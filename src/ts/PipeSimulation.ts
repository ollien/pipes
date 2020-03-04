import { DrawCommand, Regl } from 'regl'; // eslint-disable-line no-unused-vars
import mustache from 'mustache';
import lodash from 'lodash';
import pipesShaderSource from '@shader/pipes.mustache.frag'; // eslint-disable-line import/no-unresolved
import PipeGenerator from './PipeGenerator'; // eslint-disable-line no-unused-vars
import * as uniformUtil from './uniformUtil';
import { Axis, Rotation, Triplet } from './positionUtil'; // eslint-disable-line no-unused-vars

type Nonuplet<T> = [T, T, T, T, T, T, T, T, T];

/**
 * Represents a single pipe in the simulation
 */
interface RenderablePipe {
	color: Triplet<number>,
	startingPosition: Triplet<number>,
	rotations: Rotation[],
}

/**
 * Represents the parameters needed to compile the pipes shader.
 */
interface PipesShaderParameters {
	numTurns: number,
	numPipes: number,
}


/**
 * Represents the rotation that is passed to the shader as a uniform
 */
interface RotationUniform {
	// This is a spatial axis. See positionUtil.convertAxisToSpatialAxis
	// We use this in the uniform to avoid branching in the shader
	axis: Triplet<number>,
	angle: number,
}


/**
 * Represents a simulation of a single pipe.
 */
export default class PipeSimulation {
	private static readonly ROTATION_ANGLE = 90;
	private static readonly NUM_PIPE_TURNS = 32;

	private readonly regl: Regl;
	private readonly pipeGenerator: PipeGenerator;
	private readonly pipes: RenderablePipe[];

	/**
	 * @param regl The regl context to use for the simulation
	 * @param pipeGenerator The pipeGenerator to use to generate pipes
	 * @param numPipes The number of pipes to render
	 */
	constructor(regl: Regl, pipeGenerator: PipeGenerator, numPipes: number) {
		this.regl = regl;
		this.pipeGenerator = pipeGenerator;
		this.pipes = this.generatePipes(numPipes);
	}

	/**
	 * Get a ReGL command to render the pipes without a fragment shader or resolution uniforms.
	 * It is expected that the caller wrap the call to the command like so
	 * regl({
	 * 	vert: myDopeVertexShader,
	 *  attributes: { ..whatever is needed for your vertex shader  }
	 *  uniforms: { resolution: [width, height] }
	 * })(() => renderCommand())
	 */
	getPipeRenderCommand(): DrawCommand {
		const compiledPipesShaderSource = PipeSimulation.compilePipesShaderSource({
			numTurns: PipeSimulation.NUM_PIPE_TURNS,
			numPipes: this.pipes.length,
		});

		const uniformRotations = this.convertRotationsForUniform();
		const colorsUniform = uniformUtil.getObjectPropertyAsArray(this.pipes, 'color');
		const startingPositionsUniform = uniformUtil.getObjectPropertyAsArray(this.pipes, 'startingPosition');

		return this.regl({
			frag: compiledPipesShaderSource,
			uniforms: {
				time: ({ tick }) => tick,
				...uniformUtil.makeUniformsForArray('colors', colorsUniform),
				...uniformUtil.makeUniformsForObjectArray('rotations', uniformRotations),
				...uniformUtil.makeUniformsForArray('starting_positions', startingPositionsUniform),
			},
		});
	}

	/**
	 * Generate a specified number of pipes to generate.
	 * @param numPipes The number of pipes to generate
	 */
	private generatePipes(numPipes: number): RenderablePipe[] {
		const usedPositions: Triplet<number>[] = [];
		return Array(numPipes).fill(0).map((): RenderablePipe => {
			const position = this.pipeGenerator.generatePosition(usedPositions);
			usedPositions.push(position);

			return {
				rotations: this.generatePipeRotations(),
				color: this.pipeGenerator.generateColor(),
				startingPosition: position,
			};
		});
	}

	/**
	 * Generate the rotations for a single pipe
	 */
	private generatePipeRotations(): Rotation[] {
		return this.pipeGenerator.generatePipeDirections(
			PipeSimulation.NUM_PIPE_TURNS,
			PipeSimulation.ROTATION_ANGLE,
		);
	}

	/**
	 * Generate the rotations uniform for the pipes in the simulation
	 */
	private convertRotationsForUniform(): RotationUniform[] {
		// eslint-disable-next-line arrow-body-style
		const pipeRotations = this.pipes.map((pipe: RenderablePipe) => {
			return pipe.rotations.map((rotation: Rotation): RotationUniform => ({
				axis: PipeSimulation.convertAxisToTriplet(rotation.axis),
				angle: rotation.angle,
			}));
		});

		return lodash.flatten(pipeRotations);
	}

	/**
	 * Convert the given axis to a triplet usable by the shader
	 *
	 * @param axis The axis to convert
	 */
	private static convertAxisToTriplet(axis: Axis): Triplet<number> {
		/* eslint-disable no-else-return */
		if (axis === Axis.X) {
			return [1, 0, 0];
		} else if (axis === Axis.Y) {
			return [0, 1, 0];
		} else {
			return [0, 0, 1];
		}
		/* eslint-enable no-else-return */
	}

	/**
	 * Compile the source code of the pipes shader with the given parameters
	 */
	private static compilePipesShaderSource(properties: PipesShaderParameters): string {
		return mustache.render(pipesShaderSource, properties);
	}
}
