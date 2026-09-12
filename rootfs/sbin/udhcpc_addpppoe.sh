#!/bin/sh
#
# $Id: //WIFI_SOC/MP/SDK_4_2_0_0/RT288x_SDK/source/user/rt2880_app/scripts/config-igmpproxy.sh#1 $
#
# usage: config-igmpproxy.sh <wan_if_name> <lan_if_name>
#

. /sbin/config.sh
. /sbin/global.sh

if [ "$wanmode" = "PPPOE" -o "$wanmode" = "PPPOE_Ru" ]; then
	sleep 1;pppoe-on.sh
fi




