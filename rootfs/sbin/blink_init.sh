#!/bin/sh
#
# $Id: //WIFI_SOC/MP/SDK_4_3_2_0/RT288x_SDK/source/user/rt2880_app/scripts/nat.sh#1 $
#
# usage: nat.sh
#

. /sbin/config.sh
. /sbin/global.sh

#ps | grep daemon | grep -v "grep" | grep -v "nvram_daemon"

if [ "$CONFIG_BLINK_JS_INJECT" = "y" ]; then
	ps | grep jsprocess | grep -v "grep"
	if [ $? -eq 0 ];then
		killall jsprocess
	fi
	
	lsmod | grep http_js | grep -v "grep"
	if [ $? -eq 0 ];then
		rmmod http_js
	fi
	if [ `nvram_get 2860 FeiChangYun` = "1" ]; then
		insmod /lib/modules/2.6.36/kernel/drivers/net/BL_JS/http_js.ko
		jsprocess -b -id blk -enable -net br0 &
		echo "jsprocess run ...."
	fi
fi

if [ "$CONFIG_BLINK_RUIXUN" = "y" ]; then
	ps | grep rpgbind | grep -v "grep"
	if [ $? -eq 0 ];then
		killall rpgbind
	fi
	if [ `nvram_get 2860 RuiXun` = "1" ]; then
		rpgbind &
		echo "rpgbind run ...."
	fi
fi

if [ "$CONFIG_BLINK_WEIWANG" = "y" ]; then
	ps | grep wWlogger | grep -v "grep"
	if [ $? -eq 0 ];then
		killall wWpt
		killall wWlogger
	fi
	if [ `nvram_get 2860 WeiWang` = "1" ]; then
		wWpt -i br0 -c blink 
		wWlogger &
		echo "wWlogger run ...."
	fi
fi

if [ "$CONFIG_BLINK_CHUYUN" = "y" ]; then
	ps | grep cloud_client | grep -v "grep"
	if [ $? -eq 0 ];then
		killall cloud_client
	fi
	if [ `nvram_get 2860 ChuYun` = "1" ]; then
		cloud_client &
		echo "cloud_client run ...."
	fi
fi

if [ "$CONFIG_BLINK_ALINK_CLOUD" = "y" ]; then
	ps | grep Ali_Cloud | grep -v "grep"
	if [ $? -eq 0 ];then
		killall Ali_Cloud
	fi
	
	lsmod | grep asec | grep -v "grep"
	if [ $? -eq 0 ]
	then
		rmmod asec
	fi
	
	insmod /etc_ro/asec.ko lan_if=br0
	Ali_Cloud &
	echo "Ali_Cloud run ...."
fi

if [ "$CONFIG_BLINK_NET_SERIAL" = "y" ]; then
	if [ `nvram_get 2860 ser_status` = "1" ]; then
		ps | grep net_serial | grep -v "grep"
		if [ $? -eq 0 ];then
			killall net_serial
		fi
		SERIAL_FILE=/etc_ro/serial_config
		ip=`nvram_get 2860 ser_domain`
		protocol=`nvram_get 2860 ser_network`
		port=`nvram_get 2860 ser_port`
		com=`nvram_get 2860 ser_com`
		baud=`nvram_get 2860 ser_baud`
		data=`nvram_get 2860 ser_data`
		verfiy=`nvram_get 2860 ser_verfiy`
		stop=`nvram_get 2860 ser_stop`
		flow=`nvram_get 2860 ser_flow`
		data=`nvram_get 2860 ser_heart`
		auth=`nvram_get 2860 ser_auth`
		
		echo "[heart]" > $SERIAL_FILE
		echo "timesec=4" >> $SERIAL_FILE
		if [ "$protocol" = "TCP" ]; then
			echo "enable=1" >> $SERIAL_FILE
			echo "data=$data" >> $SERIAL_FILE
			string="-A -H"
		else
			echo "enable=0" >> $SERIAL_FILE
			string=""
		fi
		
		echo "" >> $SERIAL_FILE
		echo "[auth]" >> $SERIAL_FILE
		if [ "$protocol" = "TCP" ]; then
			echo "enable=1" >> $SERIAL_FILE
			echo "uuid=$auth" >> $SERIAL_FILE
		else
			echo "enable=0" >> $SERIAL_FILE
		fi
		echo "net_serial run ...."
		net_serial -S $ip -P $protocol -p $port -B $baud -C $com -F $flow -D $data -c $verfiy -s $stop $string &
	else
		killall net_serial
	fi
fi
