var Request = require("./Request.js");

function RequestManager(reply) {
    this.reply = reply;
    this.openRequests = new Map();
    this.handlers = new Map();
}

RequestManager.WILDCARD = '*';
RequestManager.ERR_INT_HANDLER = 'internal handler error';
RequestManager.ERR_NO_HANDLER = 'no handler for: ';
RequestManager.ERR_TIMEOUT = 'timeout';

RequestManager.prototype.removeRequest = function(id) {
    this.openRequests.delete(id);
};

RequestManager.prototype.getHandler = function(a) {
    if (this.handlers.has(a)) {
        return this.handlers.get(a);
    }
    if (this.handlers.has(RequestManager.WILDCARD)) {
        return this.handlers.get(RequestManager.WILDCARD);
    }
    return null;
};

RequestManager.prototype.handleRequest = function(data) {
    if (typeof data.t === "undefined" || typeof data.id === "undefined") {
        throw new Error("Malformed data: "+JSON.stringify(data));
    }
    //console.log("handle",data);
    var reply = this.reply;
    var r = this.openRequests.get(data.id);
    switch(data.t) {
        case 1:     //is an answer
            if (!r) return; //not made by us
            r.finish(data);
        break;

        case 0:     //is a request
            if (r) return;  //we created this request ourselves
            var handler = this.getHandler(data.action);
            var answer = {
                t : 1,
                id : data.id
            };
            if (!handler) {
                answer.error = {
                    error : RequestManager.ERR_NO_HANDLER,
                    action : data.action
                };
                reply(answer);
            } else {
                //@TODO: check if already in progress to handle
                var p = handler(data.data, data.action);
                if (!(p && p.constructor && p.constructor.name === 'Promise')) {
                    answer.error = {
                        error : RequestManager.ERR_INT_HANDLER,
                        action : data.action
                    };
                    reply(answer);
                    return;
                }
                p.then(function(data){
                    answer.data = data;
                    reply(answer);
                },function(err){
                    answer.error = err;
                    reply(answer);
                });
            }
        break;

        case 2:     //this is an event, there will be no response
            var handler = this.getHandler(data.e);
            if (handler) {
                handler(data.d, data.e);
            }
        break;
    }
};

RequestManager.prototype.handle = RequestManager.prototype.handleRequest;

RequestManager.prototype.createRequest = function(action, data, timeout) {
    if (action === RequestManager.WILDCARD) {
        throw new Error("Reserved as wildcard: '"+RequestManager.WILDCARD+"'");
    }
    var r = new Request(this, action, data);
    var ths = this;
    if (timeout) {
        setTimeout(function(){
            r.reject({
                error : RequestManager.ERR_TIMEOUT,
                action : action
            });
            ths.removeRequest(r.id);
        },timeout);
    }
    return r.promise;
};

RequestManager.prototype.emitEvent = function(evt, data) {
    if (evt === RequestManager.WILDCARD) {
        throw new Error("Reserved as wildcard: '"+RequestManager.WILDCARD+"'");
    }
    this.reply({
        t : 2,
        id : 0,
        e : evt,
        d : data
    });
};

RequestManager.prototype.setHandler = function(action, handler) {
    this.handlers.set(action, handler);
};

RequestManager.prototype.removeHandler = function(action) {
    this.handlers.delete(action);
};


module.exports = RequestManager;
