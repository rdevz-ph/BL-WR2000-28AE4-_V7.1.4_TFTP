/**********************************/
/*********  Writer=LiuWei  ********/
/**********************************/
//检查是否含有中文字符
function CheckChinese(str_val){
	var re = /[\u4e00-\u9fa5]/;
	var cha=/[！￥（）——？；。，》《【】、]/;
	if(re.test(str_val) || cha.test(str_val)) 
		return true; //含有中文字符
	else
		return false;
}
/**********************************/
//检查是否含有空格字符
function CheckSpace(str_val){
	var re = /\s/g;
	if(re.exec(str_val))
		return true;//含有空格
	else
		return false;
}
/**********************************/
//计算字符长度
function getStrLength(buff) {
    var realLength = 0, charCode = -1;
	var  len = buff.length;
    for (var i = 0; i < len; i++) {
        charCode = buff.charCodeAt(i);
        if (charCode > 0 && charCode <= 128) {
            realLength += 1;
        } else {
            realLength += 3;
        }
    }
    return realLength;
}
//IP去零
function clearZERO(str){
	if(str==""){
		return;
	}
	var buff="";
	var ip=str.split(".");
	for(var i=0;i<ip.length;i++){
		ip[i]=parseInt(ip[i]);
	}
	for(var i=0;i<ip.length;i++){
		if(i==(ip.length-1)){
		buff=buff+ip[i];		
		}else{
		buff=buff+ip[i]+".";
		}
	}
	return buff;
}
//根据用户输入IP推荐子网掩码
function GetkMask(IP_val){	
	var ip = new Array();
	var Mask_val;
	ip=IP_val.split(".");
	if(IP_val.length < 7 || IP_val.length > 15 || ip.length!=4){
		Mask_val="";
		return Mask_val;
	}
	if(parseInt(ip[0]) >= 1 && parseInt(ip[0]) <= 126){
		Mask_val= "255.0.0.0";
		return Mask_val;
	}
	if(parseInt(ip[0]) >= 128 && parseInt(ip[0]) <= 191){
		Mask_val = "255.255.0.0";
		return Mask_val;
	}
	if(parseInt(ip[0]) >= 192 && parseInt(ip[0]) <= 223){
		Mask_val= "255.255.255.0";
		return Mask_val;
	}
	Mask_val="";
	return Mask_val;
}
/***********************************/
//管理密码判断
function  ManagePasswords(Pass_val){
	if(Pass_val==""){
		layer.msg(curlang.AdminPass_NULL, {icon: 5});
		return false;//管理密码为空
	}
	if(CheckChinese(Pass_val)){
		layer.msg(curlang.AdminPass_CH, {icon: 5});
		return false;//管理密码包含中文字符
	}
	if(Pass_val.length>64 || Pass_val.length<8){
		layer.msg(curlang.AdminPass_Length, {icon: 5});
		return false;//管理密码长度
	}
	return true;
}
/*if(!LoginUser(string))
alert(_("Username and Password can not be empty."));//for linux
alert("Username and Password can not be empty.");//for ecos*/
/**********************************/
//检查IP地址，根据相应的返回值做判断给出提示信息
function CheckIPaddress(IP_val){
	var temp,i;
	var ip = new Array();
	var reg = /[^0-9]/;
	if(IP_val==""){
		layer.msg(curlang.IP_NULL, {icon: 5});
		return false;
	}//IP为空
	if(CheckChinese(IP_val)){
		layer.msg(curlang.IP_Illicit, {icon: 5});
		return false;
	}//IP有中文字符
	if(IP_val.length < 7 || IP_val.length > 15){
		layer.msg(curlang.IP_Error, {icon: 5});
		return false;
	}
	ip=IP_val.split(".");
	if(ip.length != 4){
		layer.msg(curlang.IP_Error, {icon: 5});
		return false;
	}
	if(parseInt(ip[0])==0 || parseInt(ip[0])==224 || parseInt(ip[0]) ==225 || parseInt(ip[3])==0 || parseInt(ip[3])==255 || (parseInt(ip[0])==127 && parseInt(ip[3])==127)){
		layer.msg(curlang.IP_Illicit, {icon: 5});
		return false;	
	}
	for(i=0;i<4;i++){
		if(reg.test(ip[i]) || ip[i] == "" || ip[i].length > 3 || parseInt(ip[i])> 255){
			layer.msg(curlang.IP_Illicit, {icon: 5});
			return false;
		}
	}
	return true;
}
/**********************************/
//检查子网掩码，根据相应的返回值做判断给出提示信息
function CheckMask(IP_val,Mask_val){
	var reg = /[^0-9]/;
    var exp=/^(254|252|248|240|224|192|128)\.0\.0\.0|255\.(254|252|248|240|224|192|128|0)\.0\.0|255\.255\.(254|252|248|240|224|192|128|0)\.0|255\.255\.255\.(254|252|248|240|224|192|128|0)$/;
	var Flag=false;
	var Mask = new Array();
	var temp=0;
	var ip=IP_val.split(".");
	Mask=Mask_val.split(".");
	if(Mask_val==""){
		layer.msg(curlang.Subnet_NULL, {icon: 5});
		return false;
	}
	if(CheckChinese(Mask_val)){
		layer.msg(curlang.Subnet_Illicit, {icon: 5});
		return false;
	}
	if(Mask_val.length < 7 || Mask_val.length > 15){
		layer.msg(curlang.Subnet_Error, {icon: 5});
		return false;
	}
	if(Mask.length != 4){
		layer.msg(curlang.Subnet_Error, {icon: 5});
		return false;
	}
	if(!(exp.test(Mask_val))){
		layer.msg(curlang.Subnet_Illicit, {icon: 5});
		return false;		
	}
	for(i=0;i<4;i++){
		if(reg.test(Mask[i]) || Mask[i].length > 3 || Mask[i] == ""){
			layer.msg(curlang.Subnet_Illicit, {icon: 5});
			return false;
		}
	}
	return true;
}
/**********************************/
//检查默认网关，根据相应的返回值做判断给出提示信息
function CheckGateway(Gateway_val){
	var temp,i;
	var ip = new Array();
	var reg = /[^0-9]/;
	if(Gateway_val==""){
		layer.msg(curlang.GateWay_NULL,{icon: 5});
		return false;
	}//IP为空
	if(CheckChinese(Gateway_val)){
		layer.msg(curlang.GateWay_Illicit,{icon: 5});
		return false;
	}//IP有中文字符
	if(Gateway_val.length < 7 || Gateway_val.length > 15){
		layer.msg(curlang.GateWay_Error,{icon: 5});
		return false;
	}
	ip=Gateway_val.split(".");
	if(ip.length != 4){
		layer.msg(curlang.GateWay_Error,{icon: 5});
		return false;
	}
	if(parseInt(ip[0])==0 || parseInt(ip[0])==224 || parseInt(ip[0]) ==225 || parseInt(ip[3])==0 || parseInt(ip[3])==255 || (parseInt(ip[0])==127 && parseInt(ip[3])==127)){
		layer.msg(curlang.GateWay_Illicit,{icon: 5});
		return false;	
	}
	for(i=0;i<4;i++){
		if(reg.test(ip[i]) || ip[i] == "" || ip[i].length > 3 || parseInt(ip[i])> 255){
			layer.msg(curlang.GateWay_Illicit,{icon: 5});
			return false;
		}
	}
	return true;
}
/**********************************/
//检查DNS，根据相应的返回值做判断给出提示信息
function CheckDNS(DNS_val){
	var temp,i;
	var ip = new Array();
	var reg = /[^0-9]/;
	if(DNS_val==""){
		layer.msg(curlang.DNS_Null, {icon: 5});
		return false;		
	}
	if(CheckChinese(DNS_val)){
		layer.msg(curlang.DNS_Illicit, {icon: 5});
		return false;		
	}
	if(DNS_val.length < 7 || DNS_val.length > 15){
		layer.msg(curlang.DNS_Error, {icon: 5});
		return false;
	}
	ip=DNS_val.split(".");
	if(ip.length != 4){
		layer.msg(curlang.DNS_Error, {icon: 5});
		return false;
	}
	if(parseInt(ip[0])==0){
		layer.msg(curlang.DNS_Illicit, {icon: 5});
		return false;
	}
	for(i=0;i<4;i++){
		if(reg.test(ip[i]) || ip[i] == "" || ip[i].length > 3 || parseInt(ip[i]) > 255){
			layer.msg(curlang.DNS_Illicit, {icon: 5});
			return false;
		}
	}
	return true;
}
/**********************************/
//检查pppoe账号
function CheckPPPOELogin(admin){
	if(admin==""){
		layer.msg(curlang.Account_NULL, {icon: 5});
		return false;
	}
	return true;
}
function CheckPPPOEPass(pass){
	if(pass==""){
		layer.msg(curlang.DialPass_NULL, {icon: 5});
		return false;
	}
	if(CheckChinese(pass)){
		layer.msg(curlang.DialPass_CH, {icon: 5});
		return false;
	}
	return true;
}
/**********************************/
//检查MAC合法性
function CheckMAC(MAC_val){
	var i;
	var re = /[^0-9a-fA-F]/;
	var mac = new Array();
	mac = MAC_val.split(":");
	if(mac.length != 6){
		layer.msg(curlang.MAC_Illicit, {icon: 5});
		return false;
	}
	for(i=0;i<6;i++){
		if(re.test(mac[i]) || mac[i] == ""   || mac[i].length != 2 ){
			layer.msg(curlang.MAC_Error, {icon: 5});
			return false;
		}
	}
	if(MAC_val.length != 17){
		layer.msg(curlang.MAC_Illicit, {icon: 5});
		return false;
	}
	if(MAC_val.toLowerCase() == "ff:ff:ff:ff:ff:ff" || MAC_val.toLowerCase() == "00:00:00:00:00:00"){
		layer.msg(curlang.MAC_length, {icon: 5});
		return false;
	}
	if(mac[5].toLowerCase() == "00" || mac[1].toLowerCase() == "ff"){
		layer.msg(curlang.MAC_length, {icon: 5});
		return false;
	}
	return true;
}
/**********************************/
//检查无线密码(wpawpa2)
function CheckSSIDKey(key_val){
	if(key_val==""){
		layer.msg(curlang.WIFIPass_NULL, {icon: 5});
		return false;
	}
	if(CheckChinese(key_val)){
		layer.msg(curlang.WIFIPass_CH, {icon: 5});
		return false;
	}
	if(getStrLength(key_val) < 8){
		layer.msg(curlang.WIFIPass_Smaller, {icon: 5});
		return false;
	}
	if(getStrLength(key_val) > 64){
		layer.msg(curlang.WIFIPass_Over, {icon: 5});
		return false;
	}
	return true;
}
/**********************************/
//检查无线ssid
function CheckSSID(ssid_val){
	if(ssid_val==""){
		layer.msg(curlang.SSID_NULL, {icon: 5});
		return false;
	}
	if(getStrLength(ssid_val) > 32){
		layer.msg(curlang.SSID_Length, {icon: 5});
		return false;
	}
	return true;
}
//检查别名
function CheckAlias(Alias){
	var reg =/^[a-zA-Z0-9_\u4e00-\u9fa5_-]+$/;
	if(Alias==""){
		layer.msg(curlang.Alias_NULL, {icon: 5});
		return false;
	}
	if(!reg.test(Alias)){
		layer.msg(curlang.Alias_Error, {icon: 5});
		return false;
	}
	if(getStrLength(Alias) > 18){
		layer.msg(curlang.Alias_Over, {icon: 5});
		return false;
	}
	return true;
}
//qos检查
function CheckQos(Value){
	var reg = /[^0-9]/;
	if(Value.toString()==""){
		layer.msg(curlang.Enter_NULL, {icon: 5});
		return false;
	}
	if(reg.test(Value)){
		layer.msg(curlang.QOS_Error, {icon: 5});
		return false;
	}
	if(Value.length>5){
		layer.msg(curlang.QOS_Over, {icon: 5});
		return false;
	}
	return true;
}
/**********************************/
//端口号检查
function CheckPort(number){
	var reg = /[^0-9]/;
	if(number==""){
		layer.msg(curlang.Enter_NULL, {icon: 5});
		return false;
	}
	if(reg.test(number)){
		layer.msg(curlang.Port_Error, {icon: 5});
		return false;
	}
	if(parseInt(number)>65535 || parseInt(number)<1){
		layer.msg(curlang.Port_Scope, {icon: 5});
		return false;
	}
	return true;
}
/**********************************/
//MTU检查
function CheckMTU(number){
	var reg = /[^0-9]/;
	if(number==""){
		layer.msg(curlang.Enter_NULL, {icon: 5});
		return false;
	}
	if(reg.test(number)){
		layer.msg(curlang.MTU_Error, {icon: 5});
		return false;
	}
	if(parseInt(number)>65535 || parseInt(number)<576){
		layer.msg(curlang.MTU_Scope, {icon: 5});
		return false;
	}
	return true;
}

//域名检查
function IsURL(urlString)
		{
		/*var regExp = /^((https?|ftp|news):\/\/)?([a-z]([a-z0-9\-]*[\.。])+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel)|(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&]*)?)?(#[a-z][a-z0-9_]*)?$/;
		if (urlString.match(regExp))
		{      
			return true; 
		}else{
			layer.msg(curlang.Domain_Error, {icon: 5});
			return false;  
		}  */
	if(urlString.length>128){
		layer.msg(curlang.Domain_Error, {icon: 5});
		return false; 
	}else{
		return true;
	}
	
}

