# BL-WR2000 DHCP Custom DNS Bug & Fix Documentation

This document explains the root cause analysis, technical investigation, and solution for the DHCP DNS bug on the **LB-LINK BL-WR2000** (firmware `V7.1.4` / MT7628 MIPS).

---

## 1. Problem Description

When enabling **Custom / Advanced DNS** in the router's web management interface (`Advanced Settings -> DNS`):
* The custom DNS servers (e.g., `1.1.1.1`, `9.9.9.9`, AdGuard, Pi-hole, etc.) are saved in the router.
* However, all DHCP clients (PCs, phones, tablets, smart TVs) connected to the router continue to receive:
  - **Primary DNS:** `192.168.16.1` (the router's own LAN IP)
  - **Secondary DNS:** `8.8.8.8` (Google DNS)
* Even after renewing DHCP leases or rebooting the router, connected devices remain stuck on `192.168.16.1` and `8.8.8.8`.

---

## 2. Technical Root Cause Analysis

By reverse engineering the web server (`goahead`), shared configuration library (`libshare-0.0.26.so`), background daemon (`daemon`), and shell scripts, we identified **two distinct architectural flaws** causing this behavior:

### Flaw A: Hardcoded Defaults in NVRAM Configs
In `/etc_ro/Wireless/RT2860AP/RT2860_default_vlan` and `RT2860_default_novlan`, the firmware defines factory defaults for DHCP:
```ini
dhcpPriDns=192.168.16.1
dhcpSecDns=8.8.8.8
```
These keys (`dhcpPriDns` and `dhcpSecDns`) are the exact values read by the DHCP server generator scripts.

### Flaw B: Disconnection Between Web Form and DHCP Daemon
1. When you click **Apply** on the DNS settings page in the UI, the frontend makes an AJAX POST request:
   ```javascript
   // rootfs/etc_ro/web/admin/js/getinfo.js
   $.ajax({
       type: 'post',
       url: '/goform/set_AdvDns_cfg',
       data: $("#dnsSet").serialize(),  // sends status, dns1, dns2
       ...
   });
   ```
2. In `goahead` (at offset `0x4f36c`), this request is dispatched to `libshare-0.0.26.so` under the action `setdnsinfo`.
3. In `libshare-0.0.26.so` (at offset `0x1f470`), the handler executes:
   ```c
   nvram_set(2860, "wan_primary_dns", dns1);
   nvram_set(2860, "wan_secondary_dns", dns2);
   nvram_commit(2860);
   system("config-dns.sh %s %s", dns1, dns2);
   ```
4. **The Critical Missing Link:**
   - `config-dns.sh` only modified `/etc/resolv.conf` (used only by local processes on the router itself).
   - Neither `libshare` nor `config-dns.sh` ever updated `dhcpPriDns` or `dhcpSecDns` in NVRAM.
   - Neither ever called `config-udhcpd.sh -d` to update `/etc/udhcpd.conf`.
   - The DHCP server (`udhcpd`) was **never reloaded**, and continued reading the hardcoded NVRAM values (`dhcpPriDns=192.168.16.1` and `dhcpSecDns=8.8.8.8`).
5. Furthermore, in `/sbin/lan.sh` (line 89) and `/sbin/url_dns.sh` (line 10):
   ```sh
   pd=`nvram_get 2860 dhcpPriDns`
   sd=`nvram_get 2860 dhcpSecDns`
   ...
   config-udhcpd.sh -d $pd $sd
   ```
   Both scripts strictly read `dhcpPriDns` and `dhcpSecDns`, completely ignoring `wan_primary_dns` and `wan_advanced1_dns`!

---

## 3. The Complete Solution

To make custom DNS work reliably and automatically propagate to all connected clients, changes were implemented across the script chain and default templates:

### 1. Auto-Propagate Custom DNS in `config-dns.sh`
**File:** `rootfs/sbin/config-dns.sh`

Whenever `config-dns.sh` is invoked (by the UI, WAN connection, or CLI), it now syncs the DNS values directly into NVRAM and the DHCP server configuration:

```sh
# Sync DNS to DHCP server (udhcpd) so clients receive the custom DNS
if [ "$1" != "" ]; then
  nvram_set 2860 dhcpPriDns "$1"
  if [ "$2" != "" ]; then
    nvram_set 2860 dhcpSecDns "$2"
    config-udhcpd.sh -d "$1" "$2"
  else
    nvram_set 2860 dhcpSecDns ""
    config-udhcpd.sh -d "$1"
  fi
  # Restart udhcpd with new DNS settings
  config-udhcpd.sh -r 1
fi
```

### 2. Prioritize Custom DNS in `lan.sh` and `url_dns.sh`
**Files:** `rootfs/sbin/lan.sh` and `rootfs/sbin/url_dns.sh`

Updated the DHCP startup logic to check for custom DNS first (`wan_advanced1_dns` or `wan_primary_dns`) before falling back to default values:

```sh
# Check custom DNS settings if dhcpPriDns is empty or default
cust_pd=`nvram_get 2860 wan_advanced1_dns`
cust_sd=`nvram_get 2860 wan_advanced2_dns`
[ -z "$cust_pd" ] && cust_pd=`nvram_get 2860 wan_primary_dns`
[ -z "$cust_sd" ] && cust_sd=`nvram_get 2860 wan_secondary_dns`
if [ -n "$cust_pd" ]; then
    pd="$cust_pd"
    sd="$cust_sd"
else
    pd=`nvram_get 2860 dhcpPriDns`
    sd=`nvram_get 2860 dhcpSecDns`
fi
```

### 3. Clear Hardcoded DNS in Default NVRAM Templates
**Files:**
* `rootfs/etc_ro/Wireless/RT2860AP/RT2860_default_vlan`
* `rootfs/etc_ro/Wireless/RT2860AP/RT2860_default_novlan`

Changed:
```ini
-dhcpPriDns=192.168.16.1
-dhcpSecDns=8.8.8.8
+dhcpPriDns=
+dhcpSecDns=
```

Also ensured credentials are documented and present:
```ini
Login=admin
Password=admin
SuperUser=superadmin
SuperPass=lblink
```

---

## 4. Verification and Flashing

After rebuilding the firmware with `firmware_tool.py`:
```bash
python firmware_tool.py build uImage_fixed_dns
```

The output image `uImage_fixed_dns` can be flashed using `tftpd32.exe`.

### Expected Behavior After Fix:
1. When you enter custom DNS in the web UI (e.g. `1.1.1.1` and `1.0.0.1`) and hit Apply:
   - The DHCP server (`udhcpd`) immediately restarts with `option dns 1.1.1.1 1.0.0.1`.
   - LAN clients renewing their lease receive `1.1.1.1` and `1.0.0.1` directly.
   - Connected devices no longer get hijacked or forced to `192.168.16.1` and `8.8.8.8`.
