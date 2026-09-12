#!/bin/sh

DEV="eth2.2"
uload=`nvram_get 2860 quload`
dload=`nvram_get 2860 qdload`
if [ "$1" = "start" ];then
		UPLINK=`awk "BEGIN{ print $uload *  100 }"`
		echo UPLINK=$UPLINK
		#下行downlink 3200 k 大概一半左右,以便能够得到更多的并发连接
		#DOWNLINK=`expr $3 \* 8`
		DOWNLINK=`awk "BEGIN{ print $dload * 1000 }"`
		echo DOWNLINK=$DOWNLINK
else
		echo $1
fi

echo "========>Packetfilter and Traffic Control By wgl Ver. 1.0<============"

start_routing() {
		echo  "队列设置开始start......"
		#1.增加一个根队列，没有进行分类的数据包都走这个1:24是缺省类:
		tc qdisc add dev $DEV root handle 1: htb default 24 1>/dev/null 2>&1
		echo  "ok1"
		#1.1增加一个根队下面主干类1: 速率为$UPLINK k
		tc class add dev $DEV parent 1: classid 1:1 htb rate ${UPLINK}kbps ceil ${UPLINK}kbps prio 0 1>/dev/null 2>&1
		echo  "ok2"
		#1.1.1 在主干类1下建立第一叶子类,这是一个最高优先权的类.需要高优先和高速的包走这条通道,比如SYN,ACK,ICMP等
		tc class add dev $DEV parent 1:1 classid 1:11 htb rate ${UPLINK}kbps ceil ${UPLINK}kbps prio 1 1>/dev/null 2>&1
		#1.1.2 在主类1下建立第二叶子类 ,这是一个次高优先权的类。比如我们重要的crm数据.
		tmp=`awk "BEGIN{print $UPLINK - 150}"`
		tmp1=`awk "BEGIN{print $UPLINK - 50}"`
		echo  "ok3"
		tc class add dev $DEV parent 1:1 classid 1:12 htb rate ${tmp}kbps ceil ${tmp1}kbps prio 2 1>/dev/null 2>&1
		echo  "ok4"
		#1.2 在根类下建立次干类 classid 1:2 。此次干类的下面全部优先权低于主干类,以防重要数据堵塞.
		#tmp2=`expr $UPLINK - 150`
		tmp2=`awk "BEGIN{print $UPLINK - 150}"`
		tc class add dev $DEV parent 1: classid 1:2 htb rate ${tmp2}kbps prio 3 1>/dev/null 2>&1
		echo  "ok5"
		#1.2.1 在次干类下建立第一叶子类,可以跑例如http,pop等.
		tc class add dev $DEV parent 1:2 classid 1:21 htb rate 100kbps ceil ${tmp2}kbps prio 4 1>/dev/null 2>&1
		echo "ok6"
		#1.2.2 在次干类下建立第二叶子类。不要太高的速度,以防发大的附件大量占用带宽,例如smtp等
		#tmp3=`expr $UPLINK - 160`
		tmp3=`awk "BEGIN{print $UPLINK - 160}"`
		tc class add dev $DEV parent 1:2 classid 1:22 htb rate 30kbps ceil ${tmp3}kbps prio 5 1>/dev/null 2>&1
		echo  "ok7"
		#1.2.3 在次干类下建立第三叶子类。不要太多的带宽,以防大量的数据堵塞网络,例如ftp-data等,
		#tmp4=`expr $UPLINK - 170`
		tmp4=`awk "BEGIN{print $UPLINK - 170}"`
		tc class add dev $DEV parent 1:2 classid 1:23 htb rate 15kbps ceil ${tmp4}kbps prio 6 1>/dev/null 2>&1
		echo  "ok8"
		#1.2.4 在次干类下建立第四叶子类。无所谓的数据通道,无需要太多的带宽,以防无所谓的人在阻碍正务.
		#tmp5=`expr $UPLINK - 250`
		tmp5=`awk "BEGIN{print $UPLINK - 250}"`
		tc class add dev $DEV parent 1:2 classid 1:24 htb rate 5kbps ceil ${tmp5}kbps prio 7 1>/dev/null 2>&1
		echo  "ok9"
		#在每个类下面再附加上另一个队列规定,随机公平队列(SFQ)，不被某个连接不停占用带宽,以保证带宽的平均公平使用：
		#SFQ(Stochastic Fairness Queueing，随机公平队列),SFQ的关键词是“会话”(或称作“流”) ，
		#主要针对一个TCP会话或者UDP流。流量被分成相当多数量的FIFO队列中，每个队列对应一个会话。
		#数据按照简单轮转的方式发送, 每个会话都按顺序得到发送机会。这种方式非常公平，保证了每一
		#个会话都不会没其它会话所淹没。SFQ之所以被称为“随机”，是因为它并不是真的为每一个会话创建
		#一个队列，而是使用一个散列算法，把所有的会话映射到有限的几个队列中去。
		#参数perturb是多少秒后重新配置一次散列算法。默认为10
		#tmp6=`expr $UPLINK / 2 + 8`
		tmp6=`awk "BEGIN{print $UPLINK / 2 + 8}"`
		tc qdisc add dev $DEV parent 1:11 handle 111: sfq quantum $tmp6 perturb 5 1>/dev/null 2>&1
		echo "111111111"
		#tmp6=`expr $tmp / 2 + 8`
		tmp6=`awk "BEGIN{print $tmp / 2 + 8}"`
		tc qdisc add dev $DEV parent 1:12 handle 112: sfq quantum $tmp6 perturb 5 1>/dev/null 2>&1
		#tmp6=`expr $tmp2 / 2 + 8`
		tmp6=`awk "BEGIN{print $tmp2 / 2 + 8}"`
		tc qdisc add dev $DEV parent 1:21 handle 121: sfq quantum $tmp6 perturb 10 1>/dev/null 2>&1
		#tmp6=`expr $tmp3 / 2 + 8`
		tmp6=`awk "BEGIN{print $tmp3 / 2 + 8}"`
		tc qdisc add dev $DEV parent 1:22 handle 122: sfq quantum $tmp6 perturb 10 1>/dev/null 2>&1
		#tmp6=`expr $tmp4 / 2 + 8`
		tmp6=`awk "BEGIN{print $tmp4 / 2 + 8}"`
		tc qdisc add dev $DEV parent 1:23 handle 133: sfq quantum $tmp6 perturb 10 1>/dev/null 2>&1
		#tmp6=`expr $tmp5 / 2 + 8`
		tmp6=`awk "BEGIN{print $tmp5 / 2 + 8}"`
		tc qdisc add dev $DEV parent 1:24 handle 124: sfq quantum $tmp6 perturb 10 1>/dev/null 2>&1
		echo "队列设置成功.done."
		echo "设置包过滤 Setting up Filters......"
		#这里设置过滤器,handle 是iptables作mark的值,让被iptables 在mangle链做了mark的不同的值选择不同的通
		#道classid,而prio 是过滤器的优先级别.
		tc filter add dev $DEV parent 1:0 protocol ip prio 1 handle 1 fw classid 1:11 1>/dev/null 2>&1
		tc filter add dev $DEV parent 1:0 protocol ip prio 2 handle 2 fw classid 1:12 1>/dev/null 2>&1
		tc filter add dev $DEV parent 1:0 protocol ip prio 3 handle 3 fw classid 1:21 1>/dev/null 2>&1
		tc filter add dev $DEV parent 1:0 protocol ip prio 4 handle 4 fw classid 1:22 1>/dev/null 2>&1
		tc filter add dev $DEV parent 1:0 protocol ip prio 5 handle 5 fw classid 1:23 1>/dev/null 2>&1
		tc filter add dev $DEV parent 1:0 protocol ip prio 6 handle 6 fw classid 1:24 1>/dev/null 2>&1
		echo "设置过滤器成功.done."

		########## downlink ##########################################################################
		#6. 下行的限制:
		#设置入队的规则,是因为把一些经常会造成下载大文件的端口进行控制,不让它们来得太快,导致堵塞.来得太快
		#的就直接drop,就不会浪费和占用机器时间和力量去处理了.
		#(1). 把下行速率控制在大概1000-1500k左右,因为这个速度已经足够用了,以便能够得到更多的并发下载连接
		echo "ok10"
		tc qdisc add dev $DEV handle ffff: ingress 1>/dev/null 2>&1

		echo "ok11"
		tc filter add dev $DEV parent ffff: protocol ip prio 50 handle 8 fw police rate ${DOWNLINK}kbps burst 10k drop flowid :8 1>/dev/null 2>&1
		echo "ok12"

		#(2).如果内部网数据流不是很疯狂的话,就不用做下载的限制了,用#符号屏蔽上面两行即可.
		#(3).如果要对任何进来数据的数据进行限速的话,可以用下面这句:
		#tc filter add dev $DEV parent ffff: protocol ip prio 10 u32 match ip src 0.0.0.0/0 police rate ${DOWNLINK}kbps burst 10k drop flowid :1 1>/dev/null 2>&1
}
###############################################################################################
#7. 开始给数据包打标记，往PREROUTING链中添加mangle规则：
start_mangle() {

		echo -n "开始给数据包打标记......start mangle mark......"

		#(1)把出去的不同类数据包(为dport)给mark上标记1--6.让它走不同的通道
		#(2)把进来的数据包(为sport)给mark上标记8,让它受到下行的限制,以免速度太过快而影响全局.
		#(3)每条规则下根着return的意思是可以通过RETURN方法避免遍历所有的规则,加快了处理速度
		#设置TOS的处理：
		iptables -t mangle -A PREROUTING -m tos --tos Minimize-Delay -j MARK --set-mark 1 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -m tos --tos Minimize-Delay -j RETURN 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -m tos --tos Minimize-Cost -j MARK --set-mark 4 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -m tos --tos Minimize-Cost -j RETURN 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -m tos --tos Maximize-Throughput -j MARK --set-mark 5 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -m tos --tos Maximize-Throughput -j RETURN 1>/dev/null 2>&1

		##提高tcp初始连接(也就是带有SYN的数据包)的优先权是非常明智的：
		iptables -t mangle -A PREROUTING -p tcp -m tcp --tcp-flags SYN,RST,ACK SYN -j MARK --set-mark 1 1>/dev/null 2>&1
		echo "13"
		iptables -t mangle -A PREROUTING -p tcp -m tcp --tcp-flags SYN,RST,ACK SYN -j RETURN 1>/dev/null 2>&1
		echo "14"
		######icmp,想ping有良好的反应,放在第一类吧.
		iptables -t mangle -A PREROUTING -p icmp -j MARK --set-mark 1 1>/dev/null 2>&1
		echo "15"
		iptables -t mangle -A PREROUTING -p icmp -j RETURN 1>/dev/null 2>&1
		echo "16"
		# small packets (probably just ACKs)长度小于64的小包通常是需要快些的,一般是用来确认tcp的连接的,
		#让它跑快些的通道吧.也可以把下面两行屏蔽,因为再下面有更多更明细的端口分类.
		iptables -t mangle -A PREROUTING -p tcp -m length --length :128 -j MARK --set-mark 2 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m length --length :128 -j RETURN 1>/dev/null 2>&1

		#ftp放第2类,因为一般是小包, ftp-data放在第5类,因为一般是大量数据的传送.
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 21 -j MARK --set-mark 2 1>/dev/null 2>&1
		echo "17"
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 21 -j RETURN 1>/dev/null 2>&1
		echo "18"
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 20 -j MARK --set-mark 5 1>/dev/null 2>&1
		echo "19"
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 20 -j RETURN 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --sport 21 -j MARK --set-mark 8 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --sport 21 -j RETURN 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --sport 20 -j MARK --set-mark 8 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --sport 20 -j RETURN 1>/dev/null 2>&1
		##提高ssh数据包的优先权：放在第1类,要知道ssh是交互式的和重要的,不容待慢哦
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 22 -j MARK --set-mark 1 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 22 -j RETURN 1>/dev/null 2>&1
		#
		##smtp邮件：放在第4类,因为有时有人发送很大的邮件,为避免它堵塞,让它跑4道吧
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 25 -j MARK --set-mark 4 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 25 -j RETURN 1>/dev/null 2>&1
		#iptables -t mangle -A PREROUTING -p tcp -m tcp --sport 25 -j MARK --set-mark 8 1>/dev/null 2>&1
		#iptables -t mangle -A PREROUTING -p tcp -m tcp --sport 25 -j RETURN 1>/dev/null 2>&1
		## name-domain server：放在第1类,这样连接带有域名的连接才能快速找到对应的地址,提高速度的一法
		iptables -t mangle -A PREROUTING -p udp -m udp --dport 53 -j MARK --set-mark 1 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p udp -m udp --dport 53 -j RETURN 1>/dev/null 2>&1
		#
		## http：放在第3类,是最常用的,最多人用的,
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 80 -j MARK --set-mark 3 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 80 -j RETURN 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --sport 80 -j MARK --set-mark 8 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --sport 80 -j RETURN 1>/dev/null 2>&1
		##pop邮件：放在第3类
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 110 -j MARK --set-mark 3 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 110 -j RETURN 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --sport 110 -j MARK --set-mark 8 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --sport 110 -j RETURN 1>/dev/null 2>&1
		## https：放在第3类
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 443 -j MARK --set-mark 3 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 443 -j RETURN 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --sport 443 -j MARK --set-mark 8 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --sport 443 -j RETURN 1>/dev/null 2>&1
		## Microsoft-SQL-Server：放在第2类,我这里认为较重要,一定要保证速度的和优先的.
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 1433 -j MARK --set-mark 2 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 1433 -j RETURN 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --sport 1433 -j MARK --set-mark 8 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --sport 1433 -j RETURN 1>/dev/null 2>&1

		## voip用, 提高,语音通道要保持高速,才不会断续.
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 1720 -j MARK --set-mark 1 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 1720 -j RETURN 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p udp -m udp --dport 1720 -j MARK --set-mark 1 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p udp -m udp --dport 1720 -j RETURN 1>/dev/null 2>&1

		## vpn ,用作voip的,也要走高速路,才不会断续.
		iptables -t mangle -A PREROUTING -p udp -m udp --dport 7707 -j MARK --set-mark 1 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p udp -m udp --dport 7707 -j RETURN 1>/dev/null 2>&1

		## 放在第1类,因为我觉得它在我心中很重要,优先.
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 7070 -j MARK --set-mark 1 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 7070 -j RETURN 1>/dev/null 2>&1

		## WWW caching service：放在第3类
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 8080 -j MARK --set-mark 3 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --dport 8080 -j RETURN 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --sport 8080 -j MARK --set-mark 8 1>/dev/null 2>&1
		iptables -t mangle -A PREROUTING -p tcp -m tcp --sport 8080 -j RETURN 1>/dev/null 2>&1

		##提高本地数据包的优先权：放在第1
		iptables -t mangle -A OUTPUT -p tcp -m tcp --dport 22 -j MARK --set-mark 1 1>/dev/null 2>&1
		iptables -t mangle -A OUTPUT -p tcp -m tcp --dport 22 -j RETURN 1>/dev/null 2>&1

		iptables -t mangle -A OUTPUT -p icmp -j MARK --set-mark 1 1>/dev/null 2>&1
		iptables -t mangle -A OUTPUT -p icmp -j RETURN 1>/dev/null 2>&1

		#本地small packets (probably just ACKs)
		iptables -t mangle -A OUTPUT -p tcp -m length --length :64 -j MARK --set-mark 2 1>/dev/null 2>&1
		iptables -t mangle -A OUTPUT -p tcp -m length --length :64 -j RETURN 1>/dev/null 2>&1

		#(4). 向PREROUTING中添加完mangle规则后，用这条规则结束PREROUTING表：
		##也就是说前面没有打过标记的数据包将交给1:24处理。
		##实际上是不必要的，因为1:24是缺省类，但仍然打上标记是为了保持整个设置的协调一致，而且这样
		#还能看到规则的包计数。

		iptables -t mangle -A PREROUTING -i $DEV -j MARK --set-mark 6 1>/dev/null 2>&1
		echo "标记完毕! mangle mark done!"
}
#-----------------------------------------------------------------------------------------------------

#8.取消mangle标记用的自定义函数
stop_mangle() {

		echo -n "停止数据标记 stop mangle table......"
		( iptables -t mangle -F && echo "ok." ) || echo "error."
}

#9.取消队列用的       
stop_routing() {
		echo -n "(删除所有队列......)"
		( tc qdisc del dev $DEV root && tc qdisc del dev $DEV ingress && echo "ok.删除成功!" ) || echo "error."
}

#10.显示状态
status() {
		echo "1.show qdisc $DEV  (显示上行队列):----------------------------------------------"
		tc -s qdisc show dev $DEV
		echo "2.show class $DEV  (显示上行分类):----------------------------------------------"
		tc class show dev $DEV
		echo "3. tc -s class show dev $DEV (显示上行队列和分类流量详细信息):------------------"
		tc -s class show dev $DEV
		echo "说明:设置总队列上行带宽 $UPLINK k."
		echo "1. classid 1:11 ssh、dns、和带有SYN标记的数据包。这是最高优先权的类包并最先类 "
		echo "2. classid 1:12 重要数据,这是较高优先权的类。"
		echo "3. classid 1:21 web,pop 服务 "
		echo "4. classid 1:22 smtp服务 "
		echo "5. classid 1:23 ftp-data服务 "
		echo "6. classid 1:24 其他服务 "
}

#11.显示帮助
usage() {
		echo "使用方法(usage): `basename $0` [start | stop | restart | status | mangle ]"
		echo "参数作用:"
		echo "start   开始流量控制"
		echo "stop    停止流量控制"
		echo "restart 重启流量控制"
		echo "status  显示队列流量"
		echo "mangle  显示mark标记"
}

#----------------------------------------------------------------------------------------------
#12. 下面是脚本运行参数的选择的控制
#
#kernel=`eval kernelversion`
kernel=`cat /proc/version | awk '{print $3}'`
echo kernel:$kernel
case "$kernel" in
		2.2)
		echo " (!) Error: won't do anything with 2.2.x 不支持内核2.2.x"
		exit 1
		;;

		2.4|2.6.36|3.10.14)
		case "$1" in
				start)
				( start_routing && start_mangle && echo "开始流量控制! TC started!" ) || echo "error."

				exit 0
				;;

				stop)
				( stop_routing && stop_mangle && echo "停止流量控制! TC stopped!" ) || echo "error."

				exit 0
				;;
				restart)
				stop_routing
				stop_mangle
				start_routing
				start_mangle

				echo "流量控制规则重新装载!"
				;;
				status)
				status
				;;

				mangle)
				echo "iptables -t mangle -L (显示目前mangle表表标记详细):"
				iptables -t mangle -nL
				;;


				*) usage
				exit 1
				;;
		esac
		;;

		*)
		echo " (!) Error: Unknown kernel version. check it !"
		exit 1
		;;
esac
#三.结束语
#1. 如果要支持htb,请到相关网站下载有关补丁.
#此脚本是参考http://lartc.org 和 http://luxik.cdi.cz/~devik/qos/htb/ 和http://www.docum.org/docum.org
#和听取chinaunix.net的C++版主JohnBull的"Linux的高级路由和流量控制北京沙龙讲座录音
#及关于<<Linux的高级路由和流量控制HOWTO中文版>;>;,经过不断调试得出的总结结果,在此感谢所有作出贡献的人.
#2. iptables,在http://www.iptables.org/ .iptables v1.2.7a 和tc是Red hat linux 9.0下自带的版本.
#3. 此脚本已经在Red Hat Linux 9.0内核2.4.20上,内网约70台频繁上网机器的环境下运行数月,事实证明良好.
#4. 如果ADSL带宽不同或有变,调节相关rate参数及ceil参数即可.
#5. 还有,如果结合IMQ,IMQ(Intermediate queueing device,中介队列设备)把上行和下行都进行分类控制
#就更理想了,但要支持IMQ,就要重新编译内核.关于补丁和更多的文档请参阅imq网站http://www.linuximq.net/
#6. 欢迎交流yahoo messegsender: kindgeorge#yahoo.com此脚本将有待不断完善.
#7. 除了ADSL外,还可以进行其他宽带的控制.
#8. 如果看谁老是在网内搞鬼,经常占满带宽,就把它列为黑名单,并派到"无所谓的数据通道",以防无所谓的人
#在阻碍正务: iptables -t mangle -I PREROUTING 1 -s 192.168.xxx.xxx -j MARK --set-mark 6
#            iptables -t mangle -I PREROUTING 2 -s 192.168.xxx.xxx -j RETURN
#9.使用方法: 整篇文档拷贝后,chmod +x tc2 ,
#执行脚本: ./tc2 start (或其他参数start | stop | restart | status | mangle )即可
#如果想每次在ppp启动时就启动,则在/etc/ppp/ip-up 文件里面加上一句: /路径/tc2 restart
echo "script done!"
exit 1
#end----------------------------------------------------------------------------------------
