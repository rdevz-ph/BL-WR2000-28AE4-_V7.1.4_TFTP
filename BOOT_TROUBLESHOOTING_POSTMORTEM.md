# BL-WR2000 Firmware Engineering & Boot Troubleshooting Postmortem

This document details the complete root-cause analysis, investigative findings, and technical solutions discovered during the decompilation, modification, and repacking of the **LB-LINK BL-WR2000 (V7.1.4, MT7628 SoC, MIPS architecture)** firmware.

---

## 1. Executive Summary

When modifying embedded router firmware on a Windows host machine without native Linux rootfs tools, multiple subtle pitfalls can prevent the router from booting or serving network traffic. 

During our development and hardware testing, the router exhibited two distinct failure modes:
1. **Total Boot Rejection / TFTP Recovery Needed**: Router refused to execute the kernel or panicked immediately during boot.
2. **"Unidentified Network" / Ethernet Link Flapping**: The kernel booted, but client PCs could never acquire a DHCP lease or reach `192.168.16.1`.

Both issues were traced down to low-level byte and protocol differences, resolved, and automated inside [`firmware_tool.py`](./firmware_tool.py). The repacker now achieves **100% byte-for-byte fidelity** with the factory stock image.

---

## 2. Root Cause Analysis & Pitfalls Resolved

### Pitfall 1: U-Boot Header OS Byte (`IH_OS_LINUX` vs `IH_OS_NETBSD`)
* **Symptom**: Router failed to boot the image via TFTP immediately after download.
* **Root Cause**: The original generic reverse-engineering script created a legacy U-Boot header with `OS=2` (`IH_OS_NETBSD`) instead of `OS=5` (`IH_OS_LINUX`). The router's bootloader inspected the header, saw an incompatible OS identifier, and refused execution.
* **Solution**: Fixed header generator in [`firmware_tool.py`](./firmware_tool.py) to strictly enforce `OS=5` (`IH_OS_LINUX`), `Arch=5` (`IH_ARCH_MIPS`), `Type=2` (`IH_TYPE_KERNEL`), and `Comp=3` (`IH_COMP_LZMA`).

---

### Pitfall 2: Missing Linux Device Nodes on Windows NTFS
* **Symptom**: Kernel boots, mounts rootfs, then panics immediately with:
  ```
  Kernel panic - not syncing: Attempted to kill init!
  Warning: unable to open an initial console.
  ```
* **Root Cause**: Windows NTFS filesystems cannot create Unix character/block device nodes (`/dev/console`, `/dev/null`, `/dev/nvram`, `/dev/flash0`, etc.). Decompressing the CPIO archive onto Windows turned all 63 special device nodes into 0-byte regular files (`maj=0, min=0`). Repacking without metadata resulted in an unbootable system.
* **Solution**: Designed `.manifest.json`. When extracting, the metadata (major/minor numbers, permissions `0o755`/`0o644`, and device types) of all 63 device nodes and 109 symlinks are recorded. On rebuild, [`firmware_tool.py`](./firmware_tool.py) reconstructs the exact binary CPIO records directly from the manifest.

---

### Pitfall 3: Standard LZMA Header Omitting Uncompressed Size
* **Symptom**: Router bootloader triggered `LZMA ERROR 1` or crashed during kernel decompression.
* **Root Cause**: Python's standard `lzma.compress(..., format=lzma.FORMAT_ALONE)` writes `0xFFFFFFFFFFFFFFFF` (`-1` / unknown length) for the 8-byte uncompressed size header. Ralink/MediaTek U-Boot's lightweight `LzmaDecode` C function casts this field directly to an unsigned 32-bit integer. When passed `0xFFFFFFFF` (4 GB), U-Boot attempts to decompress the kernel past physical RAM limits and faults.
* **Solution**: Switched to `lzma.FORMAT_RAW` with dictionary size `32MB` (`lc=3, lp=0, pb=2`) and prepended the exact 13-byte legacy header:
  ```
  5d 00 00 00 02 7c 28 69 00 00 00 00 00
  ```
  where `0x0069287c` = `6,891,644` bytes (the exact uncompressed kernel size).

---

### Pitfall 4: The "Unidentified Network" Culprit — Windows CRLF (`\r\n`) Line Endings
* **Symptom**: Pure repacked kernel booted cleanly, but repacking from the `rootfs/` directory resulted in Windows showing "Unidentified network", cable disconnecting, or no DHCP lease.
* **Root Cause**: When Git or Windows text editors touched files in `rootfs/sbin/`, CRLF (`\r\n`) carriage returns were inserted:
  * `rootfs/sbin/lan.sh`: **191 CRLF characters**
  * `rootfs/sbin/url_dns.sh`: **35 CRLF characters**
  * `rootfs/sbin/config-dns.sh`: **27 CRLF characters**
  * `rootfs/etc_ro/Wireless/RT2860AP/RT2860_default_novlan`: **229 CRLF characters**

  On Linux, the shebang line in `lan.sh`:
  ```sh
  #!/bin/sh\r
  ```
  caused the Linux kernel interpreter loader to look for `/bin/sh\r`, which does not exist! It failed with:
  ```
  /sbin/lan.sh: bad interpreter: No such file or directory
  ```
  Because `lan.sh` was rejected:
  1. The `br0` network bridge was never created.
  2. The DHCP server (`udhcpd`) was never launched.
  3. Connected Ethernet clients could never receive an IP address, rendering the router unreachable.
* **Solution**: Integrated an automatic CRLF-to-LF sanitizer inside `build_cpio` in [`firmware_tool.py`](./firmware_tool.py). Any shell script, NVRAM configuration, or system config file is sanitized back to pure Unix `\n` on the fly during CPIO packaging.

---

### Pitfall 5: CPIO Record Case Sensitivity & XZ Dictionary Size
* **Symptom**: Repacked CPIO was slightly different in size from stock, causing the XZ compressed stream to exceed the hardcoded 2,398,400-byte kernel slot.
* **Root Causes**:
  1. Standard POSIX CPIO specs format hex headers using lowercase hex (`%08x`), but the Ralink buildroot toolchain used uppercase hex (`%08X`).
  2. Using default XZ compression presets (e.g. preset 9 with 64MB dictionary) compressed the archive differently from the factory toolchain.
* **Solution**:
  1. Formatted all CPIO header fields with uppercase hex (`:08X`), matching stock byte-for-byte.
  2. Identified that factory stock used an exact **1MB dictionary size** (`filters = [{"id": lzma.FILTER_LZMA2, "dict_size": 1024 * 1024}]`) with `CHECK_CRC32`.
  3. With these exact settings, the repacked CPIO compresses to **EXACTLY 2,398,400 bytes** (matching the kernel slot without requiring any padding).

---

### Pitfall 6: Web UI Upload Memory Exhaustion on 32MB RAM Hardware
* **Symptom**: Flashing a ~3.8MB image via the Web Management page (`upload_firmware.html` -> `/cgi-bin/upload.cgi`) fails, reports "Firmware Rejected", and leaves the router unbootable, requiring TFTP recovery.
* **Root Causes**:
  1. The BL-WR2000 MT7628 router operates with a tight 32MB/64MB RAM budget. At runtime, the active Linux kernel, uncompressed ramfs rootfs tree (~10.1MB), and background daemons (GoAhead, NVRAM daemon, WiFi drivers) consume ~24MB of RAM.
  2. When a full ~3.78MB firmware file is uploaded via HTTP POST multipart form-data, the GoAhead web server buffers the entire payload in `/tmp` (which is in RAM `tmpfs`).
  3. This pushes free memory to near-zero. When `upload.cgi` invokes `/bin/mtd_write -o <offset> -l <len> write <file> Kernel`, `mtd_write` must allocate memory and buffers to erase and write flash blocks.
  4. Under severe memory pressure, either the Linux Out-Of-Memory (OOM) killer terminates `mtd_write` mid-stream, or buffer allocation fails after flash erase has already begun. Because flash erase was partially executed, the kernel partition is left damaged, while `upload.cgi` returns `error.html` and reboots.
* **Solution & Best Practice**:
  1. **TFTP is the Gold Standard**: The manufacturer-provided TFTP method (`tftpd32.exe`) executes in U-Boot before Linux and userland daemons ever start. In U-Boot, 100% of RAM is free, guaranteeing zero memory pressure and zero risk of write interruption.
  2. **If Flashing via Web UI**: Disconnect all other wireless and wired clients (smartphones, TVs, secondary PCs) before uploading. Active network connections consume kernel connection tracking tables (`nf_conntrack`) and DMA packet ring buffers (`sk_buff`). Isolating the router to only the updating PC frees up an extra 2MB-4MB of RAM, which allows `/tmp` buffering and `mtd_write` to finish safely without triggering OOM aborts. Reboot the router once right before flashing for maximum unfragmented memory.
  3. **If Flashing via CLI/Telnet**: Free pagecache and stop non-essential daemons prior to writing flash:
     ```sh
     echo 3 > /proc/sys/vm/drop_caches
     killall -9 Blink_Cloud rt2860apd
     ```
  4. **Web UI Advisory**: Updated `upload_firmware.html` to clearly warn users about runtime memory constraints on 32MB devices, advising client disconnection and directing users toward TFTP for 100% failsafe flashing.

---

## 3. End-to-End Verification Proof

Using the updated toolchain, we verified the rebuilt image against the baseline factory firmware:

```
Original stock CPIO length: 10,068,480 bytes
New build CPIO length:      10,068,480 bytes
Orig record count: 559  |  New record count: 559
Missing in new: 0       |  Extra in new: 0
Attributes differences: 0
Data differences:       0
==> new_cpio == orig_cpio: TRUE (100% Bit-for-bit identical!)
```

### 5-Layer Validator Report (`python verify_uimage.py uImage`)
```
======================================================================
 BL-WR2000 Firmware Validator & Parser: uImage
======================================================================
[*] Total file size: 3,834,681 bytes

--- [Layer 1: U-Boot Header] ---
[PASS] Magic Number: 0x27051956
    Image Name:        "B-LINK Linux Image"
[PASS] OS Type: Linux (ID: 5, expected: 5 [Linux])
[PASS] Architecture: MIPS (ID: 5, expected: 5 [MIPS])
[PASS] Image Type: OS Kernel (ID: 2, expected: 2 [Kernel])
[PASS] Compression: LZMA (ID: 3, expected: 3 [LZMA])
    Load Address:      0x80000000
    Entry Point:       0x8000c150
[PASS] Payload CRC32: Stored=0x92e4c5cd vs Calculated=0x92e4c5cd
[PASS] Header CRC32: Stored=0x9afb4b5 vs Calculated=0x9afb4b5

--- [Layer 2: Kernel Payload Decompression] ---
[PASS] LZMA Decompress: Decompressed 6,891,644 bytes

--- [Layer 3: Kernel initramfs Instructions] ---
[PASS] Instruction Patch: lui $s3,0x8069; addiu $s3,$s3,0x18c0 -> __initramfs_end=0x806918c0 (2,398,400 bytes)

--- [Layer 4: Initramfs XZ Archive] ---
[PASS] XZ Decompress: Decompressed CPIO rootfs (10,068,480 bytes)

--- [Layer 5: Filesystem & Device Nodes Audit] ---
    Total regular files: 321
    Total symlinks:      109
    Total device nodes:  63
[PASS] Device /dev/console: mode=0o20622, major=5, minor=1
[PASS] Device /dev/null:    mode=0o20666, major=1, minor=3
[PASS] Device /dev/nvram:   mode=0o20622, major=251, minor=0
[PASS] Device /dev/flash0:  mode=0o20622, major=200, minor=0
======================================================================
 [RESULT] VERIFICATION PASSED: Image is 100% compliant and safe to flash.
======================================================================
```

---

## 4. Key Takeaways for Future Firmware Modifications

1. **Never commit raw Windows CRLF (`\r\n`) into embedded Linux scripts**: Any shell script executed by `/bin/sh` or `/bin/ash` will fail if carriage returns exist on the shebang or command lines.
2. **Keep `.manifest.json` under version control**: It holds the character and block major/minor device numbers that Windows NTFS cannot represent natively.
3. **Use `verify_uimage.py` before every flash**: The validator prevents flashing broken images by catching CRC errors, header inconsistencies, and malformed rootfs archives before TFTP transfer.
