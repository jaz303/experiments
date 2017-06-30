# dom-bind

DOM event binding and delegation.

## Installation

Browserify recommended.

	$ npm install dom-bind

In the codes:

	var ev = require('dom-bind');

## API

### Events

#### `du.bind(el, evtType, cb, [useCapture])`

#### `du.bind_c(el, evtType, cb, [useCapture])`

As above, but returns a cancellation function.

#### `du.delegate(el, evtType, selector, cb, [useCapture])`

#### `du.delegate_c(el, evtType, selector, cb, [useCapture])`

As above, but returns a cancellation function.

#### `du.unbind(el, evtType, cb, [useCapture])`
