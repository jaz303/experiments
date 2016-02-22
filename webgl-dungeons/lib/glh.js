var gl = null;

exports.setContext = function(_gl) {
	gl = _gl;
}

exports.compileShader = compileShader;
function compileShader(type, source) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw new Error("shader compile error!");
	}
	return shader;
}

// TODO: cleanup
exports.compileShaderProgramFromSources = compileShaderProgramFromSources;
function compileShaderProgramFromSources(vertexShaderSource, fragmentShaderSource) {
	var vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
	var fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		throw new Error("program compile error");
	}
	return program;
}