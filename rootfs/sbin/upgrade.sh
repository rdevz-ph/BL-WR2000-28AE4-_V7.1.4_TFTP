#!/bin/sh

# Description:
# unload wifi driver and apps to free memory for firmware upload purpose

# Pitfall:
# In 2.4.x the ip of br0 was determined by min(raxx, eth2x),
# so two possible condtions:
# 1) br0 mac = eth2x mac .... just unload wifi driver
# 2) br0 mac = raxx mac  .... unload br0 and wifi driver
#                             then mirror br0 to eth2x
#
# In 2.6.17 later the kernel supports to change br0 MAC with 
# ifconfig command so this script is not needed anymore.
#

. /sbin/global.sh

kill_apps="syslogd udhcpd klogd zebra ripd wscd rt2860apd rt61apd inadyn nvram_daemon dnsproxy\
iwevent stupid-ftpd smbd ated ntpclient lld2d igmpproxy dnsmasq telnetd miniupnpd usr_flow speed_wan cmd_convert daemon uplog_daemon"

ifRaxDown()
{
	ifconfig wds0 down 1>/dev/null 2>&1
	ifconfig wds1 down 1>/dev/null 2>&1
	ifconfig wds2 down 1>/dev/null 2>&1
	ifconfig wds3 down 1>/dev/null 2>&1

	#ifconfig apcli0 down 1>/dev/null 2>&1

	ifconfig mesh0 down 1>/dev/null 2>&1
	num=`nvram_get 2860 BssidNum`
	while [ "$num" -gt 0 ]
	do
		num=`expr $num - 1`
		ifconfig ra$num down
	done

	if [ "$CONFIG_RALINK_MT7620" = "y" -a "$CONFIG_GE_RGMII_MT7530_P0_AN" = "y" ]; then
			ifconfig ra2 down
	fi
	echo -e "\n##### disable 1st wireless interface #####"
}

ifRaixDown()
{
	ifconfig wdsi0 down 1>/dev/null 2>&1
	ifconfig wdsi1 down 1>/dev/null 2>&1
	ifconfig wdsi2 down 1>/dev/null 2>&1
	ifconfig wdsi3 down 1>/dev/null 2>&1
	num=`nvram_get rtdev BssidNum`
	while [ "$num" -gt 0 ]
	do
		num=`expr $num - 1`
		ifconfig rai$num down
	done
	echo -e "\n##### disable 2nd wireless interface #####"
}

unload_ra0()
{
	ifRaxDown
	ifRaixDown
}

rmmod domain_login
rmmod flow_manage

# unload apps
for apps in $kill_apps
do
	killall -q $apps
done
for apps in $kill_apps
do
	killall -q -9 $apps
done

unload_ra0

echo 3 > /proc/sys/vm/drop_caches
sleep 1
