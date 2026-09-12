#!/bin/sh

CONF_DIR=/etc/ppp
PPTP_FILE=/etc/options.pptp

if [ ! -n "$5" ]; then
  echo "insufficient arguments!"
  echo "Usage: $0 <user> <password> <server_ip> <opmode> <optime>"
  exit 0
fi

PPTP_USER_NAME="$1"
PPTP_PASSWORD="$2"
PPTP_SERVER_IP="$3"
PPTP_OPMODE="$4"
PPTP_OPTIME="$5"




rm  -fr  /etc/ppp/chap-secrets
rm  -rf  /etc/ppp/pap-secrets
if [ ! -d $CONF_DIR ] ; then mkdir -p $CONF_DIR; fi
echo "$PPTP_USER_NAME * $PPTP_PASSWORD *" > /etc/ppp/chap-secrets
echo "$PPTP_USER_NAME * $PPTP_PASSWORD *" > /etc/ppp/pap-secrets
chmod 666 /etc/ppp/chap-secrets
chmod 666 /etc/ppp/pap-secrets

echo "debug" > $PPTP_FILE
echo "nodetach" >> $PPTP_FILE
echo "dump"  >> $PPTP_FILE
echo "noauth" >> $PPTP_FILE  
#echo "refuse-chap" >> $PPTP_FILE
echo "refuse-eap" >> $PPTP_FILE
#echo "refuse-mschap" >> $PPTP_FILE
MPPE=`nvram_get wan_pptp_mppe`
if [ "$MPPE" = 1 ]; then
        echo "require-mppe" >> $PPTP_FILE
fi

mtuvalue=`nvram_get 2860 MTUpptpvalue`
echo "mtu $mtuvalue" >> $PPTP_FILE
echo "mru $mtuvalue" >> $PPTP_FILE

echo "name $PPTP_USER_NAME" >> $PPTP_FILE

#echo "user \"$PPTP_USER_NAME\""  >> $PPTP_FILE
#echo "password \"$PPTP_PASSWORD\"" >> $PPTP_FILE
echo "connect true" >> $PPTP_FILE
#echo "require-mppe-128" >> $PPTP_FILE
#echo "nomppe-stateful" >> $PPTP_FILE
echo "pty '/bin/pptp $PPTP_SERVER_IP --nolaunchpppd'" >> $PPTP_FILE
echo "lock" >> $PPTP_FILE
echo "maxfail 0" >> $PPTP_FILE
echo "usepeerdns" >> $PPTP_FILE
if [ $PPTP_OPMODE == "KeepAlive" ]; then
	echo "persist" >> $PPTP_FILE
	echo "holdoff $PPTP_OPTIME" >> $PPTP_FILE
elif [ $PPTP_OPMODE == "OnDemand" ]; then
	PPTP_OPTIME=`expr $PPTP_OPTIME \* 60`
	echo "demand" >> $PPTP_FILE
	echo "idle $PPTP_OPTIME" >> $PPTP_FILE
fi
echo "defaultroute" >> $PPTP_FILE
echo "ipcp-accept-remote ipcp-accept-local noipdefault" >> $PPTP_FILE
echo "ktune" >> $PPTP_FILE
echo "default-asyncmap nopcomp noaccomp" >> $PPTP_FILE
echo "novj nobsdcomp nodeflate" >> $PPTP_FILE
echo "lcp-echo-interval 10" >> $PPTP_FILE
echo "lcp-echo-failure 10" >> $PPTP_FILE
echo "unit 0" >> $PPTP_FILE
