export type Triplet<T> = [T, T, T];
export type Nonuplet<T> = [T, T, T, T, T, T, T, T, T];


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
function degreesToRadians(angle: number): number {
	return angle * (Math.PI / 180);
}

/**
 * Get the rotation matrix for the given rotation.
 * @param rotation
 */
export function getRotationMatrix(rotation: Rotation): Triplet<Triplet<number>> {
	const angleRads = degreesToRadians(rotation.angle);
	const sinValue = Math.sin(angleRads);
	const cosValue = Math.cos(angleRads);
	const rotationMatrices: { [key in Axis]: Triplet<Triplet<number>> } = {
		[Axis.X]: [
			[1, 0, 0],
			[0, cosValue, -sinValue],
			[0, sinValue, cosValue],
		],
		[Axis.Y]: [
			[cosValue, 0, sinValue],
			[0, 1, 0],
			[-sinValue, 0, cosValue],
		],
		[Axis.Z]: [
			[cosValue, -sinValue, 0],
			[sinValue, cosValue, 0],
			[0, 0, 1],
		],
	};

	return rotationMatrices[rotation.axis];
}
