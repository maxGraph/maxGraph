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

import { describe, expect, jest, test } from '@jest/globals';
import { Codec, type Editor } from '../../../../src';
import { EditorCodec } from '../../../../src/serialization/codec/editor/EditorCodec';
import { parseXml } from '../../../../src/util/xmlUtils';

describe('decodeTemplates', () => {
  test('decode the first element of each child as the template named by its "as" attribute', () => {
    const doc = parseXml(
      '<templates><add as="first"><Cell id="1"/></add><add as="second">\n  <Cell id="2"/></add></templates>'
    );
    const dec = new Codec(doc);
    jest
      .spyOn(dec, 'decodeCell')
      .mockImplementation((node) => `decoded ${node.getAttribute('id')}` as never);
    const editor = { templates: null } as unknown as Editor;

    new EditorCodec().decodeTemplates(dec, doc.documentElement, editor);

    expect({ ...editor.templates }).toEqual({ first: 'decoded 1', second: 'decoded 2' });
  });
});
