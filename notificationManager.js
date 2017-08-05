var moment = require('moment');
var format = require('string-format');
const _DATEFORMAT = "YYYY-MM-DD HH:mm:s";
function sendMessage(message)
{
    console.log(format('{0}: {1}, original time:{2}',moment()
    .format(_DATEFORMAT),message.message,moment(message.timestamp * 1000)
    .format(_DATEFORMAT)));
}
exports.sendMessage = sendMessage;