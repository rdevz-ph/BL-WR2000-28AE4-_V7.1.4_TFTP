/**
 * Created by Administrator on 2017/3/18.
 */
var focus_D=false;
$(function () {
////wan设置
    $("#wan_speed_manage").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        getData_get_wanset_Minfo();
        timeControl(0);
        $(".appContent_info").hide();
        $("#setwan").show();
    });
    $("#wan_pppoe_button").click(function () {
        onform_setwan_pppoe();
        timeControl(1);
    });
    $("#wan_static_button").click(function () {
        onform_setwan_static();
        timeControl(1);
    })
    $("#wan_dhcp_button").click(function () {
        onform_setwan_dhcp();
        timeControl(1);
    })
///2.4g_wifi设置
    $("#2_4G_wifi_set").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        $("#wifi_2gssidStatus").prop("checked", false);
        $("#wifi_2gssidStatus").attr("disabled", true);
        $("#wifi_5gssidStatus").prop("checked", false);
        $("#wifi_5gssidStatus").attr("disabled", true);
        getData_wifi_info();
        getData_wifi_switch();
        timeControl(0);
        $(".appContent_info").hide();
        $("#2_4G_setwlan").show();
    });

//5G_wifi设置
    $("#5G_wifi_set").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        $("#wifi_2gssidStatus").prop("checked", false);
        $("#wifi_2gssidStatus").attr("disabled", true);
        $("#wifi_5gssidStatus").prop("checked", false);
        $("#wifi_5gssidStatus").attr("disabled", true);
        getData_5gwifi_info();
        getData_5gwifi_switch();
        timeControl(0);
        $(".appContent_info").hide();
        $("#5G_setwlan").show();
    });
//wifi开关设置
    $("#switchOff").click(function () {
        $("#slidOne").val("1");
        $("#wifi_2gssidStatus").attr("disabled", false);
        $("#switchOn").show(300);
        $(this).hide(300);
        inputset(1);
        onform_setwifi_switch();
        wifiswitch_2g(1);
    })
    $("#switchOn").click(function () {
        $("#slidOne").val("0");
        $("#wifi_2gssidStatus").attr("disabled", true);
        $("#switchOff").show(300);
        $(this).hide(300);
        inputset(0);
        onform_setwifi_switch();
        wifiswitch_2g(0);
    })
    $("#5gswitchOff").click(function () {
        $("#5gslidOne").val("1");
        $("#wifi_5gssidStatus").attr("disabled", false);
        $("#5gswitchOn").show(300);
        $(this).hide(300);
        input5set(1);
        onform_set5gwifi_switch();
        wifiswitch_5g(1);
    })
    $("#5gswitchOn").click(function () {
        $("#5gslidOne").val("0");
        $("#wifi_5gssidStatus").attr("disabled", true);
        $("#5gswitchOff").show(300);
        $(this).hide(300);
        input5set(0);
        onform_set5gwifi_switch();
        wifiswitch_5g(0);
    })
    $("#soft_mode").change(function () {
        if ($(this).val() == "open") {
            document.getElementById("wifiTkip").value = "none";
            $("#WifiKeyLabel").hide();
            $("#wifi_pass1").val("");
        } else {
            document.getElementById("wifiTkip").value = "tkipaes";
            $("#WifiKeyLabel").show();
        }
    })
    $("#5gsoft_mode").change(function () {
        if ($(this).val() == "open") {
            document.getElementById("5gwifiTkip").value = "none";
            $("#5gWifiKeyLabel").hide();
            $("#5gwifi_pass1").val("");
        } else {
            document.getElementById("5gwifiTkip").value = "tkipaes";
            $("#5gWifiKeyLabel").show();
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
//wifi定时关闭
    $("#wifiTiming").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        WTimingOff_info();
        $(".appContent_info").hide();
        $("#setWifiTiming").show();
    });
    $("#Wtiming_on").click(function(){
        WtimingSwitch(1);
    })
    $("#Wtiming_off").click(function(){
        WtimingSwitch(0);
    })
    $("#wifi_TimeApply").click(function(){
        onformWTimingOff($("#Wstart_h1").val(),$("#Wend_h1").val(),$("#Wstart_m1").val(),$("#Wend_m1").val(),$("#Wstart_h2").val(),$("#Wend_h2").val(),$("#Wstart_m2").val(),$("#Wend_m2").val())
    })
//终端设置
    $("#setup_terminallist").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        getM_terminal_info();
        $(".appContent_info").hide();
        $("#set_terminallist").show();
    });
    //限时
    $("#pro_term").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        Mget_limitTerm();
        $(".appContent_info").hide();
        $("#term_limit").show();
    });
    $(".contentCallback").click(function () {
        $(".time_terminal").css("display","block");
        $("#edit_time").css("display","none");
        $(".appCallback").css("display", "block");
        $(".contentCallback").css("display", "none");
        $(".appMenu").css("display", "block")
    })

//lan设置
    $("#lan_set").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        getData_port_Minfo();
        timeControl(0);
        $(".appContent_info").hide();
        $("#setlan").show();
    });
    $("#lan_button").click(function () {
        onform_setlan();
        timeControl(1);
        setTimeout(function () {
            layer.closeAll();
        }, 2500);
    })
 //lan auto input data
    $("#lanip").change(function(){
        var string=$("#lanip").val().split(".");
        if(string.length>3){
            var end=string[3];
            string.pop();
            if(end<100){
                var buf=string[0]+'.'+string[1]+'.'+string[2]+".";
                $("#startip").val(buf+"100");
                $("#startip").focus();
                $("#endip").val(buf+"199");
                $("#endip").focus();
            }
            else {
                var buf=string[0]+'.'+string[1]+'.'+string[2]+".";
                $("#startip").val(buf+"2");
                $("#startip").focus();
                $("#endip").val(buf+"99");
                $("#endip").focus();}
        }
    })
//lan开关输入禁止
    $("#radio1").click(function () {
        $("#startip").attr("disabled", false);
        $("#startip").removeClass("inpt-disabled");
        $("#endip").attr("disabled", false);
        $("#startip_label").css("display", "none");
        $("#endip_label").css("display", "none");
        $("#endip").removeClass("inpt-disabled");
    })
    $("#radio2").click(function () {
        $("#startip").attr("disabled", true);
        $("#startip").addClass("inpt-disabled");
        $("#endip").attr("disabled", true);
        $("#endip").addClass("inpt-disabled");
        $("#startip_label").css("display", "none");
        $("#endip_label").css("display", "none");
    })
//模式切换
    $("#ChangerMode").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        GetEseayInfo();
        $(".appContent_info").hide();
        $("#set_Mode").show();
    });
//访客网络
    $("#2_4G_Visitor_time_set").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        getData_M24G_visitor_info();
        $(".appContent_info").hide();
        $("#2_4GsetVisitor").show();
    });
    $("#visitor_button").click(function () {
        onform_visitor();
    });
    $("#5G_Visitor_time_set").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        getData_M5G_visitor_info();
        $(".appContent_info").hide();
        $("#5GsetVisitor").show();
    });
    $("#5Gvisitor_button").click(function () {
        onform_5Gvisitor();
    });
    $("#visitorOFF").click(function () {
        $("#visitor_name").attr("disabled", true);
        $("#visitor_name").addClass("inpt-disabled");
        $("#visitor_pass").attr("disabled", true);
        $("#visitor_pass").addClass("inpt-disabled");
    })
    $("#visitorON").click(function () {
        $("#visitor_name").attr("disabled", false);
        $("#visitor_name").removeClass("inpt-disabled");
        $("#visitor_pass").attr("disabled", false);
        $("#visitor_pass").removeClass("inpt-disabled");
    })
    $("#5GvisitorON").click(function () {
        $("#5Gvisitor_name").attr("disabled", false);
        $("#5Gvisitor_name").removeClass("inpt-disabled");
        $("#5Gvisitor_pass").attr("disabled", false);
        $("#5Gvisitor_pass").removeClass("inpt-disabled");
    })
    $("#5GvisitorOFF").click(function () {
        $("#5Gvisitor_name").attr("disabled", true);
        $("#5Gvisitor_name").addClass("inpt-disabled");
        $("#5Gvisitor_pass").attr("disabled", true);
        $("#5Gvisitor_pass").addClass("inpt-disabled");
    })
//测速
    $("#led_Wlanspeed").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        $("#respeed_button").attr("disabled", true);
        $("#respeed_button").unbind("click");
        $("#speedWait").css("display", "block");
        $("#dialogspeed").css("display", "none");
        start();
        onform_testspeed();
        setTimeout(getData_bwinfo, 34000);
        $(".appContent_info").hide();
        $("#getSpeed").show();
    });
//信道设置
    $("#2_4G_channelSet").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        ChannelMode = true;
        getData_Channel_info();
        $(".appContent_info").hide();
        $("#2_4G_setChannel").show();
    });
    $("#5G_channelSet").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        ChannelMode = false;
        getData_Channel_info();
        $(".appContent_info").hide();
        $("#5G_setChannel").show();
    });
    $("#FloatChannel").change(function () {
        if($("#FloatChannel").val()=="14"){
            $("#band_mode").attr("disabled",true);
            $("#band_mode").addClass("inpt-disabled");
				 $("#band_mode").val(0);
            layer.msg(curlang.JP_channel);
        }else{
            $("#band_mode").attr("disabled",false);
            $("#band_mode").removeClass("inpt-disabled");
        }
    })
//黑名单
    $("#baby_BlackList").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        $("#setblack").parent("div").css("height", "auto");
        getData_blacklist_info();
        $(".appContent_info").hide();
        $("#setblack").show();
    });
//网址黑名单
    //两个选项
    $("#URL_blacklist").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        $("#setblack").parent("div").css("height", "auto");
        MurlBlacklist();
        $(".appContent_info").hide();
        $("#set_hostBlacklist").show();
    });
    $("#shost_blacklist,#host_blacklist").click(function () {
        $("#set_urllist").hide();
        $("#blacklit_con").show();
        $(".appCallback").css("display", "none");
        $(".contentCallback").css("display", "block");
    });
    $("#shost_blacklist").click(function () {
       $("#host_url").hide();
       $(".edit_term").hide();
       $(".setup_term").show();
       $("#set_hostCon").show();
       $("#term_offline").hide();
       $(".term_con").show();
       $("#host_con").html(curlang.host_blacklist);
       $("#term_Btitle").html(curlang.termBlacklist);
    });
    $("#host_blacklist").click(function () {
        $("#host_url").show();
        $(".edit_term").show();
        $(".setup_term").hide();
        $("#set_hostCon").hide();
        $("#term_offline").show();
        $("#host_con").html(curlang.host_blacklist1);
        $("#term_Btitle").html(curlang.termBlacklist4);
        for(var i=0;i<$(".term_text").length;i++){
            if($(".term_text").eq(i).html()==""){
                $(".term_text").eq(i).parent().hide();
            }
        }
    });
    //返回
    $(".contentCallback").click(function () {
        $("#set_urllist").css("display","block");
        $("#blacklit_con").css("display","none");
        $(".appCallback").css("display", "block");
        $(".contentCallback").css("display", "none");
    });
    $(".blacklistCallback").click(function () {
        if($("#term_layer").css("display")=="block"){
            if($("#term_del").css("display")=="none"){
                $("#shost_blacklist").trigger("click");
            }else{
                $("#host_blacklist").trigger("click");
            }
        }
        $("#set_host").css("display","block");
        $("#url_layer,#term_layer").css("display","none");
        $(".contentCallback").css("display", "block");
        $(".blacklistCallback").css("display", "none");
    });
    $("#set_hostCon,#url_edit").click(function(){
        $(".contentCallback").css("display", "none");
        $(".blacklistCallback").css("display", "block");
        $("#set_host").css("display","none");
        $("#url_layer").css("display","block");
        $("#s_urllist").val($("#g_urllist").val());
    });
    $("#url_sbu").click(function(){
        onform_urlBlack($("#s_urllist").val(),1);
    });
    $("#url_del").click(function(){
        onform_delBlack("*",1);
    });

//信号强度
    $("#2_4G_signal_set").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        getData_signalstrength_info();
        $(".appContent_info").hide();
        $("#2_4GsetSignal").show();
    });
    $("#5G_signal_set").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        getData_5Gsignalstrength_info();
        $(".appContent_info").hide();
        $("#5GsetSignal").show();
    });
    //重启定时路由
    $("#timingReBoot").click(function() {
        $("#appContent").animate({"left": "0"}, 500);
        $(".appContent_info").hide();
        $("#setTimingRestore").show();
        get_sysreboot_info()
    })
    $("#timingReboot_on").click(function(){
        $("#timingReboot_h1").attr("disabled",false);
        $("#timingReboot_m1").attr("disabled",false);
        $("#timingReboot_h1").removeClass("inpt-disabled");
        $("#timingReboot_m1").removeClass("inpt-disabled");
    })
    $("#timingReboot_off").click(function(){
        $("#timingReboot_h1").attr("disabled",true);
        $("#timingReboot_m1").attr("disabled",true);
        $("#timingReboot_h1").addClass("inpt-disabled");
        $("#timingReboot_m1").addClass("inpt-disabled");
    })
    $("#timingRebootBtn").click(function(){
        set_sysreboot_info();
    })
//重启路由
    $("#misc_reboot").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        $(".appContent_info").hide();
        $("#setRestore").show();
    });
    $("#reboot_button").click(function () {
        onform_reboot();
        // layer.closeAll();
    })
//恢复出厂设置
    $("#rally_restore").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        $(".appContent_info").hide();
        $("#setrestore").show();
    });
    $("#restore_button").click(function () {
        onform_restore();
        // layer.closeAll();
    })
//修改管理密码
    $("#password").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        //getData_manpsd();
        $(".appContent_info").hide();
        $("#setAccount").show();
	if($.cookie("user")=="superadmin"){
		$(".superadminType").show();
	}else{
		$(".superadminType").hide();
	}
    });
    $("#user_confirm").click(function(){
    	if($.cookie("user")=="superadmin"){
		if($("#superaAccount").val()=="superadmin"){
	            onform_setsuperadmin();
	        }else{
	            onform_setmanpsd();
	        }
	}else{
		onform_setmanpsd();
	}
    })
    var view_pwd = $(".pwd-icon");
    var flag = 1;
    view_pwd.click(function () {
        if (flag == 1) {
            $(this).siblings("label").attr("for", $(this).siblings("input[type=text]").attr("id"));
            $(this).siblings("input[type=password]").hide();
            $(this).siblings("input[type=text]").show();
            $(this).html("<img src = '/admin/images/pwd-icon2.png' >");
            flag = 0;
        } else {
            $(this).siblings("label").attr("for", $(this).siblings("input[type=password]").attr("id"));
            $(this).siblings("input[type=password]").show();
            $(this).siblings("input[type=text]").hide();
            $(this).html("<img src = '/admin/images/pwd-icon.png' >");
            flag = 1;
        }
    })
//固件升级
    $("#update").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        getData_Mversion_info();
        set_restore = 1;
        $(".appContent_info").hide();
        $("#setupgrade").show();
    });
//绑定列表
    $("#StaticList_time").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        $("#setStatic").parent("div").css("height", "auto");
        getData_staticbind_list();
        $(".appContent_info").hide();
        $("#setStatic").show();
    });
//LED
    $("#LED_set").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        get_ledswitch();
        $(".appContent_info").hide();
        $("#set_LED").show();
    });
    //世界时间
    $("#worldTime").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        $(".appContent_info").hide();
        $("#set_worldTime").show();
        get_timeZone_info();
        var time=setInterval(get_curTmie,1000);
        $(".appCallback").unbind("click");
        $(".appCallback").click(function(){
            clearInterval(time);
            $("#appContent").animate({"left": "50%"}, 500);
            $(".appMenu").css("display", "none");
            $(".hostMenu").css("display", "block");
        })
    });
    $("#worldTime_apply").click(function(){
        onform_timeZone();
    })
//upnp
    $("#upnp_set").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        getData_Upnp_info();
        get_Upnp_port();
        $(".appContent_info").hide();
        $("#set_upnp").show();
    });
    $("#UPNPON").click(function () {
        get_Upnp_port();
        $("#upnpList").css("display","block");
        $(".upnphead").css("display","block");
        $(".upnpdata").css("display","block");

    });
    $("#UPNPOFF").click(function () {
        $("#upnpList").css("display","none");
        $(".upnphead").css("display","none");
        $(".upnpdata").css("display","none");
    });
//dmz
    $("#dmz_set").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        MgetData_Dmz_info ();
        $(".appContent_info").hide();
        $("#set_dmz").show();
    });
    //DMZ开关输入禁止
    $("#DMZON").click(function(){
        $("#mdz_ip").attr("disabled",false);
        $("#mdz_ip").removeClass("inpt-disabled");
    })
    $("#DMZOFF").click(function(){
        $("#mdz_ip").attr("disabled",true);
        $("#mdz_ip_namelabel").css("display","none");
        $("#mdz_ip").addClass("inpt-disabled");
    })
    //web远程管理
    $("#webadmin").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        get_webAdmin();
        $(".appContent_info").hide();
        $("#setwebAdmin").show();
    });
//L2TP设置
    $("#VPN_l2tp_set").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        $(this).addClass("on");
        $("#pptp_set").removeClass("on");
        $("#vpn_mode").val("setl2tpinfo");
        $("#mppe_item").css("display", "none");
        $("#mppeon").attr('disabled', true);
        $("#mppeoff").attr('disabled', true);

        getData_Ml2tp();
        $(".appContent_info").hide();
        $("#L2TP_setvpn").show();
    })
    $("#set_vpn").click(function () {
        onformL2TP();
    });
///pptp设置
    $("#VPN_pptp_set").click(function () {
        $("#appContent").animate({"left": "0"}, 500);
        $(this).addClass("on");
        $("#l2tp_set").removeClass("on");
        $("#vpn_mode").val("setpptpinfo");
        $("#mppe_item").css("display", "block");
        $("#mppeon").attr('disabled', false);
        $("#mppeoff").attr('disabled', false);

        getData_Mpptp();
        $(".appContent_info").hide();
        $("#pptp_setvpn").show();
    });
    $("#set_pptp").click(function () {
        onformPPTPAPP();
    });
//终端列表显示
    $("#nameApply").click(function(){
        if(alias_D){
            $("#dev_name").hide();
            $("#span_alias").css("display","inline-block");
            alias_D=false;
        }else{
            $("#dev_name").css("display","inline-block");
            $("#span_alias").hide();
            alias_D=true;
        }
    })
    $("#lostBlack_apply").click(function(){
        addMBlack(this);
    })
    $("#upapply").click(function(){
        if($("#upapply").attr("data-id")==1){
            $(this).parent().siblings(".dev-center").css("display","block");
            $(this).siblings("#uplimit_span").hide();
            $("#upapply").hide();
            $("#limit_cm").html(curlang.limit_cm);
            $("#limit_cm").css("display","inline-block");
            $("#limit_cm").click(function() {
                MSetupSpeed(this);
            })
        }else{
            focus_D=false;
            MSetupSpeed(this);
        }
    });
    $(".dev-center").focusin(function(){
        focus_D=true;
        $("#upapply").hide();
        $("#limit_cm").css("display","inline-block");
        $("#limit_cm").html(curlang.limit_cm);
        $("#limit_cm").unbind("click");
        $("#limit_cm").click(function() {
            $("#upapply").attr("data-id","1");
            MSetupSpeed(this);
        })
    })
    $(".dev-center").siblings().click(function(){
        if(focus_D) {
            if ($("#upapply").attr("data-id") == 1) {
                $("#upapply").hide();
                $("#limit_cm").html(curlang.limit_cm);
                $("#limit_cm").css("display", "inline-block");
            } else {
                $("#upapply").css("display", "inline-block");
                $("#limit_cm").hide();
            }
        }
    })
    $("#add_timelimit").click(function(){
        var mac=$(this).parent().siblings(".dev-content").eq(1).find("#dev_mac").html();
        var starth1=$("#start_hour1").val();
        var endh1=$("#end_hour1").val();
        var startm1=$("#start_min1").val();
        var endm1=$("#end_min1").val();
        var starth2=$("#start_hour2").val();
        var endh2=$("#end_hour2").val();
        var startm2=$("#start_min2").val();
        var endm2=$("#end_min2").val();
        set_limitTerm(mac,starth1,endh1,startm1,endm1,starth2,endh2,startm2,endm2);
    });
    $("#lostArp_apply").click(function(){
        if($("#lostArp_apply").attr("data-id")==1){
            addBind(this);
        }else{
            unBind(this);
        }
    });
//箭头返回
    $(".appCallback").click(function () {
        $("#appContent").animate({"left": "50%"}, 500);
        $(".appMenu").css("display", "none");
        $(".hostMenu").css("display", "block")
    })
//黑名单,静态绑定,取消升级 按钮返回
    $("#upgrade_close,#staticancel,#blackcannel").click(function () {
        $("#appContent").animate({"left": "50%"}, 500);
        $(".appMenu").css("display", "none");
        $(".hostMenu").css("display", "block")
    })
//终端列表、、修改别名的返回箭头
    $(".contentCallback,#terminallist_cancel").click(function () {
        $(".terminal_list").css("display","block");
        $("#set_device").css("display","none");
        $(".appCallback").css("display", "block");
        $(".contentCallback").css("display", "none");
        $(".appMenu").css("display", "block")
    })
//路由状态与路由设置切换
    $("#routerSet").click(function () {
        $(".content_section section.routerSet-sec").animate({"left": "0"}, 500);
        $(this).siblings().removeClass("active");
        $(this).addClass("active");
        MshowMorePage();
      //  get_Router_status();
        
    })
    $("#routerStatus").click(function () {
        $(".content_section section.routerSet-sec").animate({"left": "25%"}, 500);
        $(this).siblings().removeClass("active");
        $(this).addClass("active");

    })
//wan的字体颜色切换
    $(".wan_Item").click(function () {
        $(".wan_Item").eq($(this).index()).addClass("on").siblings().removeClass('on');
        $(".wan_body_div").hide().eq($(this).index()).show();
    })
    $(".txt-center").click(function () {
        $(".txt-center").eq($(this).index()).addClass("on").siblings().removeClass('on');
        $(".wan_app_info").hide().eq($(this).index()).show();
    })
    $(".label").click(function () {
        $(".label").eq($(this).index()).addClass("chanceThis").siblings().removeClass('chanceThis');
    })
//信号强度3模式
    $("#label_1").click(function () {
        document.getElementById("radios").value = "0";
        $("#label_1").addClass("chanceThis");
        $("#label_2").removeClass("chanceThis");
        $("#label_3").removeClass("chanceThis");
        $("#signal_bar").css("width", "25%");
        $("#signal_bar").css("background-color", "#86E01E");
        onform_set_pamode();
    })
    $("#label_2").click(function () {
        document.getElementById("radios").value = "1";
        $("#label_2").addClass("chanceThis");
        $("#label_1").removeClass("chanceThis");
        $("#label_3").removeClass("chanceThis");
        $("#signal_bar").css("width", "55%");
        $("#signal_bar").css("background-color", "#F2B01E");
        onform_set_pamode();
    })
    $("#label_3").click(function () {
        document.getElementById("radios").value = "2";
        $("#label_3").addClass("chanceThis");
        $("#label_2").removeClass("chanceThis");
        $("#label_1").removeClass("chanceThis");
        $("#signal_bar").css("width", "100%");
        $("#signal_bar").css("background-color", "red");
        onform_set_pamode();
    })
//5g信号强度3模式
    $("#label_4").click(function () {
        document.getElementById("radios_5G").value = "0";
        $("#label_4").addClass("chanceThis");
        $("#label_5").removeClass("chanceThis");
        $("#label_6").removeClass("chanceThis");
        $("#signal_bar_5G").css("width", "25%");
        $("#signal_bar_5G").css("background-color", "#86E01E");
       onform_5Gset_pamode();
    })
    $("#label_5").click(function () {
        document.getElementById("radios_5G").value = "1";
        $("#label_5").addClass("chanceThis");
        $("#label_4").removeClass("chanceThis");
        $("#label_6").removeClass("chanceThis");
        $("#signal_bar_5G").css("width", "55%");
        $("#signal_bar_5G").css("background-color", "#F2B01E");
        onform_5Gset_pamode();
    })
    $("#label_6").click(function () {
        document.getElementById("radios_5G").value = "2";
        $("#label_6").addClass("chanceThis");
        $("#label_5").removeClass("chanceThis");
        $("#label_4").removeClass("chanceThis");
        $("#signal_bar_5G").css("width", "100%");
        $("#signal_bar_5G").css("background-color", "red");
        onform_5Gset_pamode();
    })
//箭头返回按钮旁的显示值
    $(".appMenu_list a").click(function () {
        $(".appTitle").html($(".appMenu_list a p span").eq($(this).index()).html());
        $(".appMenu").css("display", "block");
        $(".hostMenu").css("display", "none");
        $(".contentCallback").css("display", "none");
        $(".blacklistCallback").css("display", "none");
    })
    //终端修改别名的确定按钮的提交
    $("#alieConfirm").click(function () {
        var Dnamer=$(this).siblings('input');
        MchangeName(Dnamer);
    })

})
//网址黑名单终端按钮操作
function appTermBlack(){
    $(".edit_term,.setup_term").click(function(){
        $(".contentCallback").css("display", "none");
        $(".blacklistCallback").css("display", "block");
        $("#set_host").css("display","none");
        $("#term_layer").css("display","block");
        var mac = $(this).parent().siblings(".term_macN").find("p").eq(1).html().substr(5, 17);
        var name = $(this).parent().siblings(".term_macN").find("i").eq(1).html();
        var term_url = $(this).parent().siblings(".term_text").html();
        $("#mac_term").val(mac);
        $("#TblackName").html(name);
        $("#text_term").val(term_url);
    });
    //操作
    $(".edit_term").click(function(){
        $("#term_sbu").css("display","none");
        $("#term_edit,#term_del").css("display","inline-block");
        $("#text_term").attr("disabled",true);
        $("#text_term").css("border","0");
    });
    $("#term_edit").click(function(){
        $("#text_term").attr("disabled",false);
        $("#text_term").css("border","1px solid #ccc");
        $("#term_edit").css("display","none");
        $("#term_sbu,#term_del").css("display","inline-block");
    });
    $(".setup_term").click(function(){
        $("#text_term").attr("disabled",false);
        $("#text_term").css("border","1px solid #ccc");
        $("#term_edit").css("display","none");
        $("#term_sbu").css("display","inline-block");
        $("#term_edit,#term_del").css("display","none");
    });
    //提交
    $("#term_sbu").unbind("click");
    $("#term_sbu").click(function(){
        onform_termBlack(1);
    });
    $("#term_del").unbind("click");
    $("#term_del").click(function(){
        var mac=$("#mac_term").val();
        onform_delBlack(mac,1);
    });
    if($("#host_url").css("display")!="none"){
        $(".setup_term").hide();
        for(var i=0;i<$(".term_text").length;i++){
            if($(".term_text").eq(i).html()==""){
                $(".term_text").eq(i).parent().hide();
            }
        }
    }else{$(".term_con").show();}
}
   


