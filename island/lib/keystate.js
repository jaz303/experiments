export function createControlState(keyMap) {
	var controlState = {};
	for (var k in keyMap) {
		controlState[keyMap[k]] = {
			halfTransitionCount: 0,
			isDown: false
		};
	}

	return {
		state: controlState,
		frameReset: function() {
			for (var k in controlState) {
				controlState[k].halfTransitionCount = 0;
			}
		},
		down: function(keycode) {
			var c = keyMap[keycode];
			if (c) {
				controlState[c].halfTransitionCount++;
				controlState[c].isDown = true;
			}
		},
		up: function(keycode) {
			var c = keyMap[keycode];
			if (c) {
				controlState[c].halfTransitionCount++;
				controlState[c].isDown = false;
			}
		}
	};
};
