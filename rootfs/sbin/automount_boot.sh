#! /bin/sh

. /sbin/config.sh
. /sbin/global.sh

if [ "$1" == "" ]; then
		echo "parameter is none" 
		exit 1
else
		echo "***** $1 *****"
fi
mounted=`mount | grep $1 | wc -l`
umount -l /media/$1 1>/dev/null 2>&1

if [ "$CONFIG_USER_LIGHTY" = "y" ];then
		if [ "$opmode" = "1" -o "$opmode" = "3" ]; then
				umount -l /etc_ro/lighttpd/www/media/$1 1>/dev/null 2>&1
		fi
fi
sleep 1
if ! mkdir -p "/media/$1"; then
		exit 1
fi
[ -e /sbin/chkexfat ] && chkexfat -f /dev/$1
[ -e /sbin/chkhfs ] && chkhfs -f /dev/$1
[ -e /sbin/chkntfs ] && chkntfs -f /dev/$1
mounted=`mount | grep $1 | wc -l`
num=3
#echo "################## $1 ##############"
diskcode=`echo $1 | tr -d "0-9"`
#echo diskcode=$diskcode
disktype=`cat /sys/block/$diskcode/removable`
#echo disktype=$disktype

if [  "$disktype" == "1" ];then
		while [ -e /bin/mount -a $mounted -lt 2 -a $num -gt 0 ]
		do	
				utype=`fdisk -l | grep $1 | awk '{print $7}' | cut -f2 -d\/`
				if [ "$utype" = "NTFS" ];then
						ntfs-3g "/dev/$1" "/media/$1" -o force 1>/dev/null 2>&1
				else
						mount "/dev/$1" "/media/$1" 1>/dev/null 2>&1
				fi
				if [ "$CONFIG_USER_LIGHTY" = "y" ];then
						if [ "$opmode" = "1" -o "$opmode" = "3" ]; then
								mkdir -p /etc_ro/lighttpd/www/media/$1
								if [ "$utype" = "NTFS" ];then
										ntfs-3g "/dev/$1" /etc_ro/lighttpd/www/media/$1 -o force 1>/dev/null 2>&1
								else
										mount "/dev/$1" "/etc_ro/lighttpd/www/media/$1"	1>/dev/null 2>&1
								fi
						fi
				fi
				mounted=`mount | grep $1 | wc -l`
				num=`expr $num - 1`
		done
else
		mounted=`mount | grep $1 | wc -l`
		while [ -e /bin/ntfs-3g -a $mounted -lt 2 -a $num -lt 4 ]
				#while [ -e /bin/ntfs-3g ]
		do
				#echo "##########ntfs-3g #############"
				ntfs-3g "/dev/$1" "/media/$1" -o force 1>/dev/null 2>&1
				if [ "$CONFIG_USER_LIGHTY" = "y" ];then
						if [ "$opmode" = "1" -o "$opmode" = "3" ]; then
								mkdir -p /etc_ro/lighttpd/www/media/$1
								ntfs-3g "/dev/$1" /etc_ro/lighttpd/www/media/$1 -o force 1>/dev/null 2>&1
						fi
				fi
				mounted=`mount | grep $1 | wc -l`
				num=`expr $num + 1`
				#echo "##########ntfs-3g #############"
		done
fi
if [ $mounted -lt 1 ]; then
		rm -r "/media/$1"
		exit 1
fi


# Goahead need to know the event happened.
killall -SIGTTIN goahead
killall -SIGTTIN nvram_daemon
if [ "$CONFIG_BLINK_USB_MONITOR" = "y" ];then
		killall -9 usb_monitor 
		sleep 1
		usb_monitor&
fi
exit 0

