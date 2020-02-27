/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */
import { assert } from 'chai';
import 'mocha';
import { Triplet, TripletVector } from '../TripletVector'; // eslint-disable-line no-unused-vars

describe('Coordinates', () => {
	it('should multiply matrices correctly', () => {
		const coordinate = new TripletVector([2, 1, 3]);
		const multiplied = coordinate.multiplyByMatrix([
			[1, 2, 3],
			[4, 5, 6],
			[7, 8, 9],
		]);

		assert.deepEqual(multiplied.getTriplet(), [13, 31, 49]);
	});

	it('should stringify integers without rounding', () => {
		const coordinate = new TripletVector([2, 1, 3]);
		const coordinateString = coordinate.stringify().replace(/ /g, '');

		assert.equal(coordinateString, '[2,1,3]');
	});

	it('should round to the nearest thousandth when stringifying', () => {
		const coordinate = new TripletVector([2, 1.0005, 3.0004]);
		const coordinateString = coordinate.stringify().replace(/ /g, '');

		assert.equal(coordinateString, '[2,1.001,3]');
	});

	it('should allow you to add distances', () => {
		const coordinate = new TripletVector([1, 2, 2]);
		const lengthened = coordinate.addDistance(1);

		// Assert that the magnitudes are the same
		assert.equal(lengthened.magnitude(), coordinate.magnitude() + 1);
	});

	it('should not alter angles when adding distances', () => {
		const coordinate = new TripletVector([1, 2, 2]);
		const lengthened = coordinate.addDistance(1);

		// Get the dot product of the two triplets
		const dot = (a: Triplet<number>, b: Triplet<number>): number => a.reduce(
			(total: number, _, index: number) => total + a[index] * b[index],
			0,
		);

		// Get the cosine of the angle between the two coordinates
		const getCosBetween = (a: TripletVector, b: TripletVector): number => {
			const aDotB = dot(a.getTriplet(), b.getTriplet());
			const magnitudes = a.magnitude() * b.magnitude();

			return aDotB / magnitudes;
		};

		assert.closeTo(
			getCosBetween(lengthened, new TripletVector([1, 0, 0])),
			getCosBetween(coordinate, new TripletVector([1, 0, 0])),
			0.001,
		);
		assert.closeTo(
			getCosBetween(lengthened, new TripletVector([0, 1, 0])),
			getCosBetween(coordinate, new TripletVector([0, 1, 0])),
			0.001,
		);
		assert.closeTo(
			getCosBetween(lengthened, new TripletVector([0, 0, 1])),
			getCosBetween(coordinate, new TripletVector([0, 0, 1])),
			0.001,
		);
	});

	it('should allow you to get magnitude', () => {
		const coordinate = new TripletVector([1, 2, 2]);

		assert.equal(coordinate.magnitude(), 3);
	});

	it('should add coordinates properly', () => {
		const coordinate1 = new TripletVector([1, 2, 3]);
		const coordinate2 = new TripletVector([4, 5, 6]);
		const added = coordinate1.add(coordinate2);

		assert.deepEqual(added.getTriplet(), [5, 7, 9]);
	});
});