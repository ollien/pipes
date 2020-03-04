/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */
import { assert } from 'chai';
import 'mocha';
import { Axis, Rotation, Triplet } from '../positionUtil'; // eslint-disable-line no-unused-vars
import * as positionUtil from '../positionUtil';

/**
 * Perform the operation matrix vector multiplication Ax
 *
 * @param matrix The matrix A
 * @param vector The vector x
 */
function multiplyVectorByMatrix(matrix: Triplet<Triplet<number>>, vector: Triplet<number>): Triplet<number> {
	return <Triplet<number>> vector.map((_, rowIndex: number) => matrix[rowIndex].reduce(
		(rowTotal: number, matrixItem: number, colIndex: number): number => rowTotal + matrixItem * vector[colIndex],
		0,
	));
}

describe('positionUtil', () => {
	it('should return the proper rotation matrix for a given rotation', () => {
		const rotation: Rotation = { axis: Axis.Z, angle: 45 };
		const coordinate: Triplet<number> = [1, 2, 3];
		const rotationMatrix = positionUtil.getRotationMatrix(rotation);

		const rotatedCoordinate = multiplyVectorByMatrix(rotationMatrix, coordinate);
		const expected = [-0.7071, 2.1213, 3];
		rotatedCoordinate.forEach((component: number, index: number) => {
			assert.closeTo(component, expected[index], 0.001, `Component ${index} does not match`);
		});
	});

	it('should convert degrees to radians properly', () => {
		assert.closeTo(positionUtil.degreesToRadians(45), Math.PI / 4, 0.001);
	});
});
