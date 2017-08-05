var Redis = require('ioredis');
var shortid = require('shortid');
var config = require('./config');
var notificationManager = require('./notificationManager');
var redis = new Redis(config.redis);
var redisSubscriber = new Redis(config.redis);
var stream;
const EVENT_EXPRIRED = '__keyevent@0__:expired';
const _SUB = '_sub_';
const _MESSAGE = '_message_';

function init() {
    //subscribe to pmessage on expired
    redisSubscriber.psubscribe(EVENT_EXPRIRED, function (err, count) {
        if (err)
            console.log(err);
    });
    //the _SUB key is expired and deleted by redis, then I get the value with the same key and _message prefix
    //and notify the message
    //the multi command ensure an atomic action for the get and delete right after.
    redisSubscriber.on('pmessage', function (pattern, channel, message) {
        var key = message.replace(_SUB, _MESSAGE);
        redis.multi().get((key)).del(key).exec(function (err, result) {
            if (result[0][1]) {
                var message = JSON.parse(result[0][1])
                notificationManager.sendMessage(message);
            }
        });
    });

    stream = redis.scanStream({
        match: _MESSAGE + '*'
    });

    //this happens once when we first up, the porpose is to get all _message keys that doesn't have _SUB key
    //Which means that they are ready to be notify, probably because no subscriber was up when redis fired the pub/sub event
    stream.on('data', function (resultKeys) {
        resultKeys.forEach(key => {
            var subKey = key.replace(_MESSAGE, _SUB);
            redis.get(subKey).then(function (value) {
                if (!value) {
                    redis.multi().get((key)).del(key).exec(function (err, result) {
                        if (result[0][1]) {
                            var message = JSON.parse(result[0][1])
                            notificationManager.sendMessage(message);
                        }
                    });
                }
            });
        });
    });

}

//store in 2 diffrent hashmaps, _message has the message data object, _SUB is just a key with expiration date
function setMessage(message) {
    try {
        var key = shortid.generate();
        redis.multi()
            .set(_MESSAGE + key, JSON.stringify(message))
            .set(_SUB + key, 0)
            .expireat(_SUB + key, message.timestamp)
            .exec();
    } catch (err) {
        console.log(err);
    }
}

exports.init = init;
exports.setMessage = setMessage;