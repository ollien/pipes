import lodash from 'lodash';
import colorConvert from 'color-convert';
import reglModule from 'regl'; // eslint-disable-line no-unused-vars
import pipesShaderSource from '@shader/pipes.frag'; // eslint-disable-line import/no-unresolved
import trianglesShaderSource from '@shader/triangles.vert'; // eslint-disable-line import/no-unresolved
import PipeGenerator, { Triplet, Rotation } from './PipeGenerator'; // eslint-disable-line no-unused-vars

const RENDER_TRIANGLE_VERTS = [
	[-1, -1],
	[1, -1],
	[-1, 1],
	[-1, 1],
	[1, -1],
	[1, 1],
];

const NUM_PIPES = 4;
const NUM_PIPE_TURNS = 32;
const ROTATION_ANGLE = 90;
const COLOR_SATURATION = 100;
const COLOR_LIGHTNESS = 55;

interface Pipe {
	color: Triplet<number>,
	rotations: Rotation[],
}

/**
 * Set the size of the given canvas to the window size
 *
 * @param canvas The canvas to resize
 */
function setCanvasSize(canvas: HTMLCanvasElement): void {
	// Explicitly casting, as there will always be an HTML document so we don't care about the case of it being null.
	const html = <HTMLElement>document.querySelector('html');
	/* eslint-disable no-param-reassign */
	canvas.height = html.clientHeight;
	canvas.width = html.clientWidth;
	/* eslint-enable no-param-reassign */
}

/**
 * Generate a random color, as a triplet of rgb values between 0 and 1.
 */
function generateRandomColor(): Triplet<number> {
	const hueValue = 360 * Math.random();
	const rgb = colorConvert.hsl.rgb([hueValue, COLOR_SATURATION, COLOR_LIGHTNESS]);
	return <Triplet<number>> rgb.map((channel: number): number => channel / 255);
}

/**
 * Generate a random number of pipes for the simulation.
 */
function generatePipes(generator: PipeGenerator): Pipe[] {
	return Array(NUM_PIPES).fill(0).map((): Pipe => ({
		rotations: generator.generatePipeDirections(NUM_PIPE_TURNS, ROTATION_ANGLE),
		color: generateRandomColor(),
	}));
}

/**
 * Make the uniforms needed to pass the given array to a shader.
 * @param arr The array to pull from
 */
function makeUniformsForArray<T>(uniformArrayName: string, arr: T[]): { [key: string]: T } {
	return arr.reduce((reduced: { [key: string]: T }, item: T, index: number) => {
		// eslint-disable-next-line no-param-reassign
		reduced[`${uniformArrayName}[${index}]`] = item;

		return reduced;
	}, {});
}

/**
 * Make the uniforms needed to pass the given array of objects to a shader.
 * Keys must be of string type so they may be put into a uniform name properly
 * @param objects The list of objects to pull from.
 */
function makeUniformsForObjectArray<T extends { [key: string]: V }, V>(
	uniformArrayName: string,
	objects: T[],
): { [key: string]: V } {
	return objects.reduce((reduced: { [key: string]: V}, item: T, index: number) => {
		Object.keys(item).forEach((property: string) => {
			// eslint-disable-next-line no-param-reassign
			reduced[`${uniformArrayName}[${index}].${property}`] = item[property];
		});

		return reduced;
	}, {});
}

/**
 * Get all of a single property as an array
 * e.g. getObjectPropertyAsArray([{a: 5}, {a: 6}], 'a') => [5, 6]
 *
 * @param objects The objects to pull from
 */
function getObjectPropertyAsArray<T, K extends keyof T>(objects: T[], key: K): T[K][] {
	return objects.reduce((memo: T[K][], value: T): T[K][] => [...memo, value[key]], []);
}

/**
 * Convert a rotation into a flattened rotation matrices, suitable for use when passing to a uniform.
 *
 * @param rotations The list of rotations to generate rotation matrices for
 */
function convertRotationIntoUniformRotationMatrix(rotation: Rotation): number[] {
	return lodash.flatten(PipeGenerator.getRotationMatrix(rotation));
}

window.addEventListener('load', () => {
	const canvas = <HTMLCanvasElement|null>document.getElementById('gl');
	if (canvas === null) {
		throw Error('No gl canvas available in document.');
	}

	setCanvasSize(canvas);
	const regl = reglModule(canvas);

	const pipeGenerator = new PipeGenerator();
	const pipes = generatePipes(pipeGenerator);

	const colors = getObjectPropertyAsArray(pipes, 'color');
	const rotationLists = getObjectPropertyAsArray(pipes, 'rotations');
	const rotationsUniform = lodash.flatten(rotationLists)
		.map((rotation: Rotation) => ({
			axis: rotation.axis,
			matrix: convertRotationIntoUniformRotationMatrix(rotation),
		}));

	const renderPipes = regl({
		frag: pipesShaderSource,
		vert: trianglesShaderSource,
		uniforms: {
			num_pipes: pipes.length,
			resolution: [canvas.width, canvas.height],
			time: ({ tick }) => tick,
			...makeUniformsForObjectArray('rotations', rotationsUniform),
			...makeUniformsForArray('colors', colors),
		},
		attributes: {
			a_position: RENDER_TRIANGLE_VERTS,
		},
		count: RENDER_TRIANGLE_VERTS.length,
	});

	regl.frame(() => {
		renderPipes();
	});
});
