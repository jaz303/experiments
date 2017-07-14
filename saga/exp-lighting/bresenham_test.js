[3,5,7,9,11,13,15,17,19].forEach(size => {
	const array = new Array(size);
	for (let ix = 0; ix < size; ++ix) {
		array[ix] = new Array(size);
		array[ix].fill(0);
	}
	const center = Math.floor(size / 2);

	function inc(x, y) {
		array[y][x]++;
	}

	for (var x = 0; x < size; ++x) {
		bresenhamWalk(center, center, x, 0, inc);
		bresenhamWalk(center, center, x, size-1, inc);
		bresenhamWalk(center, center, 0, x, inc);
		bresenhamWalk(center, center, size-1, x, inc);
	}
	
	console.log("" + size + " x " + size + ":");
	console.log(array);
	console.log("");
});

// Adapted from:
// https://github.com/ssloy/tinyrenderer/wiki/Lesson-1:-Bresenham%E2%80%99s-Line-Drawing-Algorithm
function bresenhamWalk(x0,y0, x1,y1, cb) {
	let steep = false; 
	let tmp;
	if (Math.abs(x0-x1) < Math.abs(y0-y1)) { 
		tmp = x0; x0 = y0; y0 = tmp;
		tmp = x1; x1 = y1; y1 = tmp;
		steep = true; 
	} 
	if (x0 > x1) {
		tmp = x0; x0 = x1; x1 = tmp;
		tmp = y0; y0 = y1; y1 = tmp; 
	} 
	const dx = x1 - x0; 
	const dy = y1 - y0; 
	const derror2 = Math.abs(dy) * 2; 
	let error2 = 0; 
	let y = y0; 
	for (let x = x0; x <= x1; x++) { 
	    if (steep) { 
	    	cb(y, x);
	    } else { 
	    	cb(x, y);
	    } 
	    error2 += derror2; 
	    if (error2 > dx) { 
	        y += (y1>y0 ? 1 : -1); 
	        error2 -= dx * 2; 
	    }
	} 
}
