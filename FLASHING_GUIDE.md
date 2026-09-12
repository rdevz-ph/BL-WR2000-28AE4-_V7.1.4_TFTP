# BL-WR2000 TFTP Firmware Flashing Guide

This step-by-step guide is based directly on the official manufacturer tutorial (`lb-link WR2000 router TFTP Tools upgrade tutoria.pdf`) and explains how to safely flash custom or modified firmware images to the **LB-LINK BL-WR2000** router using the included TFTP tool (`tftpd32.exe`).

---

## Prerequisites & Checklist

* **Hardware:**
  * BL-WR2000 router and power adapter.
  * Windows PC with an **Ethernet port**.
  * RJ45 Ethernet cable.
* **Files (Included in the repository):**
  * `tftpd32.exe`
  * `uImage` (The ready-to-flash modified firmware in the root directory)
  * `backup/uImage_stock` (Verified original factory stock firmware for recovery)

> [!WARNING]
> **Always use a wired Ethernet cable** connected to a router **LAN** port. Never attempt to flash or recover firmware over Wi-Fi.

---

## Step 1: Prepare the Firmware File

The router's bootloader (U-Boot) strictly looks for a file named **`uImage`**.

1. The modified firmware is already compiled and named **`uImage`** in the repository root directory.
2. The original stock firmware is safely preserved at `backup/uImage_stock`.
3. If you ever need to restore the router to stock factory settings, simply copy `backup/uImage_stock` to `uImage` in the root folder and flash again.

---

## Step 2: Configure Ethernet Adapter Connected to Router

U-Boot has a hardcoded client IP address it expects during TFTP recovery: **`192.168.16.123`**. Other IP addresses will be ignored by the bootloader.

1. Open **Windows Settings** $\rightarrow$ **Network & Internet** $\rightarrow$ **Change adapter options** (or run `ncpa.cpl`).
2. Right-click the **Ethernet network adapter connected to the router** $\rightarrow$ **Properties**.
3. Select **Internet Protocol Version 4 (TCP/IPv4)** $\rightarrow$ click **Properties**.
4. Select **Use the following IP address** and configure the Ethernet adapter connected to the router:
   * **IP address:** `192.168.16.123`
   * **Subnet mask:** `255.255.255.0`
   * **Default gateway:** *(leave blank)*
5. Click **OK** $\rightarrow$ **OK**.

> [!NOTE]
> Leave the Default Gateway blank on the Ethernet adapter. During TFTP recovery mode, the router temporarily acts as client IP `192.168.16.100` and requests `uImage` from your computer (`192.168.16.123`). The router only acts as gateway `192.168.16.1` after it finishes booting into normal operating mode.

> [!TIP]
> Temporarily allow `tftpd32.exe` through the Windows Defender Firewall if prompted, or disable Windows Firewall temporarily during the flash so TFTP UDP port 69 isn't blocked.

---

## Step 3: Set Up and Launch `tftpd32.exe`

1. Right-click **`tftpd32.exe`** in the repository folder $\rightarrow$ **Run as administrator**.
2. Verify the following two fields at the top of the Tftpd32 window:
   * **Current Directory:** Click **Browse** and ensure it points to the repository root directory (where `uImage` is located).
   * **Server interfaces:** Select the dropdown and choose **`192.168.16.123`** (your Ethernet card).
3. Leave `tftpd32.exe` running on your screen and click on the **Log Viewer** tab.

---

## Step 4: Cable Connection

1. Disconnect any WAN/Internet cable from the router.
2. Connect your Ethernet cable directly between:
   * **Your PC's Ethernet port**
   * Any **LAN port** on the router (LAN 1, 2, 3, or 4). Do **NOT** plug into the blue WAN port.

---

## Step 5: Trigger U-Boot TFTP Recovery Mode

Follow this timing sequence carefully:

1. **Unplug the router power cable** and wait at least **10 seconds**.
2. Locate the physical **Reset** button on the back of the router.
3. **Press and hold down the Reset button** with a pin or pen.
4. While **still holding down the Reset button**, plug the power adapter back into the router.
5. Keep holding the Reset button for **7 seconds**, then let go.
6. **Watch `tftpd32.exe`:**
   * You will see the log update as U-Boot connects to `192.168.16.123` and requests `uImage`.
   * A progress transfer popup will appear showing blocks transferring to the router.

> [!CAUTION]
> **CRITICAL:** Once the transfer starts, **DO NOT disconnect the power cord or Ethernet cable** for at least **2 minutes**!
> The router is erasing the flash memory and writing the new kernel/rootfs. Interrupting this will brick the router.

---

## Step 6: Restore PC to Automatic DHCP & Verify

1. Wait **2 minutes** after the transfer completes for the router to finish flashing and rebooting.
2. Re-open your network adapter settings (`ncpa.cpl` $\rightarrow$ Ethernet $\rightarrow$ IPv4 Properties).
3. Switch back to:
   * **Obtain an IP address automatically**
   * **Obtain DNS server address automatically**
4. Click **OK**.
5. Within a few seconds, Windows will receive an IP lease from the router (e.g., `192.168.16.100`).
6. Test network reachability:
   ```cmd
   ping 192.168.16.1
   ```
7. Open your web browser and go to:
   ```
   http://192.168.16.1
   ```
8. Log in with the credentials:
   * **Admin User:** `admin` / Password: `admin`
   * **Superadmin User:** `superadmin` / Password: `lblink`

---

## Troubleshooting Guide

| Issue | Probable Cause | Solution |
| :--- | :--- | :--- |
| **Log Viewer in Tftpd32 stays blank** | Firewall blocking TFTP port | Allow `tftpd32.exe` through Windows Firewall or temporarily disable domain/private firewall. |
| **Log Viewer stays blank** | Incorrect PC IP address | Ensure your static IP is exactly `192.168.16.123`, not `.100` or `.1`. U-Boot only looks for `.123`. |
| **Log Viewer stays blank** | Reset timing missed | Make sure you hold Reset *before* plugging in power, and release it at 7 seconds. |
| **File not found in log** | Wrong filename | Ensure the file in the directory is named `uImage` without any extension. |
| **Transfer stops halfway** | Bad cable / loose connection | Use a tested Cat5e/Cat6 patch cable and avoid USB hubs if possible. |

---

## Subsequent Updates via Web Admin UI

Once the router is running a working firmware build, you do not need to repeat the TFTP recovery procedure for future updates. You can compile the update images with `python firmware_tool.py build` and upload `update_firmware.bin` directly through the router's web admin page at `http://192.168.16.1/admin/upload_firmware.html` (under the **Local Upgrade** tab).

> [!IMPORTANT]
> **Essential Requirement for Web UI Flashing (32MB RAM Optimization):**
> Before uploading firmware through the web interface, **disconnect all other connected devices (smartphones, TVs, secondary laptops)** and keep **only your updating PC connected** (preferably via a wired Ethernet cable).
>
> * **Why this is necessary**: The MT7628 operates on a tight 32MB RAM budget. When other clients are connected, the Linux kernel continuously allocates memory for connection tracking tables (`nf_conntrack`), packet ring buffers (`sk_buff`), and real-time bandwidth daemons (`usr_flow`).
> * **The Safety Margin**: Disconnecting all other devices frees up approximately 2MB to 4MB of precious physical RAM. This provides the critical headroom needed for the web server to buffer the ~3.8MB image in `/tmp` and allow `mtd_write` to allocate erase/write buffers safely without triggering Linux Out-Of-Memory (OOM) mid-flash corruption.
> * **Quick Tip**: Reboot the router once immediately before uploading so RAM starts completely fresh and unfragmented.

See [README.md](./README.md#upgrading-firmware-via-web-admin-ui-local-upgrade) for additional details.

---

## Fast Development: Live Hot-Deploy via Telnet (No Flashing Required)

When developing or modifying Web UI pages, styles, scripts, or configuration files in `rootfs/etc_ro/`, you do not need to recompile or flash the full firmware image every time you make a change.

### Why This Works
* **Writable RAM Overlay:** The router operates with `rootfs on / type rootfs (rw)`. Files located in `/etc_ro/` can be directly overwritten in RAM while the router is running.
* **Built-in `wget`:** The router includes `/bin/wget`, allowing it to download modified files directly over the local network in milliseconds.

### Using the Automated Hot-Deploy Script

Run the included deployment script from the repository root:

```bash
python scripts/deploy_to_router.py
```

This will automatically:
1. Detect your PC's local LAN IP (e.g. `192.168.16.101`).
2. Start a temporary background HTTP server hosting `rootfs/etc_ro/`.
3. Log into the router via Telnet (`192.168.16.1:23`).
4. Transfer and replace modified files directly in `/etc_ro/`.
5. Shut down the temporary server and close the Telnet session.

#### Deploy Specific Files Only
You can also hot-deploy individual files by passing their paths:

```bash
python scripts/deploy_to_router.py web/admin/more.html web/admin/js/getinfo.js
```

#### Manual Telnet Deployment Commands
If you prefer running the commands manually:
1. Start a local HTTP server on your PC:
   ```bash
   python -m http.server 8899 --directory rootfs/etc_ro
   ```
2. Connect to the router via Telnet (`telnet 192.168.16.1 23`, credentials: `admin` / `admin`).
3. Run `wget` on the router:
   ```sh
   wget -O /etc_ro/web/admin/more.html http://192.168.16.101:8899/web/admin/more.html
   ```

> [!NOTE]
> **Persistence Note:** Hot-deploy changes take effect instantly in RAM and are ideal for rapid development and testing. To make changes permanent across power cycles and factory resets, rebuild the firmware with `python firmware_tool.py build` and flash it via TFTP or the Web UI.

