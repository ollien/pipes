import reglModule, { DrawCommand } from 'regl'; // eslint-disable-line no-unused-vars
import * as dat from 'dat.gui';
import trianglesShaderSource from '@shader/triangles.vert'; // eslint-disable-line import/no-unresolved
import PipeGenerator from './PipeGenerator'; // eslint-disable-line no-unused-vars
import PipeSimulation, { PipeParameters } from './PipeSimulation'; // eslint-disable-line no-unused-vars
import * as positionUtil from './positionUtil';
import { Triplet } from './positionUtil'; // eslint-disable-line no-unused-vars

const DEFAULT_NUM_PIPES = 8;
const DEFAULT_ROTATION_ANGLE = 90;
const DEFAULT_NUM_PIPE_TURNS = 16;
const DEFAULT_OBSERVATION_POINT = <Triplet<number>>[10, -10, 10];
const DELAY_BEFORE_REDRAW = 2500;

const RENDER_TRIANGLE_VERTS = [
	[-1, -1],
	[1, -1],
	[-1, 1],
	[-1, 1],
	[1, -1],
	[1, 1],
];

interface SimulationParameters extends PipeParameters {
	// Represents whether or not the simulation's camera will be fixed
	fixedCamera: boolean,
	// Represents how good the rendered picture will look, out of 1.
	quality: number,
}

/**
 * Set the size of the given canvas to the window size
 *
 * @param canvas The canvas to resize
 */
function setCanvasSize(canvas: HTMLCanvasElement, scaleFactor: number = 1): void {
	// Explicitly casting, as there will always be an HTML document so we don't care about the case of it being null.
	const html = <HTMLElement>document.querySelector('html');
	/* eslint-disable no-param-reassign */
	canvas.height = html.clientHeight * scaleFactor;
	canvas.width = html.clientWidth * scaleFactor;
	canvas.style.height = `${html.clientHeight}px`;
	canvas.style.width = `${html.clientWidth}px`;
	/* eslint-enable no-param-reassign */
}

/**
 * Generate a random observation point
 */
function generateObservationPoint(): Triplet<number> {
	// Phi, theta, and radius represent the parameters of a spherical coordinate
	const PHI_MIN = -85;
	const PHI_MAX = 85;
	const THETA_MIN = -135;
	const THETA_MAX = 135;
	const RADIUS_MIN = 14;
	const RADIUS_MAX = 20;

	const phi = positionUtil.degreesToRadians(Math.random() * (PHI_MAX - PHI_MIN) + PHI_MIN);
	const theta = positionUtil.degreesToRadians(Math.random() * (THETA_MAX - THETA_MIN) + THETA_MIN);
	const radius = Math.random() * (RADIUS_MAX - RADIUS_MIN) + RADIUS_MIN;

	// Convert the spherical coordinate to rectangular
	return [
		radius * Math.sin(phi) * Math.cos(theta),
		radius * Math.sin(phi) * Math.sin(theta),
		radius * Math.cos(phi),
	];
}

/**
 * Setup the control GUI
 *
 * @param parameters The object to adjust the parameters of
 * @param resetFunc Function to reset the simulation
 * @param qualityCallback Function that will be called when the quality is changed
 */
function setupGUI(
	parameters: SimulationParameters,
	resetFunc: () => void,
	qualityCallback: (value: number) => void,
): void {
	const gui = new dat.GUI();

	// The quality adjustment specifically does not need to reset after being called
	// It will pass the new value along to a callback
	const qualityAdjustment = gui.add(parameters, 'quality', 0.1, 1);
	qualityAdjustment.onFinishChange(qualityCallback);

	// All of these values are those that will reset the simulation upon being adjusted
	const resettingValues = [
		gui.add(parameters, 'numPipes', 1, 6, 1),
		gui.add(parameters, 'numPipeTurns', 4, 32, 1),
		gui.add(parameters, 'rotationAngle', 0, 90),
		gui.add(parameters, 'fixedCamera'),
	];
	resettingValues.forEach((controller: dat.GUIController) => {
		controller.onFinishChange(resetFunc);
	});

	gui.add({ resetSimulation: resetFunc }, 'resetSimulation');
}

window.addEventListener('load', () => {
	const canvas = <HTMLCanvasElement|null>document.getElementById('gl');
	if (canvas === null) {
		throw Error('No gl canvas available in document.');
	}


	const regl = reglModule(canvas);
	const simulationParameters: SimulationParameters = {
		rotationAngle: DEFAULT_ROTATION_ANGLE,
		numPipeTurns: DEFAULT_NUM_PIPE_TURNS,
		numPipes: DEFAULT_NUM_PIPES,
		fixedCamera: false,
		quality: 1,
	};

	const pipeGenerator = new PipeGenerator();
	let pipeSimulation: PipeSimulation;
	let renderPipes: DrawCommand;
	let tickCount = 0;
	let timeoutId: number|null = null;
	// Initializes all of the parameters needed for the simulation.
	// By breaking this into a closure, we can use it to reset the simulation when needed.
	const makeSimulationComponents = () => {
		setCanvasSize(canvas, simulationParameters.quality);
		pipeSimulation = new PipeSimulation(
			regl,
			pipeGenerator,
			simulationParameters,
			() => (simulationParameters.fixedCamera ? DEFAULT_OBSERVATION_POINT : generateObservationPoint()),
		);

		renderPipes = pipeSimulation.getPipeRenderCommand();
		tickCount = 0;
		if (timeoutId != null) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	};

	// Setup the simulation and all UI components
	makeSimulationComponents();
	setupGUI(simulationParameters, makeSimulationComponents, (quality: number) => setCanvasSize(canvas, quality));
	window.addEventListener('resize', () => setCanvasSize(canvas, simulationParameters.quality));

	let errorAlerted = false;
	regl.frame(() => {
		regl({
			vert: trianglesShaderSource,
			attributes: {
				a_position: RENDER_TRIANGLE_VERTS,
			},
			count: RENDER_TRIANGLE_VERTS.length,
			uniforms: {
				resolution: [canvas.width, canvas.height],
				time: () => tickCount,
			},
		})(() => {
			try {
				renderPipes();
				errorAlerted = false;
			} catch (e) {
				// We don't want to notify the user on every frame. Give them the chance to fix the error.
				if (!errorAlerted) {
					// eslint-disable-next-line no-alert
					alert('Simulation parameters are preventing shader compilation. Please lower your settings.');
				}

				errorAlerted = true;
				throw e;
			}
		});

		tickCount++;
		// If our simulation has hit the point where all of the pipes have been drawn, and we're not
		// currently waiting for a reset, schedule a reset of the simulation
		if (tickCount % (simulationParameters.numPipes * simulationParameters.numPipeTurns) === 0
			&& timeoutId == null) {
			timeoutId = setTimeout(makeSimulationComponents, DELAY_BEFORE_REDRAW);
		}
	});
});
