var fragment, vertex;
jQuery.ajax({ async:false, dataType: "text", url:"js/shaders/fragment.glsl", success:function(data){ fragment = data; } });
jQuery.ajax({ async:false, dataType: "text", url:"js/shaders/vertex.glsl", success:function(data){ vertex = data; } });
//console.log(fragment)
// console.log(vertex)


window.requestAnimationFrame = window.requestAnimationFrame || ( function() {
	return  window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
	function(  callback, element ) {
		window.setTimeout( callback, 1000 / 60 );
	};
})();

var stats = new Stats();

var seed = Math.random()*1000;
var heightSeed = Math.random()*1000;
var growthSeed = Math.random()*1000;
var levelSeed = Math.random()*1000;

var dimension = 1.0;
var deformation = 0.0;
var forest = 0.2;
var water = 0.2;
var cohesion = 0.4;
var growth = 0.1;
var height = 0.2;

var canvas;
var gl;
var buffer;
var vertex_shader;
var fragment_shader;
var currentProgram;
var vertex_position;

var parameters = {
	start_time  : new Date().getTime(), 
	time        : 0, 
	screenWidth : 0, 
	screenHeight: 0
};


vertex_shader = vertex;
fragment_shader = fragment;
canvas = document.querySelector( 'canvas' );
try { gl = canvas.getContext( 'experimental-webgl' ); } catch( error ) { }
if ( !gl ) throw "cannot create webgl context";
buffer = gl.createBuffer();
gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( [ - 1.0, - 1.0, 1.0, - 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0 ] ), gl.STATIC_DRAW );
currentProgram = createProgram( vertex_shader, fragment_shader );
onWindowResize();
window.addEventListener( 'resize', onWindowResize, false );
document.body.appendChild( stats.domElement );

var Controls = function() {
	this.dimension = dimension;
	this.deformation = deformation;
	this.forest = forest;
	this.water = water;
	this.cohesion = cohesion;
	this.height = height;
	this.seed = function(){
		newSeed();
	};
};

var updateDimension = function(value){
	var limit;
	var aspectRatio = canvas.height / canvas.width;
	if(aspectRatio < 1) limit = canvas.height;
	else limit = canvas.width;
	dimension = Math.floor(limit * value);
	console.log(dimension)
}
var updateDeformation = function(value){
	deformation = value;
}
var updateforest = function(value){
	forest = value/2;
	console.log(forest)
}
var updatewater = function(value){
	water = 1.0 - value/2;
	console.log(water)
}
var updateCohesion = function(value){
	cohesion = Math.floor(value * 10);
	console.log(cohesion)
}
var updateHeight = function(value){
	height = value;
}

var text = new Controls();
var gui = new dat.GUI();
var dimensionController = gui.add(text, 'dimension', 0, 1).onChange(updateDimension);
var deformationController = gui.add(text, 'deformation', 0, 1).onChange(updateDeformation);
var forestController = gui.add(text, 'forest', 0, 1).onChange(updateforest);
var waterController = gui.add(text, 'water', 0, 1).onChange(updatewater);
var cohesionController = gui.add(text, 'cohesion', 0, 1).onChange(updateCohesion);
var heightController = gui.add(text, 'height', 0.0, 1.0).onChange(updateHeight);
gui.add(text, 'seed');

updateDimension(dimension);
updateDeformation(deformation);
updateforest(forest);
updatewater(water);
updateCohesion(cohesion);
updateHeight(height);


render();
function createProgram( vertex, fragment ) {
	var program = gl.createProgram();
	var vs = createShader( vertex, gl.VERTEX_SHADER );
	var fs = createShader( '#ifdef GL_ES\nprecision highp float;\n#endif\n\n' + fragment, gl.FRAGMENT_SHADER );
	if ( vs == null || fs == null ) return null;
	gl.attachShader( program, vs );
	gl.attachShader( program, fs );
	gl.deleteShader( vs );
	gl.deleteShader( fs );
	gl.linkProgram( program );
	if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) {
		alert( "ERROR:\n" +
		"VALIDATE_STATUS: " + gl.getProgramParameter( program, gl.VALIDATE_STATUS ) + "\n" +
		"ERROR: " + gl.getError() + "\n\n" +
		"- Vertex Shader -\n" + vertex + "\n\n" +
		"- Fragment Shader -\n" + fragment );
		return null;
	}
	return program;
}
function createShader( src, type ) {
	var shader = gl.createShader( type );
	gl.shaderSource( shader, src );
	gl.compileShader( shader );
	if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
		alert( ( type == gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT" ) + " SHADER:\n" + gl.getShaderInfoLog( shader ) );
		return null;
	}
	return shader;
}
function onWindowResize( event ) {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	parameters.screenWidth = canvas.width;
	parameters.screenHeight = canvas.height;
	gl.viewport( 0, 0, canvas.width, canvas.height );
}
function animate() {
	
}
function render() {
	if ( !currentProgram ) return;
	stats.begin();
	parameters.time = new Date().getTime() - parameters.start_time;
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
	// Load program into GPU
	gl.useProgram( currentProgram );
	// Set values to program variables
	gl.uniform1f( gl.getUniformLocation( currentProgram, 'seed' ), seed );
	gl.uniform1f( gl.getUniformLocation( currentProgram, 'heightSeed' ), heightSeed );
	gl.uniform1f( gl.getUniformLocation( currentProgram, 'growthSeed' ), growthSeed );
	gl.uniform1f( gl.getUniformLocation( currentProgram, 'levelSeed' ), levelSeed );
	gl.uniform1f( gl.getUniformLocation( currentProgram, 'deformation' ), deformation );
	gl.uniform1f( gl.getUniformLocation( currentProgram, 'forest' ), forest );
	gl.uniform1f( gl.getUniformLocation( currentProgram, 'water' ), water );
	gl.uniform1f( gl.getUniformLocation( currentProgram, 'chession' ), 0.1 );
	gl.uniform1f( gl.getUniformLocation( currentProgram, 'dimension' ), dimension);
	gl.uniform2f( gl.getUniformLocation( currentProgram, 'resolution' ), parameters.screenWidth, parameters.screenHeight );
	// Render geometry
	gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
	gl.vertexAttribPointer( vertex_position, 2, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vertex_position );
	gl.drawArrays( gl.TRIANGLES, 0, 6 );
	gl.disableVertexAttribArray( vertex_position );
	stats.end();
	requestAnimationFrame( render );
}
var newSeed = function(){
	seed = Math.random()*1000;
	heightSeed = Math.random()*1000;
	growthSeed = Math.random()*1000;
	levelSeed = Math.random()*1000;
}
