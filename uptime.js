module.exports = uptime;

uptimed = require('uptimed');


function uptime() {

    var hours,days,minutes,seconds;
    var data = {};
    seconds= Math.round(uptimed.getUptime());
    days = parseInt(seconds / 86400);
    hours = parseInt((seconds % 86400) / 3600);
    minutes = parseInt((seconds % 3600) / 60);
    seconds =  seconds % 60;
    console.log('Uptime Days:'+days+' Hours:'+hours+' Min:'+minutes+' Sec:'+seconds);
}