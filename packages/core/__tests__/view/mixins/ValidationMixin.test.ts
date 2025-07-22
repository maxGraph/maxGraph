import { test } from '@jest/globals';
import { createGraphWithoutPlugins } from '../../utils';
import { Multiplicity } from '../../../src';

test('Ensure no side effects with the multiplicities property', () => {
  const graph1 = createGraphWithoutPlugins();
  const graph2 = createGraphWithoutPlugins();

  graph1.multiplicities.push(
    new Multiplicity(
      true,
      'rectangle',
      null!, // TODO constructor signature must be updated
      null!, // TODO constructor signature must be updated
      0,
      2,
      ['circle'],
      'Only 2 targets allowed',
      'Only circle targets allowed'
    )
  );
  expect(graph2.multiplicities).toBe([]);
  expect(graph1.multiplicities).not.toBe(graph2.multiplicities);
});
