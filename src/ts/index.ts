import reglModule from 'regl';
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

/**
 * Set the size of the given canvas to the window size
 *
 * @param canvas The canvas to resize
 */
function setCanvasSize(canvas: HTMLCanvasElement): void {
	const html = document.querySelector('html');
	/* eslint-disable no-param-reassign */
	canvas.height = 512;
	canvas.width = 512;
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
