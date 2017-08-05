var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var controller = require('./controller');
var moment = require('moment');
var notificationManager = require('./notificationManager');
controller.init();
app.use(bodyParser.json());
app.post('/echoAtTime', function (req, res) {
    var message = {}
    try {
        message.timestamp = moment(req.body.time).utc().unix();
        message.message = req.body.message;

        //if the message is earlier then now print it 
        if (message.timestamp <= moment().utc().unix()) {
            notificationManager.sendMessage(message);
        } else {
            //store the message
            controller.setMessage(message);
        }

        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(res.statusCode);
    }

});
app.listen(1977, function () {
    console.log('http://localhost:1977/echoAtTime');
})