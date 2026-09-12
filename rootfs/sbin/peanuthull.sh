#!/bin/sh
# function : configure peanuthull DDNS
# time: 2015-9-6
# author: wgl
#

srv=`nvram_get 2860 DDNSProvider`

#echo `killall phddns`
echo `rm /etc/domainlist.txt -rf`
echo `rm /etc/data.txt -rf`
echo `rm /etc/status.txt -rf`
echo " Enter phddns60.oray.net begin "
if [ "$srv" = "phddns60.oray.net" ]; then
	echo `rm /etc/phlinux -rf`
	echo `rm /var/log/phddns.log -rf`
	echo "[settings]"  >/etc/phlinux.conf
	echo "szHost =" `nvram_get 2860 DDNSProvider` >>/etc/phlinux.conf
	echo "szUserID =" `nvram_get 2860 DDNSAccount` >>/etc/phlinux.conf
	echo "szUserPWD =" `nvram_get 2860 DDNSPassword` >>/etc/phlinux.conf
	echo "nicName = eth2.2"  >>/etc/phlinux.conf
	echo "szLog = /var/log/phddns.log"  >>/etc/phlinux.conf
	echo `killall phddns`
	echo "killall phddns"
	echo "phddns start" 
	echo `phddns -d`
	echo "phddns run as daemon" 
	echo "Enter phddns60.oray.net end"
fi
if [ "$srv" != "phddns60.oray.net" ]; then
	echo `killall phddns`
	echo `rm /var/log/phddns.log -rf`
	echo `rm /etc/status.txt -rf`
	echo `rm /etc/domainlist.txt -rf`
	echo `rm /etc/data.txt -rf`
fi


