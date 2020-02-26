import lodash from 'lodash';
import reglModule, { Regl, Texture2D } from 'regl'; // eslint-disable-line no-unused-vars
import pipesShaderSource from '@shader/pipes.frag'; // eslint-disable-line import/no-unresolved
import trianglesShaderSource from '@shader/triangles.vert'; // eslint-disable-line import/no-unresolved

const RENDER_TRIANGLE_VERTS = [
	[-1, -1],
	[1, -1],
	[-1, 1],
	[-1, 1],
	[1, -1],
	[1, 1],
];

const NUM_PIPE_TURNS = 16;

/**
 * Set the size of the given canvas to the window size
 *
 * @param canvas The canvas to resize
 */
function setCanvasSize(canvas: HTMLCanvasElement): void {
	const html = document.querySelector('html');
	/* eslint-disable no-param-reassign */
	canvas.height = html.clientHeight - 4;
	canvas.width = html.clientWidth;
	/* eslint-enable no-param-reassign */
}

/**
 * Get a random item from an array
 *
 * @param arr
 */
function getRandomArrayElement<T>(arr: T[]): T {
	const index = Math.floor(arr.length * Math.random());

	return arr[index];
}

/**
 * Generate an array of random order containing a triplet indicating an axis direction to take.
 * Each item in the triplet represents the x, y, z axis respectively as -1, 0, or 1. Only one axis will be set.
 *
 * @param numItems The number of items to generate
 */
function generateRandomDirections(numItems: number): [number, number, number][] {
	const possibleDirections: [number, number, number][] = [
		[1, 0, 0],
		[-1, 0, 0],
		[0, 1, 0],
		[0, -1, 0],
		[0, 0, -1],
		[1, 0, -1],
	];

	// Presently, we will always go upwards on the y axis as the first move. Filter out this opposite.
	// TODO: Make this not depend on the y-axis start.
	let availableDirections = possibleDirections.filter((item) => !lodash.isEqual(item, [0, -1, 0]));
	return Array(numItems).fill(0).map((): [number, number, number] => {
		const direction = getRandomArrayElement(availableDirections);
		const oppositeDirection = direction.map((value) => -1 * value);

		// Forbid us from doubling back by ensuring we do not pick the opposite direction on the next attempt
		availableDirections = possibleDirections.filter((item) => !lodash.isEqual(item, oppositeDirection));

		return direction;
	});
}

/**
 * Generate a texture representing the set of directions given, as a triplet.
 * It is expected that in each item, only one of the three axes will be set, and it will be -1 or 1.
 *
 * @param regl The regl context to use to generate teh texture
 * @param directions The set of directions to use.
 */
function makeDirectionTexture(regl: Regl, directions: [number, number, number][]): Texture2D {
	// Normalize the data so the alpha value represents whether or not the axis is negated,
	// and r, g, b, represent x y and z respectively.
	const normalizedData = directions.map((direction): [number, number, number, number] => {
		const hasNegative = direction.reduce((result, axis) => result || axis < 0, false);
		const absoluteDirection = direction.map((axis) => Math.abs(axis) * 255);

		return <[number, number, number, number]>[...absoluteDirection, hasNegative ? 0 : 1];
	});

	console.log(normalizedData);
	return regl.texture({
		width: normalizedData.length,
		height: 1,
		data: lodash.flatten(normalizedData),
	});
}

window.addEventListener('load', () => {
	const canvas = <HTMLCanvasElement>document.getElementById('gl');
	setCanvasSize(canvas);
	const regl = reglModule(canvas);

	const directionData = generateRandomDirections(NUM_PIPE_TURNS);
	const directionTexture = makeDirectionTexture(regl, directionData);
	console.log(directionData.length);

	const renderPipes = regl({
		frag: pipesShaderSource,
		vert: trianglesShaderSource,
		uniforms: {
			resolution: [canvas.height, canvas.width],
			num_directions: directionData.length,
			direction_texture: regl.framebuffer({
				width: directionTexture.width,
				height: directionTexture.height,
				color: directionTexture,
			}),
			time: ({ tick }) => tick,
		},
		attributes: {
			a_position: RENDER_TRIANGLE_VERTS,
		},
		count: RENDER_TRIANGLE_VERTS.length,
	});

	// TODO: Because of the non-performant loop in the shader, running render pipes on every frame can bring a system to a stand-still.
	regl.frame(() => {
		renderPipes();
	});
});
