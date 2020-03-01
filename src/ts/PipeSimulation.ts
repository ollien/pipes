import { DrawCommand, Regl } from 'regl'; // eslint-disable-line no-unused-vars
import mustache from 'mustache';
import lodash from 'lodash';
import pipesShaderSource from '@shader/pipes.mustache.frag'; // eslint-disable-line import/no-unresolved
import PipeGenerator, { Axis, Triplet, Rotation } from './PipeGenerator'; // eslint-disable-line no-unused-vars
import * as uniformUtil from './uniformUtil';

interface RenderablePipe {
	color: Triplet<number>,
	rotations: Rotation[],
}

interface PipesShaderParameters {
	numTurns: number,
	numPipes: number,
	yAxis: Axis,
}


/**
 * Represents a simulation of a single pipe.
 */
export default class PipeSimulation {
	private static readonly ROTATION_ANGLE = 90;
	private static readonly NUM_PIPE_TURNS = 32;

	private readonly regl: Regl;
	private readonly pipeGenerator: PipeGenerator;
	private readonly pipeRotations: Rotation[];
	private readonly pipeColor: Triplet<number>;

	/**
	 * @param regl The regl context to use for the simulation
	 */
	constructor(regl: Regl, pipeGenerator: PipeGenerator) {
		this.regl = regl;
		this.pipeGenerator = pipeGenerator;
		this.pipeRotations = this.generatePipeRotations();
		this.pipeColor = this.pipeGenerator.generateColor();
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
			// TODO: Make this not part of the compilation stage if its always 1.
			numPipes: 1,
			yAxis: Axis.Y,
		});

		const rotationsUniform = this.pipeRotations.map((rotation: Rotation) => ({
			axis: rotation.axis,
			matrix: PipeSimulation.convertRotationIntoUniformRotationMatrix(rotation),
		}));

		return this.regl({
			frag: compiledPipesShaderSource,
			uniforms: {
				time: ({ tick }) => tick,
				// TODO: Make this not an array in the shader.
				// The shader in general could use a lot of cleanup for this process, but this is the first step.
				'colors[0]': this.pipeColor,
				...uniformUtil.makeUniformsForObjectArray('rotations', rotationsUniform),
			},
		});
	}

	private generatePipeRotations(): Rotation[] {
		return this.pipeGenerator.generatePipeDirections(
			PipeSimulation.NUM_PIPE_TURNS,
			PipeSimulation.ROTATION_ANGLE,
		);
	}

	/**
	 * Compile the source code of the pipes shader with the given parameters
	 */
	private static compilePipesShaderSource(properties: PipesShaderParameters): string {
		return mustache.render(pipesShaderSource, properties);
	}

	/**
	 * Convert a rotation into a flattened rotation matrices, suitable for use when passing to a uniform.
	 *
	 * @param rotations The list of rotations to generate rotation matrices for
	 */
	private static convertRotationIntoUniformRotationMatrix(rotation: Rotation): number[] {
		return lodash.flatten(PipeGenerator.getRotationMatrix(rotation));
	}
}
