/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */
import { assert } from 'chai';
import 'mocha';
import { Triplet } from '../positionUtil'; // eslint-disable-line no-unused-vars
import * as positionUtil from '../positionUtil';

describe('positionUtil', () => {
	it('should correctly generate a path given a rotation set', () => {
		const startingPoint: Triplet<number> = [1, 1, 0];
		const rotations: positionUtil.SpatialRotation[] = [
			{
				angle: -90,
				axis: [0, 1, 0],
			},
			{
				angle: -90,
				axis: [0, 0, 1],
			},
			{
				angle: -90,
				axis: [1, 0, 0],
			},
		];

		const actualPath = positionUtil.generateTrailFromRotations(startingPoint, rotations);
		const expectedPath = [
			[1, 1, 0],
			[0, 1, 1],
			[1, 0, 1],
			[1, 1, 0],
		];
		actualPath.forEach((_, stepIndex: number) => {
			actualPath[stepIndex].forEach((__, componentIndex: number) => {
				const actual = actualPath[stepIndex][componentIndex];
				const expected = expectedPath[stepIndex][componentIndex];
				assert.closeTo(
					actual,
					expected,
					0.001,
					`Component ${componentIndex} of step ${stepIndex} does not match:`
					+ `should be [${expectedPath[stepIndex]}], is [${actualPath[stepIndex]}]`,
				);
			});
		});
	});

	it('should convert degrees to radians properly', () => {
		assert.closeTo(positionUtil.degreesToRadians(45), Math.PI / 4, 0.001);
	});
});
