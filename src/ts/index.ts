import reglModule from 'regl'; // eslint-disable-line no-unused-vars
import trianglesShaderSource from '@shader/triangles.vert'; // eslint-disable-line import/no-unresolved
import PipeGenerator, { Axis, Rotation } from './PipeGenerator'; // eslint-disable-line no-unused-vars
import { Triplet } from './positionUtil'; // eslint-disable-line no-unused-vars
import PipeSimulation from './PipeSimulation';

const NUM_PIPES = 4;
const RENDER_TRIANGLE_VERTS = [
	[-1, -1],
	[1, -1],
	[-1, 1],
	[-1, 1],
	[1, -1],
	[1, 1],
];

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

window.addEventListener('load', () => {
	const canvas = <HTMLCanvasElement|null>document.getElementById('gl');
	if (canvas === null) {
		throw Error('No gl canvas available in document.');
	}

	setCanvasSize(canvas);

	const regl = reglModule(canvas);

	const pipeGenerator = new PipeGenerator();
	const pipeSimulation = new PipeSimulation(regl, pipeGenerator, NUM_PIPES);
	const renderPipes = pipeSimulation.getPipeRenderCommand();

	regl.frame(() => {
		regl({
			vert: trianglesShaderSource,
			attributes: {
				a_position: RENDER_TRIANGLE_VERTS,
			},
			count: RENDER_TRIANGLE_VERTS.length,
			uniforms: { resolution: [canvas.width, canvas.height] },
		})(() => {
			renderPipes();
		});
	});
});
