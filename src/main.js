// Base function.
var root = this;
var document = this.document || {};

//native custom event or polyfill
var CustomEvent = this.CustomEvent;
if(typeof CustomEvent === 'undefined' || typeof CustomEvent === 'object'){
  //https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent#Polyfill
  CustomEvent = (function(){
    function CEvent( event, params ) {
      params = params || { bubbles: false, cancelable: false, detail: undefined };
      var evt = document.createEvent( 'CustomEvent' );
      evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
      return evt;
    }

    CEvent.prototype = root.Event.prototype;

    return CEvent;
  }());
}

var touchme = function(args) {
  //`this` will be window in browser, and will contain ontouchstart if a mobile device
  var touchDevice = ('ontouchstart' in root);
  //self explanatory...
  var
    touchStart = false,
    tapNumber = 0,
    tapTimer, holdTimer,
    currentX, currentY,
    oldX, oldY,
    holdElement, isHolding,
    originalX, originalY, //for elements that are being held
    holdInterval, lastX, lastY, //cursor tracking while holding
    initialPinch,
    swipeTimeout = false,
    swipeTimer,
    initialEvent;

  //where args is an object that can replace any of the default arguments
  var defaults = {
    swipePrecision: 80,
    swipeThreshold: 100,
    tapThreshold: 150,
    pinchResolution: 15,
    holdThreshold: 550,
    precision: 20,
    holdPrecision:200,
    onlyTouch: false,
    onlyTap : false,
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

  var isInTapLimits = function(){
    return(
      currentX >= oldX-defaults.precision &&
      currentX <= oldX+defaults.precision &&
      currentY >= oldY-defaults.precision &&
      currentY <= oldY+defaults.precision
    );
  };
  var isInHoldLimits = function(){
    return(
      currentX >= oldX-defaults.holdPrecision &&
      currentX <= oldX+defaults.holdPrecision &&
      currentY >= oldY-defaults.holdPrecision &&
      currentY <= oldY+defaults.holdPrecision
    );
  };

  //add event (s) to a given element
  var setListener = function(element, evt, callback){
    var evtArr = evt.split(' ');
    var i = evtArr.length;
    while(i--){
      //if the onlyTouch flag is set, don't add mouse events
      if(defaults.onlyTouch){
        if(evtArr[i].match(/mouse/)){
          continue;
        }
      }
      element.addEventListener(evtArr[i], callback, false);
    }
  };
  //returns the node being touched/clicked
  var getPointer = function(event){
    if(event.targetTouches){
      return event.targetTouches[0];
    }else{
      return event;
    }
  };
  var isPinch = function(e){
    var pinching = false;
    if( e.targetTouches && e.targetTouches[0] && e.targetTouches[1]){
      pinching = true;
    }

    return pinching;
  };
  var getTouchPoints = function(event){
    var touchPoints = {},
      touches = event.targetTouches;
    for(var i = 0; i < touches.length; i++){
      var keyName = "touch"+i;
      touchPoints[keyName] = {
        x : touches[i].clientX,
        y : touches[i].clientY,
        id : touches[i].identifier
      };
    }
    return touchPoints;
  };

  var getMidPoint = function(points){
    var x1 = points['touch0'].x,
      x2 = points['touch1'].x,
      y1 = points['touch0'].y,
      y2 = points['touch1'].y,
      midpoint;

    midpoint = {
      x : (x1+x2)/2,
      y : (y1+y2)/2
    };

    return midpoint;
  };
  var getDistance = function(x1,x2,y1,y2){
    //it's a little dense, but it's the fucking distance formula.
    return Math.sqrt( Math.pow( (x2-x1) , 2) + Math.pow( (y2-y1), 2) );
  };
  var isPinchRes = function(firstPinch, newPinch){
    var touch1Dist = getDistance( firstPinch['touch0'].x,
        newPinch['touch0'].x,
        firstPinch['touch0'].y,
        newPinch['touch0'].y),
      touch2Dist = getDistance( firstPinch['touch1'].x,
        newPinch['touch1'].x,
        firstPinch['touch1'].y,
        newPinch['touch1'].y),
      isGreater = false;

    if(touch1Dist > defaults.pinchResolution || touch2Dist > defaults.pinchResolution){
      isGreater = true;
    }
    return isGreater;
  };
  /*
   triggerEvent()
   creates a custom event, and passes any members in the data object to the event
   triggers the custom event on the given element.
   */
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

  //tap, dbltap, hold, initialPinch
  setListener(document, touchDevice ? 'mousedown touchstart' : 'mousedown', function(e){
    if(!initialEvent){
      initialEvent = e.type;
    }else if(initialEvent !== e.type){
      return false;
    }
    touchStart = true;
    tapNumber += 1;
    var pointer = getPointer(e);
    oldX = currentX = pointer.clientX;
    oldY = currentY = pointer.clientY;
    //initialize tapTimer
    clearTimeout(tapTimer);
    tapTimer = setTimeout(function(){
      if( isInTapLimits() && !touchStart ){
        //dense code
        //  first check if it's a double tap. Anything over 2 taps considered a double tap
        //  then, check if ntap is enabled, if so and more than 3 taps occcured, trigger ntap.
        var tapEventName = tapNumber>=2 ? 'dbltap' : 'tap';
        triggerEvent(e.target, tapEventName, {
          x : currentX,
          y : currentY
        });
        initialEvent = undefined;
        tapNumber = 0;
      }else if( !isInTapLimits() || isHolding ){
        tapNumber = 0;
      }
    }, defaults.tapThreshold);

    clearTimeout(holdTimer);
    //if the user is already holding, do not initialize another hold. as it is, this causes bugs with multiple
    // touch events. However, TODO: implement a 'multiple hold' event, to allow for multiple drag-and-drop
    if(!isHolding){
      holdTimer = setTimeout(function(){
        if( isInHoldLimits() && touchStart){
          //user is within the tap region and is still after hold threshold
          isHolding = true;
          //set the hold interval, every 50ms update the hold elements lastXY
          holdInterval = setInterval(function(){
            lastX = currentX;
            lastY = currentY;
          },50);
          //we'll reference this when the user let's go
          holdElement = e;
          originalX = pointer.clientX;
          originalY = pointer.clientY;
          triggerEvent(holdElement.target, 'hold', {
            x: currentX,
            y: currentY,
            touches: e.touches
          });
        }
      }, defaults.holdThreshold);
    }

    //here we set the initial pinch to compare distances
    if(isPinch(e)){
      initialPinch =  getTouchPoints(e);
      initialPinch['distance'] = getDistance( initialPinch['touch0'].x,
        initialPinch['touch1'].x,
        initialPinch['touch0'].y,
        initialPinch['touch1'].y);

      initialPinch['midPoint'] = getMidPoint(getTouchPoints(e));

    }
    //setSwipe timeout
    swipeTimer = setTimeout(function(){
      swipeTimeout = true;
    }, defaults.swipeThreshold);
  });

  //track the movement / drag
  // detect pinch gesture
  setListener(document, touchDevice ? 'mousemove touchmove' : 'mousemove', function(e){
    var pointer = getPointer(e);
    currentX = pointer.clientX;
    currentY = pointer.clientY;
    //is the user is holding an item, it's being dragged
    if(isHolding){
      triggerEvent(holdElement.target, 'drag', {
        x: currentX,
        y: currentY
      });
    }
    if(isPinch(e)){
      /*
       returns array of objects, with props: x, y, id
       */
      var pinch = {};
      pinch.touchPoints = getTouchPoints(e);
      pinch.distance = getDistance( pinch.touchPoints['touch0'].x,
        pinch.touchPoints['touch1'].x,
        pinch.touchPoints['touch0'].y,
        pinch.touchPoints['touch1'].y);

      pinch.midPoint = getMidPoint(pinch.touchPoints);
      pinch.initialPinch = initialPinch;

      if( isPinchRes(pinch.initialPinch, pinch.touchPoints) ){
        triggerEvent(e.target, 'pinch', pinch);
        initialPinch = pinch.touchPoints;
        initialPinch['distance'] = pinch.distance;
        initialPinch['midPoint'] = pinch.midPoint;
      }
    }
  });

  /*
   create two seperate listeners for touchend and mouseup.

   the first is generic, it sets touch start to false and checks to see if the user was holding something
   the second is swipe specific, to check if the default 'swipeOnlyTouch' is set
   */
  setListener(document, touchDevice ? 'mouseup touchend' : 'mouseup', function(e){
    touchStart = false;
    if(initialPinch){
      initialPinch = undefined;
      triggerEvent(e.target, 'pinchrelease');
    }

    //if the user was holding something...
    if(isHolding){
      if(e.touches && e.touches.length > 0){
        return false;
      }
      isHolding = false;
      clearInterval(holdInterval);
      triggerEvent(holdElement.target, 'holdrelease', {
        originalX: originalX,
        originalY: originalY,
        lastX: lastX,
        lastY: lastY,
        touches: e.touches
      });
    }
  });
  //swipe specific
  var swipeEventName = touchDevice ? 'mouseup touchend' : 'mouseup';
  swipeEventName = defaults.swipeOnlyTouch ? 'touchend' : swipeEventName;
  setListener(document, swipeEventName, function(e){
    touchStart = false;

    var
      swipeEvents = [],
      deltaX = oldX - currentX,
      deltaY = oldY - currentY;
    //calculate radians for direction
    var rads = Math.atan2((currentY-oldY), -(currentX-oldX))+Math.PI,
      multiTouch = (e.touches && e.touches.length > 1);

    //the user is swiping...
    if(
      (deltaX <= defaults.swipePrecision || deltaY <= defaults.swipePrecision)
      && multiTouch === false
      && deltaX > 0
      && deltaY > 0
    ){
      swipeEvents.push('swipe');
    }

    //directional swipes
    if( deltaX <= -defaults.swipePrecision ){
      swipeEvents.push('swiperight');
    }
    if( deltaX >= defaults.swipePrecision ){
      swipeEvents.push('swipeleft');
    }
    if( deltaY >= defaults.swipePrecision ){
      swipeEvents.push('swipeup');
    }
    if( deltaY <= -defaults.swipePrecision ){
      swipeEvents.push('swipedown');
    }

    var i = swipeEvents.length;
    if(swipeTimeout === false){
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
        tapNumber = 0;
      }
      clearTimeout(swipeTimer);
    }else{
      swipeTimeout = false;
      clearTimeout(swipeTimer);
      swipeEvents = [];
    }


  });

  return touchDevice;
};



// Export to the root, which is probably `window`.
if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = touchme;
  }
  exports.touchme = touchme;
} else {
  root.touchme = touchme;
}

// Version.
touchme.VERSION = '0.2.0';
