/**
 * Created by Dave on 3/23/14.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent#Polyfill
 */
var CustomEventPolyFill = function () {
    console.log("!polyfill!");
    function CustomEvent ( event, params ) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
    };

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
};

module.exports = CustomEventPolyFill;