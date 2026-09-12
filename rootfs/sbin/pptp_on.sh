#!/bin/sh
#
#
# usage: wan.sh
#

. /sbin/global.sh

#killall -q udhcpc
killall -q pptp
killall -q l2tpd
killall -q openl2tpd

srv=`nvram_get 2860 wan_pptp_server`
u=`nvram_get 2860 wan_pptp_user`
pw=`nvram_get 2860 wan_pptp_pass`
mode=`nvram_get 2860 wan_pptp_mode`
pptp_opmode=`nvram_get 2860 wan_pptp_opmode`
pptp_optime=`nvram_get 2860 wan_pptp_optime`

if [ "$mode" = "0" ]
then
	ip=`nvram_get 2860 wan_pptp_ip`
	nm=`nvram_get 2860 wan_pptp_netmask`
	gw=`nvram_get 2860 wan_pptp_gateway`
	if [ "$gw" = "" ] 
	then
		gw="0.0.0.0"
	fi
	config-pptp.sh static $wan_if $ip $nm $gw $srv $u $pw $pptp_opmode $pptp_optime
else
	config-pptp.sh dhcp $wan_if $srv $u $pw $pptp_opmode $pptp_optime
fi
