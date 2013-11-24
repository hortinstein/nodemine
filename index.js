prettyseconds = require('pretty-seconds');
uptime = require('./uptime.js');
os = require('os');


clear = function () {
	console.log('\033c')

}

refresh = function (){
	clear();
	console.log(prettyseconds(uptime()));
	
	setInterval(refresh,1000)
	
}
refresh();
