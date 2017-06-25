(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const map = [
	[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,],
	[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,],
	[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,],
	[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,],
	[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,],
	[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,],
	[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,],
	[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,],
	[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,],
	[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,],
	[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,],
	[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,],
	[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,],
	[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,],
	[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,],
	[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,],
	[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,],
	[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,],
	[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,],
	[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,],
];

const TILE_SIDE = 32;

const TILE_FILL = [
	'#a0a0a0',
	'#b0b0b0'
];

const NO_MOVEMENT = [0, 0];

const DIRECTIONS = [
	[0, -1],
	[1, 0],
	[0, 1],
	[-1, 0]
];

const BRAINS = {
	random(entity, input) {
		let dir
		do {
			dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
		} while (
			(entity.x + dir[0]) < 0
			|| (entity.x + dir[0]) === map[0].length
			|| (entity.y + dir[1]) < 0
			|| (entity.y + dir[1] === map.length)
		);
		entity.x += dir[0];
		entity.y += dir[1];
	},
	player(entity, input) {
		const kbd = input.keyboard;
		let dir = NO_MOVEMENT;
		if (kbd.up.isPressed || kbd.up.halfTxCount > 1) {
			dir = DIRECTIONS[0];
		} else if (kbd.down.isPressed || kbd.down.halfTxCount > 1) {
			dir = DIRECTIONS[2];
		} else if (kbd.left.isPressed || kbd.left.halfTxCount > 1) {
			dir = DIRECTIONS[3];
		} else if (kbd.right.isPressed || kbd.right.halfTxCount > 1) {
			dir = DIRECTIONS[1];
		}
		entity.x += dir[0];
		entity.y += dir[1];
	}
};

window.init = function() {
	const canvas = document.querySelector('#canvas');
	const ctx = canvas.getContext('2d');

	let keyStates = {
		up: { isPressed: false, halfTxCount: 0 },
		down: { isPressed: false, halfTxCount: 0 },
		left: { isPressed: false, halfTxCount: 0 },
		right: { isPressed: false, halfTxCount: 0 }
	};

	let keyMap = {
		38: 'up',
		40: 'down',
		37: 'left',
		39: 'right'
	};

	canvas.addEventListener('keydown', (evt) => {
		const sym = keyMap[evt.which];
		if (!sym) return;
		keyStates[sym].isPressed = true;
		keyStates[sym].halfTxCount++;
	});

	canvas.addEventListener('keyup', (evt) => {
		const sym = keyMap[evt.which];
		if (!sym) return;
		keyStates[sym].isPressed = false;
		keyStates[sym].halfTxCount++;
	});

	function resetKeyStates() {
		for (let k in keyStates) {
			keyStates[k].halfTxCount = 0;
		}
	}

	const state = {
		map: map,
		entities: [
			{
				x: 10,
				y: 10,
				color: 'black',
				brain: 'player'
			},
			{
				x: 20,
				y: 13,
				color: 'red',
				brain: 'random'
			},
			{
				x: 12,
				y: 2,
				color: 'red',
				brain: 'random'
			},
			{
				x: 18,
				y: 6,
				color: 'red',
				brain: 'random'
			}
		]
	};

	setInterval(() => {
		state.entities.forEach(e => {
			BRAINS[e.brain](e, {
				keyboard: keyStates
			});
		});
		drawGame(ctx, state);
		resetKeyStates();
	}, 1000);

	drawGame(ctx, state);
}

function drawGame(ctx, state) {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	const map = state.map;
	for (let y = 0; y < map.length; ++y) {
		for (let x = 0; x < map[0].length; ++x) {
			ctx.fillStyle = TILE_FILL[map[y][x]];
			ctx.fillRect(x * TILE_SIDE, y * TILE_SIDE, TILE_SIDE, TILE_SIDE);
		}
	}
	state.entities.forEach((e) => {
		ctx.beginPath();
		ctx.fillStyle = e.color;
		ctx.arc(
			e.x * TILE_SIDE + TILE_SIDE / 2,
			e.y * TILE_SIDE + TILE_SIDE / 2,
			(TILE_SIDE / 2) - 3,
			0,
			Math.PI * 2,
			false
		);
		ctx.fill();
	});
}
},{}]},{},[1]);
