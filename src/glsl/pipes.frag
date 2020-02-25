#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: import('./vendor/hg_sdf.glsl')

#define MAX_MARCHING_STEPS 512
#define MARCH_HIT_THRESHOLD 0.001
#define NORMAL_DELTA 0.001

#define CYLINDER_RADIUS 0.2

uniform vec2 resolution;

/**
 * A signed distance function that will represent the pipes in our simulation.
 * Returns the distance from pos to the surface.
 */
float pipe_sdf(vec3 pos) {
	return fCylinder(pos, CYLINDER_RADIUS, CYLINDER_RADIUS);
}

vec3 pipe_normal(vec3 pos) {
	vec3 unnormalized_gradient = vec3(
		pipe_sdf(pos + vec3(NORMAL_DELTA, 0., 0.)) - pipe_sdf(pos + vec3(-NORMAL_DELTA, 0., 0.)),
		pipe_sdf(pos + vec3(0., NORMAL_DELTA, 0.)) - pipe_sdf(pos + vec3(0., -NORMAL_DELTA, 0.)),
		pipe_sdf(pos + vec3(0., 0., NORMAL_DELTA)) - pipe_sdf(pos + vec3(0., 0., -NORMAL_DELTA))
	);

	return normalize(unnormalized_gradient);
}

vec3 march(vec3 ray_origin, vec3 ray_direction) {
	float depth = 0.;
	// Our SDF will always consider (0, 0) to be the center, but we consider the center to be (0.5, 0.5).
	// We must thus translate our origin
	vec3 centered_ray_direction = vec3(ray_direction.xy - vec2(0.5), ray_direction.z);
	for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
		vec3 ray_position = ray_origin - depth * centered_ray_direction;
		float sdf_distance = pipe_sdf(ray_position);
		if (sdf_distance < MARCH_HIT_THRESHOLD) {
			return pipe_normal(ray_position);
		}

		depth += sdf_distance;
	}

	return vec3(0.);
}

void main() {
	vec2 position = gl_FragCoord.xy / resolution;
	vec3 direction = vec3(position, 1.);
	vec3 observation_point = vec3(0., 0., 1.);
	vec3 marched_ray = march(observation_point, direction);
	gl_FragColor = vec4(marched_ray, 1.);
}
