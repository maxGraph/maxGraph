/*
Copyright 2026-present The maxGraph project Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { expect, test } from '@jest/globals';
import { createGraphWithoutPlugins } from '../../utils';
import { Multiplicity } from '../../../src';

const createRuleAllowingNoOutgoingEdge = (countError: string): Multiplicity =>
  new Multiplicity(true, 'Task', null, null, 0, 0, null, countError, null);

test('getCellValidationError reports the error of every violated multiplicity', () => {
  const graph = createGraphWithoutPlugins();
  graph.multiplicities = [
    createRuleAllowingNoOutgoingEdge('first rule'),
    createRuleAllowingNoOutgoingEdge('last rule'),
  ];
  const source = graph.insertVertex({ value: document.createElement('Task') });
  graph.insertEdge({ source, target: graph.insertVertex({ value: 'target' }) });

  expect(graph.getCellValidationError(source)).toBe('first rule\nlast rule\n');
});
