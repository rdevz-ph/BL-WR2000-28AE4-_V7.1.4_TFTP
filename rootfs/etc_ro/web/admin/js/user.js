/* user.js */
/* user.js */
function postinfo() {
	window.channelPost = layer.open({
		type: 1,
		closeBtn: 0, //不显示关闭按钮
		shift: 3,
		offset: '150px',
		skin: 'layui-layer-loading',
		scrollbar: false,
		title: false,
		shade: [0.7, '#000'],
		content: '<div style="margin:0 auto;width:90px;height:90px;background: url(/admin/js/layer/skin/default/loading-2.gif) no-repeat;background-size: cover;" class="layui-layer-content layui-layer-loading2"></div><h5 style="color:#fff">' +
			curlang.getchannel + '</h5>'
	});
	setTimeout(function() {
		layer.close(window.channelPost);
	}, 5000);
}
$(function() {
	/*************** user/index **********************/
	$("#cloneinpt").focus(function() {
		$("#layList").css("display", "block");
	}).blur(function() {})
	$(".macitem").click(function() {
		$("#cloneinpt").val($(this).html());
		$("#layList").css("display", "none");
	})
	//wifi
	$("#wifi_2G").click(function() {
		$("#2gwlan").css("display", "block");
		$("#5gwlan").css("display", "none");
	})
	$("#wifi_5G").click(function() {
		$("#5gwlan").css("display", "block");
		$("#2gwlan").css("display", "none");
	})
	//访客网络
	$("#visitorOFF").click(function() {
		$("#visitor_name").attr("disabled", true);
		$("#visitor_name").addClass("inpt-disabled");
		$("#visitor_pass").attr("disabled", true);
		$("#visitor_pass").addClass("inpt-disabled");
	})
	$("#visitorON").click(function() {
		$("#visitor_name").attr("disabled", false);
		$("#visitor_name").removeClass("inpt-disabled");
		$("#visitor_pass").attr("disabled", false);
		$("#visitor_pass").removeClass("inpt-disabled");
	})
	$("#5GvisitorOFF").click(function() {
		$("#5Gvisitor_name").attr("disabled", true);
		$("#5Gvisitor_name").addClass("inpt-disabled");
		$("#5Gvisitor_pass").attr("disabled", true);
		$("#5Gvisitor_pass").addClass("inpt-disabled");
	})
	$("#5GvisitorON").click(function() {
		$("#5Gvisitor_name").attr("disabled", false);
		$("#5Gvisitor_name").removeClass("inpt-disabled");
		$("#5Gvisitor_pass").attr("disabled", false);
		$("#5Gvisitor_pass").removeClass("inpt-disabled");
	})
	//插件设置
	$("#FCYON").click(function() {
		onformPlug();
		//getData_Plug_info();
	})
	$("#FCYOFF").click(function() {
		onformPlug();
		//getData_Plug_info();
	})

	//2.4G信号强度设置
	$("#label_1").click(function() {
		document.getElementById("radios").value = "0";
		$("#label_1").addClass("chanceThis");
		$("#label_2").removeClass("chanceThis");
		$("#label_3").removeClass("chanceThis");
		$("#signal_bar").css("width", "25%");
		$("#signal_bar").css("background-color", "#86E01E");
		onform_set_pamode();
	})
	$("#label_2").click(function() {
		document.getElementById("radios").value = "1";
		$("#label_2").addClass("chanceThis");
		$("#label_1").removeClass("chanceThis");
		$("#label_3").removeClass("chanceThis");
		$("#signal_bar").css("width", "55%");
		$("#signal_bar").css("background-color", "#F2B01E");
		onform_set_pamode();
	})
	$("#label_3").click(function() {
		document.getElementById("radios").value = "2";
		$("#label_3").addClass("chanceThis");
		$("#label_2").removeClass("chanceThis");
		$("#label_1").removeClass("chanceThis");
		$("#signal_bar").css("width", "100%");
		$("#signal_bar").css("background-color", "red");
		onform_set_pamode();
	})
	//5G信号强度设置
	$("#label_4").click(function() {
		document.getElementById("radios_5G").value = "0";
		$("#label_4").addClass("chanceThis");
		$("#label_5").removeClass("chanceThis");
		$("#label_6").removeClass("chanceThis");
		$("#signal_bar_5G").css("width", "25%");
		$("#signal_bar_5G").css("background-color", "#86E01E");
		onform_5Gset_pamode();
	})
	$("#label_5").click(function() {
		document.getElementById("radios_5G").value = "1";
		$("#label_5").addClass("chanceThis");
		$("#label_4").removeClass("chanceThis");
		$("#label_6").removeClass("chanceThis");
		$("#signal_bar_5G").css("width", "55%");
		$("#signal_bar_5G").css("background-color", "#F2B01E");
		onform_5Gset_pamode();
	})
	$("#label_6").click(function() {
		document.getElementById("radios_5G").value = "2";
		$("#label_6").addClass("chanceThis");
		$("#label_5").removeClass("chanceThis");
		$("#label_4").removeClass("chanceThis");
		$("#signal_bar_5G").css("width", "100%");
		$("#signal_bar_5G").css("background-color", "red");
		onform_5Gset_pamode();
	})
	//WIFI开关
	$("#switchOff").click(function() {
		$("#slidOne").val("1");
		$("#wifi_2gssidStatus").attr("disabled", false);
		$("#switchOn").show(300);
		$(this).hide(300);
		inputset(1);
		onform_setwifi_switch();
		wifiswitch_2g(1);
	})
	$("#switchOn").click(function() {
		$("#slidOne").val("0");
		$("#wifi_2gssidStatus").attr("disabled", true);
		$("#switchOff").show(300);
		$(this).hide(300);
		inputset(0);
		onform_setwifi_switch();
		wifiswitch_2g(0);

	})
	$("#5gswitchOff").click(function() {
		$("#5gslidOne").val("1");
		$("#wifi_5gssidStatus").attr("disabled", false);
		$("#5gswitchOn").show(300);
		$(this).hide(300);
		input5set(1);
		onform_set5gwifi_switch();
		wifiswitch_5g(1);
	})
	$("#5gswitchOn").click(function() {
		$("#5gslidOne").val("0");
		$("#wifi_5gssidStatus").attr("disabled", true);
		$("#5gswitchOff").show(300);
		$(this).hide(300);
		input5set(0);
		onform_set5gwifi_switch();
		wifiswitch_5g(0);
	})
	$("#soft_mode").change(function() {
		if ($(this).val() == "open") {
			document.getElementById("wifiTkip").value = "none";
			$("#WifiKeyLabel").hide();
			$("#wifi_pass1").val("");
		} else {
			document.getElementById("wifiTkip").value = "tkipaes";
			$("#WifiKeyLabel").show();
			$("#2gPass_label").css("display", "block");
		}
	})
	$("#5gsoft_mode").change(function() {
		if ($(this).val() == "open") {
			document.getElementById("5gwifiTkip").value = "none";
			$("#5gWifiKeyLabel").hide();
			$("#5gwifi_pass1").val("");
		} else {
			document.getElementById("5gwifiTkip").value = "tkipaes";
			$("#5gWifiKeyLabel").show();
			$("#5gPass_label").css("display", "block");
		}
	})
	//WIFI开关输入禁止
	function inputset(num) {
		if (num == "0") {
			$("#wifi_ssid").attr("disabled", true);
			$("#wifi_ssid").css("cursor", "not-allowed");
			$("#soft_mode").attr("disabled", true);
			$("#soft_mode").css("cursor", "not-allowed");
			$("#wifi_pass1").attr("disabled", true);
			$("#wifi_pass1").css("cursor", "not-allowed");
		} else {
			$("#wifi_ssid").attr("disabled", false);
			$("#wifi_ssid").css("cursor", "text");
			$("#soft_mode").attr("disabled", false);
			$("#soft_mode").css("cursor", "pointer");
			$("#wifi_pass1").attr("disabled", false);
			$("#wifi_pass1").css("cursor", "text");
		}
	}

	function input5set(num) {
		if (num == "0") {
			$("#5gwifi_ssid").attr("disabled", true);
			$("#5gwifi_ssid").css("cursor", "not-allowed");
			$("#5gsoft_mode").attr("disabled", true);
			$("#5gsoft_mode").css("cursor", "not-allowed");
			$("#5gwifi_pass1").attr("disabled", true);
			$("#5gwifi_pass1").css("cursor", "not-allowed");
		} else {
			$("#5gwifi_ssid").attr("disabled", false);
			$("#5gwifi_ssid").css("cursor", "text");
			$("#5gsoft_mode").attr("disabled", false);
			$("#5gsoft_mode").css("cursor", "pointer");
			$("#5gwifi_pass1").attr("disabled", false);
			$("#5gwifi_pass1").css("cursor", "text");
		}
	}
	//lan开关输入禁止
	$("#radio1").click(function() {
		$("#startip").attr("disabled", false);
		$("#startip").removeClass("inpt-disabled");
		$("#endip").attr("disabled", false);
		$("#startip_label").css("display", "none");
		$("#endip_label").css("display", "none");
		$("#endip").removeClass("inpt-disabled");
	})
	$("#radio2").click(function() {
		$("#startip").attr("disabled", true);
		$("#startip").addClass("inpt-disabled");
		$("#endip").attr("disabled", true);
		$("#endip").addClass("inpt-disabled");
		$("#startip_label").css("display", "none");
		$("#endip_label").css("display", "none");
	})
	//DMZ开关输入禁止
	$("#DMZON").click(function() {
		$("#mdz_ip").attr("disabled", false);
		$("#mdz_ip").removeClass("inpt-disabled");
		$("#mdz_ip").focus();
	})
	$("#DMZOFF").click(function() {
		$("#mdz_ip").attr("disabled", true);
		$("#mdz_ip_namelabel").css("display", "none");
		$("#mdz_ip").addClass("inpt-disabled");
	})

	//lan自动填充参数
	$("#lanip").change(function() {
		var string = $("#lanip").val().split(".");
		if (string.length > 3) {
			var end = string[3];
			string.pop();
			if (end < 100) {
				var buf = string[0] + '.' + string[1] + '.' + string[2] + ".";
				$("#startip").val(buf + "100");
				$("#startip").focus();
				$("#endip").val(buf + "199");
				$("#endip").focus();
			} else {
				var buf = string[0] + '.' + string[1] + '.' + string[2] + ".";
				$("#startip").val(buf + "2");
				$("#startip").focus();
				$("#endip").val(buf + "99");
				$("#endip").focus();
			}
		}
	})
	//输入框焦点
	$(".inpt").focusin(function() {
		$(this).siblings("label").hide();
	}).focusout(function() {
		if ($(this).val() == '') {
			$(this).siblings("label").show();
		}
	})
	//取消按钮
	$(".cannel").click(function() {
		layer.closeAll();
	})
	//more
	$(".return_a,.Mcannel").click(function() {
		$("#app_section").show();
		$("#app_detail").hide();
		$("#area").html("");
		$("#F_name").html("");
	})
	//more 功能页面显示、隐藏
	$(".tab_title").click(function() {
		$(this).addClass("tab_cur").siblings().removeClass("tab_cur");
		$(".addon_container").eq($(".tab_title").index(this)).show().siblings().hide();
	});
	$(".ext-item").click(function() {
		$("#app_section").hide();
		$("#app_detail").show();
		$("#area").html($(this).parents("ul").siblings("span").html());
		$("#F_name").html($(this).children(".menu_text").html());
	})
	//网络设置
	//more_wan设置
	$("#more_internet").click(function() {
		$(".content_info").hide();
		$("#setwan").show();
		getData_get_wanset_info();
		timeControl(0);
	})
	//more_lan设置
	$(".more_lan").click(function() {
		$(".content_info").hide();
		$("#setlan").show();
		getData_port_info();
		timeControl(0);
	})
	$("#lan_button").click(function() {
		onform_setlan();
		timeControl(1);
		//setTimeout(function(){layer.closeAll();},2500);
	})
	//more_QOS设置
	$("#more_QOS").click(function() {
		$(".content_info").hide();
		$("#get_moreQOS").show();
		get_moreQOS_info();
	})
	$("#moreQOS_apply").click(function() {
		set_moreQos();
	})
	//pppoe
	$("#more_pppoe").click(function() {
		$(".content_info").hide();
		$("#setpppoe").show();
		get_pppoeserver();
		getpppoe_user();
		get_pppoeclient();
	})
	$("#pppoesauth").click(function() {
		if ($("#pppoesauth").val() == 0) {
			$("#sauth_type").css("display", "none");
			$(".pppoe_checkbox").prop("disabled", true);
		} else {
			$("#sauth_type").css("display", "block");
			$(".pppoe_checkbox").prop("disabled", false);
		}
	})
	$(".pppoe_checkbox").click(function() {
		if ($(this).prop("checked")) {
			$(this).val("1");
		} else {
			$(this).val("0");
		}
	})
	$(".pppoetype span").click(function() {
		$(this).addClass("oncolor").siblings("span").removeClass("oncolor");
		$(".pppoe_info").hide().eq($(this).index()).show();
	})
	$("#pppoe_button").click(function() {
		onform_pppoeserver();
	})
	$("#account_button").click(function() {
		onform_adduser();
	})
	$("#dial_terminal").click(function() {
		get_pppoeclient();
	})
	//mac clone
	$("#macClone").click(function() {
		$(".content_info").hide();
		$("#setMac").show();
		getdata_macclone();
	})
	$("#mac_apply").click(function() {
		onform_setMac();
	})
	//高级DNS
	$("#advancedDNS").click(function() {
		$(".content_info").hide();
		$("#setDNS").show();
		getdata_DNS_info();
	})
	$("#dnsApply").click(function() {
		onform_DNS();
		//layer.closeAll();
	})
	//2.4G 无线
	//more_2.4Gwifi设置
	$("#more_wifi").click(function() {
		$(".content_info").hide();
		$("#setwlan").show();
		$("#wifi_2gssidStatus").prop("checked", false);
		$("#wifi_2gssidStatus").attr("disabled", true);
		getData_wifi_info();
		getData_wifi_switch();
		timeControl(0);
	})
	//2.4G访客网络
	$("#visitor").click(function() {
		$(".content_info").hide();
		$("#setVisitor").show();
		getData_visitor_info();
	})
	$("#visitor_button").click(function() {
		onform_visitor();
	})
	//Channel
	$("#channelSet").click(function() {
		$(".content_info").hide();
		$("#setChannel").show();
		ChannelMode = true;
		getData_Channel_info();
	})
	//信号强度
	$("#signal").click(function() {
		$(".content_info").hide();
		$("#setSignal").show();
		getData_signalstrength_info();
	})
	//信道优化
	$("#oneKey").click(function() {
		onform_postchannel();
		postinfo();
		setTimeout(function() {
			getData_channelquality_info();
			$(".content_info").hide();
			$("#setupchannel").show();
		}, 5000);
	})
	$("#channel_button").click(function() {
		layer.closeAll();
		onform_setchannel();
	})
	//5G 无线
	//more_5Gwifi设置
	$("#more_5Gwifi").click(function() {
		$(".content_info").hide();
		$("#setwlan_5G").show();
		$("#5gwlan").show();
		$("#wifi_5gssidStatus").prop("checked", false);
		$("#wifi_5gssidStatus").attr("disabled", true);
		getData_5gwifi_info();
		getData_5gwifi_switch();
		timeControl(0);
	})
	//5G访客网络
	$("#visitor_5G").click(function() {
		$(".content_info").hide();
		$("#setVisitor_5G").show();
		getData_5Gvisitor_info();
	})
	$("#visitor_5Gbutton").click(function() {
		onform_5Gvisitor();
	})
	$("#set_serial").click(function() {
		onform_serial();
	})
	//5G Channel
	$("#channelSet_5G").click(function() {
		$(".content_info").hide();
		$("#setChannel_5G").show();
		ChannelMode = false;
		getData_Channel_info();
	})
	$("#qos_button").click(function() {
		//layer.closeAll();
	})
	//5G信号强度
	$("#signal_5G").click(function() {
		$(".content_info").hide();
		$("#setSignal_5G").show();
		getData_5Gsignalstrength_info();
	})
	//系统设置
	//黑名单
	$("#BlackList").click(function() {
		$(".content_info").hide();
		$("#setblack").show();
		$("#setblack").parent("div").css("height", "auto");
		getData_blacklist_info();
	})
	//静态绑定
	$("#StaticList").click(function() {
		$(".content_info").hide();
		$("#setStatic").show();
		$("#setStatic").parent("div").css("height", "auto");
		getData_staticbind_list();
	})
	//权限
	$("#permission").click(function() {
		$(".content_info").hide();
		$("#setpermission").show();
		$("#setpermission").parent("div").css("height", "auto");
		get_permission();
	})
	$("#perConfigSave,.agileYes").click(function() {
		var strNum = "";
		for (var i = 0; i < $(".checkPermission").length; i++) {
			if ($(".checkPermission").eq(i).prop("checked") == true) {
				strNum = strNum + "1";
			} else {
				strNum = strNum + "0";
			}
		}
		var parNum = strNum.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/g, "$1-$2-$3-$4");
		parNum = parNum.split("-");
		var laninfo, waninfo, wifiinfo, dmzinfo;
		waninfo = parseInt(parNum[0], 2);
		laninfo = parseInt(parNum[1], 2);
		wifiinfo = parseInt(parNum[2], 2);
		dmzinfo = parseInt(parNum[3], 2);
		if ($(this).hasClass("agileYes")) {
			onform_permission(1, laninfo, waninfo, wifiinfo, dmzinfo)
		} else {
			onform_permission(0, laninfo, waninfo, wifiinfo, dmzinfo)
		}
	})

	//wifi定时关闭设置
	$("#wifiTiming").click(function() {
		$(".content_info").hide();
		$("#setWifiTiming").show();
		WTimingOff_info();
	})
	$("#Wtiming_on").click(function() {
		WtimingSwitch(1);
	})
	$("#Wtiming_off").click(function() {
		WtimingSwitch(0);
	})
	$("#wifi_TimeApply").click(function() {
		onformWTimingOff($("#Wstart_h1").val(), $("#Wend_h1").val(), $("#Wstart_m1").val(), $("#Wend_m1").val(), $(
			"#Wstart_h2").val(), $("#Wend_h2").val(), $("#Wstart_m2").val(), $("#Wend_m2").val())
	})
	//more_terminallist终端设置
	$("#more_terminallist").click(function() {
		$(".content_info").hide();
		$("#set_terminallist").show();
		get_limitTerm();
	})
	$("#cancel_terminallist").click(function() {
		layer.closeAll();
	})
	$(".timeflag").click(function() {
		layer.closeAll();
		timeControl(1);
	})
	//网址黑名单
	$("#URL_blacklist").click(function() {
		window.location = "urlBlack.html";
	});
	//设置用户名 密码
	$("#adminPass").click(function() {
		$(".content_info").hide();
		$("#setAccount").show();
		//getData_manpsd();
		if ($.cookie("user") == "superadmin") {
			$(".superadminType").show();
		} else {
			$(".superadminType").hide();
		}

	})
	$("#user_confirm").click(function() {
		if ($.cookie("user") == "superadmin") {
			if ($("#superaAccount").val() == "superadmin") {
				onform_setsuperadmin();
			} else {
				onform_setmanpsd();
			}
		} else {
			onform_setmanpsd();
		}

	})
	//LED
	$("#LED").click(function() {
		$(".content_info").hide();
		$("#setLed").show();
		get_ledswitch();
	})
	//时间服务器
	$("#worldTime").click(function() {
		$(".content_info").hide();
		$("#setworldTime").show();
		get_timeZone_info();
		var time = setInterval(get_curTmie, 1000);
		$("#worldTime_cancel,.return_a").unbind("click");
		$("#worldTime_cancel,.return_a").click(function() {
			clearInterval(time);
			$("#app_section").show();
			$("#app_detail").hide();
			$("#area").html("");
			$("#F_name").html("");
		})
	})
	$("#worldTime_apply").click(function() {
		onform_timeZone();
	})
	//复位路由
	$("#restore").click(function() {
		$(".content_info").hide();
		$("#setrestore").show();
	})
	$("#restore_button").click(function() {
		onform_restore();
		//layer.closeAll();
	})
	//重启路由
	$("#ReBoot").click(function() {
		$(".content_info").hide();
		$("#setRestore").show();
	})
	$("#reboot_button").click(function() {
		onform_reboot();
		//layer.closeAll();
	})
	//重启定时路由
	$("#timingReBoot").click(function() {
		$(".content_info").hide();
		$("#setTimingRestore").show();
		get_sysreboot_info()
	})
	$("#timingReboot_on").click(function() {
		$("#timingReboot_h1").attr("disabled", false);
		$("#timingReboot_m1").attr("disabled", false);
		$("#timingReboot_h1").removeClass("inpt-disabled");
		$("#timingReboot_m1").removeClass("inpt-disabled");
	})
	$("#timingReboot_off").click(function() {
		$("#timingReboot_h1").attr("disabled", true);
		$("#timingReboot_m1").attr("disabled", true);
		$("#timingReboot_h1").addClass("inpt-disabled");
		$("#timingReboot_m1").addClass("inpt-disabled");
	})
	$("#timingRebootBtn").click(function() {
		set_sysreboot_info();
	})
	//硬件加速
	$("#hardware").click(function() {
		$(".content_info").hide();
		$("#set_hardware").show();
		get_HWNATswitch();
	});
	// 导入功能
	$("#Backup_Restore").click(function() {
		$(".content_info").hide();
		$('#fileContent').show();
	})
	//更多功能
	$("#Wlanspeed").click(function() {
		$(".content_info").hide();
		$("#getSpeed").show();
		$("#speedWait").css("display","block");
		$("#dialogspeed").css("display","none");
		$("#close_button").attr("disabled",true);
		$("#close_button").unbind("click");
		$("#close_button").css("cursor","not-allowed");
		$("#respeed_button").attr("disabled",true);
		$("#respeed_button").css("cursor","not-allowed");
		$("#respeed_button").unbind("click");
		$(".return_a").unbind("click");
		$(".return_a").css("cursor","not-allowed");
		start();
		onform_testspeed();
		setTimeout(getData_bwinfo,34000);
	})
	//NAS
	$("#nasSet").click(function() {
		$(".content_info").hide();
		$("#setNAS").show();
		getData_NASUser_info();
	})
	//L2TP
	$("#vpnSet").click(function() {
		$(".content_info").hide();
		$("#setvpn_L2TP").show();
		$("#pptp_set").trigger("click");
		vpnFlag = true;
		getData_l2tp();
	})
	//pptp
	$("#pptp_vpnSet").click(function() {
		$(".content_info").hide();
		$("#setvpn_pptp").show();
		$("#pptp_set").trigger("click");
		vpnFlag = false;
		getData_pptp();
	})
	//UPNP
	$("#upnp").click(function() {
		$(".content_info").hide();
		$("#setUPNP").show();
		getData_Upnp_info();
	})
	//dmz
	$("#dmz").click(function() {
		$(".content_info").hide();
		$("#setDMZ").show();
		getData_Dmz_info();
	})
	//远程web管理
	$("#webadmin").click(function() {
		$(".content_info").hide();
		$("#setwebAdmin").show();
		get_webAdmin();
	})
	//flash
	$("#flash").click(function() {
		window.location = "flash.html";
	});
	//forwarding
	$("#forwarding").click(function() {
		$(".content_info").hide();
		$("#setForwarding").show();
		$("#ForwardingList_ip").focus();
	});
	//setVserver
	$("#vserver").click(function() {
		$(".content_info").hide();
		$("#setVserver").show();
		$("#VserverAdd_pr").focus();
		$("#VserverAdd_pu").focus();
		$("#VserverAdd_ip").focus();
	})
	//Plugin
	$("#plugin").click(function() {
		$(".content_info").hide();
		$("#setPlugin").show();
		getData_Plug_info();
	})
	//main
	//wlan设置
	$("#wifi").click(function() {
		layer.open({
			type: 1,
			title: false,
			shade: [0.7, '#000'],
			closeBtn: false,
			offset: '150px',
			area: ['500px', ''],
			content: $("#setwlan"),
			skin: 'cy-class'
		});
		$("#wifi_2gssidStatus").prop("checked", false);
		$("#wifi_2gssidStatus").attr("disabled", true);
		$("#wifi_5gssidStatus").prop("checked", false);
		$("#wifi_5gssidStatus").attr("disabled", true);
		getData_wifi_info();
		getData_wifi_switch();
		if (IsDouble) {
			getData_5gwifi_info();
			getData_5gwifi_switch();
		}
		timeControl(0);
	})
	//升级
	$("#upgrade_button").click(function() {
		onform_upgrade_versoin();
	})
	//lan设置
	$(".lancon").click(function() {
		layer.open({
			type: 1,
			title: false,
			shade: [0.7, '#000'],
			closeBtn: false,
			offset: '150px',
			area: '425px',
			content: $("#setlan"),
			skin: 'cy-class'
		});
		getData_port_info();
		timeControl(0);
	})
	//waninfo
	$("#wanImg").click(function() {
		layer.open({
			type: 1,
			title: false,
			shade: [0.7, '#000'],
			closeBtn: false,
			offset: '150px',
			area: '386px',
			content: $("#getWanInfo"),
			skin: 'cy-class'
		});
	})
	$("#wanImg_button").click(function() {
		layer.closeAll();
	})
	//wan设置
	$("#internet").click(function() {
		layer.open({
			type: 1,
			title: false,
			shade: [0.7, '#000'],
			closeBtn: false,
			offset: '150px',
			area: ['510px', 'auto'],
			content: $("#setwan"),
			skin: 'cy-class'
		});
		$("#setwan").parent("div").css("height", "auto");
		getData_get_wanset_info();
		timeControl(0);
	})
	$("#wan_pppoe_button").click(function() {
		onform_setwan_pppoe();
		timeControl(1);
	})
	$("#wan_static_button").click(function() {
		onform_setwan_static();
		timeControl(1);
	})
	$("#wan_dhcp_button").click(function() {
		onform_setwan_dhcp();
		timeControl(1);
	})
	//main 复位路由
	$("#reset").click(function() {
		layer.open({
			type: 1,
			title: false,
			shade: [0.7, '#000'],
			closeBtn: false,
			offset: '150px',
			area: '360px',
			content: $("#setRestore"),
			skin: 'cy-class'
		});
	})
	//重启路由
	/* 	$("#ReBoot").click(function() {
	        layer.open({
	            type: 1,
	            title: false,
	            shade: [0.7, '#000'],
	            closeBtn: false,
				offset:'150px',
				area:'360px',
	            content: $("#setrestore"),
	            skin: 'cy-class'
	        });
	    })
		$("#restart_button").click(function(){
			onform_restore();
			layer.closeAll();
			
		}) */
	//显隐密码
	var view_pwd = $(".pwd-icon");
	var flag = 1;
	view_pwd.click(function() {
		if (flag == 1) {
			$(this).siblings("label").attr("for", $(this).siblings("input[type=text]").attr("id"));
			$(this).siblings("input[type=password]").hide();
			$(this).siblings("input[type=text]").show();
			$(this).html("<img src = 'images/pwd-icon2.png' >");
			flag = 0;
		} else {
			$(this).siblings("label").attr("for", $(this).siblings("input[type=password]").attr("id"));
			$(this).siblings("input[type=password]").show();
			$(this).siblings("input[type=text]").hide();
			$(this).html("<img src = 'images/pwd-icon.png' >");
			flag = 1;
		}
	})
	//   $(".inpt").blur(function() {
	//       $(this).siblings(".inpt").val($(this).val());
	//  })

})
$(function() {
	$(".wan_Item").click(function() {
		$(this).addClass("on");
		$(this).siblings().removeClass("on");
		var id = $(this).attr("data-id");
		for (var i = 1; i < 4; i++) {
			$("#div" + i).css("display", "none");
		}
		$("#div" + id).css("display", "block");
	})
})

function aliesover(obj) {
	$(obj).removeClass("aliesOFF");
	$(obj).addClass("aliesON");
}

function aliesout(obj) {
	$(obj).removeClass("aliesON");
	$(obj).addClass("aliesOFF");
}

function aliesGame(obj, e) {
	var keynum;
	var theFocus = obj.id;
	if (window.event) // IE
	{
		keynum = e.keyCode
	} else if (e.which) // Netscape/Firefox/Opera
	{
		keynum = e.which
	} else {
		return;
	}
	if (keynum == 13) {
		$(obj).blur();
	}
}




// 导入文件
$('#importFile').submit(function(event) {
	//首先验 证文件格式
	var fileName = $(this).find("input[name=filename]").val();
	if (fileName === '') {
		layer.alert("Pelase select file");
		return false;
	}
	var fileType = fileName.substring(fileName.lastIndexOf('.') + 1);
	const extension = fileType === 'dat';
	if (!extension) {
		layer.alert('Upload files can only be in DAT format!');
		return false;
	}
	// mulitipart form,如文件上传类
	var formData = new FormData(this);
	
	// $('.layer').show();
	// $('.operaTips').show();
		$.ajax({
			async: true,
			type: "POST",
			url: "/cgi-bin/upload_settings.cgi",
			data: formData,
			dataType: "JSON",
			mimeType: "multipart/form-data",
			contentType: false,
			cache: false,
			processData: false,
			beforeSend: function() { //ajax发送请求时的操作，得到请求结果前有效
			   restart('import');
			   // console.log(111);
			   // $('.layer').show();
			   // $('.operaTips').show();
			},
			success: function(data) {
			}
		})
	return false;
});

// 导出文件
$('#exportFile').click(function() {
	window.location = '/cgi-bin/ExportSettings.sh';
});
