var RRM = require("../index.js");
var assert = require("assert");


describe('RRM', function(){

    var a = new RRM(function(reply){
       setTimeout(function(){ b.handle(reply); },123);
    });

    var b = new RRM(function(reply){
       setTimeout(function(){ a.handle(reply); },123);
    });

    b.setHandler("echo-test",function(data){
       return new Promise(function(res,rej){
           res(data);
       });
    });

    describe('request-response', function(){
        it('should echo the test', function(done){
            var v = 34370;
            a.createRequest("echo-test",v,1000)
                .then(function(data){
                    assert.equal(data,v);
                    done();
                },done);
        });
        it('should fail an unknown action',function(done){
            var action = 'unknown';
            a.createRequest(action,123,1000)
                .then(function(){
                    done("did not fail!");
                },function(err){
                    assert.equal(err,RRM.ERR_NO_HANDLER+action);
                    done();
                });
        });
        it('should cause a timeout',function(done){
            a.createRequest("echo-test",1,100)
                .then(function(){
                    done("no timeout");
                },function(err){
                    assert.equal(err,RRM.ERR_TIMEOUT);
                    done();
                });
        });
    });

    describe('wildcards',function(){
        before(function(){
            a.setHandler(RRM.WILDCARD,function(data,action){
                return new Promise(function(res,rej){
                    res(action);
                });
            });
            a.setHandler("test",function(data){
                return new Promise(function(res,rej){
                    res("other");
                });
            });
        });
        it('should echo the action name',function(done){
            var rndAction = 'test343899';
            b.createRequest(rndAction,'whatever',1000)
                .then(function(data){
                    assert.equal(data,rndAction);
                    done();
                },done);
        });
        it('should not call the wildcard when the specific action handler exists',function(done){
            b.createRequest("test",'whatever',1000)
                .then(function(data){
                    assert.equal(data,"other");
                    done();
                },done);
        });
        after(function(){
            a.removeHandler(RRM.WILDCARD);
        });
    });

    describe('error handling',function(){
        before(function(){
            a.setHandler("test",function(data,action){
                return data + 1;
            });
        });
        it('should notify if no promise is returned by a handler',function(done){
            b.createRequest("test",1)
                .then(function(data){
                    done("no error!");
                },function(err){
                    assert.equal(err,RRM.ERR_INT_HANDLER);
                    done();
                });
        });
        after(function(){
            a.removeHandler("test");
        });
    });

    describe('events',function(){
        var sending = 123;
        it('should receive an event',function(done){
            a.setHandler("evt",function(data){
                assert.equal(data,sending);
                a.removeHandler("evt");
                done();
            });
            b.emitEvent("evt",sending);
        });
    });
});
