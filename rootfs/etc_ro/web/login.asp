<!doctype html>
<!--[if lt IE 7 ]>
<html class="ie6" lang="zh-cn"><![endif]-->
<!--[if IE 7 ]>
<html class="ie7" lang="zh-cn"><![endif]-->
<!--[if IE 8 ]>
<html class="ie8" lang="zh-cn"><![endif]-->
<!--[if IE 9 ]>
<html class="ie9" lang="zh-cn"><![endif]-->
<!--[if (gt IE 9)|!(IE)]><!-->
<html class="w3c"><!--<![endif]-->
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=0" />
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Cache-Control" content="no-cache">
	<meta http-equiv="expires" content="Wed, 26 Feb 1997 08:21:57 GMT"/>
    <title>B-LINK</title>
    <link type="text/css" href="css/login.css" rel="stylesheet"/>
	<script type="text/javascript" src="admin/js/jquery.min.js"></script>
	<script type="text/javascript" src="admin/js/jquery.cookie.js"></script>
    <script type="text/javascript" src="admin/js/new_lib.js"></script>
	<style>
	body{
	background: #0794d7 url("../admin/images/bd_bg.png") repeat scroll 0% 0%;
	}
	.logo{
	    margin-top: 12px;
	}
	#pwd_label{position: absolute;top: 58px;left: 100px;color: #999;}
	.button-area{padding-left: 8px;}
	.btn_login{background: rgb(0, 163, 222);}
	#user{width: 260px;}
	.langBtn{padding: 3px 7px;border-radius: 5px;background: #ffffff;color: #35a6ff;cursor:pointer;}
	.topbar{background: #0794d7 url('admin/images/bd_bg.png');}
	#loadingbox{
	margin:20% auto;
	height:160px;
	width:100px
	}
		@media screen and (max-width: 1000px) { /*当屏幕尺寸小于1000px时，应用下面的CSS样式*/
			.topbar{
			    background: none;
			    position: static;
			    height: 35px;
			}
			#lang_change{
				text-align: center;
				padding-top: 25px;
			}
			.topbar .logo{
			    float: none;
                width: 150px;
                margin: 50px auto 0;
			}
			.topbar .nav {
				float:right;
				margin-top:22px;
				line-height: 14px;
				font-size: 14px;
			}
			.login-area {
				width: 80%;
				margin: 35px auto 0;
				padding-top: 30px;
				background-color: #fff;
				padding-bottom: 10px;
                border-radius: 10px;
			}
			.login-area .slogan {
				margin: 0px auto 30px;
				font-size: 18px;
				line-height: 40px;
				text-align: center;
				color: #999;
			}
			.login-area .login{
				width:100%;
				text-align: center;
			}
			#lbl_login_pwd{
			    color:#999;
			    font-size: 13px;
                padding-right: 5px;
                float:none;
			}
			.topbar .container{
			    width:100%;
			    padding: 0;
			}
			.login-area .input-area .input-txt {
			    margin: 0px;
			    width:80%;
			    height: 36px;
			    font-size: 12px;
			    border-radius:16px;
			    color:#999;
			    padding:0 0 0 10px;
			    box-sizing: border-box;
			}
			.button-area{padding: 0px;}
			#lbl_login_pwd{display: none;}
			.login-area .button-area .btn_login {
				height: 38px;
				font-size: 20px;
				background: #428BEF none repeat scroll 0% 0%;
				color: #F5F6F8;
				width: 80%;
				text-align: center;
			    border: 0 none;
                border-radius: 16px;
                margin:0 auto;
			}
			#loadingbox{
			margin:35% auto;
			height:160px;
			width:100px
			}
			#user{width: 80%;}
			#pwd_label{position: absolute;top: 91px;left: 11%;color: #999;}
		}
		@media screen and (max-width: 320px) {
            #slogan {font-size: 16px;}
		}
        ::-ms-clear,::-ms-reveal{display:none;}
	</style>
	<script language=JavaScript>
	var lang={
		'en':{
			'B_Link':'B-LINK Router',
			'Select_Language':'Select Language',
			//'welcome_info':'Welcome to Use the REDLINE Router',
			'welcome_info':'Welcome to Use the LB-LINK Router',
			'wait':'Logging In',
			'system_info1':'Password cannot be empty.',
			'Router_Login':'Router Login',
			'username':'User Account',
			'Password':'Password',
			'Login':'Login',
			'system_info2':'Password is incorrect, please re-enter',
			'password_label':'Please enter the login password',
			'Cancel':'Cancel',
			'Apply': "Apply",
			'system_info3':'Password Error'
		},
		'tr':{
			'B_Link':'B-LINK Router',
			'Select_Language':'Dil Seç',
           // 'welcome_info':'REDLINE Router kullanımına Hoşgeldiniz',
			'welcome_info':'LB-LINK Router kullanımına Hoşgeldiniz',
            'wait':'Giriş Yapılıyor',
            'system_info1':'Şifre boş olamaz.',
			'Router_Login':'Router Girişi',
			'username':'Kullanıcı Hesabı',
            'Password':'Sifre',
            'Login':'Giris',
            'system_info2':'Şifre Hatalı, Lütfen Tekrar Girin',
            'password_label':'Lütfen şifrenizi girin',
			'Cancel':'İptal Et',
			'Apply':"Uygula",
            'system_info3':'Şifre Hatalı'
		},
		'ba':{
			'B_Link':'B-LINK Router',
			'Select_Language':'Izaberite jezik',
			//'welcome_info':'Dobro dosli u REDLINE Router',
			'welcome_info':'Dobro dosli u LB-LINK Router',
			'wait':'Prijavljivanje',
			'system_info1':'Lozinka ne može biti prazna.',
			'Router_Login':'Prijava',
			'username':'korisnički račun',
			'Password':'Lozinka',
			'Login':'Prijava',
			'system_info2':'Lozinka je netacna, ponovo unesite',
			'password_label':'Unesite lozinku za prijavu',
			'Cancel':'Otkazati',
			'Apply':"Primjeni",
			'system_info3':'Pogreška lozinke'
		},
		'de': {
			'B_Link': 'B-LINK Router',
			'Select_Language': 'Sprache auswählen',
			'welcome_info': 'Willkommen bei der Verwendung des LB-LINK Routers',
			'wait': 'Einloggen',
			'system_info1': 'Passwort darf nicht leer sein.',
			'Router_Login': 'Router Login',
			'username':'Benutzerkonto',
			'Password': 'Passwort',
			'Login': 'Einloggen',
			'system_info2': 'Passwort ist falsch, bitte erneut eingeben',
			'password_label': 'Bitte geben Sie das Login-Passwort ein',
			'Cancel': 'Abbrechen',
			'Apply': "Übernehmen",
			'system_info3': 'Passwortfehler'
		},
		'ar':{
			'B_Link':'B-LINK Router',
			'Select_Language':'إختيار اللغة',
			'welcome_info':'اهلا بمستخدمين روتر لبي لينك',
			'wait':'تسجيل الدخول',
			'system_info1':'لا تترك كلمة السر فارغة',
			'Router_Login':'مدخل الروتر',
			'username':'حساب المستخدم',
			'Password':'كلمة السر',
			'Login':'دخول',
			'system_info2':'كلمة السر خاطئ,يرجى إعادة كتابته',
			'password_label':'يرجى ادخال كلمة السر',
			'Cancel':'إلغاء',
			'Apply':"تطبيق",
			'system_info3':'كلمة السر خطأ'
		},
		'fr':{
			'B_Link':'B-LINK Routeur',
			'Select_Language':'Choisir langue',
			//'welcome_info':'Bienvenue dans l’utilisation du routeur REDLINE',
			'welcome_info':'Bienvenue dans l’utilisation du routeur LB-LINK',
			'wait':'Se connecter',
			'system_info1':'Le mot de passe ne peut être vide.',
			'Router_Login':'Connexion au routeur',
			"username":"d'utilisateur",
			'Password':'Mot de passe',
			'Login':"S'identifier",
			'system_info2':'Le mot de passe est incorrect, veuillez ré-entrer',
			'password_label':"S'il vous plaît entrer le mot de passe de connexion",
			'Cancel':'Annuler',
			'Apply':"Appliquer",
			'system_info3':'Erreur de mot de passe'
		}
	}
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
    var mob = 0;
    if (browser.versions.mobile || browser.versions.android || browser.versions.iPhone) {
        mob = 1;
    }
    return mob;
}
var getLanguage,languagetype,langClass;
function getLangs(){
	$.ajax({
		type: 'get',
		url: '/goform/http_get_weblanguage_info',
		data: {},
		dataType:"json", 
		success: function(data) {
			if((typeof data)=='object'){
				var msg=data;
			}else{
				var msg=eval('('+data+')');
            }
            getLanguage=msg.setflag
            $("#System_lang").val(msg.languagetype);
			languagetype=msg.languagetype;

			if(languagetype=="en"){
				langClass=lang.en
			}else if(languagetype=="ba"){
				langClass=lang.ba
			}else if(languagetype=="tr"){
				langClass=lang.tr
			}else if(languagetype=="de"){
				langClass=lang.de
			}else if(languagetype=="fr"){
				langClass=lang.fr
			}else{
				langClass=lang.ar
			}
			document.title=langClass.B_Link; 
			//$('#logo_img').attr('src','admin/images/redline.png');
			$('#logo_img').attr('src','admin/images/logo.png');
			$("#slogan").html(langClass.welcome_info);
			$("#lbl_login_pwd").html(langClass.Password);
			$("#lbl_login_user").html(langClass.username);
			$("#loginin").val(langClass.Login);
			$("#waitTips").html(langClass.wait);
			$(".langBtn").html(langClass.Apply);
			$('#pwd_label').html(langClass.password_label);
		},
		error:function(data){
		}
	})
}
function setLangs(){
    $("#lock_div").css("display","block");
    $("#waitTips").css("display","none");
	$.ajax({
		type: 'post',
		url: '/goform/http_set_weblanguage_info',
		data: {"type":"setweblanguage","languagetype":$("#System_lang").val(),"setflag":1},
		dataType:"json", 
		success: function(data) {
			
			window.location.reload();
		},
		error:function(data){
		}
	})
}

function gologin(f)
{
	if(languagetype=='zhcn'){
		if(f.pass.value == "")
		{
			alert(langClass.system_info1);
			return;
		}	
	}else{
		if(f.pass.value == "")
		{
			alert(langClass.system_info1);
			return;
		}		
	}
	if($("#user").val() == ""){
		
	}
	$.cookie('user',$("#user").val(), { path: '/'});
	f.submit();
	$("#lock_div").css("display","block");
	$("#waitTips").css("display","block");
	geturl()
} 
function geturl(){
	var plath=window.location.search;
	if(plath==""){
		return;
	}
	var buf=plath.split("?");
	if(buf.length>1){
	/*	if(languagetype=='zhcn'){
			alert(langClass.system_info3);
		}else{
			alert(langClass.system_info3);
		}*/
		window.location="login.asp";
	}else{
		return;
	}		
}

window.onload = function ()
{
	getLangs()
	$("#login_pwd").focus();
	if(getMobile()==1){
		$("#platform").val("1");
		$.cookie('platform','1', { path: '/'});
	}else{
		$.cookie('platform','0', { path: '/'});
	}
	setTimeout(function(){geturl()},150)
}

function keydown(evt)
{
	var keyCode = evt.keyCode ? evt.keyCode : evt.which ? evt.which : evt.charCode;
	if (keyCode==13) 
	{
		gologin(document.forms[0]);
	}
}
</script>	
</head>
<body onKeyDown="keydown(event)" >
<div class="topbar">
    <div class="container">
        <div class="logo">
            <img id="logo_img" width="166"/>
        </div>
    </div>
</div>
<div id="lang_change" class="lang">
	<select name="system_lang" id="System_lang" style="height: 24px;border:0px;">
		<option id="lang_en" value="en">English</option> 
		<option id="lang_zh" value="de">Deutsch</option>
		<option id="lang_zh" value="fr">Français</option>
		<option id="lang_zh" value="tr">Türkçe</option>
		<option id="lang_zh" value="ba">Bosanski,Hrvatski</option>
		<option id="lang_zh" value="ar">العربية</option>
	</select>
	<span class="langBtn"></span>
</div>
<div id="login_area" class="login-area">
    <div class="slogan" id="slogan"></div>
    <div id="login" class="login">
        <form id="login_frm" name="loginin" action="/login/auth" method="post">
			<input type="hidden" name="platform" value="0" id="platform"/>
            <div class="input-area clearfix">
			 	<span id="lbl_login_user" class="input-label">User Name</span>
				<select id="user" name="user" class="input-txt" style="margin-bottom: 10px;height:38px;">
					<option value="admin">admin</option>
					<option value="superadmin">superadmin</option>
				</select><span id="lbl_login_pwd" class="input-label"></span>
                <label for="login_pwd" id="pwd_label"></label>
                <input id="login_pwd" name="pass" maxlength="64" type="password" class="input-txt" />
                <input type="text" value="LoginFlag" style="display:none;">
            </div>
            <div class="button-area">
                <input type="button" style="background: #0794d7;" class="btn_login"  name="loginin" onClick="gologin(this.form)" id="loginin"/>
            </div>
        </form>
    </div>
	<div id="login_info" class="pass-info"></div>
    <div id="login_router"></div>
</div>
<div id="lock_div" style="display: none;">
	<div id="loadingbox">
		<div style="width:100%;float:left;">
			<img src="admin/images/loading.gif" style="width:90px;height:90px;float:left;margin:0 auto;"></img>
		</div>
		<h2 id="waitTips" style="color:#fff;float:left;font-size:15px;text-align:center;width:100%">...</h2>
	</div>
</div>
<script>

$(function() {
  $("#login_pwd").focus(function() {
      $("#pwd_label").css("display","none");
  });
  $("#login_pwd").blur(function() {
    if($("#login_pwd").val()===""){
        $("#pwd_label").css("display","block");
    }else{
        $("#pwd_label").css("display","none");
    }
  });
  $("#pwd_label").click(function() {
        $("#pwd_label").css("display","none");
  })
  $(".langBtn").click(function(){
	setLangs()
  })
})
</script>
</body>
</html>
