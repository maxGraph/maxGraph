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

import { describe, expect, test } from '@jest/globals';
import { Codec, type EditorToolbar } from '../../../../src';
import { EditorToolbarCodec } from '../../../../src/serialization/codec/editor/EditorToolbarCodec';
import { parseXml } from '../../../../src/util/xmlUtils';

const createToolbar = () => {
  const addedOptions: (string | null)[][] = [];
  const toolbar = {
    editor: { templates: {} },
    toolbar: {},
    addActionCombo: () => 'action combo',
    addCombo: () => document.createElement('select'),
    addPrototype: () => document.createElement('img'),
    addOption: (combo: unknown, label: string, value?: string | null) => {
      addedOptions.push([
        combo instanceof HTMLSelectElement ? 'combo' : String(combo),
        label,
        value ?? null,
      ]);
      return document.createElement('option');
    },
    addActionOption: (combo: unknown, label: string, action: string) => {
      addedOptions.push([String(combo), label, action]);
    },
  } as unknown as EditorToolbar;
  return { toolbar, addedOptions };
};

const decode = (xml: string) => {
  const { toolbar, addedOptions } = createToolbar();
  const doc = parseXml(xml);
  new EditorToolbarCodec().decode(new Codec(doc), doc.documentElement, toolbar);
  return addedOptions;
};

describe('decode', () => {
  test('add every entry of an action combo', () => {
    const addedOptions = decode(
      '<EditorToolbar><add as="actions"><add as="Save" action="save"/><separator/><add as="Open" action="open"/></add></EditorToolbar>'
    );

    expect(addedOptions).toEqual([
      ['action combo', 'Save', 'save'],
      ['action combo', '---', null],
      ['action combo', 'Open', 'open'],
    ]);
  });

  test('add every entry of a template combo', () => {
    const addedOptions = decode(
      '<EditorToolbar><add as="shapes" icon="shapes.gif"><add as="Box" template="box"/><separator/><add as="Ellipse" template="ellipse"/></add></EditorToolbar>'
    );

    expect(addedOptions).toEqual([
      ['combo', 'Box', 'box'],
      ['combo', '---', null],
      ['combo', 'Ellipse', 'ellipse'],
    ]);
  });
});
