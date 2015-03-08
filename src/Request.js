function Request(manager, action, data) {
    this.manager = manager;
    this.action = action;
    this.data = data;
    var ths = this;
    this.fulfill = null;
    this.reject = null;
    this.promise = new Promise(function(f,r){ ths.fulfill = f; ths.reject = r; });
    this.id = Request.getId();


    this.manager.openRequests.set(this.id, this);
    this.manager.reply({
        id : this.id,
        action: this.action,
        data : this.data,
        t : 0
    });
};

Request.prototype.finish = function(response) {
    if (response.error) {
        this.reject(response.error);
    } else {
        this.fulfill(response.data);
    }
    this.manager.removeRequest(this.id);
};


var counter = 0;

Request.getId = function() {
    return "" + (new Date()).getTime() + "-" + counter;
};

module.exports = Request;
