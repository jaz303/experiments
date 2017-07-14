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