import {mat4, vec3} from 'gl-matrix';
import * as glh from './glh';

var fs = require('fs');

var pMatrix;
var mvMatrix;

var shaderSources = {
	vertex: fs.readFileSync(__dirname + '/shaders/vertex.glsl'),
	fragment: fs.readFileSync(__dirname + '/shaders/fragment.glsl')	
};

window.init = function() {
	var canvas = document.querySelector('#canvas');
 	var gl = canvas.getContext('webgl');

 	glh.setContext(gl);

 	gl.viewport(0, 0, canvas.width, canvas.height);

 	gl.clearColor(0, 0, 0, 1);
 	gl.enable(gl.DEPTH_TEST);
 	gl.depthFunc(gl.LEQUAL);
 	gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

 	var program = glh.compileShaderProgramFromSources(shaderSources.vertex, shaderSources.fragment);
 	gl.useProgram(program);

	pMatrix = mat4.create();
 	mat4.perspective(pMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);

 	mvMatrix = mat4.create();
 	mat4.identity(mvMatrix);
 	mat4.translate(mvMatrix, mvMatrix, vec3.fromValues(0, 0, -7));
 	//mat4.lookAt(vMatrix, vec3.create(0, 0, 2), vec3.create(0, 0, 1), vec3.create(0, 1, 0));

 	var lVertexPosition = gl.getAttribLocation(program, 'vertexPosition');
 	gl.enableVertexAttribArray(lVertexPosition);

 	var lPMatrix = gl.getUniformLocation(program, 'pMatrix');
 	gl.uniformMatrix4fv(lPMatrix, false, pMatrix);

 	console.log(pMatrix);
 	console.log(mvMatrix);

 	var lMVMatrix = gl.getUniformLocation(program, 'mvMatrix');
 	gl.uniformMatrix4fv(lMVMatrix, false, mvMatrix);

 	// console.log(lVertexPosition, lMVPMatrix);

	var square = createSquare(gl);
	square.bind();
 	square.draw(lVertexPosition);

 	gl.flush();
}





function Shape(gl, drawMode, floatData) {
	this.gl = gl;
	this.drawMode = drawMode;
	this.itemSize = 3;
	this.numItems = floatData.length / 3;
	this.vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
	gl.bufferData(gl.ARRAY_BUFFER, floatData, gl.STATIC_DRAW);
}

Shape.prototype.bind = function() {
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
}

Shape.prototype.draw = function(ixPos) {
	var gl = this.gl;
	if (ixPos != null) {
		gl.vertexAttribPointer(ixPos, this.itemSize, gl.FLOAT, false, 0, 0);
		gl.drawArrays(this.drawMode, 0, this.numItems);	
	}
}

function createSquare(gl) {
	return new Shape(gl, gl.TRIANGLE_STRIP, new Float32Array([
	    1.0,  1.0,  0.0,
	    -1.0, 1.0,  0.0,
	    1.0,  -1.0, 0.0,
	    -1.0, -1.0, 0.0
  	]));
}



function createFloor(gl, y, size) {
	// var hs = size / 2;
	// var positions = new Float32Array([
	// 	-hs, y, hs,
	// 	-hs, y, -hs,
	// 	hs, y, hs,
	// 	hs, y, -hs
	// ]);

	// var buffer = gl.createBuffer();
	// gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	// gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

function createXWall() {

}

function createZWall() {

}
