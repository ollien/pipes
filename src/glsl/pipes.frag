#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: import('./vendor/hg_sdf.glsl')

#define MAX_MARCHING_STEPS 512
#define MARCH_HIT_THRESHOLD 0.001
#define NORMAL_DELTA 0.001

#define CYLINDER_RADIUS 0.2

uniform vec2 resolution;
uniform float time;

/**
 * A signed distance function that will represent the pipes in our simulation.
 * Returns the distance from pos to the surface.
 */
float pipe_sdf(vec3 pos) {
	float cylinder_height = 5. * CYLINDER_RADIUS;
	float sphere_radius = 1.6 * CYLINDER_RADIUS;
	float top_sphere = fSphere(vec3(pos.x, pos.y + cylinder_height, pos.z), sphere_radius);
	float bottom_sphere = fSphere(vec3(pos.x, pos.y - cylinder_height, pos.z), sphere_radius);
	float spheres = min(top_sphere, bottom_sphere);

	return fOpUnionSoft(fCylinder(pos, CYLINDER_RADIUS, cylinder_height), spheres, 0.04);
}

/**
 * A signed distance function that will represent the mesh of all of the pipes.
 */
float pipes_sdf(vec3 pos) {
	// pR(pos.xy, 90.);
	float pipe1 = pipe_sdf(pos);
	vec3 pipe2_pos = vec3(pos.xy, pos.z);
	pR(pipe2_pos.xy, 3.14/2.);
	pipe2_pos.xy += vec2(5. * CYLINDER_RADIUS);
	float pipe2 = pipe_sdf(pipe2_pos);

	return min(pipe1, pipe2);
}

/**
 * Gets the normal to a single pipe at the given position
 */
vec3 pipe_normal(vec3 pos) {
	vec3 unnormalized_gradient = vec3(
		pipes_sdf(pos + vec3(NORMAL_DELTA, 0., 0.)) - pipes_sdf(pos + vec3(-NORMAL_DELTA, 0., 0.)),
		pipes_sdf(pos + vec3(0., NORMAL_DELTA, 0.)) - pipes_sdf(pos + vec3(0., -NORMAL_DELTA, 0.)),
		pipes_sdf(pos + vec3(0., 0., NORMAL_DELTA)) - pipes_sdf(pos + vec3(0., 0., -NORMAL_DELTA))
	);

	return normalize(unnormalized_gradient);
}

/**
 * Return a transformation matrix that will transform a ray from view space
 * to world coordinates, given the eye point, the camera target, and an up vector.
 *
 * This assumes that the center of the camera is aligned with the negative z axis in
 * view space when calculating the ray marching direction.
 *
 * Taken from: http://jamie-wong.com/2016/07/15/ray-marching-signed-distance-functions/
 */
mat4 viewMatrix(vec3 eye, vec3 center, vec3 up) {
    // Based on gluLookAt man page
    vec3 f = normalize(center - eye);
    vec3 s = normalize(cross(f, up));
    vec3 u = cross(s, f);
    return mat4(
        vec4(s, 0.0),
        vec4(u, 0.0),
        vec4(-f, 0.0),
        vec4(0.0, 0.0, 0.0, 1)
    );
}

/**
 * Perform a raymarching operation from the given origin along the given direction vector.
 */
vec3 march(vec3 ray_origin, vec3 ray_direction) {
	float depth = 0.;
	vec3 centered_ray_direction = normalize(vec3(ray_direction.xy, ray_direction.z));
	// Rotate the ray direction to look at the ray origin
	vec3 rotated_ray_direction = (viewMatrix(ray_origin, vec3(0.), vec3(0., 1., 0.)) * vec4(centered_ray_direction, 1.)).xyz;
	for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
		vec3 ray_position = ray_origin - depth * rotated_ray_direction;
		float sdf_distance = pipes_sdf(ray_position);
		if (sdf_distance < MARCH_HIT_THRESHOLD) {
			return abs(pipe_normal(ray_position));
		}

		depth += sdf_distance;
	}

	return vec3(0.);
}

void main() {
	vec2 position = gl_FragCoord.xy / resolution;
	// Our SDF will always consider (0, 0) to be the center, but we consider the center to be (0.5, 0.5).
	// We must thus translate our origin
	position.xy -= vec2(0.5);
	vec3 direction = vec3(position, 1.);

	float rot = 28. * 3.14;
	vec3 observation_point = vec3(0., -5., 5.);
	vec3 marched_ray = march(observation_point, direction);
	gl_FragColor = vec4(marched_ray, 1.);
}
