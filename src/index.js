var rx = require('rx');
var NodeCache = require("node-cache");

var cache = new NodeCache({ stdTTL: 60, checkperiod: 60 });

var index = function(event) {
	cache.set(event.host + event.service, event, event.ttl, function(err, success) {
  		if(!err && success) {
    		console.log("added event " + event);
  		}
	});
}

var expiredEvents = rx.Observable.fromEvent(cache, 'expired', function(args) {
	return args[1];
}).map(function(value) {
	value.state = "expired";
	return value;
});

exports.index = index;
exports.expiredEvents = expiredEvents;