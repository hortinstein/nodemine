
var config = require('./.config.json');
var printUptime = require('./uptime.js');
var request = require('request');
var terminal = require('color-terminal');
var mtgox    = require('mtgox-orderbook');

var btcGuild={};
var goxData = {};
var rateData = {};
////////////////////////////////////////////////////////
mtgox.on('ticker', function(ticker){
	//goxData.high = ticker.high.display_short;
	//goxData.low = ticker.low.display_short;
	goxData.last = ticker.last.display_short;
	goxData.last_num = ticker.last.value;
});
mtgox.connect('usd');

////////////////////////////////////////////////////////

var clear = function () {
	console.log('\033c');
};
////////////////////////////////////////////////////////

var calcRate = function	(hashrate) {
	var url = 'http://www.alloscomp.com/bitcoin/calculator/json?hashrate='+(hashrate*1000000);
	request({url:url}, function (error, response, body) {
		body = JSON.parse(body);
        rateData.coins_per_day = (body.coins_per_hour * 24).toFixed(6);
        rateData.dollars_per_day = '$'+(rateData.coins_per_day * goxData.last_num).toFixed(2);
		rateData.total_earned = '$'+(goxData.last_num * btcGuild.total).toFixed(2);
	});

};
////////////////////////////////////////////////////////
var btcGUpdate = function (apiKey) {
	var url = "https://www.btcguild.com/api.php?api_key="+config.apiKey;
	request({url:url, json:true}, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            btcGuild.total = body.user.total_rewards;
            btcGuild['24h'] = body.user.past_24h_rewards;
            btcGuild.difficulty = body.pool.difficulty;
            try{
                btcGuild.worker = body.workers[1].hash_rate;	
                calcRate(btcGuild.worker);
    
            } catch (e){
                btcGuild.worker = "DOWN";
            }
        }
	});
};

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
setInterval(btcGUpdate,16000);
setInterval(refresh,10000);
