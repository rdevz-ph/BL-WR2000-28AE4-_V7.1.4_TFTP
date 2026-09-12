# BL-WR2000 (V7.1.4) Firmware Reversing & Decompilation Guide

This document explains the exact internal architecture of the BL-WR2000 router firmware (`uImage` / `WRS-432-300M-28N-S-EN,7.1.4-20210113-upgrade`), how each layer was reversed, the exact offsets discovered, and the complete step-by-step commands to unpack, modify, and repack it using **Python 3 (`firmware_tool.py`)** or manual **Linux / WSL commands**.

---

## 1. Architectural Overview

The firmware file is **not** a standard dual-partition image (Kernel + SquashFS). Instead, it uses a **monolithic embedded initramfs** structure inside a U-Boot container:

```
+-------------------------------------------------------------------------+
| Layer 1: U-Boot Legacy Image Header (64 Bytes)                          |
| Magic: 0x27051956 | Compression: LZMA (Type 3) | Target: Linux/MIPS     |
+-------------------------------------------------------------------------+
| Layer 2: Linux Kernel 2.6.36 Payload (vmlinux.bin) [LZMA Decompressed]  |
| - Virtual Entry Point: 0x8000C150 | Load Address: 0x80000000            |
| - Kernel code, drivers, and static data (0x00000000 to 0x00447FFF)     |
|                                                                         |
|   +-----------------------------------------------------------------+   |
|   | Layer 3: Embedded Initramfs Archive (Offset 0x448000 / 4489216) |   |
|   | Format: XZ-compressed CPIO Archive (CRC32 check)                |   |
|   | Size: 2,398,400 bytes (ends at 0x6918C0 / 6887616)              |   |
|   |                                                                 |   |
|   |   +---------------------------------------------------------+   |   |
|   |   | Layer 4: ASCII SVR4 CPIO Root Filesystem (rootfs)       |   |   |
|   |   | - /etc_ro/web  --> GoAhead Web UI (HTML, CSS, JS, ASP)  |   |   |
|   |   | - /sbin        --> Network & DNS scripts (lan.sh, etc.) |   |   |
|   |   | - /bin         --> Binaries (dnsmasq, dnsproxy, goahead)|   |   |
|   |   | - /lib/modules --> Kernel drivers (BL_DNS/domain_login) |   |   |
|   |   +---------------------------------------------------------+   |   |
|   +-----------------------------------------------------------------+   |
|                                                                         |
| - Kernel cleanup code (.exit.text): 4,028 bytes (0x6918C0 to EOF)       |
+-------------------------------------------------------------------------+
```

---

## 2. Technical Evidence & Key Offsets

### Layer 1: U-Boot Header
Inspection of the initial 64 bytes reveals:
* **Magic:** `0x27051956` (big-endian)
* **Image Name:** `"B-LINK Linux Image"`
* **Architecture:** MIPS (Arch `5` = `IH_ARCH_MIPS`)
* **OS:** Linux (OS `5` = `IH_OS_LINUX`)
* **Type:** Kernel Image (Type `2` = `IH_TYPE_KERNEL`)
* **Compression:** LZMA (Comp `3` = `IH_COMP_LZMA`)
* **Load Address:** `0x80000000`
* **Entry Point:** `0x8000C150`
* **Payload Size:** `3,836,824` bytes (Total file size: 64 + 3,836,824 = `3,836,888` bytes)

> [!CAUTION]
> **Critical Pitfalls When Rebuilding:**
> 1. **U-Boot OS Byte (`ih_os`):** Must be set to `5` (`IH_OS_LINUX`). If set to `2` (`IH_OS_NETBSD`), U-Boot refuses to boot Linux and halts with an error.
> 2. **Device Nodes in `/dev`:** The rootfs contains 63 character/block device nodes (`/dev/console`, `/dev/null`, `/dev/nvram`, `/dev/flash0`, etc.). When extracted on Windows NTFS or non-root environments, these become 0-byte regular files. Repacking them as regular files causes an immediate kernel panic on boot (`unable to open an initial console`). `firmware_tool.py` preserves them faithfully using `.manifest.json`.
> 3. **Dynamic `populate_rootfs` Patching:** In `vmlinux.bin` at `0x426084` and `0x426090`, the kernel sets `$s3 = __initramfs_end`. `firmware_tool.py` dynamically patches the MIPS `lui` and `addiu` instructions to match `0x80448000 + len(new_xz)`, preventing XZ decompressor errors on trailing padding.

### Layer 2: Kernel `vmlinux.bin`
Decompressing the 3.84 MB payload via LZMA produces `vmlinux.bin` (**6,891,644 bytes** ~6.89 MB):
* **Linux Version:** `2.6.36 (gcc 4.6.3 Buildroot 2012.11.1)`
* **Boot command line:** `console=ttyS1,57600n8 root=/dev/ram0`

### Layer 3: Kernel Initramfs Integration
Scanning the decompressed kernel for compression signatures located an **XZ header** (`FD 37 7A 58 5A 00`) at byte offset `4489216` (`0x448000`).

Disassembly of the kernel function `populate_rootfs` at offset `0x426078` reveals how the kernel loads this payload:
```assembly
0x426084: lui   $s3, 0x8069          # s3 = 0x80690000
0x426088: lui   $s1, 0x8045          # s1 = 0x80450000
0x42608c: addiu $s1, $s1, -0x8000    # s1 = 0x80448000  (__initramfs_start)
0x426090: addiu $s3, $s3, 0x18c0     # s3 = 0x806918c0  (__initramfs_end)
0x426094: subu  $s3, $s3, $s1        # s3 = 0x002498c0  (__initramfs_size = 2,398,400 bytes)
0x426098: move  $a0, $s1             # a0 = buffer start
0x42609c: move  $a1, $s3             # a1 = buffer size
0x4260ac: jal   unpack_to_rootfs     # Kernel decompressor call
```
* **Start Address:** Virtual `0x80448000` -> File offset `0x448000` (4,489,216 bytes).
* **Length:** `2,398,400` bytes (`0x2498C0`).
* **Format:** Raw XZ stream with CRC32 checksum.

### Layer 4: Initramfs CPIO Archive
Decompressing the 2.39 MB XZ stream yields **10,068,480 bytes** (~10 MB) of an ASCII CPIO archive (`070701` SVR4 with no CRC), containing 384 files, 65 directories, and 109 symlinks.

---

## 3. Step-by-Step Decompilation

### Method 1: Python 3 (Recommended)
You do not need WSL or external Linux utilities. Python 3 standard library is enough to unpack the firmware cleanly across Windows, macOS, and Linux:

```bash
python firmware_tool.py extract uImage
```

This single command automatically:
1. Strips the 64-byte U-Boot header.
2. Decompresses the kernel LZMA payload into `vmlinux_orig.bin`.
3. Carves out the embedded XZ initramfs starting at offset `0x448000`.
4. Decompresses the CPIO archive and extracts the files into `rootfs/`.
5. Creates `rootfs/.manifest.json` to record all Linux device node metadata (major/minor numbers, permissions, ownership) and symlinks, so you never lose them when working on Windows NTFS.

---

### Method 2: Manual Decompilation Reference (WSL / Linux)
If you want to perform the decompilation steps manually inside Ubuntu / WSL:

#### Prerequisites
Install the required tools in Ubuntu:
```bash
sudo apt-get update
sudo apt-get install -y cpio u-boot-tools xz-utils
```

#### Step 1: Strip the 64-Byte U-Boot Header
Extract the raw LZMA payload from `uImage`:
```bash
dd if=uImage of=vmlinux.bin.lzma bs=64 skip=1
```

#### Step 2: Decompress the Kernel
Unpack the LZMA stream to obtain `vmlinux.bin`:
```bash
unlzma -k vmlinux.bin.lzma
# Creates: vmlinux.bin (6,891,644 bytes)
```

#### Step 3: Carve Out the Embedded XZ Initramfs
Extract the 2,398,400-byte XZ archive starting at offset `4489216` (`0x448000`):
```bash
dd if=vmlinux.bin of=rootfs.cpio.xz bs=1 skip=4489216 count=2398400
```

#### Step 4: Decompress the XZ Archive
```bash
unxz -k rootfs.cpio.xz
# Creates: rootfs.cpio (10,068,480 bytes)
```

#### Step 5: Extract the Root Filesystem
Create a workspace directory and extract the files preserving permissions:
```bash
mkdir -p rootfs
cd rootfs
cpio -idmv < ../rootfs.cpio
cd ..
```

The entire operating system is now unpacked under `rootfs/`.

---

## 4. Key Files to Modify

### Admin Web UI (`rootfs/etc_ro/web/`)
The web server is **GoAhead**, which handles ASP directives and standard web assets:
* **`rootfs/etc_ro/web/login.asp`**: Router login page.
* **`rootfs/etc_ro/web/css/login.css`**: Login styling and color palette.
* **`rootfs/etc_ro/web/admin/main.html`**: Primary dashboard interface.
* **`rootfs/etc_ro/web/admin/setup.html`**: Quick setup wizard.
* **`rootfs/etc_ro/web/admin/more.html`**: Advanced configuration menus.
* **`rootfs/etc_ro/web/admin/css/`**: Core UI stylesheets.
* **`rootfs/etc_ro/web/admin/js/`**: Client-side logic, form validation, and AJAX scripts.

### DNS & Network Scripts (`rootfs/sbin/`)
* **`rootfs/sbin/lan.sh`**:
  - Starts `dnsmasq &` when `dnsPEnabled=1`.
  - Inserts the kernel redirection hook `domain_login.ko`.
* **`rootfs/sbin/config-dns.sh`**:
  - Re-writes `/etc/resolv.conf`.
* **`rootfs/sbin/config-udhcpd.sh`**:
  - Generates `/etc/udhcpd.conf` (DHCP server configuration).
* **`rootfs/sbin/udhcpc.sh`**:
  - Updates upstream DNS when WAN IP changes.
* **`rootfs/lib/modules/2.6.36/kernel/drivers/net/BL_DNS/domain_login.ko`**:
  - Proprietary Netfilter module that intercepts port 53 UDP packets to hijack `myblink.cn`.

---

## 5. Step-by-Step Repacking Procedure

### Method 1: Python 3 (Recommended and Safe)

Python 3 using `firmware_tool.py` is the proper and recommended way to build the firmware:

```bash
python firmware_tool.py build uImage
```

**Why Python is the proper method instead of manual WSL:**
1. **Prevents Router Bricking from Missing Device Nodes:**
   Windows NTFS cannot store Linux character and block device nodes (`/dev/console`, `/dev/null`, `/dev/nvram`, `/dev/flash0`, etc.). If you run manual WSL `cpio` commands on a Windows git checkout, `cpio` packs all 63 device nodes as empty 0-byte regular files. When flashed, the router suffers an immediate kernel panic on boot (`unable to open an initial console`). `firmware_tool.py` reads `rootfs/.manifest.json` and reconstructs the real device nodes directly into the CPIO stream with exact major/minor numbers.
2. **Dynamically Patches Kernel Assembly:**
   `firmware_tool.py` patches MIPS assembly instructions (`lui $s3` and `addiu $s3`) inside `vmlinux.bin` at `0x426084` and `0x426090` so the kernel decompressor knows the exact byte length of the new initramfs, preventing decompressor padding errors.
3. **CRLF Line-Ending Sanitization:**
   It automatically cleans Windows carriage returns (`\r\n` to `\n`) in shell scripts and configuration files so BusyBox scripts execute without syntax errors.
4. **Zero Dependencies:**
   Does not require WSL, root privileges, `mkimage`, or external Linux packages. Works on Windows, macOS, and Linux using Python 3 standard library alone.

---

### Method 2: Manual Repacking Reference (WSL / Linux)

> [!WARNING]
> **Do not use manual WSL `cpio` on a Windows checkout:**
> Running `find . | cpio -o -H newc` inside a repository checked out on Windows will pack 63 character/block device nodes as regular 0-byte files, which will cause a kernel panic on boot. Use `firmware_tool.py` instead. This manual section is provided for educational reference and native Linux environments only.

If you are working on a native Linux filesystem with real device nodes intact:

#### Step 1: Re-pack the CPIO Archive
```bash
cd rootfs
find . | cpio -o -H newc > ../rootfs_modified.cpio
cd ..
```

#### Step 2: Compress with XZ (Using CRC32 Checksum)
The Linux kernel decompressor specifically requires CRC32 integrity check:
```bash
xz --check=crc32 -9 -e -k rootfs_modified.cpio
# Output: rootfs_modified.cpio.xz
```
*(Note: As long as the compressed size is <= 2,398,400 bytes, it drops cleanly into the kernel slot).*

#### Step 3: Embed the New Initramfs Back into `vmlinux.bin`
Pad the new XZ archive to exactly 2,398,400 bytes and splice it into `vmlinux.bin`:
```bash
# Calculate padding needed:
# Target slot: 2398400 bytes
python3 -c "
with open('vmlinux.bin', 'rb') as f:
    kernel = bytearray(f.read())

with open('rootfs_modified.cpio.xz', 'rb') as f:
    new_xz = f.read()

slot_start = 4489216
slot_len = 2398400
assert len(new_xz) <= slot_len, f'XZ is too big! {len(new_xz)} > {slot_len}'

# Insert new XZ and zero-pad remaining slot bytes
kernel[slot_start : slot_start + len(new_xz)] = new_xz
kernel[slot_start + len(new_xz) : slot_start + slot_len] = b'\x00' * (slot_len - len(new_xz))

with open('vmlinux_modified.bin', 'wb') as f:
    f.write(kernel)
print('Patched vmlinux_modified.bin successfully!')
"
```

#### Step 4: Re-compress the Kernel with LZMA
```bash
lzma -z -k -9 vmlinux_modified.bin
# Output: vmlinux_modified.bin.lzma
```

#### Step 5: Generate the Final `uImage` with U-Boot Header
Using `mkimage`:
```bash
mkimage -A mips -O linux -T kernel -C lzma \
  -a 0x80000000 -e 0x8000C150 \
  -n "B-LINK Linux Image" \
  -d vmlinux_modified.bin.lzma \
  uImage_modified
```

The resulting `uImage_modified` is ready to be loaded via TFTP using `tftpd32.exe`.

