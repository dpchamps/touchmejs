/**
 * Created by Dave on 3/20/14.
 */

/*
a proof of concept that I want to build upon later...

TODO:
    add holding drop, and holding move
    add angular direction while moving

    unit tests

tap
directional swipe
double-tap
hold

etc...
 */
var touch = function(defArgs){
    //determine if touch device
    var touchDevice = ('ontouchstart' in window);

    //these are the defaults for all of the settings
    var defaults = {
        swipeThreshold: 80,
        tapThreshold: 200,
        holdThreshold: 500,//half a second, so we don't have events firing alll willy nilly
        precision: 45,
        onlyTouch: false,
        ntap : false
    };
   //simple set defaults function
    if(defArgs){
        var object = defArgs;
        for(var key in object){
            if(key in defaults){
                defaults[key] = object[key];
            }
        }
    }

    //returns the node being touched
    var getPointer = function(event){

        if(event.targetTouches){
            return event.targetTouches[0];
        }else{
            return event;
        }
    };

    //add event(s) to a given element
    var setListener = function(element, evt, callback){

        var evts = evt.split(' ');

        for(var i = 0; i < evts.length; i++){
            element.addEventListener(evts[i], callback, false);
        }

    };

    //trigger new event
    var triggerEvent = function(element, eventName, originalEvent, data){
        data = data || {};

        data.x = currentX;
        data.y = currentY;

        var newEvent = new CustomEvent(
            eventName,
            {
                detail: {

                },
                bubbles: true,
                cancelable: true
            }
        );

        newEvent.originalEvent = originalEvent;
        //may be unnecessary, but we might be adding more to the data object later
        for( var key in data){
            newEvent[key] = data[key];
        }
        element.dispatchEvent(newEvent);
    };

    //yada yada...
    var touchStart = false,
        tapNumber = 0,
        tapTimer,
        holdTimer,//may not need...
        currentX,currentY,
        oldX, oldY,
        holdElement, isHolding;

    /*
    if touch.js 'onlyTouch' default is set to true, we set touch device to true so none of
     the listeners get set for mouse events
     */
    if(defaults.onlyTouch){
        touchDevice = true;
    }

    /*
    now, we'll set the listeners
     */

    /*
        tap, doubletap and ntap
     */
    setListener(document, touchDevice ? 'touchstart' : 'mousedown', function(e){
        touchStart = true;
        tapNumber += 1;
        var pointer = getPointer(e);

        //not so much of a problem here, since they're already defined.
        oldX = currentX = pointer.pageX;
        oldY = currentY = pointer.pageY;


        clearTimeout(tapTimer);
        setTimeout(function(){

            if(
                currentX >= oldX-defaults.precision &&
                currentX <= oldX+defaults.precision &&
                currentY >= oldY-defaults.precision &&
                currentY <= oldY+defaults.precision &&
                !touchStart
             ){
                //might be too clever.. assign either 'tap' or 'dbltap'
                // if ntap is enabled -- it is not by default -- change to 'ntap' if the tap number is >=3
                var tapEventName = tapNumber===2 ? 'dbltap' : 'tap';
                if(defaults.ntap) tapEventName = tapNumber>=3 ? 'ntap' : tapEventName;
                //the user has initiated one of three tap events
                triggerEvent(e.target, tapEventName, e, {taps: tapNumber});

                tapNumber = 0;
            }
        }, defaults.tapThreshold);

        //clear hold timer
        clearTimeout(holdTimer);
        /*
        start hold timer,
        if the user is holding in one position for longer than the holdthreshold, trigger a hold event
         */
        setTimeout(function(){
            if(
                currentX >= oldX-defaults.precision &&
                currentX <= oldX+defaults.precision &&
                currentY >= oldY-defaults.precision &&
                currentY <= oldY+defaults.precision &&
                touchStart
            ){
                isHolding = true //oblig
                holdElement = e.target; //incase we want to do anything special with it when it's released
                triggerEvent(e.target, 'hold', e);
                tapNumber = 0;
            }
        }, defaults.holdThreshold);
    });

    /*
        swipe, directional swipe, hold
     */
    setListener(document, touchDevice ? 'touchend' : 'mouseup', function(e){
        //no mo touchy
        touchStart = false;

        var directionEvents = [],
            deltaX = oldX - currentX,
            deltaY = oldY - currentY;

        if( deltaX <= -defaults.swipeThreshold ){
            directionEvents.push('swiperight');
        }
        if( deltaX >= defaults.swipeThreshold ){
            directionEvents.push('swipeleft');
        }
        if( deltaY >= defaults.swipeThreshold ){
            directionEvents.push('swipeup');
        }
        if( deltaY <= -defaults.swipeThreshold ){
            directionEvents.push('swipedown');
        }




        //if there is something inside of 'directionEvents', trigger those events
        if(directionEvents.length){
            for( var i = 0; i < directionEvents.length; i++){
                triggerEvent(e.target,directionEvents[i], e, {
                    distance: {
                        x: Math.abs(deltaX),
                        y: Math.abs(deltaY)
                    }
                });
            }
        }

        //if the user was holding something
        if(isHolding){
            isHolding = false;
            triggerEvent(holdElement, 'holdrelease', e, {
                distance:{
                    x: Math.abs(deltaX),
                    y: Math.abs(deltaY)
                }
            })
        }
    });

    setListener(document, touchDevice ? 'touchmove' : 'mousemove',function(e){
        var pointer = getPointer(e);
        currentX = pointer.pageX;
        currentY = pointer.pageY;
    });

    return touchDevice;
};

module.exports = touch;