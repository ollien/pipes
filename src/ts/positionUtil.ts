import lodash from 'lodash';
import { Matrix } from 'ml-matrix';
import * as mlMatrix from 'ml-matrix';
// @ts-ignore There are no definitions for quaternion
import Quaternion from 'quaternion';

export type Triplet<T> = [T, T, T];

// Axis represents an axis that a pipe can travel along
// These aren't actually unused, eslint just bugs out about it.
/* eslint-disable no-unused-vars */
export enum Axis {
	X = 1,
	Y,
	Z
}
/* eslint-enable no-unused-vars */

// Represents the base of a rotation, simply the axis and the polarity.
export interface RotationDirection {
	axis: Axis,
	polarity: number,
}

// Represents a rotation about a given axis with a standard angle.
export interface Rotation {
	axis: Axis,
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
 * Convert an axis to its cartesian vector equivalent e.g. Y => [0, 1, 0]
 * @param axis The axis to convert
 */
export function convertAxisToSpatialAxis(axis: Axis): Triplet<number> {
	switch (axis) {
	case Axis.X:
		return [1, 0, 0];
	case Axis.Y:
		return [0, 1, 0];
	case Axis.Z:
		return [0, 0, 1];
	default:
		throw Error('Invalid axis');
	}
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
	rotations: Rotation[],
): Triplet<number>[] {
	const trail: Triplet<number>[] = [startingPoint];
	// This matrix represents a change of basis from the standard coordinates to the coordinates of each pipe
	// As explained in the shader, each pipe has its own local y axis, which means that we must perform all rotations
	// with respect to this "local" axis. e.g. no y axis rotations actually do anything but spin the cylinder
	// (which in reality, has no discernable effect).
	const basisMatrix = Matrix.identity(3);

	const growthDirection: Triplet<number> = [0, 1, 0];
	let cursor = startingPoint;
	rotations.forEach((rotation: Rotation) => {
		const quaternion = Quaternion.fromAxisAngle(
			convertAxisToSpatialAxis(rotation.axis),
			degreesToRadians(rotation.angle),
		);

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
