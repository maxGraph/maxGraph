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

test('import a style extending another one', () => {
  const stylesheet = new Stylesheet();
  importToObject(
    stylesheet,
    `<Stylesheet>
  <add as="base">
    <add value="red" as="fillColor" />
    <add value="blue" as="strokeColor" />
  </add>
  <add as="derived" extend="base">
    <add value="green" as="strokeColor" />
    <add value="12" as="fontSize" />
  </add>
</Stylesheet>`
  );

  // The properties of the extended style are inherited, and the ones declared here win over them
  expect(stylesheet.styles.get('derived')).toEqual({
    fillColor: 'red',
    strokeColor: 'green',
    fontSize: 12,
  });
});

test('import a style extending another one leaves the extended style untouched', () => {
  const stylesheet = new Stylesheet();
  importToObject(
    stylesheet,
    `<Stylesheet>
  <add as="base">
    <add value="red" as="fillColor" />
  </add>
  <add as="derived" extend="base">
    <add value="green" as="fillColor" />
  </add>
</Stylesheet>`
  );

  // The extended style is copied and not shared, so overriding a property in the derived style cannot leak back
  expect(stylesheet.styles.get('base')).toEqual({ fillColor: 'red' });
});

test('import a style removing a property of the style it extends', () => {
  const stylesheet = new Stylesheet();
  importToObject(
    stylesheet,
    `<Stylesheet>
  <add as="base">
    <add value="red" as="fillColor" />
    <add value="blue" as="strokeColor" />
  </add>
  <add as="derived" extend="base">
    <remove as="fillColor" />
  </add>
</Stylesheet>`
  );

  expect(stylesheet.styles.get('derived')).toEqual({ strokeColor: 'blue' });
});

test('import a style extending a style that does not exist', () => {
  const stylesheet = new Stylesheet();
  importToObject(
    stylesheet,
    `<Stylesheet>
  <add as="derived" extend="unknown">
    <add value="red" as="fillColor" />
  </add>
</Stylesheet>`
  );

  // Nothing to inherit, so the style holds its own properties only. A warning is logged.
  expect(stylesheet.styles.get('derived')).toEqual({ fillColor: 'red' });
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
