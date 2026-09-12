#	!bin/sh
#	new_qos.sh
#	creation by kmi

. /sbin/config.sh
. /sbin/global.sh


opmode=`nvram_get 2860 OperationMode`

if [ "$opmode" = "0" ]; then
		WAN=br0
		LAN=br0
elif [ "$opmode" = "1" ]; then
	LAN=br0
	if [ "$CONFIG_RAETH_ROUTER" = "y" -o "$CONFIG_MAC_TO_MAC_MODE" = "y" -o "$CONFIG_RT_3052_ESW" = "y" ]; then
		if [ "$CONFIG_RAETH_SPECIAL_TAG" == "y" ]; then
			if [ "$CONFIG_WAN_AT_P0" == "y" ]; then
				WAN=eth2.1		
			else
				WAN=eth2.5
			fi
		else
			WAN=eth2.2
		fi
	else
		WAN=eth2.2
	fi
elif [ "$opmode" = "2" ]; then
	WAN=ra0
	LAN=eth2
elif [ "$opmode" = "3" ]; then
	WAN=apcli0
	LAN=br0
fi

DOWN_SPEED=50000
#TCA="tc class add dev"
#TFA="tc filter add dev"

#lan_pkt_mark=40
iptables -F -t mangle
iptables -X -t mangle
iptables -Z -t mangle
tc qdisc del dev $WAN root 
tc qdisc del dev $LAN root

SPEED1=`expr $DOWN_SPEED / 2`
echo "SPEED1=$SPEED1"
SPEED2=`expr $SPEED1 / 4` 
echo "SPEED2=$SPEED2"

tc qdisc add dev $LAN root handle 1: hfsc default 30
tc class add dev $LAN parent 1:0 classid 1:1 hfsc sc rate ${DOWN_SPEED}kbps ul rate ${DOWN_SPEED}kbps
tc class add dev $LAN parent 1:1 classid 1:30 hfsc ls m1 ${SPEED2}kbps d 1500us m2 ${SPEED1}kbps ul rate ${DOWN_SPEED}kbps
tc class add dev $LAN parent 1:1 classid 1:20 hfsc ls m1 0kbps d 3000us m2 ${SPEED2}kbps ul rate ${DOWN_SPEED}kbps
tc qdisc add dev $LAN parent 1:30 handle 130: sfq quantum 6000 perturb 10
tc qdisc add dev $LAN parent 1:20 handle 120: sfq quantum 6000 perturb 10

tc qdisc add dev $LAN root handle 2: hfsc default 30
tc class add dev $LAN parent 2:0 classid 2:1 hfsc sc rate ${DOWN_SPEED}kbps ul rate ${DOWN_SPEED}kbps
tc class add dev $LAN parent 2:1 classid 2:30 hfsc ls m1 ${SPEED2}kbps d 1500us m2 ${SPEED1}kbps ul rate ${DOWN_SPEED}kbps
tc class add dev $LAN parent 2:1 classid 2:20 hfsc ls m1 0kbps d 3000us m2 ${SPEED2}kbps ul rate ${DOWN_SPEED}kbps
tc qdisc add dev $LAN parent 2:30 handle 130: sfq quantum 6000 perturb 10
tc qdisc add dev $LAN parent 2:20 handle 120: sfq quantum 6000 perturb 10


lan_ip=$(nvram_get 2860 lan_ipaddr)
lanip=`echo "$lan_ip" | sed 's/[0-9]\{1,3\}$//g'`

echo "lan_ip=$lan_ip"
echo "lanip=$lanip"

tc filter add dev $LAN parent 1:0 protocol ip prio 1 handle 100 fw flowid 1:30
#tc filter add dev $LAN parent 2:0 protocol ip prio 1 handle 100 fw flowid 1:30
iptables -A FORWARD -t mangle -p tcp -d $lan_ip -j MARK --set-mark 100
iptables -A INPUT -t mangle -p tcp -d $lan_ip -j MARK --set-mark 100

j=1
for i in $(seq 0 3)
do
	str=`nvram_get 2860 qos_$i`
	echo "str=$qos_str"
	if [ "$str" != "" ];
	then
		for z in $(seq 0 10)
		do
			tmp=`echo $str | cut -f$j -d ";"`
				j=`expr $j + 1`
			if [ "$tmp" != "" ];
			then
				echo "tmp=$tmp"
				IP_Start=`echo $tmp | cut -f2 -d,`
				IP_End=`echo $tmp | cut -f2 -d,`
				bandwidth_up=`echo $tmp | cut -f3 -d,`
				bandwidth_dl=`echo $tmp | cut -f4 -d,`
				dl_mark=`expr $i + $j + 2`
				up_mark=`expr $i + $j + 42`	
				echo "dl_mark=$dl_mark"
				echo "up_mark=$up_mark"
				echo "start_ip=$IP_Start"
				echo "end_ip=$IP_End"
				echo "up_speed=${bandwidth_up}"
				echo "down_speed=${bandwidth_dl}"
				
				if [ "$bandwidth_dl" -ne 0 ]
				then
				IPTABLE_CMD="iptables -A FORWARD -t mangle -m iprange --dst-range ${IP_Start}-${IP_End} -j MARK --set-mark $dl_mark"
				$IPTABLE_CMD
				fi
		
				if [ "$bandwidth_up" -ne 0 ]
				then
				IPTABLE_CMD="iptables -A FORWARD -t mangle -m iprange --src-range ${IP_Start}-${IP_End} -j MARK --set-mark $up_mark"
				$IPTABLE_CMD
				fi
				
				###############################################################################################################################################
				if [ "$bandwidth_dl" -ne 0 ]
				then
				SPEED1=$bandwidth_dl
				TC_CMD="tc class add dev $LAN parent 1:1 classid 1:$dl_mark hfsc ls m1 0kbps d 3000us m2 ${SPEED1}kbps ul rate ${bandwidth_dl}kbps"
				$TC_CMD
				TC_CMD="tc qdisc add dev $LAN parent 1:$dl_mark handle $dl_mark: sfq quantum 6000 perturb 10"
				$TC_CMD
				TC_CMD="tc filter add dev $LAN parent 1:0 protocol ip prio 6 handle $dl_mark fw classid 1:$dl_mark"
				$TC_CMD
				fi
				###############################################################################################################################################
				if [ "$bandwidth_up" -ne 0 ]
				then
				SPEED2=$bandwidth_up
				TC_CMD="tc class add dev $LAN parent 2:1 classid 1:$up_mark hfsc ls m1 0kbps d 3000us m2 ${SPEED2}kbps ul rate ${bandwidth_up}kbps"
				$TC_CMD
				TC_CMD="tc qdisc add dev $LAN parent 2:$up_mark handle $up_mark: sfq quantum 6000 perturb 10"
				$TC_CMD
				TC_CMD="tc filter add dev $LAN parent 2:0 protocol ip prio 6 handle $up_mark fw classid 1:$up_mark"
				$TC_CMD
				fi
				###############################################################################################################################################
			else
				break
			fi
		done
		
	else
		exit 0
	fi
done 
#end for
#Qos_En

#exit 0
