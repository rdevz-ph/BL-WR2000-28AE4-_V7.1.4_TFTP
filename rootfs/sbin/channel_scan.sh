#!/bin/sh
channel_cur=`iwconfig ra0 | grep -i "Channel=" | awk '{print $2}' | cut -f2 -d=`                    
iwpriv ra0 get_site_survey > /etc/channel_scan.conf
echo "$channel_cur" > /etc/signal.conf
awk 'NR>2 && $1=='$channel_cur' {print $5}' /etc/channel_scan.conf >> /etc/signal.conf
#awk 'NR>2 && $5>15 {print $1}' /etc/channel_scan.conf > /etc/all.conf
#awk '$1>65 {print $1}' /etc/all.conf > /etc/bad.conf
#awk '$1>30 && $1<66 {print $1}' /etc/all.conf > /etc/good.conf
#awk '$1<31 {print $1}' /etc/all.conf > /etc/best.conf
rm -rf /etc/channel_scan.conf
