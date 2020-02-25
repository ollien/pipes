#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;

void main() {
	vec2 position = gl_FragCoord.xy / resolution;
	gl_FragColor = vec4(vec3(position.x, 0., position.y), 1.);
}
