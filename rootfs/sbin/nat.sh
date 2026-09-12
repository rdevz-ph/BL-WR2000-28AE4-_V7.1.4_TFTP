#!/bin/sh
#
# $Id: //WIFI_SOC/MP/SDK_4_2_0_0/RT288x_SDK/source/user/rt2880_app/scripts/nat.sh#1 $
#
# usage: nat.sh
#

. /sbin/config.sh
. /sbin/global.sh


lan_ip=`nvram_get 2860 lan_ipaddr`
nat_en=`nvram_get 2860 natEnabled`
tcp_timeout=`nvram_get 2860 TcpTimeout`
udp_timeout=`nvram_get 2860 UdpTimeout`

if [ "$nat_en" = "1" ]; then
	if [ "$CONFIG_NF_CONNTRACK_SUPPORT" = "1" ]; then
		if [ "$udp_timeout" = "" ]; then
			echo 180 > /proc/sys/net/netfilter/nf_conntrack_udp_timeout
		else	
			echo "$udp_timeout" > /proc/sys/net/netfilter/nf_conntrack_udp_timeout
		fi

		if [ "$tcp_timeout" = "" ]; then
			echo 180 >  /proc/sys/net/netfilter/nf_conntrack_tcp_timeout_established
		else
			echo "$tcp_timeout" >  /proc/sys/net/netfilter/nf_conntrack_tcp_timeout_established
		fi
	else
		if [ "$udp_timeout" = "" ]; then
			echo 180 > /proc/sys/net/ipv4/netfilter/ip_conntrack_udp_timeout
		else	
			echo "$udp_timeout" > /proc/sys/net/ipv4/netfilter/ip_conntrack_udp_timeout
		fi

		if [ "$tcp_timeout" = "" ]; then
			echo 180 > /proc/sys/net/ipv4/netfilter/ip_conntrack_tcp_timeout_established
		else
			echo "$tcp_timeout" > /proc/sys/net/ipv4/netfilter/ip_conntrack_tcp_timeout_established
		fi
	fi
	if [ "$wanmode" = "PPPOE" -o "$wanmode" = "L2TP" -o "$wanmode" = "PPTP" -o "$wanmode" = "3G" ]; then
		wan_if="ppp0"
	fi
    if [ "$CONFIG_RALINK_RAM_SIZE" = "32"  ];then
        echo 2048 > /proc/sys/net/nf_conntrack_max    
        echo 2048 > /proc/sys/net/netfilter/nf_conntrack_max
    elif [ "$CONFIG_RALINK_RAM_SIZE" = "64"  ];then
        echo 8192 > /proc/sys/net/nf_conntrack_max    
        echo 8192 > /proc/sys/net/netfilter/nf_conntrack_max
    elif [ "$CONFIG_RALINK_RAM_SIZE" = "128"  ];then
        echo 16384 > /proc/sys/net/nf_conntrack_max    
        echo 16384 > /proc/sys/net/netfilter/nf_conntrack_max
    fi
    echo 3 >/proc/sys/vm/drop_caches
    echo 1024 >/proc/sys/vm/min_free_kbytes

	#added by lsw 20180526 to fix l2tp problem
	if [ "$wanmode" = "L2TP" -o "$wanmode" = "PPTP" -o "$wanmode" = "3G" ]; then
		iptables -t nat -A POSTROUTING -s $lan_ip/24 -o $wan_if -j MASQUERADE
	else
		iptables -t nat -D POSTROUTING -s $lan_ip/24 -o $wan_if -j MASQUERADE
		iptables -t nat -I POSTROUTING -s $lan_ip/24 -o $wan_if -j MASQUERADE
	fi
	if [ "$wanmode" = "L2TP" -o "$wanmode" = "PPTP" -o "$wanmode" = "3G" ]; then
    	if [ "$opmode" = "1" ]; then
			#changed by lsw 20180526 to fix l2tp problem
            #iptables -t nat -D POSTROUTING -s $lan_ip/24 -o eth2.2 -j MASQUERADE 1>/dev/null 2>&1
            iptables -t nat -A POSTROUTING -s $lan_ip/24 -o eth2.2 -j MASQUERADE
        else
			#iptables -t nat -D POSTROUTING -s $lan_ip/24 -o apcli0 -j MASQUERADE 1>/dev/null 2>&1
		    iptables -t nat -A POSTROUTING -s $lan_ip/24 -o apcli0 -j MASQUERADE
        fi
	fi
fi

