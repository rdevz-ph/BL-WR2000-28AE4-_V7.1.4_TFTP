#!/bin/sh
#
# script file for traffic control (QoS)
#########modify by tianshaoxian on 20120928##############
#
arptables -F
arptables -X
arptables -Z

str=`nvram_get 2860 arpbind`
var=1
str=`echo $str | cut -f$var -d\;`
#echo "$str"
config-udhcpd.sh -S
while [ "$str" != "" ]
do
ipaddress=`echo $str | cut -f2 -d,`
macaddress=`echo $str | cut -f1 -d,`
#echo "arptables -A INPUT -i br0 --src-mac $macaddress --src-ip ! $ipaddress -j DROP"#########
arptables -A INPUT -i br0 --src-mac $macaddress --src-ip ! $ipaddress -j DROP
#echo "arptables -A INPUT -i br0 --src-mac $ipaddress --src-ip ! $macaddress -j DROP"#########
arptables -A INPUT -i br0 --src-ip $ipaddress --src-mac ! $macaddress -j DROP
static=`echo $macaddress`\ `echo $ipaddress`
#echo "$static"
config-udhcpd.sh -S $static
var=`expr $var + 1`
str=`nvram_get 2860 arpbind`
#echo "$var"
str=`echo $str | cut -f$var -d\;`
done



