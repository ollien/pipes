/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */
import { assert } from 'chai';
import 'mocha';
import lodash from 'lodash';
import { Coordinate } from '../Coordinate';

describe('Coordinates', () => {
	it('should multiply matrices correctly', () => {
		const coordinate = new Coordinate([2, 1, 3]);
		const multiplied = coordinate.multiplyByMatrix([
			[1, 2, 3],
			[4, 5, 6],
			[7, 8, 9],
		]);

		assert.isTrue(lodash.isEqual(multiplied.getTriplet(), [13, 31, 49]));
	});

	it('should stringify integers without rounding', () => {
		const coordinate = new Coordinate([2, 1, 3]);
		const coordinateString = coordinate.stringify().replace(/ /g, '');

		assert.equal(coordinateString, '[2,1,3]');
	});

	it('should round to the nearest thousandth when stringifying', () => {
		const coordinate = new Coordinate([2, 1.0005, 3.0004]);
		const coordinateString = coordinate.stringify().replace(/ /g, '');

		assert.equal(coordinateString, '[2,1.001,3]');
	});
});

export default 26;
