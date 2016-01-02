# touchmeJS

## About

A simple javascript library for adding touch events to your app, provides mouse fallback for greater ease.

## Usage

#### In the Browser:

    <script src='touchme.js'></script>`

#### CommonJS

    require('/touchme');`


#### Instantiating

```javascript
touchme(args); //returns true if on touch device, false otherwise
```

##### where args is an object to override default arguments, the defaults are as follows:
    {
        swipeThreshold: 80,    //the minimun distance required for a 'swipe' event to fire
        tapThreshold: 200,     //the time in milleseconds to wait for a dbltap
        holdThreshold: 550,    //the time in milliseconds required for a 'hold' event to fire
        precision: 45,         //the boundary for all tap events
        onlyTouch: false,      //when set to true, events only fire on touch device
        swipeOnlyTouch: false, //when set to true, swipe events only fire on touch device,
        nTap: false            //still experimental, if the users clicks >=3 taps within tap threshold, nTap is fired containing how many taps occured.
    }
___

### tap

+ el.addEventListener('tap', doSomething(data));
   + data contents:
      + `.x`, `.y` - position where event occurred

### dbltap

+ el.addEventListener('dbltap', doSomething(data));
   + data contents:
      + `.x`, `.y` - position where event occurred

### swiperight

+ el.addEventListener('swiperight', doSomething(data));
   + data contents:
      + `.x`, `.y` - position where event occurred
      + `.direction.radians`, `.direction.degrees` - direction in radians or degrees
      + `.distance.x`, `.distance.y` - distance in pixels

### swipeleft

+ el.addEventListener('swipeleft', doSomething(data));
   + data contents:
      + `.x`, `.y` - position where event occurred
      + `.direction.radians`, `.direction.degrees` - direction in radians or degrees
      + `.distance.x`, `.distance.y` - distance in pixels

### swipeup

+ el.addEventListener('swipeup', doSomething(data));
   + data contents:
      + `.x`, `.y` - position where event occurred
      + `.direction.radians`, `.direction.degrees` - direction in radians or degrees
      + `.distance.x`, `.distance.y` - distance in pixels

### swipedown

+ el.addEventListener('swipedown', doSomething(data));
   + data contents:
      + `.x`, `.y` - position where event occurred
      + `.direction.radians`, `.direction.degrees` - direction in radians or degrees
      + `.distance.x`, `.distance.y` - distance in pixels

### hold

+ el.addEventListener('hold', doSomething(data));
   + data contents:
      + `.x`, `.y` - position where event occurred
      + `.holdElement` - the element that's being held.

### holdrelease

+ el.addEventListener('holdrelease', doSomething(data));
   + data contents:
      + `.x`, `.y` - position where event occurred
      + `.holdElement` - the element that's being released.
      + `.originalX`, `.originalY` the original coordinates of the element being released.


##Coming soon
