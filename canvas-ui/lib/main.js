window.init = function() {
	var canvas = document.querySelector('#canvas');
	var ctx = canvas.getContext('2d');
    
    var root = new RootWidget(new Rect(0, 0, canvas.width, canvas.height));

    var b1 = new Button(new Rect(10, 10, 100, 50));
    b1.backgroundColora = 'red';
    root.add(b1);

    var b2 = new Button(new Rect(300, 50, 100, 50));
    b2.backgroundColor = 'green';
    root.add(b2);

    canvas.addEventListener('mousedown', (evt) => {
    	var outPoint = new Point();
    	var target = root.findEventTarget(evt.offsetX, evt.offsetY, outPoint);
    	if (target) {
    		target.mouseDown({pos: outPoint});
    	}
    });

    canvas.addEventListener('mouseup', (evt) => {

    });

    canvas.addEventListener('mousemove', (evt) => {

    });

    root.render(ctx);
}

class Point {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

class Rect {
	constructor(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	get left() { return this.x; }
	get right() { return this.x + this.width; }
	get top() { return this.y; }
	get bottom() { return this.y + this.height; }

	containsPoint(x, y) {
		return x >= this.left
				&& x <= this.right
				&& y >= this.top
				&& y <= this.bottom;
	}
}

class Widget {
	constructor(rect) {
		this._rect = rect || new Rect();
	}

	get rect() {
		return this._rect;
	}

	set rect(r) {
		this._rect = r;
	}

	findEventTarget(x, y, outPoint) {
		outPoint.x = x;
		outPoint.y = y;
		return this;
	}

	render(ctx) {

	}
}

class RootWidget extends Widget {
	constructor(rect) {
		super(rect);
		this.children = [];
	}

	render(ctx) {
		ctx.save();
		ctx.fillStyle = '#a0a0a0';
		ctx.translate(this._rect.x, this._rect.y);
		ctx.fillRect(0, 0, this._rect.width, this._rect.height);

		this.children.forEach((child) => {
			ctx.save();
			ctx.translate(child.rect.x, child.rect.y);
			child.render(ctx);
			ctx.restore();
		});

		ctx.restore();
	}

	add(child) {
		this.children.push(child);
	}

	findEventTarget(x, y, outPoint) {
		for (var ix = this.children.length - 1; ix >= 0; --ix) {
			var ch = this.children[ix];
			if (ch.rect.containsPoint(x, y)) {
				return ch.findEventTarget(
					x - ch.rect.x,
					y - ch.rect.y,
					outPoint
				);
			}
		}
		return super.findEventTarget(x, y, outPoint);
	}

	mouseDown(evt) {
		console.log("boom");
	}
}

class Button extends Widget {
	constructor(rect) {
		super(rect);
		this.backgroundColor = 'blue';
	}

	render(ctx) {
		ctx.fillStyle = this.backgroundColor;
		ctx.fillRect(0, 0, this.rect.width, this.rect.height);
	}

	mouseDown(evt) {
		console.log("mouse down - button!", evt.pos.x, evt.pos.y);
	}
}