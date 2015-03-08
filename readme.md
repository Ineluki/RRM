# RRM

RRM (Request-Response-Manager) is a tiny tool to facilitate request & response on dual-channel transports, such as websockets, webworkers or webrtc.

Uses promises for async flow.

## Features

* completly transport-agnostic
* supports messages without need for response ("events")
* wildcards as fallback or default handler
* timeouts

## Requirements

- Promises 
- Browserify for usage in browser
- Maps

## Usage 

### Setup example with Webworker

```javascript
var hostWorker = new Worker("worker.js");

//setup RRM by telling him where to send messages
var requestManager = new RequestManager(function(data){
    hostWorker.postMessage(JSON.stringify(data));
});

//send all incoming from worker directly to RRM
hostWorker.onmessage = function(e) {
    requestManager.handleRequest(JSON.parse(e.data));
};

//add handlers for incoming messages and events
requestManager.setHandler("myActionType",function(data){
    //if the type identifies it as an event, we must return a promise
    return new Promise(function(resolve,reject){
        //...
    });
});
```
The worker side is set up in the same way.

### Requests and Events

```javascript
//send a request of type "someAction" with a timeout of 1sec
requestManager.createRequest("someAction",data,1000);

//emit an event - means we don't expect a response
requestManager.emitEvent("myEvent",data);
```

* If no handler is set for the action on the other side, the response is an error
* If the timeout is not met, the response is an error

### Wildcards

```javascript
//can set a default or fallback handler (used if no other handler matches)
requestManager.setHandler("*",function(data,action){
    switch(action){
        //...
    }
});
```