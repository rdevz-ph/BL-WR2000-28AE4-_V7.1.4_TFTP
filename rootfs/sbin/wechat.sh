#!/bin/sh
#
# WeChat WiFi
#
. /sbin/config.sh
. /sbin/global.sh

#echo $1 $2 $3

for z in $(seq 0 15)
do
sleep 2
subscribe=`curl -k $1`

flag=`echo $subscribe | grep subscribe | cut -d ':' -f 2 | cut -d ',' -f 1`

if [ "$flag" != "" ]; then
	if [ "$flag" = "1" ]; then
		curl -k $2
		exit 0
	fi
fi
if [ $z -eq 15 -a "$flag" != "1" ]; then
#	echo "DisConnectSta "$3
	iptables -t filter -R ndsNET $4 -m mac --mac-source $3 -p tcp --dport 443 -j DROP
	iwpriv ra0 set DisConnectSta=$3
	exit 0
fi
done
