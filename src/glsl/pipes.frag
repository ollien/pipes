#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: import('./vendor/hg_sdf.glsl')
#pragma glslify: orenNayar = require(glsl-diffuse-oren-nayar)

// GL_ES uses IEEE754 floats, where this is the maximum
#define FLOAT_MAX 3.402823466e+38

#define MAX_MARCHING_STEPS 512
#define MAX_MARCHING_DISTANCE 1000.
#define MARCH_HIT_THRESHOLD 0.001
#define NORMAL_DELTA 0.001

#define CYLINDER_RADIUS 0.2
#define CYLINDER_HEIGHT 5. * CYLINDER_RADIUS
#define SPHERE_RADIUS 1.6 * CYLINDER_RADIUS

// The number of directions that will be passed to this shader.
#define NUM_DIRECTIONS 32
#define NUM_PIPES 4

#define SURFACE_ROUGHNESS 0.6
#define SURFACE_ALBEDO 1.

uniform vec2 resolution;
uniform float time;
uniform sampler2D direction_texture;
uniform int num_directions;

uniform mat3 direction_matrices[NUM_DIRECTIONS * NUM_PIPES];
uniform vec3 colors[NUM_PIPES];

/**
 * A signed distance function that will represent the segments of a pipe in our simulation.
 * Returns the distance from pos to the surface.
 */
float pipe_segment_sdf(vec3 pos) {
	float top_sphere = fSphere(vec3(pos.x, pos.y + CYLINDER_HEIGHT, pos.z), SPHERE_RADIUS);
	float bottom_sphere = fSphere(vec3(pos.x, pos.y - CYLINDER_HEIGHT, pos.z), SPHERE_RADIUS);
	float spheres = min(top_sphere, bottom_sphere);

	return fOpUnionSoft(fCylinder(pos, CYLINDER_RADIUS, CYLINDER_HEIGHT), spheres, 0.04);
}

/**
 * A signed distance function that will represent the mesh of a length of pipe segments.
 */
float pipe_sdf(vec3 pos, int pipe_id) {
	// The cylinder starts along the y axis, so every time we move it, we are manipulating its "y axis."
	// It will always grow along this axis, even though it is not ACTUALLY along this axis.
	// Think of it as a virtual "pipe axis." No rotation can be about the y axis, as it would not actually perform
	// a pipe pivot.
	vec3 growth_vector = vec3(0., 1., 0.);
	vec3 pipe_pos = pos;
	float pipes = FLOAT_MAX;

	for (int i = 0; i < NUM_DIRECTIONS * NUM_PIPES; i++) {
		// HACK: Because we cannot use num_pipes in an array index expression, we must continue/break if we aren't
		// in the right range.
		if (i < NUM_DIRECTIONS * pipe_id) {
			continue;
		} else if (i >= NUM_DIRECTIONS * (pipe_id + 1)) {
			break;
		}

		pipe_pos += CYLINDER_HEIGHT * growth_vector;
		pipe_pos = direction_matrices[i] * pipe_pos;
		pipe_pos += CYLINDER_HEIGHT * growth_vector;
		pipes = min(pipes, pipe_segment_sdf(pipe_pos));
	}

	return pipes;
}

/**
 * A signed distance function that will represent the mesh of all pipes. The second component of the vector is the id
 * of the pipe struck.
 */
vec2 pipes_sdf(vec3 pos) {
	vec2 res = vec2(FLOAT_MAX, FLOAT_MAX);
	for (int i = 0; i < NUM_PIPES; i++) {
		float pipe_distance = pipe_sdf(pos, i);
		if (pipe_distance < res.x) {
			res.x = pipe_distance;
			res.y = float(i);
		}
	}

	return res;
}

/**
 * Gets the normal to a single pipe at the given position
 */
vec3 pipe_normal(vec3 pos) {
	vec3 unnormalized_gradient = vec3(
		pipes_sdf(pos + vec3(NORMAL_DELTA, 0., 0.)).x - pipes_sdf(pos + vec3(-NORMAL_DELTA, 0., 0.)).x,
		pipes_sdf(pos + vec3(0., NORMAL_DELTA, 0.)).x - pipes_sdf(pos + vec3(0., -NORMAL_DELTA, 0.)).x,
		pipes_sdf(pos + vec3(0., 0., NORMAL_DELTA)).x - pipes_sdf(pos + vec3(0., 0., -NORMAL_DELTA)).x
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
 * Returns the normal vector at the struck position as the first 3 components, and the pipe id as the fourth component.
 */
vec4 get_marched_pipe(vec3 ray_origin, vec3 ray_direction) {
	float depth = 0.;
	// Rotate the ray direction to look at the ray origin
	vec3 rotated_ray_direction = (viewMatrix(ray_origin, vec3(0.), vec3(0., 1., 0.)) * vec4(normalize(ray_direction), 1.)).xyz;
	for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
		vec3 ray_position = ray_origin - depth * rotated_ray_direction;
		vec2 sdf_result = pipes_sdf(ray_position);
		float sdf_distance = sdf_result.x;
		float pipe_id = sdf_result.y;

		if (sdf_distance < MARCH_HIT_THRESHOLD) {
			return vec4(pipe_normal(ray_position), pipe_id);
		}

		depth += sdf_distance;

		// If the distance is so far away that we will not hit it reasonably, break out early.
		if (depth >= MAX_MARCHING_DISTANCE) {
			break;
		}
	}

	return vec4(0.);
}

/**
 * Shade the surface normal with an oren nayer diffusion.
 */
float light_pipe_normal(vec3 observation_point, vec3 light_position, vec3 surface_normal) {
	vec3 observation_direction = normalize(observation_point);
	vec3 light_direction = normalize(light_position);

	return orenNayar(
		light_direction,
		observation_direction,
		surface_normal,
		SURFACE_ROUGHNESS,
		SURFACE_ALBEDO
	);
}

/**
 * Get the color for the given pipe id.
 */
vec3 get_color_for_pipe(float pipe_id) {
	// HACK: GLSL doesn't allow us to access array ids with anything other than constants or loop variables, so we must
	// perform a "linear search" of sorts in order to get the color for the given pipe.
	// The +/- 0.5 is simply for safety when dealing with annoying floating points. 0.5 might be a bit aggressive.
	for (int i = 0; i < NUM_PIPES; i++) {
		if (float(i) >= pipe_id - 0.5 && float(i) <= pipe_id + 0.5) {
			return colors[i];
		}
	}

	return vec3(0.);
}

void main() {
	vec2 position = gl_FragCoord.xy / resolution;
	// Our SDF will always consider (0, 0) to be the center, but we consider the center to be (0.5, 0.5).
	// We must thus translate our origin
	position.xy -= vec2(0.5);

	// Correct for aspect ratio.
	position.x *= resolution.x / resolution.y;
	vec3 direction = vec3(position, 1.);

	vec3 observation_point = vec3(10., -10., 10.);
	vec4 marched_pipe = get_marched_pipe(observation_point, direction);
	vec3 marched_ray_normal = marched_pipe.xyz;
	float marched_pipe_id = marched_pipe.w;
	float lit_result = light_pipe_normal(observation_point, observation_point, marched_ray_normal);
	vec3 pipe_color = get_color_for_pipe(marched_pipe_id);

	gl_FragColor = vec4(lit_result * pipe_color, 1.);
}
