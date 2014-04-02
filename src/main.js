/* touchme main */

/*
TODO add support for the 'swipeOnly' option, which keeps swipe events to the mouse.
 */

// Base function.
var root = this;
var document = this.document || {};

//native custom event or polyfill
var CustomEvent = this.CustomEvent || function(){
    var CustomEvent = function ( event, params ) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
    };

    CustomEvent.prototype = this.Event.prototype;

    this.CustomEvent = CustomEvent;
};


var touchme = function(args) {
    //`this` will be window in browser, and will contain ontouchstart if a mobile device
    var touchDevice = ('ontouchstart' in this);

    //self explanitory...
    var
        touchStart = false,
        tapNumber = 0,
        tapTimer,
        holdTimer,
        currentX, currentY,
        oldX, oldY,
        holdElement, isHolding,
        originalX, originalY; //for elements that are being held


    //where args is an object that can replace any of the default arguments
    var defaults = {
        swipeThreshold: 80,
        tapThreshold: 200,
        holdThreshold: 550,
        precision: 45,
        onlyTouch: false,
        swipeOnlyTouch: false,
        nTap: false
    };
    //replace any object that belongs in the defaults
    if(args){
        for(var key in args){
            if (args.hasOwnProperty(key) && defaults.hasOwnProperty(key)) {
                defaults[key] = args[key];
            }
        }
    }

    //returns the node being touched/clicked
    var getPointer = function(event){

        if(event.targetTouches){
            return event.targetTouches[0];
        }else{
            return event;
        }
    };

    //add event (s) to a given element
    var setListener = function(element, evt, callback){
        var evtArr = evt.split(' ');
        var i = evtArr.length;
        while(i--){
            element.addEventListener(evtArr[i], callback, false);
        }
    };

    var isInTapLimits = function(){
        return(
            currentX >= oldX-defaults.precision &&
            currentX <= oldX+defaults.precision &&
            currentY >= oldY-defaults.precision &&
            currentY <= oldY+defaults.precision
            );
    };

    var triggerEvent = function(element, eventName, data){
        data = data || {
            x: currentX,
            y: currentY
        };
        var newEvent = new CustomEvent(
            eventName,
            {
                bubbles: true,
                cancelable:true
            }
        );
        for(var key in data){
            if(data.hasOwnProperty(key)){
                newEvent[key] = data[key];
            }
        }

        element.dispatchEvent(newEvent);
    };

    //if we're only dealing with touch devices, just set touch device to true to prevent mouse fallbacks
    if(defaults.onlyTouch){
        touchDevice = true;
    }

    //tap, dbltap, ntap
    setListener(document, touchDevice ? 'touchstart' : 'mousedown', function(e){
        touchStart = true;
        tapNumber += 1;

        var pointer = getPointer(e);

        oldX = currentX = pointer.pageX;
        oldY = currentY = pointer.pageY;

        //initialize tapTimer
        clearTimeout(tapTimer);
        tapTimer = setTimeout(function(){
            if( isInTapLimits() && !touchStart ){
                //dense code
                //  first check if it's a double tap. Anything over 2 taps considered a double tap
                //  then, check if ntap is enabled, if so and more than 3 taps occcured, trigger ntap.
                var tapEventName = tapNumber>=2 ? 'dbltap' : 'tap';
                if(defaults.ntap) { tapEventName = tapNumber>=3 ? 'ntap' : tapEventName;}
                triggerEvent(e.target, tapEventName, {
                    taps: tapNumber //use case for ntap
                });

                tapNumber = 0;
            }
        }, defaults.tapThreshold);

        //initialize holdTimer
        clearTimeout(holdTimer);
        holdTimer = setTimeout(function(){
            if( isInTapLimits() && touchStart){
                //user is within the tap region and is still after hold threshold
                isHolding = true;
                //we'll reference this when the user let's go
                holdElement = e;
                originalX = holdElement.pageX;
                originalY = holdElement.pageY;

                triggerEvent(holdElement, 'hold', {
                    //having a difficult time deciding actually how to deal with this at the moment
                    holdElement: holdElement
                });
                tapNumber = 0;
            }
        }, defaults.holdThreshold);


    });

    //track the movement 
    setListener(document, touchDevice ? 'touchmove' : 'mousemove', function(e){
        var pointer = getPointer(e);
        currentX = pointer.pageX;
        currentY = pointer.pageY;

        //do we need to update hold information here too? I don't think so...
    });
    
    //swipe, directional swipe, hold
    setListener(document, touchDevice ? 'touchend' : 'mouseup', function(e){
        touchStart = false;
        
        var
            swipeEvents = [],
            deltaX = oldX - currentX,
            deltaY = oldY - currentY;

        //calculate radians for direction
        var rads = Math.atan2(currentY-oldY, currentX-oldX);
        if(rads<0){rads+= Math.PI*2;}
        
        //the user is swiping...
        //why do we need this? 
        if(deltaX <= defaults.swipeThreshold || deltaY <= defaults.swipeThreshold){
            swipeEvents.push('swipe');
        }
        
        //directional swipes
        if( deltaX <= -defaults.swipeThreshold ){
            swipeEvents.push('swiperight');
        }
        if( deltaX >= defaults.swipeThreshold ){
            swipeEvents.push('swipeleft');
        }
        if( deltaY >= defaults.swipeThreshold ){
            swipeEvents.push('swipeup');
        }
        if( deltaY <= -defaults.swipeThreshold ){
            swipeEvents.push('swipedown');
        }
        
        var i = swipeEvents.length;
        while(i--){
            triggerEvent(e.target, swipeEvents[i], {
                distance:{
                    x: Math.abs(deltaX),
                    y: Math.abs(deltaY)
                },
                direction:{
                    radians: rads,
                    degrees: rads*(180/Math.PI)
                }
            });
        }

        //if the user was holding something...
        if(isHolding){
            isHolding = false;
            triggerEvent(holdElement, 'holdRelease', {
                originalX: originalX,
                originalY: originalY
            });
        }
    });
    return touchDevice;
};



// Export to the root, which is probably `window`.
if(module !== undefined && module.exports){
    module.exports = touchme;
}else{
    root.touchme = touchme;
}

// Version.
touchme.VERSION = '0.1.0';