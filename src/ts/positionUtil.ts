// @ts-ignore There are no definitions for quaternion
import Quaternion from 'quaternion';
import { Triplet } from './PipeGenerator'; // eslint-disable-line no-unused-vars

/**
 * Represents the items needed for a rotation in 3D space.
 * TODO: Make this the standard in PipeSimulation as well
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

export function generateTrailFromRotations(
	startingPoint: Triplet<number>,
	rotations: SpatialRotation[],
): Triplet<number>[] {
	const trail: Triplet<number>[] = [startingPoint];

	let cursor = startingPoint;
	rotations.forEach((rotation: SpatialRotation) => {
		const q = Quaternion.fromAxisAngle(rotation.axis, degreesToRadians(rotation.angle));
		cursor = q.rotateVector(cursor);
		trail.push(cursor);
	});

	return trail;
}
