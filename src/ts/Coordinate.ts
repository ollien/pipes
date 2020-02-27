export type Triplet<T> = [T, T, T];

export class Coordinate {
	private readonly ROUNDING_FACTOR = 1000;
	private coordinateTriplet: Triplet<number>;

	constructor(coordinateTriplet: Triplet<number>) {
		this.coordinateTriplet = coordinateTriplet;
	}

	getTriplet(): Triplet<number> {
		return this.coordinateTriplet;
	}

	/**
	 * Convert the coordinates into a stringified version, with rounding applied.
	 */
	stringify(): string {
		const roundedTriplets = this.coordinateTriplet.map(
			(value) => Math.round(value * this.ROUNDING_FACTOR) / this.ROUNDING_FACTOR,
		);

		return JSON.stringify(roundedTriplets);
	}

	/**
	 * Multiply the coordinates by a given matrix.
	 *
	 * @param matrix The matrix to multiply. It is expected that this is a 3x3 matrix, such as a rotation matrix.
	 */
	multiplyByMatrix(matrix: Triplet<Triplet<number>>): Coordinate {
		// All of these lines are too long to actually use one line arrow functions
		/* eslint-disable arrow-body-style */
		const rotated = <Triplet<number>> this.coordinateTriplet.map((_, rowIndex: number): number => {
			return matrix[rowIndex].reduce((rowTotal: number, matrixItem: number, colIndex: number): number => {
				return rowTotal + matrixItem * this.coordinateTriplet[colIndex];
			}, 0);
		});
		/* eslint-enable arrow-body-style */

		return new Coordinate(rotated);
	}

	addDistance(n: number): Coordinate {
		const currentMagnitude = this.magnitude();
		const res = <Triplet<number>> this.coordinateTriplet.map(
			(value: number): number => ((currentMagnitude + n) / currentMagnitude) * value,
		);

		return new Coordinate(res);
	}

	magnitude(): number {
		return Math.sqrt(this.coordinateTriplet.reduce(
			(magnitude: number, value: number): number => magnitude + value ** 2,
			0,
		));
	}
}
