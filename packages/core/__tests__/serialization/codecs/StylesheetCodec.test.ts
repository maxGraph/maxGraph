/*
Copyright 2025-present The maxGraph project Contributors

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

import { registerCoreCodecs, Stylesheet, unregisterAllCodecs } from '../../../src';
import { expect, test } from '@jest/globals';
import { exportObject, importToObject } from './shared';

// Prevents side effects between tests
beforeAll(() => {
  unregisterAllCodecs();
});
beforeEach(() => {
  registerCoreCodecs();
});
afterEach(() => {
  unregisterAllCodecs();
});

test('import', () => {
  const stylesheet = new Stylesheet();
  importToObject(
    stylesheet,
    `<Stylesheet>
  <add as="custom">
    <add value="red" as="fillColor" />
    <add value="true" as="rounded" />
    <add value="blue" as="strokeColor" />
  </add>
</Stylesheet>`
  );

  const style = stylesheet.styles.get('custom');
  expect(style).toEqual({
    fillColor: 'red',
    rounded: 'true',
    strokeColor: 'blue',
  });
});

test('export', () => {
  const stylesheet = new Stylesheet();
  stylesheet.putCellStyle('custom', {
    fillColor: 'red',
    rounded: true,
    strokeColor: 'blue',
  });

  const xml = exportObject(stylesheet);
  expect(xml).toEqual(
    `<Stylesheet>
  <add as="defaultVertex">
    <add value="rectangle" as="shape" />
    <add value="rectanglePerimeter" as="perimeter" />
    <add value="middle" as="verticalAlign" />
    <add value="center" as="align" />
    <add value="#C3D9FF" as="fillColor" />
    <add value="#6482B9" as="strokeColor" />
    <add value="#774400" as="fontColor" />
  </add>
  <add as="defaultEdge">
    <add value="connector" as="shape" />
    <add value="classic" as="endArrow" />
    <add value="middle" as="verticalAlign" />
    <add value="center" as="align" />
    <add value="#6482B9" as="strokeColor" />
    <add value="#446299" as="fontColor" />
  </add>
  <add as="custom">
    <add value="red" as="fillColor" />
    <add value="true" as="rounded" />
    <add value="blue" as="strokeColor" />
  </add>
</Stylesheet>
`
  );
});
