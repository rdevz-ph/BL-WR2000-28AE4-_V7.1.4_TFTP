#!/bin/sh

# $Id: //WIFI_SOC/MP/SDK_4_2_0_0/RT288x_SDK/source/user/rt2880_app/scripts/config-dns.sh#1 $
# usage: config-dns.sh [<dns1>] [<dns2>]

fname="/etc/resolv.conf"
fbak="/etc/resolv_conf.bak"

# in case no previous file
touch $fname

# backup file without nameserver part
sed -e '/nameserver/d' $fname > $fbak

# set primary and seconday DNS
if [ "$1" != "" ]; then
  echo "nameserver $1" > $fname
else # empty dns
  rm -f $fname
fi
if [ "$2" != "" ]; then
  echo "nameserver $2" >> $fname
fi

cat $fbak >> $fname
rm -f $fbak

# Sync custom DNS to DHCP server (udhcpd) so connected devices receive it
if [ "$1" != "" ]; then
  nvram_set 2860 dhcpPriDns "$1"
  if [ "$2" != "" ]; then
    nvram_set 2860 dhcpSecDns "$2"
    config-udhcpd.sh -d "$1" "$2"
  else
    nvram_set 2860 dhcpSecDns ""
    config-udhcpd.sh -d "$1"
  fi
  # Reload udhcpd cleanly without dropping physical Ethernet links
  killall udhcpd 2>/dev/null
  rm -f /var/run/udhcpd.pid
  [ -f /etc/udhcpd.conf ] && udhcpd /etc/udhcpd.conf
fi


