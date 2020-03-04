/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */
import { assert } from 'chai';
import 'mocha';
import { Triplet } from '../positionUtil'; // eslint-disable-line no-unused-vars
import * as positionUtil from '../positionUtil';

describe('positionUtil', () => {
	const pathTests = [
		{
			name: 'all positive',
			rotations: [
				{ angle: 90, axis: <Triplet<number>>[0, 1, 0] },
				{ angle: 90, axis: <Triplet<number>>[0, 0, 1] },
				{ angle: 90, axis: <Triplet<number>>[0, 1, 0] },
				{ angle: 90, axis: <Triplet<number>>[1, 0, 0] },
			],
			expected: [
				[1, 1, 0],
				[1, 2, 0],
				[1, 2, 1],
				[1, 2, 2],
				[1, 1, 2],
			],
		},
		{
			name: 'loop',
			rotations: [
				{ angle: 90, axis: <Triplet<number>>[1, 0, 0] },
				{ angle: 90, axis: <Triplet<number>>[1, 0, 0] },
				{ angle: 90, axis: <Triplet<number>>[1, 0, 0] },
				{ angle: 90, axis: <Triplet<number>>[1, 0, 0] },
			],
			expected: [
				[1, 1, 0],
				[1, 1, -1],
				[1, 0, -1],
				[1, 0, 0],
				[1, 1, 0],
			],
		},
		{
			name: 'one bend',
			rotations: [
				{ angle: 90, axis: <Triplet<number>>[1, 0, 0] },
				{ angle: 90, axis: <Triplet<number>>[0, 1, 0] },
				{ angle: 90, axis: <Triplet<number>>[0, 1, 0] },
				{ angle: 90, axis: <Triplet<number>>[0, 1, 0] },
			],
			expected: [
				[1, 1, 0],
				[1, 1, -1],
				[1, 1, -2],
				[1, 1, -3],
				[1, 1, -4],
			],
		},
		{
			name: 'no bends',
			rotations: [
				{ angle: 90, axis: <Triplet<number>>[0, 1, 0] },
				{ angle: 90, axis: <Triplet<number>>[0, 1, 0] },
				{ angle: 90, axis: <Triplet<number>>[0, 1, 0] },
			],
			expected: [
				[1, 1, 0],
				[1, 2, 0],
				[1, 3, 0],
				[1, 4, 0],
			],
		},
	];

	pathTests.forEach((spec) => {
		it(`should correctly generate a path given a rotation set: ${spec.name}`, () => {
			const startingPoint: Triplet<number> = [1, 1, 0];
			// eslint-disable-next-line prefer-destructuring
			const rotations: positionUtil.SpatialRotation[] = spec.rotations;
			const actualPath = positionUtil.generateTrailFromRotations(startingPoint, rotations);
			const expectedPath = spec.expected;

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
	});

	it('should convert degrees to radians properly', () => {
		assert.closeTo(positionUtil.degreesToRadians(45), Math.PI / 4, 0.001);
	});
});
