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
import MaxXmlRequest from '../../src/util/MaxXmlRequest';

describe('simulate', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const simulateAndGetSubmittedFields = (request: MaxXmlRequest): [string, string][] => {
    let fields: [string, string][] = [];
    jest.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(function (
      this: HTMLFormElement
    ) {
      fields = Array.from(this.querySelectorAll('textarea')).map((textarea) => [
        textarea.name,
        textarea.value,
      ]);
    });

    request.simulate(document);

    return fields;
  };

  test('submit one field per parameter separated by &', () => {
    const request = new MaxXmlRequest('https://example.com', 'first=1&second=a%20b');

    expect(simulateAndGetSubmittedFields(request)).toEqual([
      ['first', '1'],
      ['second', 'a%20b'],
    ]);
  });

  test('submit one field per parameter separated by spaces, skipping the ones without a name', () => {
    const request = new MaxXmlRequest(
      'https://example.com',
      'first=1 =2 noValue second=a%20b'
    );
    request.decodeSimulateValues = true;

    expect(simulateAndGetSubmittedFields(request)).toEqual([
      ['first', '1'],
      ['second', 'a b'],
    ]);
  });
});
