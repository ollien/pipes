import lodash from 'lodash';
import colorConvert from 'color-convert';
import reglModule, { Regl, Texture2D } from 'regl'; // eslint-disable-line no-unused-vars
import pipesShaderSource from '@shader/pipes.frag'; // eslint-disable-line import/no-unresolved
import trianglesShaderSource from '@shader/triangles.vert'; // eslint-disable-line import/no-unresolved
import PipeGenerator, { Triplet } from './PipeGenerator';

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
	rotations: Triplet<Triplet<number>>[],
}

/**
 * Set the size of the given canvas to the window size
 *
 * @param canvas The canvas to resize
 */
function setCanvasSize(canvas: HTMLCanvasElement): void {
	const html = document.querySelector('html');
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
 * @param arr
 */
function makeUniformsForArray<T>(uniformArrayName: string, arr: T[]): { [key: string]: T } {
	return arr.reduce((reduced, item, index) => {
		// eslint-disable-next-line no-param-reassign
		reduced[`${uniformArrayName}[${index}]`] = item;

		return reduced;
	}, {});
}

window.addEventListener('load', () => {
	const canvas = <HTMLCanvasElement>document.getElementById('gl');
	setCanvasSize(canvas);
	const regl = reglModule(canvas);

	const pipeGenerator = new PipeGenerator();
	const pipes = generatePipes(pipeGenerator);

	const colors = pipes.reduce((list: Triplet<number>, pipe: Pipe) => [...list, pipe.color], []);
	const directionMatrices = pipes.reduce(
		(list: Triplet<Triplet<number>>[], pipe: Pipe) => [...list, ...pipe.rotations],
		[],
	).map((matrix: Triplet<Triplet<number>>): number[] => lodash.flatten(matrix));


	const renderPipes = regl({
		frag: pipesShaderSource,
		vert: trianglesShaderSource,
		uniforms: {
			...{
				num_pipes: pipes.length,
				resolution: [canvas.width, canvas.height],
				time: ({ tick }) => tick,
			},
			...makeUniformsForArray('direction_matrices', directionMatrices),
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
