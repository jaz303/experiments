const ev = require('dom-bind');

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

const keyCommands = {
	up: ['move', DIRECTIONS[0]],
	right: ['move', DIRECTIONS[1]],
	down: ['move', DIRECTIONS[2]],
	left: ['move', DIRECTIONS[3]]
};

const BRAINS = {
	random(entity, state) {
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
	player(entity, state) {
		if (!entity.pendingCommand) return;
		const cmd = entity.pendingCommand;
		switch (cmd[0]) {
			case 'move':
				entity.x += cmd[1][0];
				entity.y += cmd[1][1];
				break;
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
		entity.pendingCommand = null;
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

	let keyMap = {
		38: 'up',
		40: 'down',
		37: 'left',
		39: 'right'
	};

	canvas.addEventListener('keydown', (evt) => {
		if (evt.repeat) return;
		const sym = keyMap[evt.which];
		if (!sym) return;

		state.player.pendingCommand = keyCommands[sym];
		tick();
	});

	function tick() {
		state.entities.forEach(e => {
			if (!e.brain) return;
			BRAINS[e.brain](e, state);
		});
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

	state.player = state.entities[0];

	drawGame(ui, ctx, state);
}

function drawGame(ui, ctx, state) {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	const map = state.map;
	for (let y = 0; y < map.length; ++y) {
		for (let x = 0; x < map[0].length; ++x) {
			ctx.fillStyle = TILE_FILL[map[y][x]];
			ctx.fillRect(x * TILE_SIDE, y * TILE_SIDE, TILE_SIDE, TILE_SIDE);
		}
	}
	const pd = partition(state.entities, e => e.conveyable);
	pd[0].forEach(drawOne);
	pd[1].forEach(drawOne);

	populateItems(ui.inventory, state.player.inventory, false);
	populateItems(ui.onGround, findConveyableItemsAtLocation(state, state.player), true);

	function drawOne(e) {
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
	}

	function populateItems(container, list, hide) {
		container.innerHTML = '';
		list.forEach((e) => {
			const el = document.createElement('div');
			el.className = 'itemtile';
			el.style.backgroundColor = e.color;
			el._entity = e;
			container.appendChild(el);
		});
		if (hide) {
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