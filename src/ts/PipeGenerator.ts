import lodash from 'lodash';

// Axis represents an axis that a pipe can travel along
// These aren't actually unused, eslint just bugs out about it.
/* eslint-disable no-unused-vars */
enum Axis {
	X = 1,
	Y,
	Z
}
/* eslint-enable no-unused-vars */

type Triplet<T> = [T, T, T];

export default class PipeGenerator {
	/**
	 * Returns a set of rotation matrices for the given number of pipes, rotated by the given rotationAngle
	 * along a random axis.
	 * @param numPipes The number of pipes to generate
	 * @param rotationAngle The angle to rotate by each time, in degrees.
	 */
	generatePipeDirections(numPipes: number, rotationAngle: number): Triplet<Triplet<number>>[] {
		const possibleDirections: [Axis, number][] = [
			[Axis.X, 1],
			[Axis.Y, 1],
			[Axis.Z, 1],
			[Axis.X, -1],
			[Axis.Y, -1],
			[Axis.Z, -1],
		];

		let lastDirection: [Axis, number]|null = null;
		return Array(numPipes).fill(0).map((): Triplet<Triplet<number>> => {
			const directionPossibilities = possibleDirections.filter((direction) => {
				if (lastDirection === null) {
					return true;
				}

				const forbiddenDirection = [lastDirection[0], -1 * lastDirection[1]];
				return !lodash.isEqual(direction, forbiddenDirection);
			});

			const direction = PipeGenerator.getRandomArrayElement(directionPossibilities);
			lastDirection = direction;

			return PipeGenerator.makeRotationMatrixForAxis(direction[0], direction[1] * rotationAngle);
		});
	}

	/**
	 * Get a random item from an array
	 *
	 * @param arr
	 */
	private static getRandomArrayElement<T>(arr: T[]): T {
		const index = Math.floor(arr.length * Math.random());

		return arr[index];
	}

	/**
	 * Make a rotation matrix that will rotate along the given axis.
	 * @param axis The axis to rotate about
	 * @param angle The angle to use, given in degrees
	 */
	private static makeRotationMatrixForAxis(axis: Axis, angle: number): Triplet<Triplet<number>> {
		const angleRads = this.degreesToRadians(angle);
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

		return rotationMatrices[axis];
	}

	/**
	 * Convert the given angle from degrees to radians
	 * @param angle The angle to convert
	 */
	private static degreesToRadians(angle: number): number {
		return angle * (Math.PI / 180);
	}
}
