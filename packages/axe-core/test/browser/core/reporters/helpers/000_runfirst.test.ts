import { it } from 'vitest';

declare const axe: any;
// HACK: make "helpers" a global, as the tests rely on it.
(globalThis as any).helpers = axe._thisWillBeDeletedDoNotUse.helpers;
