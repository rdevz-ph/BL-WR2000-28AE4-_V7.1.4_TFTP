#!/bin/sh
#
# $Id: //WIFI_SOC/MP/SDK_4_2_0_0/RT288x_SDK/source/user/rt2880_app/scripts/ntp.sh#1 $
#
# usage: ntp.sh
#

#srv=`nvram_get 2860 NTPServerIP`
sertype=`nvram_get 2860 Server_type`
sync=`nvram_get 2860 NTPSync`
tz=`nvram_get 2860 TZ`

killall -q ntpclient
killall -9 ntpclient
if [ "$sertype" = "1" ]; then
srv=`nvram_get 2860 NTPServerIP`
else
srv=`nvram_get 2860 NTPServerIP1`
fi
if [ "$srv" = "" ]; then
	srv="time.windows.com"
fi
#if [ "$sync" = "" ]; then
#	sync=1
#elif [ $sync -lt 300 -o $sync -le 0 ]; then
#	sync=1
#fi

sync=`expr $sync \* 3600`

if [ "$tz" = "" ]; then
	tz="UCT_000"
fi

#debug
#echo "serv=$srv"
#echo "sync=$sync"
#echo "tz=$tz"

echo $tz > /etc/tmpTZ
sed -e 's#.*_\(-*\)0*\(.*\)#GMT-\1\2#' /etc/tmpTZ > /etc/tmpTZ2
sed -e 's#\(.*\)--\(.*\)#\1\2#' /etc/tmpTZ2 > /etc/TZ
rm -rf /etc/tmpTZ
rm -rf /etc/tmpTZ2
killall -9 ntpclient
ntpclient -s -c 0 -h $srv -i $sync &

