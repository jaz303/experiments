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
			frameLightmap[y][x][0] = staticLightmap[y][x][0];
			frameLightmap[y][x][1] = staticLightmap[y][x][1];
			frameLightmap[y][x][2] = staticLightmap[y][x][2];
		}
	}

	// Per-entity point lighting
	state.entities.forEach((e) => {
		if (!e.lightsOn) return;

		const lightRadius = e.lightRadius;

		// Step 1 - calculate which tiles are lit
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
