module.exports = uptimes;

var uptimed = require('uptimed');
os = require('os');

function uptimes() {

    var hours,days,minutes,seconds;
    seconds= Math.round(uptimed.getUptime());
    days = parseInt(seconds / 86400);
    hours = parseInt((seconds % 86400) / 3600);
    minutes = parseInt((seconds % 3600) / 60);
    seconds =  seconds % 60;
    console.log('uptime days:'+days+' hours:'+hours);//+' min:'+minutes+' sec:'+seconds);
}