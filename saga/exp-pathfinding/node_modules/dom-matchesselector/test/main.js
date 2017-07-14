var matches = require('../');
var test = require('tape');

test("matchesSelector()", function(assert) {

    var el = document.getElementById('title');

    assert.ok(matches('div h1 span', el));
    assert.notOk(matches('table', el));
    assert.end();

});