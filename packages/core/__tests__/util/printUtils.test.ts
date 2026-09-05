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

import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { BaseGraph } from '../../src';
import { show } from '../../src/util/printUtils';
import { createBaseGraph } from '../utils';

describe('show', () => {
  afterEach(() => {
    document.head.innerHTML = '';
  });

  test('write the base, link and style elements of the document into the head of the target document', () => {
    document.head.innerHTML = [
      '<base href="https://example.com/"/>',
      '<link rel="stylesheet" href="first.css"/>',
      '<link rel="stylesheet" href="second.css"/>',
      '<style>.first {}</style>',
      '<style>.second {}</style>',
    ].join('');
    const graph = createBaseGraph();
    const targetDocument = document.implementation.createHTMLDocument();
    const writeln = jest.spyOn(targetDocument, 'writeln');

    show(graph, targetDocument);
    graph.destroy();

    const writtenLines = writeln.mock.calls.map(([line]) => line);
    expect(writtenLines).toEqual([
      '<html><head>',
      '<base xmlns="http://www.w3.org/1999/xhtml" href="https://example.com/" />',
      '<link xmlns="http://www.w3.org/1999/xhtml" rel="stylesheet" href="first.css" />',
      '<link xmlns="http://www.w3.org/1999/xhtml" rel="stylesheet" href="second.css" />',
      '<style xmlns="http://www.w3.org/1999/xhtml">.first {}</style>',
      '<style xmlns="http://www.w3.org/1999/xhtml">.second {}</style>',
      '</head><body style="margin:0px;"></body></html>',
    ]);
  });
});
