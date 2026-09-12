# Cloudflare Worker HTTP OTA Updater Guide

This Cloudflare Worker serves as an HTTP OTA proxy and update server for the BL-WR2000 router.

## Why this Worker is Needed

1. **Embedded wget SSL Limitation:**
   The router runs Linux 2.6.36 with a lightweight uClibc `wget` binary that has no OpenSSL or TLS compiled in. It can only fetch plain `http://` URLs.
2. **GitHub Releases HTTPS Enforcement:**
   GitHub Releases and Azure Blob asset downloads strictly enforce HTTPS with 302 redirects. When the router tries to fetch directly from GitHub, `wget` halts with `Unknown/unsupported protocol`.
3. **Vendor Server Decommission:**
   The original vendor server (`sandbox.b-link.net.cn`) is offline and no longer serves updates.

This Worker receives requests over plain HTTP, fetches the release asset from GitHub over HTTPS (following redirects), and streams the binary to the router.

---

## Directory Structure

```
scripts/cf-ota-updater/
|-- package.json       # Project definitions and scripts
|-- wrangler.toml      # Wrangler configuration and environment variables
|-- README.md          # This publishing guide
`-- src/
    `-- index.js       # Cloudflare Worker request handler
```

---

## Prerequisites

1. **Node.js**: Installed on your computer (Node 18 or higher recommended).
2. **Cloudflare Account**: Free tier is completely sufficient.

---

## Step-by-Step Publishing Guide

### 1. Open Terminal in the Worker Folder

Open PowerShell or Command Prompt in the Worker directory:

```bash
cd C:\Users\Romel\Desktop\FUN-PROJECTS\BL-WR2000(28AE4)_V7.1.4_TFTP\scripts\cf-ota-updater
```

### 2. Install Dependencies

Install Wrangler locally:

```bash
npm install
```

### 3. Log into Cloudflare

Authenticate Wrangler with your Cloudflare account:

```bash
npx wrangler login
```

A browser window will open asking you to authorize Wrangler. Click **Allow**.

### 4. (Optional) Test Locally

You can test the Worker locally before publishing:

```bash
npm run dev
```

Visit `http://localhost:8787` in your browser to view the status dashboard.

### 5. Deploy to Cloudflare

Deploy the Worker to your Cloudflare account:

```bash
npm run deploy
```

Wrangler will output your live public Worker URL:
```
https://bl-wr2000-ota-updater.romel-brosas.workers.dev
```

---

## Available Worker Endpoints

Once deployed, your Worker provides the following endpoints:

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/` | GET | Visual dashboard with status and links |
| `/image/WRS-432-300M-28N-S-EN/upgrade.txt` | GET | Router native `upgrade.txt` manifest |
| `/upgrade.txt` | GET | Short path for `upgrade.txt` |
| `/image/WRS-432-300M-28N-S-EN/update_firmware.bin` | GET | Proxied HTTP stream of firmware binary |
| `/update_firmware.bin` | GET | Short path for firmware binary |
| `/api/version` | GET | JSON API for Web Admin UI and scripts |
| `/ping` | GET | Health check endpoint (returns `OK`) |

---

## Dynamic MD5 and Automatic Version Detection

The Worker dynamically tracks the repository rolling pre-release and `main` branch:
1. **Immediate Release Availability:** The Worker sources `update_firmware.bin` from the rolling GitHub Pre-Release (`releases/download/pre-release/update_firmware.bin`), which updates immediately upon every push to `main` via GitHub Actions (avoiding GitHub raw's 5-minute CDN cache delay).
2. **Dynamic MD5:** Every 60 seconds, the Worker calculates the MD5 checksum of the pre-release binary dynamically.
3. **Version Auto-Detection:** The Worker reads `rootfs/etc_ro/FW-Version` from `main` to determine the latest available version string (e.g. `7.1.4`).
4. **Zero-Maintenance:** You do not need to re-deploy the Cloudflare Worker or manually edit MD5 hashes when pushing new firmware builds.

If you ever need to change the upstream repository URLs, update `wrangler.toml`:
```toml
[vars]
FIRMWARE_DOWNLOAD_URL = "https://github.com/rdevz-ph/BL-WR2000-28AE4-_V7.1.4_TFTP/releases/download/pre-release/update_firmware.bin"
VERSION_INFO_URL = "https://raw.githubusercontent.com/rdevz-ph/BL-WR2000-28AE4-_V7.1.4_TFTP/main/rootfs/etc_ro/FW-Version"
FALLBACK_VERSION = "7.1.4"
RELEASE_NOTES_EN = "BL-WR2000 Custom Firmware v7.1.4: Dynamic OTA updater, DHCP DNS fix, and Web UI upgrade."
RELEASE_NOTES_ZH = "BL-WR2000 自定义固件 v7.1.4: 动态 OTA 更新服务、DHCP DNS 修复与 Web 升级。"
```
Then run `npm run deploy` to update the Worker environment variables.

---

## Configuring the Router to Use Your Worker

### Method 1: Web Admin UI (One-Click Update)
1. Open the router Web Admin (`http://192.168.16.1`).
2. Go to **Firmware Upgrade** (`upload_firmware.html`) and select **Online Check**.
3. Enter your Worker URL into the Server input field (or use the configured default).
4. Click **Check Version**. When a new version is detected, click **Upgrade Now**.
5. The Web UI will stream the firmware, verify the U-Boot header, and flash with progress reporting.

### Method 2: Command Line Script (`/sbin/ota_upgrade.sh`)
From the router terminal or SSH:
```bash
/sbin/ota_upgrade.sh http://bl-wr2000-ota-updater.romel-brosas.workers.dev
```
The script downloads `upgrade.txt`, checks the MD5 checksum, downloads the binary, and executes `/bin/mtd_write` to flash and reboot.
