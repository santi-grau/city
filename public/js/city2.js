var Noise = Backbone.Model.extend({
	defaults: {
		seed : new Date().getTime(),
		x : null,
		y : null,
		grad3 : [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],
		p : [],
		perm : []
	},
	initialize: function(data){
		if(data && data.seed) this.set('seed', data.seed);
		this.set({
			x : this.get('seed') * 3253,
			y : this.neighbor(36969)
		});
		var p = perm = [];
		for (var i=0; i<256; i++) p[i] = perm[i] = perm[i+256] = Math.floor(this.random()*256);
		this.set('p', p);
		this.set('perm', perm);
	},
	neighbor: function(val){
		return val * (this.get('x') & 65535) + (this.get('x') >> 16);
	},
	random: function(){
		var num = this.get('x');
		if (this.get('x') == 0) this.set('x', -1);
		else this.set('x', this.neighbor(36969));
		if (this.get('y') == 0) this.set('y', -1);
		else this.set('y', this.neighbor(18273));
		return ((this.get('x') << 16) + (this.get('y') & 65535)) / 4294967295 + 0.5;
	},
	noise: function(xin, yin){
		var perm = this.get('perm');
		var grad3 = this.get('grad3');
		var n0, n1, n2; // Noise contributions from the three corners
		// Skew the input space to determine which simplex cell we're in
		var F2 = 0.5*(Math.sqrt(3.0)-1.0);
		var s = (xin+yin)*F2; // Hairy factor for 2D
		var i = Math.floor(xin+s);
		var j = Math.floor(yin+s);
		var G2 = (3.0-Math.sqrt(3.0))/6.0;
		var t = (i+j)*G2;
		var X0 = i-t; // Unskew the cell origin back to (x,y) space
		var Y0 = j-t;
		var x0 = xin-X0; // The x,y distances from the cell origin
		var y0 = yin-Y0;
		// For the 2D case, the simplex shape is an equilateral triangle.
		// Determine which simplex we are in.
		var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
		if(x0>y0) {i1=1; j1=0;} // lower triangle, XY order: (0,0)->(1,0)->(1,1)
		else {i1=0; j1=1;} // upper triangle, YX order: (0,0)->(0,1)->(1,1)
		// A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
		// a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
		// c = (3-sqrt(3))/6
		var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
		var y1 = y0 - j1 + G2;
		var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
		var y2 = y0 - 1.0 + 2.0 * G2;
		// Work out the hashed gradient indices of the three simplex corners
		var ii = i & 255;
		var jj = j & 255;
		var gi0 = perm[ii+perm[jj]] % 12;
		var gi1 = perm[ii+i1+perm[jj+j1]] % 12;
		var gi2 = perm[ii+1+perm[jj+1]] % 12;
		// Calculate the contribution from the three corners
		var t0 = 0.5 - x0*x0-y0*y0;
		var t1 = 0.5 - x1*x1-y1*y1;
		var t2 = 0.5 - x2*x2-y2*y2;
		if(t0<0) n0 = 0.0;
		else n0 = Math.pow(t0,2) * Math.pow(t0,2) * (grad3[gi0][0]*x0 + grad3[gi0][1]*y0); // (x,y) of grad3 used for 2D gradient
		if(t1<0) n1 = 0.0;
		else n1 = Math.pow(t1,2) * Math.pow(t1,2) * (grad3[gi1][0]*x1 + grad3[gi1][1]*y1);
		if(t2<0) n2 = 0.0;
		else n2 = Math.pow(t2,2) * Math.pow(t2,2) * (grad3[gi2][0]*x2+ grad3[gi2][1]*y2);
		// Add contributions from each corner to get the final noise value.
		// The result is scaled to return values in the interval [-1,1].
		return 70.0 * (n0 + n1 + n2);
	}
})




var p = new Noise({ });
// Dimensions of the landscape.
var tilesHeight = 200;
var tilesWidth = 200;
// Gather our HTML template as an array of strings for output.
var html = [];
html.push("<table>");
for (var y = 0; y < tilesHeight; y++) {
    html.push("<tr>");
    
    for (var x = 0; x < tilesWidth; x++) {
    	p.noise(x,y);
        var detail = Math.abs(p.noise(x / 300.0, y / 300.0));
        var desert1 = -p.noise(x / 100.0, y / 100.0);
        var desert2 = p.noise(x / 10.0, y / 10.0);
        var desertp = desert1 * detail + desert2 * (1.0 - detail);
        var waterp = p.noise(x / 150.0, y / 150.0);
        var roadsp = (Math.abs(p.noise(x / 50.0, y / 50.0)));
        var treep = Math.max(0, p.noise(x / 300.0, y / 300.0)) + p.noise(x / 3.0, y / 3.0);
        // water
        var oasis = desertp > 0.95;
        var lake = desertp < -0.6;
        var river = desert1 < 0.6 && Math.abs(waterp) < 0.075;
        // desert
        var desert = desertp > 0.6 && desertp < 1.0 || desert1 > 0.8;
        // roads
        var roads = Math.abs(roadsp) < 0.05;
        var riversideRoads = desertp < 0.6 && Math.abs(waterp) < 0.11 && Math.abs(waterp > 0.08);
        // trees
        var trees = treep > 1.15;
        
        if (lake || river || oasis) {
            terrain = "water";
        }
        else if (roads || riversideRoads) {
            terrain = "road";
        } 
        else if (desert) {
            terrain = "sand";
        } 
        else if (trees) {
            terrain = "trees";
        } 
        else {
            terrain = "grass";
        }
        html.push("<td class='" + terrain + "'> </td>");
    }
    html.push("</tr>");
}
html.push("</table>");
document.getElementById("map").innerHTML += html.join("");





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

init();
animate();
function init() {
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
}
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
	requestAnimationFrame( animate );
	render();
}
function render() {
	if ( !currentProgram ) return;
		parameters.time = new Date().getTime() - parameters.start_time;
		gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
		// Load program into GPU
		gl.useProgram( currentProgram );
		// Set values to program variables
		gl.uniform1f( gl.getUniformLocation( currentProgram, 'time' ), parameters.time / 1000 );
		gl.uniform2f( gl.getUniformLocation( currentProgram, 'resolution' ), parameters.screenWidth, parameters.screenHeight );
		// Render geometry
		gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
		gl.vertexAttribPointer( vertex_position, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( vertex_position );
		gl.drawArrays( gl.TRIANGLES, 0, 6 );
		gl.disableVertexAttribArray( vertex_position );
	}
