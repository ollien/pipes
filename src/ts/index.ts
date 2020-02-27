import lodash from 'lodash';
import reglModule, { Regl, Texture2D } from 'regl'; // eslint-disable-line no-unused-vars
import pipesShaderSource from '@shader/pipes.frag'; // eslint-disable-line import/no-unresolved
import trianglesShaderSource from '@shader/triangles.vert'; // eslint-disable-line import/no-unresolved
import PipeGenerator from './PipeGenerator';

type Triplet<T> = [T, T, T];

const RENDER_TRIANGLE_VERTS = [
	[-1, -1],
	[1, -1],
	[-1, 1],
	[-1, 1],
	[1, -1],
	[1, 1],
];

const NUM_PIPE_TURNS = 32;
const ROTATION_ANGLE = 90;

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

window.addEventListener('load', () => {
	const canvas = <HTMLCanvasElement>document.getElementById('gl');
	setCanvasSize(canvas);
	const regl = reglModule(canvas);

	const pipeGenerator = new PipeGenerator();
	const directionMatrices = pipeGenerator.generatePipeDirections(NUM_PIPE_TURNS, ROTATION_ANGLE);
	const directionUniforms = directionMatrices.reduce((reduced, matrix, index) => {
		// eslint-disable-next-line no-param-reassign
		reduced[`direction_matrices[${index}]`] = lodash.flatten(matrix);

		return reduced;
	}, {});

	const renderPipes = regl({
		frag: pipesShaderSource,
		vert: trianglesShaderSource,
		uniforms: Object.assign(directionUniforms, {
			resolution: [canvas.height, canvas.width],
			time: ({ tick }) => tick,
		}),
		attributes: {
			a_position: RENDER_TRIANGLE_VERTS,
		},
		count: RENDER_TRIANGLE_VERTS.length,
	});

	regl.frame(() => {
		renderPipes();
	});
});
