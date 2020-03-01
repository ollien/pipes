/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */
import { assert } from 'chai';
import 'mocha';
import * as uniformUtil from '../uniformUtil';

describe('uniformUtil', () => {
	it('should correctly make usable array uniforms', () => {
		const uniforms = uniformUtil.makeUniformsForArray('squares', [0, 1, 4, 9]);
		const expected = {
			'squares[0]': 0,
			'squares[1]': 1,
			'squares[2]': 4,
			'squares[3]': 9,
		};

		assert.deepEqual(uniforms, expected);
	});

	it('should correctly make usable struct array uniforms from arrays of objects', () => {
		const uniforms = uniformUtil.makeUniformsForObjectArray('squares', [
			{ n: 0, square: 0 },
			{ n: 1, square: 1 },
			{ n: 2, square: 4 },
			{ n: 3, square: 9 },
		]);

		const expected = {
			'squares[0].n': 0,
			'squares[0].square': 0,
			'squares[1].n': 1,
			'squares[1].square': 1,
			'squares[2].n': 2,
			'squares[2].square': 4,
			'squares[3].n': 3,
			'squares[3].square': 9,
		};

		assert.deepEqual(uniforms, expected);
	});

	it('should allow you to get a property of arrays of objects as an array', () => {
		const arr = uniformUtil.getObjectPropertyAsArray([
			{ n: 0, square: 0 },
			{ n: 1, square: 1 },
			{ n: 2, square: 4 },
			{ n: 3, square: 9 },
		], 'square');

		const expected = [0, 1, 4, 9];

		assert.deepEqual(arr, expected);
	});
});
