#!/bin/sh
#
# script file for traffic control (QoS)
#

str=`nvram_get 2860 QoSRules`
#var=`nvram_get 2860 rulenum`
var=`cut -f1 -d" " /etc/number.conf`
#echo "$var"
str=`echo $str | cut -f$var -d=`
echo "$str" > /etc/list$var.conf
mode=`echo $str | cut -f1 -d,`
mode=`echo $mode | cut -f2 -d" "`
echo "$mode" > /etc/mode.conf
lo_ip_start=`echo $str | cut -f2 -d,`
lo_ip_start=`echo $lo_ip_start | cut -f2 -d" "`
echo "$lo_ip_start" > /etc/startIP.conf
lo_ip_end=`echo $str | cut -f3 -d,`
lo_ip_end=`echo $lo_ip_end | cut -f2 -d" "`
echo "$lo_ip_end" > /etc/endIP.conf
bandwidth=`echo $str | cut -f4 -d,`
bandwidth=`echo $bandwidth | cut -f2 -d" "`
echo "$bandwidth" > /etc/Upbandwidth.conf
bandwidth_dl=`echo $str | cut -f5 -d,`
bandwidth_dl=`echo $bandwidth_dl | cut -f2 -d" "`
echo "$bandwidth_dl" > /etc/Downbandwidth.conf
var=`expr $var + 1`
str=`nvram_get 2860 QoSRules`
str=`echo $str | cut -f$var -d=`
if [ "$str" == "" ]; then
	nvram_set 2860 qoslist 111
fi

