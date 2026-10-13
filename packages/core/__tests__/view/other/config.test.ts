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
import { GuideConfig, resetGuideConfig } from '../../../src';

test('resetGuideConfig', () => {
  const originalGuideConfig = { ...GuideConfig };

  GuideConfig.color = 'chartreuse';
  GuideConfig.dashed = false;
  GuideConfig.strokeWidth = 3;

  resetGuideConfig();

  expect(GuideConfig.color).toBe('#FF0000');
  expect(GuideConfig.dashed).toBe(true);
  expect(GuideConfig.strokeWidth).toBe(1);
  expect(GuideConfig).toStrictEqual(originalGuideConfig);
});
