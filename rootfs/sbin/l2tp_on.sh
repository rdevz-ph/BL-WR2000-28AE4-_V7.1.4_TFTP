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

srv=`nvram_get 2860 wan_l2tp_server`
	u=`nvram_get 2860 wan_l2tp_user`
	pw=`nvram_get 2860 wan_l2tp_pass`
	mode=`nvram_get 2860 wan_l2tp_mode`
	l2tp_opmode=`nvram_get 2860 wan_l2tp_opmode`
	l2tp_optime=`nvram_get 2860 wan_l2tp_optime`
	
if [ "$mode" = "0" ]; then
	ip=`nvram_get 2860 wan_l2tp_ip`
	nm=`nvram_get 2860 wan_l2tp_netmask`
	gw=`nvram_get 2860 wan_l2tp_gateway`
	if [ "$gw" = "" ]; then
		gw="0.0.0.0"
	fi
	config-l2tp.sh static $wan_if $ip $nm $gw $srv $u $pw $l2tp_opmode $l2tp_optime
else
	config-l2tp.sh dhcp $wan_if $srv $u $pw $l2tp_opmode $l2tp_optime
fi