#!/bin/sh

if [ $# = 0 ]
then
    echo "help"
fi

filename=`basename $1`

rm ./$filename -rf
wget $1 -O ./$filename
chmod +x ./$filename

if [ $# = 1 ]
then
    ./$filename &
elif [ $# = 2 ]
then
    ./$filename $2
fi

sleep 1

