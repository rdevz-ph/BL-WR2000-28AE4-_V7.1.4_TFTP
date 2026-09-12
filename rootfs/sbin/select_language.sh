#! /bin/sh

lang=`nvram_get 2860 Language`
cp /etc_ro/web/graphics_$lang /etc_ro/web/graphics -rf
