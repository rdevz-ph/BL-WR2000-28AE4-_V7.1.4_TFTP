var browser = {
	versions: function() {
		var u = navigator.userAgent, app = navigator.appVersion;
		return {
			trident: u.indexOf('Trident') > -1, //IE内核 
			presto: u.indexOf('Presto') > -1, //opera内核 
			webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核 
			gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核 
			mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端 
			ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端 
			android: u.indexOf('Android') > -1, //android终端或uc浏览器 
			iPhone: u.indexOf('iPhone') > -1, //是否为iPhone或者QQHD浏览器 
			iPad: u.indexOf('iPad') > -1, //是否iPad 
			webApp: u.indexOf('Safari') == -1 //是否web应该程序，没有头部与底部 
		};
	}(),
	language: (navigator.browserLanguage || navigator.language).toLowerCase()
}
function getMobile() {
	var mob = false;
	if (browser.versions.mobile || browser.versions.android || browser.versions.iPhone) {
		mob = true;
	}
	return mob;
}
$(function(){
	$(".close").click(function(){
		layer.closeAll();
	})
	$(".ListRow").bind("click",function(){
		$(this).children(".Tdleft").children("span").addClass("radioOn").children("input").attr("checked",true);
		$(this).siblings("tr").children("td").children("span").removeClass("radioOn").children("input").attr("checked",false);
		$(this).children(".Tdright").children("img").css("display","block");
		$(this).siblings("tr").children(".Tdright").children("img").css("display","none");
		var mode=$(this).children(".Tdleft").children("span").children("input").attr("id").replace("mode","");
		showMode(mode);
	})
	function showMode(Number){
		$("#breadcrumb-mode").css("display","inline");
		$("#breadcrumb-msg").css("display","");		
		if(Number==1){
			$(".page-index").css("display","none");
			$(".wan-set").css("display","block");
			$("#wan_prev").show();
			$("#breadcrumb-mode").html(curlang.RouteMode);
			$("#breadcrumb-msg").html(curlang.WanSet);
			$("#help").css("display","none");

			Get_wan_info();
                Get_wanMode();
			NowMode=1;
		}
		if(Number==2){
			$(".page-index").css("display","none");
			$(".ssid-list").css("display","block");
			$("#breadcrumb-mode").html(curlang.RelayMode);
			$("#breadcrumb-msg").html(curlang.WlanList);
			$("#help").css("display","none");
			getData_wificonnet();
			 Get_wifilist();
			NowMode=2;
		}
		if(Number==3){
			$(".page-index").css("display","none");
			$(".ssid-list").css("display","block");
			$("#breadcrumb-mode").html(curlang.WISP_Setup);
			$("#breadcrumb-msg").html(curlang.WlanList);
			$("#help").css("display","none");
			getData_wificonnet();
			 Get_wifilist();
			NowMode=3;			
		}
		if(Number==4){
			$(".page-index").css("display","none");
			$(".ssid-list").css("display","block");
			$("#breadcrumb-mode").html(curlang.ClientMode);
			$("#breadcrumb-msg").html(curlang.WlanList);
			$("#help").css("display","none");
			getData_wificonnet();
			 Get_wifilist();
			NowMode=4;			
		}
		if(Number==5){
			$(".page-index").css("display","none");
			$(".wlan-set").css("display","block");
			$("#floatWlan").css("display","block");
			$("#breadcrumb-mode").html(curlang.BridgeMode);
			$("#breadcrumb-msg").html(curlang.WIFISet);
			$("#help").css("display","none");
			Get_24gwifi_info();
			if(curVersion){
				$("#doubleWlan").css("display","block");
				Get_5gwifi_info();
			}
			NowMode=5;			
		}		
	}
	$("#help").click(function(){
		if(getMobile()){
			layer.open({
				  type: 1,
				  shade: false,
				  offset:'150px',
				  title: false, //不显示标题
				  area: '280px',
				  shift: 4 ,
				  content: $('#helpInfo')
				});			
		}else{
			layer.open({
			  type: 1,
			  shade: false,
			  offset:'150px',
			  title: false, //不显示标题
			  shift: 4 ,
			  content: $('#helpInfo')
			});
		}

	})
	$(".tab_area .tab_item").click(function(){
		var num=$(this).attr('id').replace('wan_type',"");
		$(this).addClass("on");
		$(this).siblings().removeClass("on");
		$("#wan_app"+num).css("display","block");
		$("#wan_app"+num).siblings().css("display","none");
	})
	$("#host").click(function(){
			$(".page-index").css("display","block");
			$(".wan-set").css("display","none");
			$(".wlan-set").css("display","none");
			$(".ssid-list").css("display","none");
			$(".login-set").css("display","none");
			$("#list_prev").css("display","");
			$("#wan_prev").css("display","");
			$("#breadcrumb-msg").css("display","none");
			$("#breadcrumb-mode").css("display","none");
			$("#help").css("display","block");
			NowMode=-1;			
	})
	$("#wan_prev").click(function(){
		if(NowMode==1){
			$(".page-index").css("display","block");
			$(".wan-set").css("display","none");
			$("#breadcrumb-msg").css("display","none");
			$("#breadcrumb-mode").css("display","none");
			$("#help").css("display","block");
			NowMode=-1;
		}
		if(NowMode==3){
			$(".wan-set").css("display","none");
			$(".ssid-list").css("display","block");	
			$("#breadcrumb-msg").html(curlang.WlanList);
			getData_wificonnet();
			 Get_wifilist();
		}
	})
	function checkWan(){
		var i;
		for(i=1;i<=3;i++){
			if($("#wan_type"+i).hasClass("on")){
				break;
			}
		}
		if(i==1){
			var User=CheckPPPOELogin($("#pppoeUser").val());
			if(!User){return false;}
			var Pass=CheckPPPOEPass($("#pppoePass").val());
			if(!Pass){return false;}
			
			var PPPOEMTU=CheckMTU($("#Spppoe_mtu").val());
			if(!PPPOEMTU){return false;}
			return true;
		}
		if(i==2){return true;}
		if(i==3){
			var ip=CheckIPaddress($("#staticIp").val());
			if(!ip){return false;}
			var msk=CheckMask($("#staticIp").val(),$("#staticMask").val());
			if(!msk){return false;}
			var gw=CheckGateway($("#staticGw").val());
			if(!gw){return false;}
			var dns=CheckDNS($("#staticDNS").val());
			if(!dns){return false;}				
			return true;			
		}
	}
	$("#wan_after").click(function(){
		if(NowMode==1 || NowMode==3){
			if(!checkWan()){return;}
			$(".wlan-set").css("display","block");
			$(".wan-set").css("display","none");
			$("#wlan_prev").css("display","inline-block");
			$("#floatWlan").css("display","block");
			$("#doubleWlan").css("display","none");
			$("#breadcrumb-msg").html(curlang.WIFISet);
			Get_24gwifi_info();
			if(curVersion){
				$("#doubleWlan").css("display","block");
				Get_5gwifi_info();
			}
		}
	})
	$("#wlan_prev").click(function(){
		if(NowMode==1 || NowMode==3){
			$(".wlan-set").css("display","none");
			$(".wan-set").css("display","block");
			$("#breadcrumb-msg").html(curlang.WanSet);
			Get_wan_info();
		}
		if(NowMode==2 ||　NowMode==4){
			$(".wlan-set").css("display","none");
			$(".ssid-list").css("display","block");	
			$("#breadcrumb-msg").html(curlang.WlanList);
			getData_wificonnet();
			Get_wifilist();
		}
		if(NowMode==5){
			$(".page-index").css("display","block");
			$(".wlan-set").css("display","none");
			$("#breadcrumb-msg").css("display","none");
			$("#breadcrumb-mode").css("display","none");
			$("#help").css("display","block");
			NowMode=-1;				
		}		
	})
	function checkWlan(){
		if(NowMode==4 && curVersion)
		{
			var twoName=CheckSSID($("#doubleWifiName").val());
			if(!twoName){return false;}
			var twoPass=CheckSSIDKey($("#doubleWifiPass").val());
			if(!twoPass){return false;}	
			return true;
		}else
		{
			var oneName=CheckSSID($("#floatWifiName").val());
			if(!oneName){return false;}
			var onePass=CheckSSIDKey($("#floatWifiPass").val());
			if(!onePass){return false;}
			if(curVersion){
				var twoName=CheckSSID($("#doubleWifiName").val());
				if(!twoName){return false;}
				var twoPass=CheckSSIDKey($("#doubleWifiPass").val());
				if(!twoPass){return false;}			
			}
			return true;
		}
	}
	$("#wlan_after").click(function(){
		if(NowMode==4 && !IsFirst){
			if(checkWlan())
			{
				setRouter();
			}
		}else{
			if(!checkWlan()){return false;}
			$(".wlan-set").css("display","none");
			$("#floatWlan").css("display","none");
			$("#doubleWlan").css("display","none");
			$(".login-set").css("display","block");
			$("#breadcrumb-msg").html(curlang.Admin);			
		}
	})
	$("#login_prev").click(function(){
		if(NowMode == 4)
		{
			if(curVersion)
			{
				$(".wlan-set").css("display","block");
				$(".login-set").css("display","none");
				$("#floatWlan").css("display","none");
				$("#doubleWlan").css("display","block");
				$("#breadcrumb-msg").html(curlang.WIFISet);
				Get_5gwifi_info();
			}
			else
			{
				$(".login-set").css("display","none");
				$(".ssid-list").css("display","block");	
				$("#breadcrumb-msg").html(curlang.WlanList);
				getData_wificonnet();
				Get_wifilist();
			}
		}
		else{
			$(".wlan-set").css("display","block");
			$(".login-set").css("display","none");
			$("#floatWlan").css("display","block");
			$("#doubleWlan").css("display","none");
			$("#breadcrumb-msg").html(curlang.WIFISet);
			Get_24gwifi_info();
			if(curVersion){
				$("#doubleWlan").css("display","block");
				Get_5gwifi_info();
			}
		}
	})
	function CheckPass(){
		var Pass=ManagePasswords($("#routerpwd").val());
		if(!Pass){return false;}
		return true;
	}
	$("#login_after").click(function(){
		if(!CheckPass()){return;}
        	showanimation(1);
        	showanimation(4);
		setRouter();
	})
	$("#list_after").click(function(){
		if($("#wlanPassRow").css("display")!="none"){
			var pass=CheckSSIDKey($("#wlanPass").val());
			if(!pass){return;}
		}
		if(NowMode==3){
			$(".ssid-list").css("display","none");
			$(".wan-set").css("display","block");
			$("#breadcrumb-msg").html(curlang.WanSet);
			Get_wan_info();
		}
		if(NowMode==2){
			$(".ssid-list").css("display","none");
			$(".wlan-set").css("display","block");
			$("#floatWlan").css("display","block");
			$("#doubleWlan").css("display","none");
			$("#breadcrumb-msg").html(curlang.WIFISet);
			Get_24gwifi_info();
			if(curVersion){
				$("#doubleWlan").css("display","block");
				Get_5gwifi_info();
			}
		}
		if(NowMode==4){
			if(IsFirst){
				if(curVersion){
					$(".wlan-set").css("display","block");
					$(".login-set").css("display","none");
					$("#floatWlan").css("display","none");
					$("#doubleWlan").css("display","block");
					$("#breadcrumb-msg").html(curlang.WIFISet);
					Get_5gwifi_info();
				}
				else
				{
					$(".ssid-list").css("display","none");
					$(".login-set").css("display","block");	
					$("#breadcrumb-msg").html(curlang.Admin);
				}				
			}else{
				$("#wlan_link").unbind();
			}
		}		
	})
	$("#list_prev").click(function(){
		if(NowMode>0){
			$(".page-index").css("display","block");
			$(".ssid-list").css("display","none");
			$("#breadcrumb-msg").css("display","none");
			$("#breadcrumb-mode").css("display","none");
			$("#help").css("display","block");
			NowMode=-1;
		}
	})
})