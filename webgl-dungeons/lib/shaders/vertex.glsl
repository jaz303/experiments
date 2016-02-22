precision mediump float;

attribute vec3 vertexPosition;
uniform mat4 pMatrix;
uniform mat4 mvMatrix;

void main() {
  	gl_Position = pMatrix * mvMatrix * vec4(vertexPosition, 1.0);
}
