import colorConvert from 'color-convert';
import lodash from 'lodash';

// Axis represents an axis that a pipe can travel along
// These aren't actually unused, eslint just bugs out about it.
/* eslint-disable no-unused-vars */
export enum Axis {
	X = 1,
	Y,
	Z
}
/* eslint-enable no-unused-vars */

export type Triplet<T> = [T, T, T];

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

export default class PipeGenerator {
	private static readonly COLOR_SATURATION = 100;
	private static readonly COLOR_LIGHTNESS = 55;

	private readonly directionSelector: (directions: RotationDirection[]) => RotationDirection;
	private readonly hueSelector: () => number;
	private readonly positionSelector: (forbidden: Triplet<number>[]) => Triplet<number>;

	/**
	 * @param directionSelector A function to select a rotation direction from a list of possibilities.
	 *                          Defaults to a function that selects a random direction.
	 * @param hueSelector A function to select a hue. Should return a value in [0, 360].
	 * 					  Defaults to a function that selects a random hue.
	 * @param positionSelector A function to select a position in space, omitting the forbidden positions given.
	 * 						   Defaults to a function that selects a random position between -10 and 10 on each axis.
	 */
	constructor(
		directionSelector?: (directions: RotationDirection[]) => RotationDirection,
		hueSelector?: () => number,
		positionSelector?: (forbidden: Triplet<number>[]) => Triplet<number>,
	) {
		this.directionSelector = directionSelector == null ? PipeGenerator.getRandomArrayElement : directionSelector;
		this.hueSelector = hueSelector == null ? PipeGenerator.generateRandomHue : hueSelector;
		this.positionSelector = positionSelector == null ? PipeGenerator.generateRandomPosition : positionSelector;
	}

	/**
	 * Generate a position in space
	 */
	generatePosition(forbidden?: Triplet<number>[]): Triplet<number> {
		const forbiddenPositions = forbidden == null ? [] : forbidden;
		const selected = this.positionSelector(forbiddenPositions);
		if (lodash.some(forbiddenPositions, (item: Triplet<number>) => lodash.isEqual(selected, item))) {
			throw Error('Selected item was in the forbidden list');
		}

		return selected;
	}

	/**
	 * Generate a random color, as a triplet of rgb values between 0 and 1.
	 */
	generateColor(): Triplet<number> {
		const hueValue = this.hueSelector();
		const rgb = colorConvert.hsl.rgb([hueValue, PipeGenerator.COLOR_SATURATION, PipeGenerator.COLOR_LIGHTNESS]);

		return <Triplet<number>> rgb.map((channel: number): number => channel / 255);
	}

	/**
	 * Returns a set of rotations for the given number of pipes, rotated by the given rotationAngle along a random axis.
	 * @param numPipes The number of pipes to generate
	 * @param rotationAngle The angle to rotate by each time, in degrees.
	 */
	generatePipeDirections(numPipes: number, rotationAngle: number): Rotation[] {
		const possibleRotations: RotationDirection[] = [
			{ axis: Axis.X, polarity: 1 },
			{ axis: Axis.Y, polarity: 1 },
			{ axis: Axis.Z, polarity: 1 },
			{ axis: Axis.X, polarity: -1 },
			{ axis: Axis.Y, polarity: -1 },
			{ axis: Axis.Z, polarity: -1 },
		];

		let lastDirection: RotationDirection|null = null;
		return Array(numPipes).fill(0).map((): Rotation => {
			const rotationPossibilities = possibleRotations.filter((rotation: RotationDirection) => {
				if (lastDirection === null) {
					return true;
				}

				const forbiddenDirection = { axis: lastDirection.axis, polarity: -1 * lastDirection.polarity };
				return !lodash.isEqual(rotation, forbiddenDirection);
			});

			const direction: RotationDirection = this.directionSelector(rotationPossibilities);
			// Check if the direction given is contained within the possible rotations.
			if (possibleRotations.find((item: RotationDirection) => lodash.isEqual(item, direction)) == null) {
				throw Error('Invalid direction returned from direction selector.');
			}

			lastDirection = direction;

			return { axis: direction.axis, angle: direction.polarity * rotationAngle };
		});
	}

	/**
	 * Get the rotation matrix for the given rotation.
	 * @param rotation
	 */
	static getRotationMatrix(rotation: Rotation): Triplet<Triplet<number>> {
		const angleRads = PipeGenerator.degreesToRadians(rotation.angle);
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

	/**
	 * Generates a random hue
	 */
	private static generateRandomHue(): number {
		return Math.random() * 360;
	}

	/**
	 * Generate a random position in space between -10 and 10 on each component
	 */
	private static generateRandomPosition(forbiddenPositions: Triplet<number>[]): Triplet<number> {
		const min = -3;
		const max = 3;

		let possiblePositions: Triplet<number>[] = [];
		for (let i = min; i <= max; i++) {
			for (let j = min; j <= max; j++) {
				for (let k = min; k <= max; k++) {
					const position: Triplet<number> = [i, j, k];
					possiblePositions.push(position);
				}
			}
		}

		possiblePositions = lodash.differenceWith(possiblePositions, forbiddenPositions, lodash.isEqual);

		return possiblePositions[Math.floor(Math.random()) * possiblePositions.length];
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
	 * Convert the given angle from degrees to radians
	 * @param angle The angle to convert
	 */
	private static degreesToRadians(angle: number): number {
		return angle * (Math.PI / 180);
	}
}
