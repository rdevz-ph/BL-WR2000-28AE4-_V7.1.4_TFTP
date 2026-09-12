#!/bin/sh
#
# $Id: //WIFI_SOC/MP/SDK_4_2_0_0/RT288x_SDK/source/user/rt2880_app/scripts/updateMtu.sh#1 $
#
# usage: nat.sh
#

. /sbin/config.sh
. /sbin/global.sh

fag=`ifconfig | grep ppp`
if [ "$fag" = "" ]; then
echo "noppppp...."
else

echo "pppppp...."
	if [ "$wanmode" = "PPPOE" -o "$wanmode" = "L2TP" -o "$wanmode" = "PPTP" -o "$wanmode" = "PPPOE_Ru" -o "$wanmode" = "L2TP_Ru" -o "$wanmode" = "PPTP_Ru" -o "$wanmode" = "3G" ]; then
		wan_if_blink="ppp0"
	fi
	
	if [ "$wanmode" = "PPPOE" -o "$wanmode" = "PPPOE_Ru" ]; then
		mtuvalue=`nvram_get 2860 MTUpppoevalue`
		ifconfig $wan_if_blink mtu $mtuvalue
		
	elif [ "$wanmode" = "L2TP" -o "$wanmode" = "L2TP_Ru" ]; then
		mtuvalue=`nvram_get 2860 MTUl2tpvalue`
		ifconfig $wan_if_blink mtu $mtuvalue
		
	elif [ "$wanmode" = "PPTP" -o "$wanmode" = "PPTP_Ru" ]; then
		mtuvalue=`nvram_get 2860 MTUpptpvalue`
		ifconfig $wan_if_blink mtu $mtuvalue
		
	fi
fi
	
	



