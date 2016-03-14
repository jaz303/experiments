import {createControlState} from './keystate';

const ceil = Math.ceil;
const floor = Math.floor;
const rand = Math.random;
const min = Math.min;

const emoji = {
	SMILE: String.fromCharCode(55357) + String.fromCharCode(56835)
};

const INITIAL_TILE_SIZE = 32;
const MIN_TILE_SIZE = 4;
const MAX_TILE_SIZE = 64;
const SCROLL_SPEED	= MAX_TILE_SIZE / 4;

const terrainTypes = [
	{
		name: 'water',
		color: 'blue'
	},
	{
		name: 'grass',
		color: 'green'
	},
	{
		name: 'rock',
		color: 'grey'
	},
	{
		name: 'sand',
		color: 'yellow'
	},
	{
		name: 'lava',
		color: 'red'
	},
	{
		name: 'soil',
		color: 'brown'
	}
];

class Map {
	constructor(tilesWide, tilesTall, terrain) {
		this.tilesWide = tilesWide;
		this.tilesTall = tilesTall;
		this.terrain = terrain;
	}

	terrainAt(x, y) {
		return this.terrain[(y * this.tilesWide) + x];
	}
}

class Camera {
	constructor(map) {
		this.map = map;
		this.x = floor((map.tilesWide * MAX_TILE_SIZE) / 2);
		this.y = floor((map.tilesTall * MAX_TILE_SIZE) / 2);
		this.tileSize = INITIAL_TILE_SIZE;	
	}
	
	pixelToWorldPixel(x, y, out) {
		return false;

		out.x = x + this.x;
		out.y = y + this.y;
		if (out.x < 0 || out.y < 0) return false;
		if (out.x >= this.map.tilesWide * this.tileSize) return false;
		if (out.y >= this.map.tilesTall * this.tileSize) return false;
		return true;
	}

	pixelToWorldTile(x, y, out) {
		return false;

		if (!this.pixelToWorldPixel(x, y, out)) {
			return false;
		}
		out.x = floor(out.x / this.tileSize);
		out.y = floor(out.y / this.tileSize);
		return true;
	}
}

function generateMap(width, height) {
	const numTiles = width * height;
	const terrain = new Array(width * height);
	for (let ix = 0; ix < numTiles; ++ix) {
		terrain[ix] = terrainTypes[floor(rand() * terrainTypes.length)];
	}
	return new Map(width, height, terrain);
}

function render(ctx, map, camera) {
	const canvasWidth = ctx.canvas.width;
	const canvasHeight = ctx.canvas.height;
	const tileSize = camera.tileSize;

	ctx.clearRect(0, 0, canvasWidth, canvasHeight);

	const scale = tileSize / MAX_TILE_SIZE;
	const cornerX = (camera.x * scale) - (canvasWidth / 2);
	const cornerY = (camera.y * scale) - (canvasHeight / 2);
	const canvasTilesWide = ceil(canvasWidth / tileSize);
	const canvasTilesTall = ceil(canvasHeight / tileSize);

	const minTileX = floor(cornerX / tileSize);
	const startX = -mod(cornerX, tileSize);
	const minTileY = floor(cornerY / tileSize);
	let y = -mod(cornerY, tileSize);
	const maxTileX = min(map.tilesWide, minTileX + canvasTilesWide + 1);
	const maxTileY = min(map.tilesTall, minTileY + canvasTilesTall + 1);

	for (let row = minTileY; row < maxTileY; ++row) {
		if (row >= 0) {
			let x = startX;
			for (let col = minTileX; col < maxTileX; ++col) {
				if (col >= 0) {
					let t = map.terrainAt(col, row);
					ctx.fillStyle = t.color;
					ctx.fillRect(x, y, tileSize, tileSize);	
				}
				x += tileSize;
			}	
		}
		y += tileSize;
	}

	ctx.strokeStyle = 'rgba(15,15,15,0.3)';

	ctx.beginPath();
	ctx.moveTo(canvasWidth / 2, 0);
	ctx.lineTo(canvasWidth / 2, canvasHeight)
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(0, canvasHeight / 2);
	ctx.lineTo(canvasWidth, canvasHeight / 2);
	ctx.stroke();

}

window.init = function() {
    var canvas = document.querySelector('#canvas');
    var ctx = canvas.getContext('2d');

    var map = generateMap(100, 100);
    var camera = new Camera(map);

    var controls = createControlState({
    	16 	: 'shift',
    	37	: 'scrollLeft',
    	38 	: 'scrollUp',
    	39	: 'scrollRight',
    	40	: 'scrollDown',
    	187	: 'zoomIn',
    	189	: 'zoomOut'
    });

    var controlState = controls.state;

    canvas.onkeydown = (evt) => {
    	if (evt.repeat) return;
    	controls.down(evt.which);
    }
	
	canvas.onkeyup = (evt) => {
		if (evt.repeat) return;
		controls.up(evt.which);
	}
	
    canvas.onclick = (evt) => {
    	var tile = {x: null, y: null};
    	var valid = camera.pixelToWorldTile(evt.offsetX, evt.offsetY, tile);
    	if (valid) {
    		console.log("click", tile);
    	}
    }

	canvas.focus();

	setInterval(() => {
		const scrollSpeed = SCROLL_SPEED * (controlState.shift.isDown ? 4 : 1);
		const now = Date.now();
		if (controlState.scrollUp.isDown) {
			camera.y -= scrollSpeed;
		} else if (controlState.scrollDown.isDown) {
			camera.y += scrollSpeed;
		}
		if (controlState.scrollLeft.isDown) {
			camera.x -= scrollSpeed;
		} else if (controlState.scrollRight.isDown) {
			camera.x += scrollSpeed;
		}
		if (controlState.zoomIn.isDown && controlState.zoomIn.halfTransitionCount) {
			if (camera.tileSize < MAX_TILE_SIZE) {
				camera.tileSize *= 2;	
			}
		} else if (controlState.zoomOut.isDown && controlState.zoomOut.halfTransitionCount) {
			if (camera.tileSize > MIN_TILE_SIZE) {
				camera.tileSize /= 2;	
			}
		}
		render(ctx, map, camera);
		controls.frameReset();
	}, 33.33333);
}


function mod(l, r) {
    return ((l%r)+r)%r;
};