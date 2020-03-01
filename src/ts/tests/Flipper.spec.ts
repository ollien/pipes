/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */
import { assert } from 'chai';
import 'mocha';
import Flipper from '../Flipper';

describe('Flipper', () => {
	it('should allow you to peek both sides without flipping', () => {
		const flipper = new Flipper<number>(5, 6);

		assert.equal(flipper.peekFront(), 5);
		assert.equal(flipper.peekBack(), 6);
	});

	it('should allow you to flip the front and back', () => {
		const flipper = new Flipper<number>(5, 6);
		flipper.flip();

		assert.equal(flipper.peekFront(), 6);
		assert.equal(flipper.peekBack(), 5);
	});

	it('should return the current front when flipping', () => {
		const flipper = new Flipper<number>(5, 6);
		const oldFront = flipper.flip();

		assert.equal(oldFront, 5);
	});
});
