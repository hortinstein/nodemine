
var config = require('./.config.json');
var uptimed = require('uptimed');
os = require('os');
var request = require('request');
var terminal = require('color-terminal');
var mtgox    = require('mtgox-orderbook');

var btcGuild={};
var goxData = {};
var rateData = {};
var minerLog = {};
var uptime=0;

var SEC = 1000;
var MIN = 60 * SEC;
var HOUR = 60 * MIN;
var DAY = 24 * HOUR;

function printUptime() {
    var hours,days,minutes,seconds;
    //storing complete json to sync to log
	minerLog.uptimeSeconds = Math.round(uptimed.getUptime());
	//
    seconds= Math.round(uptimed.getUptime());
    days = parseInt(seconds / 86400);
    hours = parseInt((seconds % 86400) / 3600);
    minutes = parseInt((seconds % 3600) / 60);
    seconds =  seconds % 60;
    console.log('uptime days:'+days+' hours:'+hours);//+' min:'+minutes+' sec:'+seconds);
}

////////////////////////////////////////////////////////
//Function that is responsible for updating the gox price
//
var setupTicker = function (){
	mtgox.on('ticker', function(ticker){
		minerLog.goxData = ticker;
		goxData.high = ticker.high.display_short;
		goxData.low = ticker.low.display_short;
		goxData.last = ticker.last.display_short;
		goxData.last_num = ticker.last.value;
	});
	mtgox.connect('usd');	
	mtgox.on('disconnect', function(){
		mtgox.connect('usd');	
	});	
} 

////////////////////////////////////////////////////////
//Function used to clear the screen, niaive way to update
//
var clear = function () {
	console.log('\033c');
};

////////////////////////////////////////////////////////
//Function that calculates the rates based on API data, called by btcGuild update 
//
var calcRate = function	(hashrate) {
	var url = 'http://www.alloscomp.com/bitcoin/calculator/json?hashrate='+(hashrate*1000000);
	request({url:url}, function (error, response, body) {
		try{
			body = JSON.parse(body);
			//storing complete json to sync to log
			minerLog.rate = body;
			//
	        rateData.coins_per_day = (body.coins_per_hour * 24).toFixed(6);
	        rateData.dollars_per_day = '$'+(rateData.coins_per_day * goxData.last_num).toFixed(2);
			rateData.total_earned = '$'+(goxData.last_num * btcGuild.total).toFixed(2);
			//storing complete json to sync to log
			minerLog.rateData = rateData;	
			//
		} catch (e) {
			rateData = {"ERROR":"error parsing alloscomp json"};

		}
		
	});

};

////////////////////////////////////////////////////////
//Pulls information from BTC API
//
var btcGUpdate = function (apiKey) {
	var url = "https://www.btcguild.com/api.php?api_key="+config.api_key;
	request({url:url, json:true}, function (error, response, body) {
        if (!error && response.statusCode == 200) {
        	//storing complete json to sync to log
			minerLog.btcGuild = body;
        	//
            try{
                btcGuild.total = body.user.total_rewards;
                btcGuild['24h'] = body.user.past_24h_rewards;
                btcGuild.difficulty = body.pool.difficulty;
            } catch (e){
                btcGuild = {"ERROR":"error parsing btcguild json"};
            }
            try{
                btcGuild.worker = body.workers[1].hash_rate;	
                calcRate(btcGuild.worker);
    
            } catch (e){
                btcGuild.worker = "miner DOWN";
            }
        }
	});
};


////////////////////////////////////////////////////////
//Function that pushes to iris couch used for logging
//
var pushLog = function (){
	a = new Date();
	minerLog.timestamp = JSON.stringify(a);
    var couch_host = config.couch_host;
    var nano = require('nano')(config.couch_host)
      
    var db = nano.db.use(config.couch_db_name);

    db.insert(minerLog, (new Date).getTime(), function(e, body){
		if (e) { 
			console.log('ERROR LOGGING: '+e);
		} else {
			console.log("logged successfully");
        }
    });
}

////////////////////////////////////////////////////////
var refresh = function (){
	clear();
	//terminal.colorize('%1');
	console.log('kintaro miner');
	printUptime();
	//terminal.colorize('%2');
	console.log('rate: '+btcGuild.worker+' MH/S');
	console.log('earning: '+rateData.coins_per_day+' BTC/day');
	console.log('earned: '+btcGuild.total+' BTC');
	//terminal.colorize('%3');
	console.log('---------------------------');
	console.log("price per coin: "+ goxData.last);
	//terminal.colorize('%0');
	             
	console.log(rateData.dollars_per_day+"/day, "+rateData.total_earned+" total");
};
////////////////////////////////////////////////////////
setupTicker();
refresh();
btcGUpdate();
setInterval(setupTicker,10*MIN);
setInterval(btcGUpdate,45*SEC);
setInterval(refresh,10*SEC);
setInterval(pushLog,5*MIN);//logs every five min
