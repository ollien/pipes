/**
 * Make the uniforms needed to pass the given array of objects to a shader.
 * Keys must be of string type so they may be put into a uniform name properly
 *
 * @param objects The list of objects to pull from.
 */
export function makeUniformsForArray<T>(uniformArrayName: string, arr: T[]): { [key: string]: T } {
	return arr.reduce((reduced: { [key: string]: T }, item: T, index: number) => {
		// eslint-disable-next-line no-param-reassign
		reduced[`${uniformArrayName}[${index}]`] = item;

		return reduced;
	}, {});
}

/**
 * Make the uniforms needed to pass the given array of objects to a shader.
 * Keys must be of string type so they may be put into a uniform name properly
 * @param objects The list of objects to pull from.
 */
export function makeUniformsForObjectArray<T extends { [key: string]: any }>(
	uniformArrayName: string,
	objects: T[],
): { [key: string]: any } {
	return objects.reduce((reduced: { [key: string]: any}, item: T, index: number) => {
		Object.keys(item).forEach((property: string) => {
			// eslint-disable-next-line no-param-reassign
			reduced[`${uniformArrayName}[${index}].${property}`] = item[property];
		});

		return reduced;
	}, {});
}

/**
 * Get all of a single property as an array
 * e.g. getObjectPropertyAsArray([{a: 5}, {a: 6}], 'a') => [5, 6]
 *
 * @param objects The objects to pull from
 */
export function getObjectPropertyAsArray<T, K extends keyof T>(objects: T[], key: K): T[K][] {
	return objects.reduce((memo: T[K][], value: T): T[K][] => [...memo, value[key]], []);
}
