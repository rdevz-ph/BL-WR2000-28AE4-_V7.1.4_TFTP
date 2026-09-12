#!/bin/sh
# BL-WR2000 Router OTA Upgrade Script
# Downloads and writes firmware from Cloudflare Worker or HTTP server.
# Usage: /sbin/ota_upgrade.sh [SERVER_URL]

SERVER="${1:-http://bl-wr2000-ota-updater.romel-brosas.workers.dev}"
SERVER="${SERVER%/}"

echo "[*] Checking OTA firmware from: $SERVER"
rm -f /tmp/upgrade.txt /tmp/update_firmware.bin

# Try vendor path first, then root path
wget "$SERVER/image/WRS-432-300M-28N-S-EN/upgrade.txt" -O /tmp/upgrade.txt -q -t 3 -T 10
if [ ! -s /tmp/upgrade.txt ]; then
    wget "$SERVER/upgrade.txt" -O /tmp/upgrade.txt -q -t 3 -T 10
fi

if [ ! -s /tmp/upgrade.txt ]; then
    echo "[!] Error: Failed to download upgrade.txt from $SERVER"
    exit 1
fi

IMAGE_NAME=$(sed -n '1p' /tmp/upgrade.txt | tr -d '\r\n')
NEW_VER=$(sed -n '2p' /tmp/upgrade.txt | tr -d '\r\n')
EXPECTED_MD5=$(sed -n '3p' /tmp/upgrade.txt | tr -d '\r\n')

CUR_VER="7.1.4"
if [ -f /etc_ro/FW-Version ]; then
    CUR_VER=$(cut -d',' -f2 /etc_ro/FW-Version | tr -d '\r\n')
fi

echo "[+] Current Version: $CUR_VER"
echo "[+] Latest Version:  $NEW_VER"
echo "[+] Target Image:    $IMAGE_NAME"
echo "[+] Expected MD5:    $EXPECTED_MD5"

case "$IMAGE_NAME" in
    http://*|https://*)
        IMG_URL="$IMAGE_NAME"
        ;;
    *)
        IMG_URL="$SERVER/image/WRS-432-300M-28N-S-EN/$IMAGE_NAME"
        ;;
esac

echo "[*] Downloading firmware from $IMG_URL ..."
wget "$IMG_URL" -O /tmp/update_firmware.bin -t 3 -T 90
if [ ! -s /tmp/update_firmware.bin ]; then
    wget "$SERVER/$IMAGE_NAME" -O /tmp/update_firmware.bin -t 3 -T 90
fi

if [ ! -s /tmp/update_firmware.bin ]; then
    echo "[!] Error: Failed to download firmware image!"
    exit 1
fi

FILE_SIZE=$(wc -c < /tmp/update_firmware.bin | tr -d ' ')
echo "[+] Downloaded $FILE_SIZE bytes."

if [ -n "$EXPECTED_MD5" ] && [ "$EXPECTED_MD5" != "-" ]; then
    echo "[*] Verifying MD5 checksum..."
    ACTUAL_MD5=$(md5sum /tmp/update_firmware.bin | awk '{print $1}')
    echo "[+] Calculated: $ACTUAL_MD5"
    echo "[+] Expected:   $EXPECTED_MD5"
    if [ "$ACTUAL_MD5" != "$EXPECTED_MD5" ]; then
        echo "[!] Error: Checksum mismatch! Aborting."
        rm -f /tmp/update_firmware.bin
        exit 1
    fi
    echo "[+] Checksum verified successfully!"
fi

echo "[*] Flashing firmware to SPI flash and rebooting router..."
/bin/mtd_write -o 0 -l "$FILE_SIZE" -r write /tmp/update_firmware.bin Kernel
