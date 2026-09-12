#!/bin/sh
#
# script file for traffic control (QoS)
#

opmode=`nvram_get 2860 OperationMode`
bssidnum=`nvram_get 2860 BssidNum`
if [ "$opmode" = "0" ]; then
		WAN=br0
		BRIDGE=br0
elif [ "$opmode" = "1" ]; then
	BRIDGE=br0
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
	BRIDGE=eth2
elif [ "$opmode" = "3" ]; then
	WAN=apcli0
	BRIDGE=br0
fi

UPLINK_SPEED=102400
DOWNLINK_SPEED=102400

iptables -F -t mangle
iptables -X -t mangle
iptables -Z -t mangle

tc qdisc del dev $WAN root 2> /dev/null
tc qdisc del dev $BRIDGE root 2> /dev/null

tc qdisc add dev $WAN root handle 2:0 htb default 2 r2q 64                   
TC_CMD="tc class add dev $WAN parent 2:0 classid 2:1 htb rate ${UPLINK_SPEED}kbit ceil ${UPLINK_SPEED}kbit quantum 30000"
#echo "$TC_CMD"
$TC_CMD
TC_CMD="tc class add dev $WAN parent 2:1 classid 2:2 htb rate 1kbit ceil ${UPLINK_SPEED}kbit prio 256 quantum 30000"
#echo "$TC_CMD"
$TC_CMD
TC_CMD="tc qdisc add dev $WAN parent 2:2 handle 102: sfq perturb 10"
#echo "$TC_CMD"
$TC_CMD

tc qdisc add dev $BRIDGE root handle 5:0 htb default 2 r2q 64                   
TC_CMD="tc class add dev $BRIDGE parent 5:0 classid 5:1 htb rate ${DOWNLINK_SPEED}kbit ceil ${DOWNLINK_SPEED}kbit quantum 30000"
#echo "$TC_CMD"
$TC_CMD
TC_CMD="tc class add dev $BRIDGE parent 5:1 classid 5:2 htb rate 1kbit ceil ${DOWNLINK_SPEED}kbit prio 256 quantum 30000"
#echo "$TC_CMD"
$TC_CMD
TC_CMD="tc qdisc add dev $BRIDGE parent 5:2 handle 502: sfq perturb 10"
#echo "$TC_CMD"
$TC_CMD
