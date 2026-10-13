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

import { afterEach, describe, expect, test } from '@jest/globals';
import Translations from '../../src/i18n/Translations';

describe('parse', () => {
  afterEach(() => {
    Translations.resources = {};
    Translations.resourcesEncoded = false;
  });

  test('store each key and value pair, skipping comments and lines without a key', () => {
    Translations.parse(
      [
        'first=1',
        '# comment=ignored',
        'noValue',
        '=noKey',
        'second=a=b\r',
        'third=',
      ].join('\n')
    );

    expect(Translations.resources).toEqual({ first: '1', second: 'a=b', third: '' });
  });

  test('decode the unicode escapes when the resources are encoded', () => {
    Translations.resourcesEncoded = true;

    Translations.parse(['first=caf\\u00e9', 'second=na\\u00efve'].join('\n'));

    expect(Translations.resources).toEqual({ first: 'café', second: 'naïve' });
  });
});
