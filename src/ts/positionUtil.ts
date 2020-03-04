import lodash from 'lodash';
import { Matrix } from 'ml-matrix';
import * as mlMatrix from 'ml-matrix';
// @ts-ignore There are no definitions for quaternion
import Quaternion from 'quaternion';

export type Triplet<T> = [T, T, T];

/**
 * Represents the items needed for a rotation in 3D space.
 */
export interface SpatialRotation {
	// Represents an axis as a a component of a vector, with 1 being along that axis, 0 otherwise.
	axis: Triplet<number>,
	// Represents the angle in degrees
	angle: number,
}

/**
 * Convert the given angle from degrees to radians
 * @param angle The angle to convert
 */
export function degreesToRadians(angle: number): number {
	return angle * (Math.PI / 180);
}

/**
 * Perform componentwise operation on the given triplets
 * @param a The left operand of the subtraction
 * @param b The right operand of the subtraction
 * @param op The operation to perform.
 */
function operateOnTriplets(
	a: Triplet<number>,
	b: Triplet<number>,
	op: (a: number, b: number) => number,
): Triplet<number> {
	return <Triplet<number>> lodash.zip(a, b).map((components: [number?, number?]): number => {
		const aComponent: number = components[0]!;
		const bComponent: number = components[1]!;

		return op(aComponent, bComponent);
	});
}

/**
 * Generate the path taken by a the rotations applied to a pipe
 * @param startingPoint The point the pipe will start with
 * @param rotations The rotations applied to the pipe
 */
export function generateTrailFromRotations(
	startingPoint: Triplet<number>,
	rotations: SpatialRotation[],
): Triplet<number>[] {
	const trail: Triplet<number>[] = [startingPoint];
	// This matrix represents a change of basis from the standard coordinates to the coordinates of each pipe
	// As explained in the shader, each pipe has its own local y axis, which means that we must perform all rotations
	// with respect to this "local" axis. e.g. no y axis rotations actually do anything but spin the cylinder
	// (which in reality, has no discernable effect).
	const basisMatrix = Matrix.identity(3);

	const growthDirection: Triplet<number> = [0, 1, 0];
	let cursor = startingPoint;
	rotations.forEach((rotation: SpatialRotation) => {
		const quaternion = Quaternion.fromAxisAngle(rotation.axis, degreesToRadians(rotation.angle));
		// Rotate each part of the basis in accordance with the quaternion
		for (let i = 0; i < basisMatrix.columns; i++) {
			const axis = <Triplet<number>>basisMatrix.getColumn(i);
			const rotatedAxis = quaternion.rotateVector(axis);
			basisMatrix.setColumn(i, rotatedAxis);
		}

		const growthDirectionVector = (new Matrix([growthDirection])).transpose();
		// Convert our change of basis matrix into the inverse, allowing us to move from standard coordinates to
		// the coordinates created by the system.
		const inverseBasis = mlMatrix.inverse(basisMatrix);
		const reorientedDirectionVector = <Triplet<number>>inverseBasis.mmul(growthDirectionVector).getColumn(0);

		// Use this offset to adjust our cursor.
		cursor = operateOnTriplets(cursor, reorientedDirectionVector, (a, b) => a + b);

		trail.push(cursor);
	});

	return trail;
}
