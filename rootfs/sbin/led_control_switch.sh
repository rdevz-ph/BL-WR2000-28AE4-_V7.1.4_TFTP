#!/bin/sh
#
# usage: led_control_switch.sh
# date:  2017-06-05
# author:wgl
#
. /sbin/config.sh
ledeasysw=`nvram_get 2860 ledeasysw`
curyear=`date | awk '{print $6}'`
if [ "$curyear" = "1970" -a "$ledeasysw" != "1" ];then
	echo "curyear=$curyear"
	echo "ledeasysw=$ledeasysw"
	exit 1
fi
if [ "$CONFIG_BLINK_LED_SWITCH_CONTROL" = "y" ];then
		
		curhour=`date | awk '{print $4}' | awk -F":" '{print $1}'`
		curmin=`date | awk '{print $4}' | awk -F":" '{print $2}'`
		ledsh=`nvram_get 2860 ledsh`
		ledsm=`nvram_get 2860 ledsm`
		ledeh=`nvram_get 2860 ledeh`
		ledem=`nvram_get 2860 ledem`
		ledon=`nvram_get 2860 ledon`
		ledflag=0
		ledstatus=0
		platform=0
		led5g=0

	
		if [ "$ledsh" -lt "$ledeh" ];then
				if [ "$curhour" -gt "$ledsh" -a "$curhour" -lt "$ledeh" ];then
						ledflag=1	
				elif [ "$curhour" -eq "$ledsh" -a "$curmin" -ge "$ledsm" ];then
						ledflag=1
				elif [ "$curhour" -eq "$ledeh" -a "$curmin"  -le "$ledem" ];then
						ledflag=1
				else
						ledflag=0
				fi
		elif [ "$ledsh" -eq "$ledeh" ];then
				if [ "$curhour" -eq "$ledsh" ];then		
						if [ "$curmin" -ge "$ledsm" -a "$curmin" -le "$ledem" ];then
								ledflag=1
						else
								ledflag=0
						fi

				else
						ledfalg=0
				fi
		elif [ "$ledsh" -gt "$ledeh" ];then
				if [ "$curhour" -gt "$ledsh" ];then
						ledflag=1
				elif [ "$curhour" -lt "$ledeh" ];then
						ledflag=1
				elif [ "$curhour" -eq "$ledsh" -a "$curmin" -ge "$ledsm" ];then
						ledflag=1
				elif [ "$curhour" -eq "$ledeh" -a "$curmin" -le "$ledem" ];then
						ledflag=1
				else
						ledflag=0
				fi
		else
				ledflag=0
		fi

		
		if [ "$CONFIG_RALINK_MT7620" = "y" -a "$CONFIG_GE_RGMII_MT7530_P0_AN" != "y" ];then
				platform=7620
		elif [ "$CONFIG_RALINK_MT7620" = "y" -a "$CONFIG_GE_RGMII_MT7530_P0_AN" = "y" ];then
				platform=7530
		elif [ "$CONFIG_RALINK_MT7628" = "y" ];then
				platform=7628
		elif [ "$CONFIG_RALINK_MT7621" = "y" ];then
				platform=7621
		fi

		if [ "$CONFIG_BLINK_DUAL_BAND_ROUTER" = "y" ];then
				led5g=1
		else
				led5g=0
		fi

		ledstatus=`nvram_get 2860 ledstatus`
		echo "platform=$platform ledstatus=$ledstatus ledeasysw=$ledeasysw led5g=$led5g ledflag=$ledflag ledon=$ledon"
		echo "curhour=$curhour curmin=$curmin ledsh=$ledsh ledsm=$ledsm ledeh=$ledeh ledem=$ledem"
		
		if [ "$ledflag" = "1" -o "$ledeasysw" = "1" ];then
				if [ "$ledstatus" = "1" ];then
						echo `nvram_set 2860 ledon 0`
						ledswitch $platform 0 $led5g 0
				else
						echo `nvram_set 2860 ledon 1`
						ledswitch $platform 1 $led5g 1
				fi
		else
				echo `nvram_set 2860 ledon 1`
				ledswitch $platform 1 $led5g 1
		fi
fi

