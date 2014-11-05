uniform vec2 resolution;
uniform float seed;
uniform float heightSeed;
uniform float growthSeed;
uniform float levelSeed;
uniform float deformation;
uniform float forest;
uniform float water;
uniform float dimension;
precision mediump float;


//
// GLSL textureless classic 2D noise "cnoise",
// with an RSL-style periodic variant "pnoise".
// Author:	Stefan Gustavson (stefan.gustavson@liu.se)
// Version: 2011-08-22
//
// Many thanks to Ian McEwan of Ashima Arts for the
// ideas for permutation and gradient selection.
//
// Copyright (c) 2011 Stefan Gustavson. All rights reserved.
// Distributed under the MIT license. See LICENSE file.
// https://github.com/ashima/webgl-noise
//

vec4 mod289(vec4 x){
	return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 permute(vec4 x){
	return mod289(((x*34.0)+1.0)*x);
}
vec4 taylorInvSqrt(vec4 r){
	return 1.79284291400159 - 0.85373472095314 * r;
}
vec2 fade(vec2 t) {
	return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise, periodic variant
float pnoise(vec2 P, vec2 rep){
	vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
	vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
	Pi = mod(Pi, rep.xyxy); // To create noise with explicit period
	Pi = mod289(Pi); // To avoid truncation effects in permutation
	vec4 ix = Pi.xzxz;
	vec4 iy = Pi.yyww;
	vec4 fx = Pf.xzxz;
	vec4 fy = Pf.yyww;
	vec4 i = permute(permute(ix) + iy);
	vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0 ;
	vec4 gy = abs(gx) - 0.5 ;
	vec4 tx = floor(gx + 0.5);
	gx = gx - tx;
	vec2 g00 = vec2(gx.x,gy.x);
	vec2 g10 = vec2(gx.y,gy.y);
	vec2 g01 = vec2(gx.z,gy.z);
	vec2 g11 = vec2(gx.w,gy.w);
	vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
	g00 *= norm.x;
	g01 *= norm.y;
	g10 *= norm.z;
	g11 *= norm.w;
	float n00 = dot(g00, vec2(fx.x, fy.x));
	float n10 = dot(g10, vec2(fx.y, fy.y));
	float n01 = dot(g01, vec2(fx.z, fy.z));
	float n11 = dot(g11, vec2(fx.w, fy.w));
	vec2 fade_xy = fade(Pf.xy);
	vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
	float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
	return 2.3 * n_xy;
}

float turbulence( vec2 p ) {
	float t = -0.1;
	for (float f = 1.0 ; f <= 10.0 ; f++ ){
		float power = pow( 1.5, f );
		t += abs( pnoise( vec2( power * p ), vec2( 10.0, 10.0 ) ) / power );
	}
	return t;
}

bool pP(vec2 p, float noise){
	if(length(vec2(p.x, p.y)) < dimension / 2.0 - noise * dimension / 1.8 * deformation && noise > forest && noise < water) return true;
	else return false;
}

void main( void ) {
	vec2 p = floor(gl_FragCoord.xy - resolution.xy / 2.0);
	float noise = turbulence( vec2( gl_FragCoord.xy / resolution.xy ) + seed);
	//float heightNoise = turbulence( vec2( gl_FragCoord.xy / resolution.xy ) * 3.0 + heightSeed );
	//float growthNoise = turbulence( vec2( gl_FragCoord.xy / resolution.xy ) * 3.0 + growthSeed );
	//float levelNoise = turbulence( vec2( gl_FragCoord.xy / resolution.xy ) * 3.0 + levelSeed );
	//float height = heightNoise;
	//float growth = growthNoise;
	//float level = floor(levelNoise * 10.0) / 10.0;
	float point = floor(noise * 10.0) / 10.0;
	if( pP(p, noise) ){
		gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
	}else if( noise < forest && noise < 0.5){
		gl_FragColor = vec4( 0.0, 1.0, 0.0, 1.0 );
	}else if( noise > water && noise > 0.5){
		gl_FragColor = vec4( 0.0, 0.0, 1.0, 1.0 );
	} else{
		gl_FragColor = vec4( 1.0 - point, 0.753 - point, 0.0, 1.0 );
	}
}