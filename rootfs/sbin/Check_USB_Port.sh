#! /bin/sh

DEV_FILE=/tmp/check_usb_dev
USB_Dev=/tmp/check

cat /proc/bus/usb/devices | sed -n '/.* Vendor=.* ProdID=.*/p' | sed -e 's/.*Vendor=\(.*\) ProdID=\(.*\) Rev.*/\1:\2/' | sed 'y/abcdefghijklmnopqrstuvwxyz/ABCDEFGHIJKLMNOPQRSTUVWXYZ/' > $DEV_FILE
awk 'NR == 3' $DEV_FILE > $USB_Dev