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
import { BaseGraph, RubberBandHandler } from '../../../src';
import { hasListener } from '../../utils';

describe('onDestroy', () => {
  test('removes all graph listeners registered in constructor', () => {
    const graph = new BaseGraph({ plugins: [RubberBandHandler] });
    const handler = graph.getPlugin<RubberBandHandler>('RubberBandHandler')!;

    expect(hasListener(graph.eventListeners, handler.forceRubberbandHandler)).toBe(true);
    expect(hasListener(graph.eventListeners, handler.panHandler)).toBe(true);
    expect(hasListener(graph.eventListeners, handler.gestureHandler)).toBe(true);

    handler.onDestroy();

    expect(hasListener(graph.eventListeners, handler.forceRubberbandHandler)).toBe(false);
    expect(hasListener(graph.eventListeners, handler.panHandler)).toBe(false);
    expect(hasListener(graph.eventListeners, handler.gestureHandler)).toBe(false);
  });
});
