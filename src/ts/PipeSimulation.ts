import { DrawCommand, Regl } from 'regl'; // eslint-disable-line no-unused-vars
import mustache from 'mustache';
import lodash from 'lodash';
import pipesShaderSource from '@shader/pipes.mustache.frag'; // eslint-disable-line import/no-unresolved
import PipeGenerator from './PipeGenerator'; // eslint-disable-line no-unused-vars
import * as uniformUtil from './uniformUtil';
import * as positionUtl from './positionUtil';
/* eslint-disable no-unused-vars */
import {
	Axis,
	Nonuplet,
	Rotation,
	Triplet,
} from './positionUtil';
/* eslint-enable no-unused-vars */

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
	yAxis: Axis,
}


/**
 * Represents the rotation that is passed to the shader as a uniform
 */
interface RotationUniform {
	matrix: Nonuplet<number>
	axis: Axis,
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
			yAxis: Axis.Y,
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
				matrix: <Nonuplet<number>> lodash.flatten(positionUtl.getRotationMatrix(rotation)),
				axis: rotation.axis,
			}));
		});

		return lodash.flatten(pipeRotations);
	}

	/**
	 * Compile the source code of the pipes shader with the given parameters
	 */
	private static compilePipesShaderSource(properties: PipesShaderParameters): string {
		return mustache.render(pipesShaderSource, properties);
	}
}
