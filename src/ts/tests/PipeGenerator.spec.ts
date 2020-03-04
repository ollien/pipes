/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */
import { assert } from 'chai';
import 'mocha';
import lodash from 'lodash';
import colorConvert from 'color-convert';
/* eslint-disable no-unused-vars */
import PipeGenerator from '../PipeGenerator';
import {
	Axis,
	RotationDirection,
	Rotation,
	Triplet,
} from '../positionUtil';
/* eslint-enable no-unused-vars */

describe('PipeGenerator', () => {
	it('should call its selector function once per pipe', () => {
		let numCalls = 0;
		const generator = new PipeGenerator((directions: RotationDirection[]): RotationDirection => {
			numCalls++;
			return directions[0];
		});

		assert.equal(numCalls, 0);
		generator.generatePipeDirections(8, 90);
		assert.equal(numCalls, 8);
	});

	it('should use the directions suggested by the selector', () => {
		const selectedDirections: RotationDirection[] = [];
		const generator = new PipeGenerator((directions: RotationDirection[]): RotationDirection => {
			const direction = directions[0];
			selectedDirections.push(direction);

			return direction;
		});

		const generatedRotations = generator.generatePipeDirections(3, 90);
		lodash.zip(selectedDirections, generatedRotations).forEach(
			(directions: [RotationDirection|undefined, Rotation|undefined]) => {
				const [selectedDirection, generatedRotation] = directions;
				assert.isDefined(selectedDirection);
				assert.isDefined(generatedRotation);


				// We have already asserted these are defined above, TS just doesn't know what the assert means.
				// @ts-ignore: Object is possibly 'undefined'
				assert.equal(generatedRotation.axis, selectedDirection.axis);
				// @ts-ignore: Object is possibly 'undefined'
				assert.equal(generatedRotation.angle, selectedDirection.polarity * 90);
			},
		);
	});

	it('should not pass a rotation to the selector that would allow a double-back', () => {
		const directionLists: RotationDirection[][] = [];
		const generator = new PipeGenerator((directions: RotationDirection[]): RotationDirection => {
			directionLists.push(directions.slice());

			return directions[0];
		});


		const generatedRotations = generator.generatePipeDirections(2, 90);
		const missingDirections = lodash.differenceWith(directionLists[0], directionLists[1], lodash.isEqual);
		// Assert that one direction is in the first list but not the second.
		assert.lengthOf(missingDirections, 1);

		const forbiddenDirection: RotationDirection = {
			axis: generatedRotations[0].axis,
			polarity: -1 * Math.sign(generatedRotations[0].axis),
		};

		// Assert that the missing element was the opposite of the first one.
		assert.deepEqual(missingDirections[0], forbiddenDirection);
	});

	it('should not allow you to return a rotation from your selector that was not passed to it', () => {
		const generator = new PipeGenerator(
			// Polarity is only ever expected to be 1 or -1, so this will never be in the list.
			(): RotationDirection => ({ axis: Axis.X, polarity: -50 }),
		);

		assert.throws(() => generator.generatePipeDirections(5, 90));
	});

	it('should use the hue supplied when generating a color', () => {
		const pipeGenerator = new PipeGenerator(undefined, () => 180);
		const generatedColor = pipeGenerator.generateColor();
		const hslGeneratedColor = colorConvert.rgb.hsl(generatedColor);

		assert.equal(hslGeneratedColor[0], 180);
	});

	it('should always have a constant saturation and lightness between runs', () => {
		const pipeGenerator = new PipeGenerator(undefined, () => 180);
		const generatedColors = Array(2).fill(0).map(() => pipeGenerator.generateColor());
		const hslGeneratedColors = generatedColors.map(colorConvert.rgb.hsl);

		assert.equal(hslGeneratedColors[0][1], hslGeneratedColors[1][1]);
		assert.equal(hslGeneratedColors[0][2], hslGeneratedColors[1][2]);
	});

	it('should use the position selector to generate positions', () => {
		const pipeGenerator = new PipeGenerator(undefined, undefined, () => [1, 2, 3]);
		const generatedPosition = pipeGenerator.generatePosition();

		assert.deepEqual(generatedPosition, [1, 2, 3]);
	});

	it('should allow selection of a position that has not been marked as forbidden', () => {
		const pipeGenerator = new PipeGenerator(
			undefined,
			undefined,
			() => [4, 5, 6],
		);

		assert.deepEqual(pipeGenerator.generatePosition([[1, 2, 3]]), [4, 5, 6]);
	});

	it('should not allow selection of a position that has been marked as forbidden', () => {
		const pipeGenerator = new PipeGenerator(
			undefined,
			undefined,
			(forbidden: Triplet<number>[]) => forbidden[0],
		);

		assert.throws(() => pipeGenerator.generatePosition([[1, 2, 3]]));
	});

	it('should allow you to create a copy of an existing PipeGenerator, preserving the selectors', () => {
		// Counts to represent how many times each selector was called
		let directionCalls = 0;
		let hueCalls = 0;
		let positionCalls = 0;

		const pipeGenerator = new PipeGenerator(
			(directions: RotationDirection[]): RotationDirection => {
				directionCalls++;
				return directions[0];
			},
			(): number => {
				hueCalls++;
				return 56;
			},
			(): Triplet<number> => {
				positionCalls++;
				return [1, 2, 3];
			},
		);

		const copy = new PipeGenerator(pipeGenerator);
		pipeGenerator.generatePipeDirections(1, 90);
		pipeGenerator.generateColor();
		pipeGenerator.generatePosition();

		copy.generatePipeDirections(1, 90);
		copy.generateColor();
		copy.generatePosition();

		// We can check that the selectors were copied by ensuring that the call counters are 2.
		assert.equal(directionCalls, 2);
		assert.equal(hueCalls, 2);
		assert.equal(positionCalls, 2);
	});
});
