#!/usr/bin/env python3
"""
BL-WR2000 Firmware Decompiler & Repacker Tool
Supports extracting and repacking uImage without requiring sudo or external packages.
Uses standard Python 3 libraries (lzma, struct, zlib, os, sys, stat, json).

Key Features:
- Preserves all special device nodes (character/block devices in /dev) via manifest
- Preserves exact file modes, permissions, symlinks, and ownership
- Dynamically patches MIPS populate_rootfs instructions in vmlinux for exact initramfs sizing
- Generates 100% compliant U-Boot legacy images (OS=5 Linux, Arch=5 MIPS, Type=2 Kernel, Comp=3 LZMA)
"""

import os
import sys
import json
import struct
import zlib
import lzma
import time

SLOT_START = 0x448000   # 4489216 bytes (__initramfs_start)
SLOT_LEN = 0x2498C0     # 2398400 bytes slot capacity

def parse_uimage_header(data):
    if len(data) < 64:
        raise ValueError("Image is smaller than 64-byte U-Boot header")
    magic, hcrc, time_val, size, load, ep, dcrc, os_type, arch, type_, comp, name = struct.unpack(">IIIIIIIBBBB32s", data[:64])
    if magic != 0x27051956:
        raise ValueError(f"Invalid U-Boot magic: {hex(magic)}")
    clean_name = name.decode('latin-1', errors='ignore').strip('\x00')
    return {
        "magic": magic, "hcrc": hcrc, "time": time_val, "size": size,
        "load": load, "ep": ep, "dcrc": dcrc, "os": os_type,
        "arch": arch, "type": type_, "comp": comp, "name": clean_name
    }

def create_uimage_header(payload, load_addr=0x80000000, entry_point=0x8000C150, image_name="B-LINK Linux Image"):
    name_bytes = image_name.encode('latin-1')[:32].ljust(32, b'\x00')
    dcrc = zlib.crc32(payload) & 0xFFFFFFFF
    size = len(payload)
    timestamp = int(time.time())
    
    # U-Boot header: os=5 (Linux), arch=5 (MIPS), type=2 (Kernel), comp=3 (LZMA)
    hdr_pre = struct.pack(">IIIIIIIBBBB32s", 0x27051956, 0, timestamp, size, load_addr, entry_point, dcrc, 5, 5, 2, 3, name_bytes)
    hcrc = zlib.crc32(hdr_pre) & 0xFFFFFFFF
    hdr_final = struct.pack(">IIIIIIIBBBB32s", 0x27051956, hcrc, timestamp, size, load_addr, entry_point, dcrc, 5, 5, 2, 3, name_bytes)
    return hdr_final + payload

def parse_cpio_archive(cpio_data):
    offset = 0
    entries = []
    while offset < len(cpio_data):
        magic = cpio_data[offset:offset+6]
        if magic != b"070701" and magic != b"070702":
            break
        hdr = cpio_data[offset:offset+110]
        if len(hdr) < 110:
            break
        ino = int(hdr[6:14], 16)
        mode = int(hdr[14:22], 16)
        uid = int(hdr[22:30], 16)
        gid = int(hdr[30:38], 16)
        nlink = int(hdr[38:46], 16)
        mtime = int(hdr[46:54], 16)
        filesize = int(hdr[54:62], 16)
        maj = int(hdr[62:70], 16)
        min_ = int(hdr[70:78], 16)
        rmaj = int(hdr[78:86], 16)
        rmin = int(hdr[86:94], 16)
        namesize = int(hdr[94:102], 16)
        
        name_offset = offset + 110
        name = cpio_data[name_offset:name_offset+namesize-1].decode('latin-1', errors='replace')
        pad1 = (4 - ((110 + namesize) % 4)) % 4
        data_offset = name_offset + namesize + pad1
        pad2 = (4 - (filesize % 4)) % 4
        next_offset = data_offset + filesize + pad2
        
        if name == "TRAILER!!!":
            break
            
        data = cpio_data[data_offset:data_offset+filesize]
        ftype = mode & 0o170000
        
        entry = {
            "name": name,
            "ino": ino,
            "mode": mode,
            "uid": uid,
            "gid": gid,
            "nlink": nlink,
            "mtime": mtime,
            "filesize": filesize,
            "maj": maj,
            "min": min_,
            "rmaj": rmaj,
            "rmin": rmin,
            "is_symlink": (ftype == 0o120000),
            "symlink_target": data.decode('latin-1', errors='replace') if ftype == 0o120000 else "",
            "is_dev": (ftype in (0o20000, 0o60000)),
            "is_dir": (ftype == 0o040000)
        }
        entries.append((entry, data))
        offset = next_offset
        
    return entries

def extract_cpio(cpio_data, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    entries = parse_cpio_archive(cpio_data)
    manifest = []
    reg_count = 0
    dev_count = 0
    sym_count = 0
    
    for entry, data in entries:
        manifest.append(entry)
        rel_path = entry["name"].lstrip("/\\")
        dest_path = os.path.join(out_dir, rel_path)
        
        if entry["is_dir"]:
            os.makedirs(dest_path, exist_ok=True)
        elif entry["is_symlink"]:
            sym_count += 1
        elif entry["is_dev"]:
            dev_count += 1
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            # Create a 0-byte placeholder on disk for reference
            with open(dest_path, "wb") as f_out:
                pass
        else:
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            with open(dest_path, "wb") as f_out:
                f_out.write(data)
            reg_count += 1

    # Save manifest for 100% faithful rebuilding (device nodes, permissions, symlinks)
    manifest_path = os.path.join(out_dir, ".manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        
    # Also save human-readable symlinks list
    symlink_file = os.path.join(out_dir, ".symlinks.txt")
    with open(symlink_file, "w", encoding="utf-8") as f:
        for entry in manifest:
            if entry["is_symlink"]:
                f.write(f"{entry['name'].lstrip('/')} -> {entry['symlink_target']}\n")
                
    print(f"[+] Extracted {reg_count} regular files, {sym_count} symlinks, and {dev_count} device nodes into '{out_dir}'")
    print(f"[+] Created metadata manifest: {manifest_path}")

def build_cpio(in_dir, kernel_base="vmlinux_orig.bin"):
    manifest_path = os.path.join(in_dir, ".manifest.json")
    manifest = []
    
    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
    elif os.path.exists(kernel_base):
        print(f"[*] Extracting metadata manifest directly from baseline kernel '{kernel_base}'...")
        with open(kernel_base, "rb") as f:
            vmlinux_data = f.read()
        xz_slice = vmlinux_data[SLOT_START : SLOT_START + SLOT_LEN]
        cpio_raw = lzma.decompress(xz_slice)
        manifest = [entry for entry, _ in parse_cpio_archive(cpio_raw)]
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)
    else:
        raise FileNotFoundError("Neither .manifest.json nor baseline kernel found to reconstruct device nodes and metadata!")

    manifest_map = {e["name"].lstrip("/\\").replace("\\", "/"): e for e in manifest}
    
    cpio_out = bytearray()
    ino_max = 1
    
    # Process all manifest entries
    for e in manifest:
        rel_path = e["name"].lstrip("/\\").replace("\\", "/")
        name_bytes = ("/" + rel_path).encode('latin-1') + b"\x00"
        namesize = len(name_bytes)
        ino = e["ino"]
        if ino > ino_max:
            ino_max = ino
            
        if e["is_dev"]:
            body = b""
            filesize = 0
            mode = e["mode"]
        elif e["is_symlink"]:
            body = e["symlink_target"].encode('latin-1')
            filesize = len(body)
            mode = e["mode"]
        elif e["is_dir"]:
            body = b""
            filesize = 0
            mode = e["mode"]
        else:
            disk_path = os.path.join(in_dir, rel_path)
            if os.path.exists(disk_path):
                with open(disk_path, "rb") as f:
                    body = f.read()
                # Windows CRLF sanitizer: ensure Unix LF on shell scripts and nvram config files
                if rel_path.endswith('.sh') or 'RT2860_default' in rel_path or rel_path in ('etc_ro/inittab', 'etc_ro/rcS', 'etc/fstab'):
                    body = body.replace(b'\r\n', b'\n')
            else:
                body = b""
            filesize = len(body)
            mode = e["mode"]
            
        hdr = f"070701{ino:08X}{mode:08X}{e['uid']:08X}{e['gid']:08X}{e['nlink']:08X}{e['mtime']:08X}{filesize:08X}{e['maj']:08X}{e['min']:08X}{e['rmaj']:08X}{e['rmin']:08X}{namesize:08X}00000000".encode('ascii')
        cpio_out.extend(hdr)
        cpio_out.extend(name_bytes)
        cpio_out.extend(b"\x00" * ((4 - (len(cpio_out) % 4)) % 4))
        cpio_out.extend(body)
        cpio_out.extend(b"\x00" * ((4 - (len(cpio_out) % 4)) % 4))

    # Check for newly added files in rootfs not in manifest
    for root, dirs, files in os.walk(in_dir):
        for f in files:
            if f in (".manifest.json", ".symlinks.txt"):
                continue
            rel = os.path.relpath(os.path.join(root, f), in_dir).replace("\\", "/")
            if rel not in manifest_map:
                ino_max += 1
                name_bytes = ("/" + rel).encode('latin-1') + b"\x00"
                namesize = len(name_bytes)
                file_full = os.path.join(root, f)
                with open(file_full, "rb") as f_in:
                    body = f_in.read()
                if any(f.endswith(ext) for ext in ('.sh', '.asp', '.html', '.htm', '.css', '.js', '.txt', '.json', '.conf')):
                    body = body.replace(b'\r\n', b'\n')
                filesize = len(body)
                mode = 0o100755 if (f.endswith(".sh") or "bin/" in rel or "sbin/" in rel) else 0o100644
                hdr = f"070701{ino_max:08X}{mode:08X}{0:08X}{0:08X}{1:08X}{0:08X}{filesize:08X}{0:08X}{0:08X}{0:08X}{0:08X}{namesize:08X}00000000".encode('ascii')
                cpio_out.extend(hdr)
                cpio_out.extend(name_bytes)
                cpio_out.extend(b"\x00" * ((4 - (len(cpio_out) % 4)) % 4))
                cpio_out.extend(body)
                cpio_out.extend(b"\x00" * ((4 - (len(cpio_out) % 4)) % 4))

    # Trailer entry
    trailer = b"TRAILER!!!\x00"
    hdr = f"0707010000000000000000000000000000000000000001000000000000000000000000000000000000000000000000{len(trailer):08X}00000000".encode('ascii')
    cpio_out.extend(hdr)
    cpio_out.extend(trailer)
    cpio_out.extend(b"\x00" * ((4 - (len(cpio_out) % 4)) % 4))
    # 512-byte block padding
    cpio_out.extend(b"\x00" * ((512 - (len(cpio_out) % 512)) % 512))
    
    return bytes(cpio_out)

def patch_kernel_rootfs_size(kernel_bytes, new_xz_len):
    """
    Dynamically patches MIPS populate_rootfs instructions in vmlinux.bin.
    At 0x426084: lui   $s3, high
    At 0x426090: addiu $s3, $s3, low
    so that __initramfs_end == 0x80448000 + new_xz_len.
    """
    kernel = bytearray(kernel_bytes)
    end_addr = 0x80448000 + new_xz_len
    high = (end_addr >> 16) & 0xFFFF
    low = end_addr & 0xFFFF
    if low >= 0x8000:
        high = (high + 1) & 0xFFFF
        low = low - 0x10000

    inst_lui = (0x3c130000 | (high & 0xFFFF)).to_bytes(4, 'little')
    inst_addiu = (0x26730000 | (low & 0xFFFF)).to_bytes(4, 'little')

    kernel[0x426084 : 0x426088] = inst_lui
    kernel[0x426090 : 0x426094] = inst_addiu
    print(f"[+] Patched kernel populate_rootfs: lui $s3, {hex(high)}; addiu $s3, $s3, {hex(low & 0xFFFF)} (end: {hex(end_addr)})")
    return bytes(kernel)

def cmd_extract(uimage_path, out_dir="rootfs", kernel_dump="vmlinux_orig.bin"):
    print(f"[*] Reading uImage from: {uimage_path}")
    with open(uimage_path, "rb") as f:
        uimage_data = f.read()
    hdr = parse_uimage_header(uimage_data)
    print(f"[+] Valid U-Boot Image: '{hdr['name']}', payload {hdr['size']} bytes, OS={hdr['os']}")
    
    print("[*] Decompressing kernel LZMA payload...")
    payload = uimage_data[64:]
    try:
        filt = lzma._decode_filter_properties(lzma.FILTER_LZMA1, payload[:5])
        vmlinux = lzma.decompress(payload[13:], format=lzma.FORMAT_RAW, filters=[filt])
    except Exception:
        vmlinux = lzma.decompress(payload, format=lzma.FORMAT_ALONE)
    print(f"[+] Decompressed kernel: {len(vmlinux)} bytes")
    with open(kernel_dump, "wb") as f:
        f.write(vmlinux)
    print(f"[+] Saved baseline kernel to: {kernel_dump}")
    
    print(f"[*] Extracting embedded XZ initramfs from offset {hex(SLOT_START)}...")
    xz_slice = vmlinux[SLOT_START : SLOT_START + SLOT_LEN]
    decomp = lzma.LZMADecompressor(format=lzma.FORMAT_XZ)
    cpio_data = decomp.decompress(xz_slice)
    print(f"[+] Decompressed CPIO archive: {len(cpio_data)} bytes")
    
    print(f"[*] Unpacking files into '{out_dir}'...")
    extract_cpio(cpio_data, out_dir)
    print("[SUCCESS] Firmware decompiled successfully!")
    print(f"          You can now edit files inside '{out_dir}/etc_ro/web' and '{out_dir}/sbin'.")

def patch_kernel_initramfs_end(kernel_bytes, new_xz_len):
    """
    Patches populate_rootfs in the MIPS kernel:
    At 0x426084: lui $s3, high
    At 0x426090: addiu $s3, $s3, low
    so that __initramfs_end == 0x80448000 + new_xz_len.
    """
    kernel = bytearray(kernel_bytes)
    end_addr = 0x80448000 + new_xz_len
    high = (end_addr >> 16) & 0xFFFF
    low = end_addr & 0xFFFF
    if low >= 0x8000:
        high = (high + 1) & 0xFFFF
        low = low - 0x10000

    inst_lui = (0x3c130000 | (high & 0xFFFF)).to_bytes(4, 'little')
    inst_addiu = (0x26730000 | (low & 0xFFFF)).to_bytes(4, 'little')

    kernel[0x426084 : 0x426088] = inst_lui
    kernel[0x426090 : 0x426094] = inst_addiu
    print(f"[+] Patched kernel populate_rootfs: lui $s3, {hex(high)}; addiu $s3, $s3, {hex(low & 0xFFFF)} (end: {hex(end_addr)}, size: {new_xz_len:,} bytes)")
    return bytes(kernel)

def cmd_build(in_dir="rootfs", kernel_base="vmlinux_orig.bin", out_uimage="uImage"):
    if not os.path.exists(kernel_base):
        print(f"[!] Baseline kernel '{kernel_base}' not found. Run extract first!")
        sys.exit(1)
        
    print(f"[*] Packing '{in_dir}' into CPIO archive with full device node preservation...")
    cpio_data = build_cpio(in_dir, kernel_base)
    print(f"[+] CPIO archive size: {len(cpio_data)} bytes")
    
    print("[*] Compressing CPIO with XZ (check=CRC32)...")
    filters_xz = [{"id": lzma.FILTER_LZMA2, "dict_size": 1024 * 1024}]
    xz_data = lzma.compress(cpio_data, format=lzma.FORMAT_XZ, check=lzma.CHECK_CRC32, filters=filters_xz)
    if len(xz_data) > SLOT_LEN:
        # If additions exceed 1MB slot, use 2MB dictionary for better ratio
        filters_xz = [{"id": lzma.FILTER_LZMA2, "dict_size": 2 * 1024 * 1024}]
        xz_data = lzma.compress(cpio_data, format=lzma.FORMAT_XZ, check=lzma.CHECK_CRC32, filters=filters_xz)
    if len(xz_data) > SLOT_LEN:
        xz_data = lzma.compress(cpio_data, format=lzma.FORMAT_XZ, check=lzma.CHECK_CRC32, preset=6)
    print(f"[+] Compressed XZ size: {len(xz_data)} bytes (slot limit: {SLOT_LEN} bytes)")
    
    if len(xz_data) > SLOT_LEN:
        raise ValueError(f"RootFS XZ size ({len(xz_data)}) exceeds slot limit ({SLOT_LEN}) by {len(xz_data) - SLOT_LEN} bytes!")
        
    print(f"[*] Loading baseline kernel '{kernel_base}'...")
    with open(kernel_base, "rb") as f:
        kernel = bytearray(f.read())
        
    # Place new XZ rootfs into kernel slot
    kernel[SLOT_START : SLOT_START + len(xz_data)] = xz_data
    # Pad remaining bytes in the slot with null stream padding
    pad_len = SLOT_LEN - len(xz_data)
    kernel[SLOT_START + len(xz_data) : SLOT_START + SLOT_LEN] = b"\x00" * pad_len
    
    # Patch kernel populate_rootfs with the exact new XZ size so unpack_to_rootfs does not fail
    kernel = bytearray(patch_kernel_initramfs_end(kernel, len(xz_data)))
    
    print("[*] Compressing kernel with raw LZMA1 (dict_size=32MB, lc=3, lp=0, pb=2)...")
    filters = [{"id": lzma.FILTER_LZMA1, "dict_size": 32 * 1024 * 1024, "lc": 3, "lp": 0, "pb": 2}]
    raw_payload = lzma.compress(bytes(kernel), format=lzma.FORMAT_RAW, filters=filters)
    # Prepend 13-byte header matching factory stock: 5 bytes props + 8 bytes uncompressed size
    props = b"\x5d\x00\x00\x00\x02"
    size_header = struct.pack("<Q", len(kernel))
    vmlinux_lzma = props + size_header + raw_payload
    print(f"[+] Compressed kernel size: {len(vmlinux_lzma)} bytes (uncompressed size in header: {len(kernel):,} bytes)")
    
    target_desc = "uImage & update_firmware.bin" if out_uimage in ("all", "both") else out_uimage
    print(f"[*] Generating firmware image ({target_desc}) with OS=5 (IH_OS_LINUX)...")
    final_image = create_uimage_header(vmlinux_lzma)
        
    import hashlib
    md5_str = hashlib.md5(final_image).hexdigest()

    if out_uimage in ("all", "both"):
        # Write both uImage and update_firmware.bin
        for target in ("uImage", "update_firmware.bin"):
            with open(target, "wb") as f:
                f.write(final_image)
            with open(target + ".md5", "w") as f:
                f.write(md5_str + "\n")
            print(f"[SUCCESS] Built '{target}' ({len(final_image)} bytes, MD5: {md5_str}) successfully!")
        print("          Ready for TFTP recovery (uImage) and Web UI upgrade (update_firmware.bin).")
    else:
        # Write only the requested target file
        with open(out_uimage, "wb") as f:
            f.write(final_image)
        with open(out_uimage + ".md5", "w") as f:
            f.write(md5_str + "\n")
        print(f"[SUCCESS] Built '{out_uimage}' ({len(final_image)} bytes, MD5: {md5_str}) successfully!")

def cmd_repack_kernel(kernel_path="vmlinux_orig.bin", out_uimage="uImage"):
    if not os.path.exists(kernel_path):
        print(f"[!] Kernel '{kernel_path}' not found!")
        sys.exit(1)
        
    print(f"[*] Reading pure untouched kernel from '{kernel_path}'...")
    with open(kernel_path, "rb") as f:
        kernel = f.read()
    print(f"[+] Loaded kernel: {len(kernel):,} bytes")
    
    print("[*] Compressing kernel with raw LZMA1 (dict_size=32MB, lc=3, lp=0, pb=2)...")
    filters = [{"id": lzma.FILTER_LZMA1, "dict_size": 32 * 1024 * 1024, "lc": 3, "lp": 0, "pb": 2}]
    raw_payload = lzma.compress(kernel, format=lzma.FORMAT_RAW, filters=filters)
    props = b"\x5d\x00\x00\x00\x02"
    size_header = struct.pack("<Q", len(kernel))
    vmlinux_lzma = props + size_header + raw_payload
    print(f"[+] Compressed kernel size: {len(vmlinux_lzma)} bytes (uncompressed size in header: {len(kernel):,} bytes)")
    
    print(f"[*] Generating uImage: {out_uimage} with OS=5 (IH_OS_LINUX)...")
    final_image = create_uimage_header(vmlinux_lzma)
    with open(out_uimage, "wb") as f:
        f.write(final_image)
        
    print(f"[SUCCESS] Built '{out_uimage}' ({len(final_image)} bytes) directly from untouched kernel!")
    print(f"          Ready for TFTP baseline test flashing.")

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in ("extract", "build", "repack-kernel"):
        print("Usage:")
        print("  python firmware_tool.py extract [uImage_path]")
        print("  python firmware_tool.py build [output_path]   (default: builds both uImage and update_firmware.bin)")
        print("  python firmware_tool.py repack-kernel [kernel_path] [output_uImage_path]")
        sys.exit(1)
        
    if sys.argv[1] == "extract":
        target_img = sys.argv[2] if len(sys.argv) > 2 else "uImage"
        cmd_extract(target_img)
    elif sys.argv[1] == "build":
        out_img = sys.argv[2] if len(sys.argv) > 2 else "all"
        cmd_build(out_uimage=out_img)
    elif sys.argv[1] == "repack-kernel":
        k_path = sys.argv[2] if len(sys.argv) > 2 else "vmlinux_orig.bin"
        out_img = sys.argv[3] if len(sys.argv) > 3 else "uImage"
        cmd_repack_kernel(kernel_path=k_path, out_uimage=out_img)
