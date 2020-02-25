#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: import('./vendor/hg_sdf.glsl')

uniform vec2 resolution;

void main() {
	vec2 position = gl_FragCoord.xy / resolution;
	float sphere = fSphere(vec3(position, 1.), 0.2);
	gl_FragColor = vec4(vec3(sphere), 1.);
}
