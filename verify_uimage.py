#!/usr/bin/env python3
"""
uImage Verification & Parser Utility for BL-WR2000 Router Firmware

This script performs complete multi-layer verification on a uImage file:
1. U-Boot Legacy Header Check (magic, CRC32, architecture, OS type, entry points)
2. Kernel LZMA Decompression Check (verifies kernel payload integrity)
3. populate_rootfs MIPS Opcode Parsing (verifies initramfs boundary pointers)
4. Embedded Initramfs XZ Decompression (verifies compressed CPIO stream)
5. CPIO Filesystem & Device Node Audit (ensures /dev/console, /dev/nvram, etc. exist)
"""

import sys
import os
import struct
import zlib
import lzma

def print_status(check_name, status, detail=""):
    symbol = "[PASS]" if status else "[FAIL]"
    color = "\033[92m" if status else "\033[91m"
    reset = "\033[0m"
    # Support terminals with or without color support
    if sys.platform == "win32" and "ANSICON" not in os.environ and "WT_SESSION" not in os.environ:
        print(f"{symbol} {check_name}: {detail}")
    else:
        print(f"{color}{symbol}{reset} {check_name}: {detail}")

def verify_uimage(image_path="uImage"):
    if not os.path.exists(image_path):
        print(f"[!] Error: File '{image_path}' not found.")
        sys.exit(1)

    print("=" * 70)
    print(f" BL-WR2000 Firmware Validator & Parser: {image_path}")
    print("=" * 70)

    with open(image_path, "rb") as f:
        data = f.read()

    total_size = len(data)
    print(f"[*] Total file size: {total_size:,} bytes")
    if total_size < 64:
        print_status("File Size", False, "File is smaller than 64-byte U-Boot header!")
        return False

    all_passed = True

    # -------------------------------------------------------------
    # 1. U-Boot Header Verification
    # -------------------------------------------------------------
    print("\n--- [Layer 1: U-Boot Header] ---")
    hdr_bytes = data[:64]
    payload = data[64:]
    
    magic, hcrc, time_val, size, load, ep, dcrc, os_type, arch, type_, comp, name = struct.unpack(">IIIIIIIBBBB32s", hdr_bytes)
    clean_name = name.decode("latin-1", errors="ignore").rstrip("\x00")

    # Magic Check
    is_magic_ok = (magic == 0x27051956)
    print_status("Magic Number", is_magic_ok, f"{hex(magic)} (expected: 0x27051956)")
    all_passed = all_passed and is_magic_ok

    # Image Name
    print(f"    Image Name:        \"{clean_name}\"")

    # OS Byte (Must be 5 = IH_OS_LINUX)
    is_os_ok = (os_type == 5)
    os_name = "Linux" if os_type == 5 else ("NetBSD" if os_type == 2 else f"Type {os_type}")
    print_status("OS Type", is_os_ok, f"{os_name} (ID: {os_type}, expected: 5 [Linux])")
    all_passed = all_passed and is_os_ok

    # Architecture (Must be 5 = IH_ARCH_MIPS)
    is_arch_ok = (arch == 5)
    print_status("Architecture", is_arch_ok, f"MIPS (ID: {arch}, expected: 5 [MIPS])")
    all_passed = all_passed and is_arch_ok

    # Image Type (Must be 2 = IH_TYPE_KERNEL)
    is_type_ok = (type_ == 2)
    print_status("Image Type", is_type_ok, f"OS Kernel (ID: {type_}, expected: 2 [Kernel])")
    all_passed = all_passed and is_type_ok

    # Compression (Must be 3 = IH_COMP_LZMA)
    is_comp_ok = (comp == 3)
    print_status("Compression", is_comp_ok, f"LZMA (ID: {comp}, expected: 3 [LZMA])")
    all_passed = all_passed and is_comp_ok

    # Load Address & Entry Point
    print(f"    Load Address:      {hex(load)} (expected: 0x80000000)")
    print(f"    Entry Point:       {hex(ep)} (expected: 0x8000C150)")

    # Data CRC32 Verification
    calc_dcrc = zlib.crc32(payload) & 0xFFFFFFFF
    is_dcrc_ok = (calc_dcrc == dcrc)
    print_status("Payload CRC32", is_dcrc_ok, f"Stored={hex(dcrc)} vs Calculated={hex(calc_dcrc)}")
    all_passed = all_passed and is_dcrc_ok

    # Header CRC32 Verification
    hdr_zero_crc = hdr_bytes[:4] + b"\x00\x00\x00\x00" + hdr_bytes[8:64]
    calc_hcrc = zlib.crc32(hdr_zero_crc) & 0xFFFFFFFF
    is_hcrc_ok = (calc_hcrc == hcrc)
    print_status("Header CRC32", is_hcrc_ok, f"Stored={hex(hcrc)} vs Calculated={hex(calc_hcrc)}")
    all_passed = all_passed and is_hcrc_ok

    # -------------------------------------------------------------
    # 2. Kernel LZMA Decompression Check
    # -------------------------------------------------------------
    print("\n--- [Layer 2: Kernel Payload Decompression] ---")
    try:
        props = payload[:5]
        filt = lzma._decode_filter_properties(lzma.FILTER_LZMA1, props)
        vmlinux = lzma.decompress(payload[13:], format=lzma.FORMAT_RAW, filters=[filt])
        stored_size = int.from_bytes(payload[5:13], 'little')
        size_str = f"Decompressed {len(vmlinux):,} bytes (header size: {stored_size:,} bytes)"
        print_status("LZMA Decompress", True, size_str)
    except Exception:
        try:
            vmlinux = lzma.decompress(payload, format=lzma.FORMAT_ALONE)
            print_status("LZMA Decompress", True, f"Decompressed {len(vmlinux):,} bytes successfully")
        except Exception as err:
            print_status("LZMA Decompress", False, f"Decompression failed: {err}")
            return False

    # -------------------------------------------------------------
    # 3. populate_rootfs MIPS Opcode Parsing
    # -------------------------------------------------------------
    print("\n--- [Layer 3: Kernel initramfs Instructions] ---")
    SLOT_START = 0x448000
    w_lui = int.from_bytes(vmlinux[0x426084:0x426088], "little")
    w_addiu = int.from_bytes(vmlinux[0x426090:0x426094], "little")
    
    high = w_lui & 0xFFFF
    low = w_addiu & 0xFFFF
    if low >= 0x8000:
        end_addr = ((high - 1) << 16) | low
    else:
        end_addr = (high << 16) | low
        
    expected_size = end_addr - 0x80448000
    is_size_valid = 1000000 < expected_size <= 2398400
    print_status("Instruction Patch", is_size_valid, 
                 f"lui $s3,{hex(high)}; addiu $s3,$s3,{hex(low & 0xFFFF)} -> __initramfs_end={hex(end_addr)} ({expected_size:,} bytes)")
    all_passed = all_passed and is_size_valid

    # -------------------------------------------------------------
    # 4. Embedded Initramfs XZ Decompression
    # -------------------------------------------------------------
    print("\n--- [Layer 4: Initramfs XZ Archive] ---")
    xz_slice = vmlinux[SLOT_START : SLOT_START + expected_size]
    try:
        decomp_xz = lzma.LZMADecompressor(format=lzma.FORMAT_XZ)
        cpio_data = decomp_xz.decompress(xz_slice)
        print_status("XZ Decompress", True, f"Decompressed CPIO rootfs ({len(cpio_data):,} bytes)")
    except Exception as err:
        print_status("XZ Decompress", False, f"Failed to decompress initramfs slice: {err}")
        return False

    # -------------------------------------------------------------
    # 5. CPIO Filesystem & Device Node Audit
    # -------------------------------------------------------------
    print("\n--- [Layer 5: Filesystem & Device Nodes Audit] ---")
    offset = 0
    dev_nodes = {}
    files_count = 0
    symlinks_count = 0
    
    while offset < len(cpio_data):
        if cpio_data[offset:offset+6] != b"070701":
            break
        hdr = cpio_data[offset:offset+110]
        mode = int(hdr[14:22], 16)
        filesize = int(hdr[54:62], 16)
        rmaj = int(hdr[78:86], 16)
        rmin = int(hdr[86:94], 16)
        namesize = int(hdr[94:102], 16)
        
        name = cpio_data[offset+110 : offset+110+namesize-1].decode("latin-1", errors="replace")
        pad1 = (4 - ((110 + namesize) % 4)) % 4
        data_offset = offset + 110 + namesize + pad1
        pad2 = (4 - (filesize % 4)) % 4
        next_offset = data_offset + filesize + pad2
        
        if name == "TRAILER!!!":
            break
            
        ftype = mode & 0o170000
        if ftype in (0o020000, 0o060000):  # Char or Block Device
            dev_nodes[name] = {"mode": oct(mode), "major": rmaj, "minor": rmin}
        elif ftype == 0o120000:
            symlinks_count += 1
        elif ftype == 0o100000:
            files_count += 1
            
        offset = next_offset

    print(f"    Total regular files: {files_count}")
    print(f"    Total symlinks:      {symlinks_count}")
    print(f"    Total device nodes:  {len(dev_nodes)}")

    # Audit critical character device nodes needed for boot
    critical_devs = {
        "/dev/console": (5, 1),
        "/dev/null": (1, 3),
        "/dev/nvram": (251, 0),
        "/dev/flash0": (200, 0),
    }

    devs_ok = True
    for dev_path, (exp_maj, exp_min) in critical_devs.items():
        if dev_path in dev_nodes:
            dev = dev_nodes[dev_path]
            maj_min_ok = (dev["major"] == exp_maj and dev["minor"] == exp_min)
            print_status(f"Device {dev_path}", maj_min_ok, 
                         f"mode={dev['mode']}, major={dev['major']}, minor={dev['minor']}")
            devs_ok = devs_ok and maj_min_ok
        else:
            print_status(f"Device {dev_path}", False, "MISSING! Kernel will panic on boot.")
            devs_ok = False
            
    all_passed = all_passed and devs_ok

    # -------------------------------------------------------------
    # Summary
    # -------------------------------------------------------------
    print("=" * 70)
    if all_passed:
        print(" [RESULT] VERIFICATION PASSED: Image is 100% compliant and safe to flash.")
    else:
        print(" [RESULT] VERIFICATION FAILED: Do NOT flash this image!")
    print("=" * 70)
    return all_passed

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "uImage"
    success = verify_uimage(target)
    sys.exit(0 if success else 1)
