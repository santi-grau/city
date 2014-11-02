var Noise = Backbone.Model.extend({
	defaults: {
		r : Math,
		grad3 : [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],
		p : [],
		perm : [],
		simplex : [[0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],[0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],[1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],[2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]]
	},
	initialize: function(data){
		if(data && data.r) this.set('r', data.r);
		var p = perm = [];
		for (var i=0; i<256; i++) p[i] = perm[i] = perm[i+256] = Math.floor(this.get('r').random()*256);
		this.set('p', p);
		this.set('perm', perm);
		console.log(this.get('simplex').length)
	},
	dot: function(g, x, y){
		return g[0]*x + g[1]*y;
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
		if(t0<0) n0 = 0.0;
		else {
			t0 *= t0;
			n0 = t0 * t0 * this.dot(grad3[gi0], x0, y0); // (x,y) of grad3 used for 2D gradient
		}
		var t1 = 0.5 - x1*x1-y1*y1;
		if(t1<0) n1 = 0.0;
		else {
			t1 *= t1;
			n1 = t1 * t1 * this.dot(grad3[gi1], x1, y1);
		}
		var t2 = 0.5 - x2*x2-y2*y2;
		if(t2<0) n2 = 0.0;
		else {
			t2 *= t2;
			n2 = t2 * t2 * this.dot(grad3[gi2], x2, y2);
		}
		// Add contributions from each corner to get the final noise value.
		// The result is scaled to return values in the interval [-1,1].
		return 70.0 * (n0 + n1 + n2);
	}
})



var SeedableRandom = Backbone.Model.extend({
	defaults: {
		seed : new Date().getTime(),
		x : null,
		y : null
	},
	initialize: function(data){
		if(data && data.seed) this.set('seed', data.seed);
		this.set({
			x : this.get('seed') * 3253,
			y : this.nextX()
		});
	},
	random: function(){
		var x = this.get('x');
		var y = this.get('y');
		if (x == 0) x == -1;
		if (y == 0) y == -1;
		this.set('x', this.nextX());
		this.set('y', this.nextY());
		return ((this.get('x') << 16) + (this.get('y') & 0xFFFF)) / 0xFFFFFFFF + 0.5;
	},
	nextX: function(){
		return 36969 * (this.get('x') & 0xFFFF) + (this.get('x') >> 16);
	},
	nextY: function(){
		return 18273 * (this.get('x') & 0xFFFF) + (this.get('x') >> 16);
	},
});


var r = new SeedableRandom({ seed : 1414959060900 });
// var r = new SeedableRandom();
var p = new Noise({ r : r });
// Dimensions of the landscape.
var tilesHeight = 200;
var tilesWidth = 200;


// Gather our HTML template as an array of strings for output.
var html = [];

html.push("<table>");
for (var y = 0; y < tilesHeight; y++) {
    html.push("<tr>");
    
    for (var x = 0; x < tilesWidth; x++) {
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
console.log("Seed generation ------> " + r.get('seed'))