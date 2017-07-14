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
	left: ['move', DIRECTIONS[3]]
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
		39: 'right'
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
				pendingCommand: null
			},
			{
				x: 2,
				y: 2,
				color: 'green',
				conveyable: true
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
				conveyable: true
			},
			{
				x: 20,
				y: 13,
				color: 'red',
				brain: 'randomWalker',
				path: null
			},
			{
				x: 12,
				y: 2,
				color: 'red',
				brain: 'randomWalker',
				path: null
			},
			{
				x: 18,
				y: 6,
				color: 'red',
				brain: 'randomWalker',
				path: null
			},
			{
				x: 0,
				y: 1,
				color: 'red',
				brain: 'randomWalker',
				path: null,
				roaming: true
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

	pd[1].forEach(e => {
		if (e.path && e.path.length) {
			let x = e.x, y = e.y;
			e.path.forEach(m => {
				x += m[0];
				y += m[1];
				drawCircle(x, y, e.color, 0.15);
			});
		}
	});

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