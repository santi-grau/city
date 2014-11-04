varying vec2 vUv;
varying float noise;

void main() {
	gl_FragColor = vec4( vec3( vUv, 0. ), 1.0 );

}