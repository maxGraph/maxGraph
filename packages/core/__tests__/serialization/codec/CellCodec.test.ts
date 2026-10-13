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
import { Cell, Codec } from '../../../src';
import { CellCodec } from '../../../src/serialization/codec/CellCodec';
import { parseXml } from '../../../src/util/xmlUtils';

describe('beforeDecode', () => {
  test('resolve the parent, source and target references and remove them from the node', () => {
    const codec = new CellCodec();
    const name = codec.getName();
    const doc = parseXml(
      `<root><${name} id="edge" parent="parent" source="source" target="target" edge="1"/><${name} id="parent"/><${name} id="source" vertex="1"/><${name} id="target" vertex="1"/></root>`
    );
    const edgeNode = doc.documentElement.firstChild as Element;
    const edge = new Cell();

    const inner = codec.beforeDecode(new Codec(doc), edgeNode, edge)!;

    expect([edge.parent?.getId(), edge.source?.getId(), edge.target?.getId()]).toEqual([
      'parent',
      'source',
      'target',
    ]);
    expect(
      ['parent', 'source', 'target'].filter((attr) => inner.hasAttribute(attr))
    ).toEqual([]);
  });
});
