(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const TILE_ATTRIBS = require('./tiles');
const MinHeap = require('min-heap');

module.exports = function(map, sx, sy, dx, dy) {
	const storage = new Storage();
	const endId = id(dx, dy);

	storage.addToOpenSet(id(sx, sy), 0.0, h(sx, sy, dx, dy), null);

	while (storage.hasOpenNodes()) {
		const currNode = storage.removeBestOpenNode();
		if (currNode === endId) {
			const path = storage.pathTo(endId);
			const outPath = [];
			let prevX = path[0] % map.width;
			let prevY = Math.floor(path[0] / map.width);
			for (let ix = 1; ix < path.length; ++ix) {
				let currX = path[ix] % map.width;
				let currY = Math.floor(path[ix] / map.width);
				outPath.push([currX - prevX, currY - prevY]);
				prevX = currX;
				prevY = currY;
			}
			return outPath;
		} else {
			storage.addToClosedSet(currNode);
			eachPassableNeighbour(currNode % map.width, Math.floor(currNode / map.width), (x, y) => {
				const neighbourId = id(x, y);
				if (storage.isInClosedSet(neighbourId)) {
					return;
				}
				const g = storage.g(currNode) + 1;
				if (!storage.isInOpenSet(neighbourId)) {
					const nx = neighbourId % map.width;
					const ny = Math.floor(neighbourId / map.width);
					storage.addToOpenSet(neighbourId, g, h(nx, ny, dx, dy), currNode);
				} else {
					storage.updateG(neighbourId, g, currNode);
				}
			});
		}
	}

	return null;

	function id(x, y) {
		return (y * map.width) + x;
	}

	function h(x1, y1, x2, y2) {
		return Math.abs(x1 - x2) + Math.abs(y1 - y2);
	}

	function eachPassableNeighbour(x, y, callback) {
		_try(x-1, y);
		_try(x+1, y);
		_try(x, y-1);
		_try(x, y+1);
		function _try(x, y) {
			if (x < 0 || x === map.width) return;
			if (y < 0 || y === map.height) return;
			if (TILE_ATTRIBS[map[y][x]].passable) {
				callback(x, y);
			}
		}
	}
}

function Node(id) {
	this.id = id;
	this.closed = false;
	this.parent = null;
	this.steps = 0;
	this.f = 0;
	this.g = 0;
	this.h = 0;
}

function Storage() {
	this.state = {};
	this.open = new MinHeap((n1, n2) => {
		return n1.f - n2.f;
	});
}

Storage.prototype._get = function(nodeId) {
	let node = this.state[nodeId];
	if (!node) {
		node = new Node(nodeId);
		this.state[nodeId] = node;
	}
	return node;
}

Storage.prototype.hasOpenNodes = function() {
	return this.open.size > 0;
}

Storage.prototype.removeBestOpenNode = function() {
	return this.open.removeHead().id;
}

Storage.prototype.addToClosedSet = function(nodeId) {
	this.state[nodeId].closed = true;
}

Storage.prototype.addToOpenSet = function(nodeId, g, h, parent) {
	const node = this._get(nodeId);
	if (typeof parent === 'number') {
		node.parent = parent;
		node.steps = this._get(parent).steps + 1;
	} else {
		node.parent = null;
		node.steps = 0;
	}
	node.f = g + h;
	node.g = g;
	node.h = h;
	this.open.insert(node);
}

Storage.prototype.isInOpenSet = function(nodeId) {
	return this.open.contains(this._get(nodeId));
}

Storage.prototype.isInClosedSet = function(nodeId) {
	return this._get(nodeId).closed;
}

Storage.prototype.g = function(nodeId) {
	return this._get(nodeId).g;
}

Storage.prototype.updateG = function(nodeId, g, parent) {
	const node = this._get(nodeId);
	if (g < node.g) {
		this.open.remove(node);
		node.g = g;
		node.f = g + node.h;
		node.parent = parent;
		node.steps = this._get(parent).steps + 1;
		this.open.insert(node);
	}
}

Storage.prototype.pathTo = function(node) {
	const path = [];
	while (typeof node === 'number') {
		path.unshift(node);
		node = this._get(node).parent;
	}
	return path;
}
},{"./tiles":3,"min-heap":6}],2:[function(require,module,exports){
const ev = require('dom-bind');
const astar = require('./a-star');

const map = [
	[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,],
	[1,2,2,2,2,2,2,2,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,],
	[0,2,0,1,0,1,0,2,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,],
	[1,2,1,0,1,0,1,2,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,],
	[0,2,2,2,0,2,2,2,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,],
	[1,0,2,0,1,0,2,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,],
	[0,1,2,1,0,1,2,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,],
	[1,0,2,0,1,0,2,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,],
	[0,1,2,1,0,1,2,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,],
	[1,0,2,0,1,0,2,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,],
	[0,1,0,1,0,1,2,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,],
	[1,0,2,0,1,0,2,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,],
	[0,1,2,1,0,1,2,1,0,1,0,1,2,2,2,1,0,1,0,1,0,1,0,1,],
	[1,0,2,0,1,0,2,0,1,0,1,0,2,0,2,0,1,0,1,0,1,0,1,0,],
	[0,1,2,1,0,1,2,1,0,1,0,1,2,1,2,1,0,1,0,1,0,1,0,1,],
	[1,0,1,0,1,0,1,0,1,0,1,0,2,0,2,2,2,2,2,2,1,2,2,0,],
	[0,1,0,1,0,1,0,1,0,1,0,1,2,1,0,1,0,1,0,1,0,1,2,1,],
	[1,0,1,0,1,0,1,0,1,0,1,0,2,2,2,2,1,0,1,0,1,0,2,0,],
	[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,2,2,2,2,2,2,2,2,1,],
	[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,],
];

const globalIllumination = [0, 0, 0];

const staticLightmap = map.map((row) => {
	return row.map(_ => [0.3, 0.3, 0.3]);
});

const frameLightmap = map.map((row) => {
	return row.map(_ => [null, null, null]);
});

map.width = map[0].length;
map.height = map.length;

const TILE_SIDE = 32;

const TILE_ATTRIBS = require('./tiles');

const NO_MOVEMENT = [0, 0];

const DIRECTIONS = [
	[0, -1],
	[1, 0],
	[0, 1],
	[-1, 0]
];

const keyCommands = {
	up: ['move', DIRECTIONS[0]],
	right: ['move', DIRECTIONS[1]],
	down: ['move', DIRECTIONS[2]],
	left: ['move', DIRECTIONS[3]],
	toggle_lights: ['toggle_lights']
};

const BRAINS = {
	player(entity, state) {
		const cmd = entity.pendingCommand;
		entity.pendingCommand = null;
		return cmd;
	},
	randomWalker(entity, state) {
		if (entity.path) {
			const cmd = ['move', entity.path.shift()];
			if (entity.path.length === 0) {
				entity.path = null;
			}
			return cmd;
		}
		if (entity.roaming) {
			let dir;
			do {
				dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
			} while (!isPassable(state.map, entity.x + dir[0], entity.y + dir[1]));
			return ['move', dir];	
		}
		return null;
	}
};

const EXECUTORS = {
	brain(entity, state, cmd) {
		switch (cmd[0]) {
			case 'move':
			{
				const nx = entity.x + cmd[1][0];
				const ny = entity.y + cmd[1][1];
				if (isPassable(state.map, nx, ny)) {
					entity.x = nx;
					entity.y = ny;
				}
				break;
			}
			case 'getitem':
			{
				const ix = state.entities.indexOf(cmd[1]);
				if (ix >= 0) {
					state.entities.splice(ix, 1);
					entity.inventory.push(cmd[1]);
				}
				break;
			}
			case 'dropitem':
			{
				const ix = entity.inventory.indexOf(cmd[1]);
				const item = cmd[1];
				if (ix >= 0) {
					entity.inventory.splice(ix, 1);
					state.entities.push(item);
					item.x = entity.x;
					item.y = entity.y;
				}
				break;
			}
			case 'toggle_lights':
			{
				entity.lightsOn = !entity.lightsOn;
				break;
			}
			default:
				console.warn("unknown command", cmd);
				break;
		}
	}
};

window.init = function() {
	const canvas = document.querySelector('#canvas');
	const ctx = canvas.getContext('2d');

	const ui = {
		inventory: document.querySelector('.inventory--items'),
		onGround: document.querySelector('.on-ground')
	};

	ui.onGround.style.display = 'none';

	ev.delegate(ui.onGround, 'click', '.itemtile', (evt) => {
		state.player.pendingCommand = ['getitem', evt.delegateTarget._entity];
		tick();
	});

	ev.delegate(ui.inventory, 'click', '.itemtile', (evt) => {
		state.player.pendingCommand = ['dropitem', evt.delegateTarget._entity];
		tick();
	});

	const keyMap = {
		38: 'up',
		40: 'down',
		37: 'left',
		39: 'right',
		76: 'toggle_lights'
	};

	let clickState = {
		entity: null
	};

	canvas.addEventListener('click', (evt) => {
		const tx = Math.floor(evt.offsetX / TILE_SIDE);
		const ty = Math.floor(evt.offsetY / TILE_SIDE);
		if (clickState.entity === null) {
			clickState.entity = findNPCAtLocation(state, tx, ty);
		} else if (clickState.entity.x === tx && clickState.entity.y === ty) {
			clickState.entity = null;
		} else {
			clickState.entity.path = astar(map, clickState.entity.x, clickState.entity.y, tx, ty);
			clickState.entity = null;
			drawGame(ui, ctx, state);
		}
	});

	document.body.addEventListener('keydown', (evt) => {
		clickState.entity = null;
		if (evt.repeat) return;
		const sym = keyMap[evt.which];
		if (!sym) return;

		state.player.pendingCommand = keyCommands[sym];
		tick();
	});

	function tick() {
		const commands = [];
		state.entities.forEach((e) => {
			if (!e.brain) return;
			const cmd = BRAINS[e.brain](e, state);
			if (cmd) {
				commands.push(e, cmd);
			}
		});
		for (let ix = 0; ix < commands.length; ix += 2) {
			EXECUTORS.brain(commands[ix], state, commands[ix+1]);
		}
		drawGame(ui, ctx, state);
	}

	const state = {
		map: map,
		entities: [
			{
				x: 10,
				y: 10,
				color: 'black',
				brain: 'player',
				inventory: [],
				pendingCommand: null,
				lightsOn: true,
				lightRadius: 4,
				lightColor: [0.7, 0.5, 0.0]
			},
			{
				x: 2,
				y: 2,
				color: 'green',
				conveyable: true,
				lightsOn: true,
				lightRadius: 4,
				lightColor: [0.2, 0.7, 0.3]
			},
			{
				x: 4,
				y: 6,
				color: 'orange',
				conveyable: true
			},
			{
				x: 15,
				y: 8,
				color: 'blue',
				conveyable: true,
				lightsOn: true,
				lightRadius: 3,
				lightColor: [0.2, 0.2, 0.6]
			},
			{
				x: 20,
				y: 13,
				color: 'red',
				brain: 'randomWalker',
				path: null,
				lightsOn: true,
				lightRadius: 3,
				lightColor: [0.6, 0.1, 0.2]
			},
			{
				x: 12,
				y: 2,
				color: 'red',
				brain: 'randomWalker',
				path: null,
				lightsOn: true,
				lightRadius: 3,
				lightColor: [0.6, 0.1, 0.2]
			},
			{
				x: 18,
				y: 6,
				color: 'red',
				brain: 'randomWalker',
				path: null,
				lightsOn: true,
				lightRadius: 3,
				lightColor: [0.6, 0.1, 0.2]
			},
			{
				x: 0,
				y: 1,
				color: 'red',
				brain: 'randomWalker',
				path: null,
				roaming: true,
				lightsOn: true,
				lightRadius: 3,
				lightColor: [0.6, 0.1, 0.2]
			}
		]
	};

	state.player = state.entities[0];

	drawGame(ui, ctx, state);
}

function drawGame(ui, ctx, state) {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	const map = state.map;
	for (let y = 0; y < map.length; ++y) {
		for (let x = 0; x < map[0].length; ++x) {
			ctx.fillStyle = TILE_ATTRIBS[map[y][x]].color;
			ctx.fillRect(x * TILE_SIDE, y * TILE_SIDE, TILE_SIDE, TILE_SIDE);
		}
	}
	const pd = partition(state.entities, e => e.conveyable);
	pd[0].forEach(drawOne);
	pd[1].forEach(drawOne);

	//
	// Lighting

	// Base lightmap
	for (let y = 0; y < map.height; ++y) {
		for (let x = 0; x < map.width; ++x) {
			frameLightmap[y][x][0] = staticLightmap[y][x][0] + globalIllumination[0];
			frameLightmap[y][x][1] = staticLightmap[y][x][1] + globalIllumination[1];
			frameLightmap[y][x][2] = staticLightmap[y][x][2] + globalIllumination[2];
		}
	}

	// Per-entity point lighting
	state.entities.forEach((e) => {
		if (!e.lightsOn) return;

		const lightRadius = e.lightRadius;

		const marked = {};
		function mark(x, y) {
			if (!isPassable(state.map, x, y)) {
				return false;
			}
			marked[x + ',' + y] = true;
		}

		// Octants (this diagram is flipped on the y-axis):
		//  \2|1/
		//  3\|/0
		// ---+---
		//  4/|\7
		//  /5|6\
		for (let i = 0; i <= lightRadius; ++i) {
			bresenhamWalk(0, e.x, e.y, e.x + lightRadius, e.y + i, mark);		
			bresenhamWalk(7, e.x, e.y, e.x + lightRadius, e.y - i, mark);
			bresenhamWalk(3, e.x, e.y, e.x - lightRadius, e.y + i, mark);		
			bresenhamWalk(4, e.x, e.y, e.x - lightRadius, e.y - i, mark);
			bresenhamWalk(1, e.x, e.y, e.x + i, e.y + lightRadius, mark);
			bresenhamWalk(2, e.x, e.y, e.x - i, e.y + lightRadius, mark);
			bresenhamWalk(6, e.x, e.y, e.x + i, e.y - lightRadius, mark);
			bresenhamWalk(5, e.x, e.y, e.x - i, e.y - lightRadius, mark);
		}

		const lightX = e.x + 0.5;
		const lightY = e.y + 0.5;
		
		const x1 = lightX - lightRadius;
		const x2 = lightX + lightRadius + 1;
		const y1 = lightY - lightRadius;
		const y2 = lightY + lightRadius + 1;
		for (let y = y1; y < y2; ++y) {
			for (let x = x1; x < x2; ++x) {
				const dx = x - lightX;
				const dy = y - lightY;
				const d = Math.sqrt(dx*dx + dy*dy);
				const tx = Math.floor(x);
				const ty = Math.floor(y);
				if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) continue;	
				if (!marked[tx + ',' + ty]) continue;
				const i = clamp(lightRadius - d, 0, lightRadius) / lightRadius;
				frameLightmap[ty][tx][0] += e.lightColor[0] * i;
				frameLightmap[ty][tx][1] += e.lightColor[1] * i;
				frameLightmap[ty][tx][2] += e.lightColor[2] * i;
			}
		}
	});

	// Draw lighting
	ctx.save();
	ctx.globalCompositeOperation = 'multiply';
	for (let y = 0; y < map.height; ++y) {
		for (let x = 0; x < map.width; ++x) {
			const l = frameLightmap[y][x];
			const r = clamp(l[0], 0, 1);
			const g = clamp(l[1], 0, 1);
			const b = clamp(l[2], 0, 1);
			ctx.fillStyle = 'rgb(' + Math.floor(r*255) + ',' + Math.floor(g*255) + ',' + Math.floor(b*255) + ')';
			ctx.fillRect(x * TILE_SIDE, y * TILE_SIDE, TILE_SIDE, TILE_SIDE);
		}
	}
	ctx.restore();

	// Pending paths
	pd[1].forEach(e => {
		if (e.path && e.path.length) {
			let x = e.x, y = e.y;
			e.path.forEach(m => {
				x += m[0];
				y += m[1];
				drawCircle(x, y, e.color, 0.3);
			});
		}
	});

	// GUI

	populateItems(ui.inventory, state.player.inventory, false);
	populateItems(ui.onGround, findConveyableItemsAtLocation(state, state.player), true);

	function drawOne(e) {
		drawCircle(e.x, e.y, e.color, 1);
	}

	function drawCircle(x, y, color, opacity) {
		const oldAlpha = ctx.globalAlpha;
		ctx.beginPath();
		ctx.fillStyle = color;
		ctx.globalAlpha = opacity;
		ctx.arc(
			x * TILE_SIDE + TILE_SIDE / 2,
			y * TILE_SIDE + TILE_SIDE / 2,
			(TILE_SIDE / 2) - 3,
			0,
			Math.PI * 2,
			false
		);
		ctx.fill();
		ctx.globalAlpha = oldAlpha;
	}

	function populateItems(container, list, hideIfEmpty) {
		container.innerHTML = '';
		list.forEach((e) => {
			const el = document.createElement('div');
			el.className = 'itemtile';
			el.style.backgroundColor = e.color;
			el._entity = e;
			container.appendChild(el);
		});
		if (hideIfEmpty) {
			container.style.display = (list.length > 0) ? '' : 'none';
		}
	}
}

function partition(lst, test) {
	const yes = [], no = [];
	lst.forEach((item) => {
		(test(item) ? yes : no).push(item);
	});
	return [yes, no];
}

function findConveyableItemsAtLocation(state, position) {
	const out = [];
	state.entities.forEach((e) => {
		if (e.conveyable && e.x === position.x && e.y === position.y) {
			out.push(e);
		}
	});
	return out;
}

function isPassable(map, x, y) {
	if (x < 0 || y < 0 || x >= map[0].length || y >= map.length) {
		return false;
	} else {
		return TILE_ATTRIBS[map[y][x]].passable;
	}
}

function findNPCAtLocation(state, x, y) {
	for (var ix = 0; ix < state.entities.length; ++ix) {
		const e = state.entities[ix];
		if (e.brain && e.brain !== 'player' && e.x === x && e.y === y) {
			return e;
		}
	}
	return null;
}

function clamp(x, min, max) {
	return (x < min) ? min : ((x > max) ? max : x);
}

function bresenhamWalk(octant, x0,y0, x1,y1, cb) {
	let tmp;
	tmp = oi(x0, y0);
	x0 = tmp[0];
	y0 = tmp[1];
	tmp = oi(x1, y1);
	x1 = tmp[0];
	y1 = tmp[1];

	const dx = x1 - x0;
	const dy = y1 - y0;
	let D = 2*dy - dx;
	let y = y0;
	for (let x = x0; x <= x1; ++x) {
		if (oo(x, y) === false) {
			return;
		}
		if (D > 0) {
			y++;
			D = D - 2*dx;
		}
		D += 2*dy;
	}

	function oi(x, y) {
		switch (octant) {
			case 0: return [x, y];
			case 1: return [y, x];
			case 2: return [y, -x];
			case 3: return [-x, y];
			case 4: return [-x, -y];
			case 5: return [-y, -x];
			case 6: return [-y, x];
			case 7: return [x, -y];
		}
	}

	function oo(x, y) {
		switch(octant) {
			case 0: return cb(x, y);
			case 1: return cb(y, x);
			case 2: return cb(-y, x);
			case 3: return cb(-x, y);
			case 4: return cb(-x, -y);
			case 5: return cb(-y, -x);
			case 6: return cb(y, -x);
			case 7: return cb(x, -y);
		}
	}
}

},{"./a-star":1,"./tiles":3,"dom-bind":4}],3:[function(require,module,exports){
module.exports = [
	{ color: '#a0a0a0', passable: true },
	{ color: '#b0b0b0', passable: true },
	{ color: 'black', passable: false }
];
},{}],4:[function(require,module,exports){
var matches = require('dom-matchesselector');

var bind = null, unbind = null;

if (typeof window.addEventListener === 'function') {

	bind = function(el, evtType, cb, useCapture) {
		el.addEventListener(evtType, cb, useCapture || false);
		return cb;
	}

	unbind = function(el, evtType, cb, useCapture) {
		el.removeEventListener(evtType, cb, useCapture || false);
		return cb;
	}

} else if (typeof window.attachEvent === 'function') {

	bind = function(el, evtType, cb, useCapture) {
		
		function handler(evt) {
			evt = evt || window.event;
			
			if (!evt.preventDefault) {
				evt.preventDefault = function() { evt.returnValue = false; }
			}
			
			if (!evt.stopPropagation) {
				evt.stopPropagation = function() { evt.cancelBubble = true; }
			}

			cb.call(el, evt);
		}
		
		el.attachEvent('on' + evtType, handler);
		return handler;
	
	}

	unbind = function(el, evtType, cb, useCapture) {
		el.detachEvent('on' + evtType, cb);
		return cb;
	}

}

function delegate(el, evtType, selector, cb, useCapture) {
	return bind(el, evtType, function(evt) {
		var currTarget = evt.target;
		while (currTarget && currTarget !== el) {
			if (matches(selector, currTarget)) {
				evt.delegateTarget = currTarget;
				cb.call(el, evt);
				break;
			}
			currTarget = currTarget.parentNode;
		}
	}, useCapture);
}

function bind_c(el, evtType, cb, useCapture) {
	cb = bind(el, evtType, cb, useCapture);

	var removed = false;
	return function() {
		if (removed) return;
		removed = true;
		unbind(el, evtType, cb, useCapture);
		el = cb = null;
	}
}

function delegate_c(el, evtType, selector, cb, useCapture) {
	cb = delegate(el, evtType, selector, cb, useCapture);

	var removed = false;
	return function() {
		if (removed) return;
		removed = true;
		unbind(el, evtType, cb, useCapture);
		el = cb = null;
	}
}

exports.bind = bind;
exports.unbind = unbind;
exports.delegate = delegate;
exports.bind_c = bind_c;
exports.delegate_c = delegate_c;
},{"dom-matchesselector":5}],5:[function(require,module,exports){
var proto = window.Element.prototype;
var nativeMatch = proto.webkitMatchesSelector
					|| proto.mozMatchesSelector
					|| proto.msMatchesSelector
					|| proto.oMatchesSelector;

if (nativeMatch) {
	
	module.exports = function(selector, el) {
		return nativeMatch.call(el, selector);
	}

} else {

	console.warn("Warning: using slow matchesSelector()");
	
	var indexOf = Array.prototype.indexOf;
	module.exports = function(selector, el) {
		return indexOf.call(document.querySelectorAll(selector), el) >= 0;
	}

}

},{}],6:[function(require,module,exports){
function CMP(l,r) { return l-r; }

function MinHeap(scoreFn) {
  this.cmp = scoreFn || CMP;
  this.heap = [];
  this.size = 0;
}

MinHeap.prototype = {

  clear: function() {
    this.heap.length = 0;
    this.size = 0;
  },

  contains: function(item) {
    var heap = this.heap;
    for (var i = 0, sz = this.size; i < sz; ++i) {
      if (heap[i] === item)
        return true;
    }
    return false;
  },
  
  insert: function(item) {
    
    var heap  = this.heap,
        ix    = this.size++;
        
    heap[ix] = item;
    
    var parent = (ix-1)>>1;
    
    while ((ix > 0) && this.cmp(heap[parent], item) > 0) {
      var tmp = heap[parent];
      heap[parent] = heap[ix];
      heap[ix] = tmp;
      ix = parent;
      parent = (ix-1)>>1;
    }
        
  },
  
  removeHead: function() {
    
    var heap  = this.heap,
        cmp   = this.cmp;
    
    if (this.size === 0)
      return undefined;
      
    var out = heap[0];
    
    this._bubble(0);
    
    return out;
    
  },

  remove: function(item) {

    var heap = this.heap;

    for (var i = 0; i < this.size; ++i) {
      if (heap[i] === item) {
        this._bubble(i);
        return true;
      }
    }

    return false;

  },

  _bubble: function(ix) {

    var heap  = this.heap,
        cmp   = this.cmp;

    heap[ix] = heap[--this.size];
    heap[this.size] = null;

    while (true) {
      
      var leftIx  = (ix<<1)+1,
          rightIx = (ix<<1)+2,
          minIx   = ix;
      
      if (leftIx < this.size && cmp(heap[leftIx], heap[minIx]) < 0) {
        minIx = leftIx;
      }
      
      if (rightIx < this.size && cmp(heap[rightIx], heap[minIx]) < 0) {
        minIx = rightIx;
      }
      
      if (minIx !== ix) {
        var tmp = heap[ix];
        heap[ix] = heap[minIx];
        heap[minIx] = tmp;
        ix = minIx;
      } else {
        break;
      }
      
    }

  }

};

module.exports = MinHeap;
},{}]},{},[2]);
