import isNode from '../../commons/dom/is-node';

/**
 * Checks if a value is array-like.
 *
 * @param {any} arr - The value to check.
 * @returns {boolean} - Returns true if the value is array-like, false otherwise.
 */
export default function isArrayLike(arr: unknown): arr is ArrayLike<unknown> {
  return (
    !!arr &&
    typeof arr === 'object' &&
    typeof (arr as { length?: unknown }).length === 'number' &&
    // Avoid DOM weirdness
    !isNode(arr)
  );
}
