# LB-LINK BL-WR2000 Timezone & NTP Bug Analysis & Fix

This document explains the root cause analysis, technical investigation, and solution for the Timezone and NTP synchronization bug on the **LB-LINK BL-WR2000** (firmware `V7.1.4` / MT7628 MIPS).

---

## 1. Problem Description

When running the router in **Router (Gateway) Mode**, all time-dependent features were either non-functional or erratic:
* **Child Protection (Scheduled Internet Cutoffs):** Setting rules to block client devices during specific hours (e.g., 9:00 PM to 7:00 AM) failed to trigger or blocked devices at random, incorrect times.
* **Wi-Fi Timers & LED Sleep Mode:** Scheduled Wi-Fi shutdown and LED toggles failed to operate on local time.
* **System Event Logs:** Router logs and client connection history had timestamps stuck in year 2011 (or 1970) in UTC.
* **Hidden Configuration:** The router management web interface provided no visible option to change the time zone or configure NTP servers.

Because of these defects, users frequently found "Router Mode" unusable and were forced to demote the router to an Access Point (AP) or simple Wi-Fi repeater.

---

## 2. Technical Root Cause Analysis

By reverse engineering the filesystem init scripts, web server templates, daemon binaries (`usr_flow`, `goahead`, `libshare`), and NVRAM defaults, we identified **five distinct architectural flaws**:

### Flaw A: Missing Daemon Startup in Init Script (`/etc_ro/rcS`)
The Linux system startup script ([`rootfs/etc_ro/rcS`](./rootfs/etc_ro/rcS)) initializes the hardware drivers, filesystem mounts, and daemons. In the factory firmware:
* `/sbin/ntp.sh` was **never executed** during system boot.
* No `/etc/TZ` file was created on startup.
* As a result, the kernel and BusyBox C library (`uClibc`) fell back to UTC (GMT+0), with the system clock starting at the hardware build timestamp (`2011-01-01` or `1970-01-01`).

### Flaw B: The Time Zone Web UI Card Was Hidden
The vendor actually wrote the full HTML markup and JavaScript logic for the Time Zone card:
* Modal template `#modal_timezone` existed in [`rootfs/etc_ro/web/admin/more.html`](./rootfs/etc_ro/web/admin/more.html).
* AJAX handler `get_timeZone()` and `set_timeZone()` existed in [`rootfs/etc_ro/web/admin/js/getinfo.js`](./rootfs/etc_ro/web/admin/js/getinfo.js).
* However, the vendor **excluded the card from the 3x4 grid** in `more.html`, leaving only 11 cards visible. Users had no UI mechanism to select their time zone or see the router's current time.

### Flaw C: Unreliable Hardcoded NTP Servers
In factory default NVRAM files ([`RT2860_default_vlan`](./rootfs/etc_ro/Wireless/RT2860AP/RT2860_default_vlan) and [`RT2860_default_novlan`](./rootfs/etc_ro/Wireless/RT2860AP/RT2860_default_novlan)):
```ini
NTPServerIP=time.pool.aliyun.com
NTPSync=1
```
The router defaulted exclusively to Alibaba Cloud NTP (`time.pool.aliyun.com`). Outside mainland China, this server frequently suffers from high latency, packet loss, or domain resolution timeouts, causing `ntpclient` to silently fail.

### Flaw D: Missing Philippines (Manila) Localization
In the stock timezone list:
* UTC+8 options only included `ChinaCoast` (Beijing/Hong Kong), `Taipei`, `Singapore`, and `AustraliaWA`.
* There was no entry for the Philippines (`PHT_008` / Manila), preventing proper regional identification.

### Flaw E: POSIX Timezone Inverted Sign Standard
The router libc and BusyBox require POSIX standard formatting for `/etc/TZ`. Under POSIX:
* Timezones east of Greenwich (like UTC+8) require a **negative** sign: `GMT-8`.
* Writing `GMT+8` actually sets the clock to UTC-8 (16 hours in the past).
The shell script `/sbin/ntp.sh` handles this translation using a `sed` regular expression:
```sh
sed -e 's#.*_\(-*\)0*\(.*\)#GMT-\1\2#'
```
Passing an incorrectly formatted string breaks this parser and leaves `/etc/TZ` invalid.

---

## 3. The Solution & Implementation

### 1. Boot Initialization in `/etc_ro/rcS`
Added automatic timezone setup and background NTP daemon startup on boot in [`rootfs/etc_ro/rcS`](./rootfs/etc_ro/rcS):
```sh
# Set default timezone to UTC+8 (Manila) and start NTP
echo "GMT-8" > /etc/TZ
/sbin/ntp.sh &
```

### 2. Factory Defaults Update (`RT2860_default_*`)
Updated default NVRAM configuration in [`RT2860_default_vlan`](./rootfs/etc_ro/Wireless/RT2860AP/RT2860_default_vlan) and [`RT2860_default_novlan`](./rootfs/etc_ro/Wireless/RT2860AP/RT2860_default_novlan):
```ini
TZ=PHT_008
NTPServerIP=time.pool.aliyun.com
NTPServerIP1=time.windows.com
NTPSync=1
NTPValid=1
```
This ensures new installations and factory resets automatically default to `PHT_008` with `time.windows.com` as an active fallback.

### 3. Exposing the Time Zone Card in the Web UI
In [`rootfs/etc_ro/web/admin/more.html`](./rootfs/etc_ro/web/admin/more.html), restored the 12th card under **Advanced -> System**, completing the 3x4 grid:
* Allows users to select time zones from the dropdown.
* Shows live system time and allows testing NTP server connectivity.

### 4. Dedicated Philippines Entry (`PHT_008`)
* Added dedicated `PHT_008` mapped to `(GMT+08:00) Philippines, Manila` alongside existing regional entries in:
  - [`more.html`](./rootfs/etc_ro/web/admin/more.html) (Desktop Web UI)
  - [`mobile/index.html`](./rootfs/etc_ro/web/admin/mobile/index.html) (Mobile Web UI)
* Added translations for `Philippines` across all 6 language dictionaries (English, Turkish, Spanish, German, Russian, French) in [`lang_more.js`](./rootfs/etc_ro/web/admin/js/lang_more.js) and [`lang_mobile.js`](./rootfs/etc_ro/web/admin/mobile/js/lang_mobile.js).

### 5. Live Router Time Display in Client Modals
In [`rootfs/etc_ro/web/admin/terminal.html`](./rootfs/etc_ro/web/admin/terminal.html), added real-time router clock display directly beneath the Child Protection schedule inputs:
> `Router Time: YYYY-MM-DD HH:MM:SS (UTC+8 Manila)`

This allows users to instantly verify the router's internal clock when setting up access rules.

---

## 4. Real-World Scheduling Guide: Crossing Midnight

The router daemon [`usr_flow`](./rootfs/bin/usr_flow) evaluates scheduled drop rules using `iptables` against local system time.

Because time schedules evaluate within a 24-hour cycle (`00:00` to `23:59`), setting a single range that crosses midnight (e.g., `21:00 ~ 07:00`) is rejected by frontend validation (*"Start time cannot be greater than end time"*).

To schedule an overnight cutoff (e.g., **No internet from 9:00 PM to 7:00 AM**), split the schedule into two continuous periods:
* **Period 1 (Evening):** `21 : 00` ~ `23 : 59` (Blocks from 9:00 PM to midnight)
* **Period 2 (Morning):** `00 : 00` ~ `07 : 00` (Continues blocking from midnight to 7:00 AM)

### Verification
Live hardware testing on the BL-WR2000 confirmed that when configuring `23:58 ~ 23:59` and `00:00 ~ 07:00`, the router dropped the target client's network traffic at **exactly 11:58:00 PM**, verifying full end-to-end synchronization between the kernel clock, `usr_flow`, and `iptables`.
