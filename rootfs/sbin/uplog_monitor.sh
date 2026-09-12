#!/bin/sh
#
# usage: uplog_daemon.sh
# date:  20181108
# author:lsw
#
. /sbin/config.sh
. /sbin/global.sh

while [ true ]
do
	sleep 20
	n=`ps | grep uplog_daemon | grep -v grep | wc -l`
	if [ $n != 2 ]; then
		echo "uplog_daemon error"
		killall -9 uplog_daemon
		sleep 5
		uplog_daemon &
	fi

done
