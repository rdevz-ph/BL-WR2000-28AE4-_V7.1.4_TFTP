#	!bin/sh
#	this qos function is based on MAC address realize
#	creation by kmi
#	date 2016-11-12

. /sbin/config.sh
. /sbin/global.sh


DOWN_SPEED="100Mbit"
UP_SPEED="100Mbit"

iptables -F -t mangle
iptables -X -t mangle
iptables -Z -t mangle

tc qdisc del dev $wan_if root 
tc qdisc del dev $lan_if root

TC_DOWN="tc qdisc add dev $lan_if"
TC_DOWN_CLASS="tc class add dev $lan_if"
TC_DOWN_FILTER="tc filter add dev $lan_if"

TC_UP="tc qdisc add dev $wan_if"
TC_UP_CLASS="tc class add dev $wan_if"
TC_UP_FILTER="tc filter add dev $wan_if"

IPTABLES="iptables -t mangle -A PREROUTING"


######################Down set########################
$TC_DOWN root handle 100: cbq bandwidth $DOWN_SPEED avpkt 1000
$TC_DOWN_CLASS parent 100:0 classid 100:1 cbq bandwidth $DOWN_SPEED rate $DOWN_SPEED allot 1514 weight $DOWN_SPEED prio 4 cell 8 maxburst 8 avpkt 1000 bounded
##################################################

######################Up set########################
$TC_UP root handle 200: cbq bandwidth $UP_SPEED avpkt 1000
$TC_UP_CLASS parent 200:0 classid 200:1 cbq bandwidth $UP_SPEED rate $UP_SPEED allot 1514 weight $UP_SPEED prio 4 cell 8 maxburst 8 avpkt 1000 bounded
##################################################

#管理IP不被限速
lan_ip=`nvram_get 2860 lan_ipaddr`
ip_rang=`echo "$lan_ip" | sed 's/[0-9]\{1,3\}$//g'`"0/24"
$TC_DOWN_FILTER parent 100:0 protocol ip prio 1 u32 match ip src $lan_ip flowid 100:1
$TC_UP_FILTER parent 200:0 protocol ip prio 1 u32 match ip src $lan_ip flowid 200:1

priority=`nvram_get 2860 PriorityMac`

k=1
if [ "$priority" != "" ];
then
	for q in $(seq 0 32)
	do	
		#echo "priority=$priority"
		buf=`echo $priority | cut -f$k -d ";"`
		#echo "buf=$buf"
		if [ "$buf" != "" ];
		then
			pro_mac="$buf"
			pro_down_mac1="0x"`echo $pro_mac | sed 's/\://g' | cut -c1-4`
			pro_down_mac2="0x"`echo $pro_mac | sed 's/\://g' | cut -c5-12`
			pro_mark=`expr $k + 100`
			k=`expr $k + 1`
			
			#echo "pro_mac=$pro_mac"
			#echo "pro_down_mac1=$pro_down_mac1"
			#echo "pro_down_mac2=$pro_down_mac2"
			
			$TC_DOWN_FILTER parent 100:0 protocol ip prio 4 u32 match u16 0x0800 0xffff at -2 match u32 $pro_down_mac2 0xffffffff at -12 match u16 $pro_down_mac1 0xffff at -14 flowid 100:1
			$TC_UP_FILTER parent 200:0 protocol ip prio 4 handle $pro_mark fw classid 200:1
			$IPTABLES -m mac --mac-source $pro_mac -j MARK --set-mark $pro_mark
			$IPTABLES -m mac --mac-source $pro_mac -j RETURN
		else
			break
		fi
	done

	######################策略组管理#######################
	$TC_DOWN_CLASS parent 100:1 classid 100:100 cbq bandwidth $DOWN_SPEED rate 200kbps allot 1514 weight 100Kbit prio 4 cell 8 maxburst 8 avpkt 1000 bounded
	$TC_DOWN parent 100:100 sfq quantum 1514b perturb 10

	$TC_UP_CLASS parent 200:1 classid 200:200 cbq bandwidth $DOWN_SPEED rate 200kbps allot 1514 weight 100Kbit prio 4 cell 8 maxburst 8 avpkt 1000 bounded
	$TC_UP parent 200:200 sfq quantum 1514b perturb 10

	$TC_DOWN_FILTER parent 100:0 protocol ip prio 4 u32 match ip dst $ip_rang flowid 100:100
	$TC_UP_FILTER parent 200:0 protocol ip prio 4 handle 201 fw flowid 200:200
	$IPTABLES -s $ip_rang -j MARK --set-mark 201
	$IPTABLES -s $ip_rang -j RETURN 
	#######################带宽优先级######################	
fi


j=1
for i in $(seq 0 3)
do
	str=`nvram_get 2860 qos_$i`
	#echo "str=$str"
	if [ "$str" != "" ];
	then
		for z in $(seq 0 10)
		do
			tmp=`echo $str | cut -f$j -d ";"`
			if [ "$tmp" != "" ];
			then
				#echo "tmp=$tmp"
				qos_mac=`echo $tmp | cut -f1 -d,`
				mac=`echo $qos_mac | sed 's/\://g'`
				IP_Start=`echo $tmp | cut -f2 -d,`
				IP_End=`echo $tmp | cut -f2 -d,`
				bandwidth_up=`echo $tmp | cut -f3 -d,`
				bandwidth_dl=`echo $tmp | cut -f4 -d,`
				mark=`expr $i + $j + 2`				
				down_mac1="0x"`echo $mac | cut -c1-4`
				down_mac2="0x"`echo $mac | cut -c5-12`
				
				echo "mac=$qos_mac"
				#echo "down_mac1=$down_mac1"
				#echo "down_mac2=$down_mac2"
				#echo "mark=$mark"
				#echo "start_ip=$IP_Start"
				#echo "end_ip=$IP_End"
				echo "up_speed=${bandwidth_up}"
				echo "down_speed=${bandwidth_dl}"
				j=`expr $j + 1`
								
				###############################################################################################################################################
				if [ "$bandwidth_dl" -ne 0 ]
				then
				$TC_DOWN_CLASS parent 100:1 classid 100:$mark cbq bandwidth $DOWN_SPEED rate ${bandwidth_dl}kbps allot 1514 weight 100Kbit prio 5 cell 8 maxburst 8 avpkt 1000 bounded
				$TC_DOWN parent 100:$mark sfq quantum 1514b perturb 10		
				$TC_DOWN_FILTER parent 100:0 protocol ip prio 5 u32 match u16 0x0800 0xffff at -2 match u32 $down_mac2 0xffffffff at -12 match u16 $down_mac1 0xffff at -14 flowid 100:$mark				
				fi
				###############################################################################################################################################
				if [ "$bandwidth_up" -ne 0 ]
				then
				$TC_UP_CLASS parent 200:1 classid 200:$mark cbq bandwidth $DOWN_SPEED rate ${bandwidth_up}kbps allot 1514 weight 100Kbit prio 5 cell 8 maxburst 8 avpkt 1000 bounded
				$TC_UP parent 200:$mark sfq quantum 1514b perturb 10
				#该方法会现在所有用户上传限制，所以只能用iptables打标记方法
				#$TC_UP_FILTER parent 200:0 protocol ip prio 1 u32 match u16 0x0800 0xffff at -2 match u16 0x2066 0xffff at -4 match u32 0x000C4376 0xffffffff at -8 flowid 200:2
				$TC_UP_FILTER parent 200:0 protocol ip prio 5 handle $mark fw classid 200:$mark
				$IPTABLES -m mac --mac-source $qos_mac -j MARK --set-mark $mark
				$IPTABLES -m mac --mac-source $qos_mac -j RETURN
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



#Qos_End


#exit 0
