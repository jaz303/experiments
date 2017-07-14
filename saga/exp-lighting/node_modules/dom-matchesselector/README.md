# dom-matchesselector

Test if an element matches a given selector.

## Installation

Browserify recommended.

	$ npm install dom-matchesselector

In the codes:

	var matches = require('om-matchesselector');

## API

#### `matches(selector, element)`

Returns true if `element` matches `selector`.

Note that `selector` is the first argument; this enables derivation of a partially-applied function for testing multiple elements against the same selector via suitable library.