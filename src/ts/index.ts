import reglModule from 'regl';
import pipesShaderSource from '@shader/pipes.frag';
import trianglesShaderSource from '@shader/triangles.vert';

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
	const renderPipes = regl({
		frag: pipesShaderSource,
		vert: trianglesShaderSource,
		uniforms: {
			resolution: [canvas.height, canvas.width],
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
