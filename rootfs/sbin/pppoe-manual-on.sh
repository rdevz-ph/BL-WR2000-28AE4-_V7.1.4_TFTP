#!/bin/sh
#
# $Id: pppoe-manual-on.sh,v 1.00 2010-1-16 15:07:19 Created by Gerry Lee $
#
# usage: pppoe-manual-on.sh
#
. /sbin/global.sh
killall -q pppd
u=`nvram_get 2860 wan_pppoe_user`
pw=`nvram_get 2860 wan_pppoe_pass`
pppoe_opmode=`nvram_get 2860 wan_pppoe_opmode`
#if [ "$pppoe_opmode" = "Manual" ]; then
	pppoe_opmode=KeepAlive
	pppoe_optime=`nvram_get 2860 wan_pppoe_optime`
	pppoe.sh $u $pw $wan_if $pppoe_opmode $pppoe_optime
	pppd file /etc/options.pppoe &
#else
#	echo "you should change the pppoe-opmode to Manual mode"
#fi
