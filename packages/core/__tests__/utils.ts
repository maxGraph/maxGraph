/*
Copyright 2023-present The maxGraph project Contributors

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

import { Cell, type CellStateStyle, Graph } from '../src';
import { jest } from '@jest/globals';

// no need for a container, we don't check the view here
export const createGraphWithoutContainer = (): Graph => new Graph();

export const createGraphWithoutPlugins = (): Graph => new Graph(undefined, undefined, []);

export const createCellWithStyle = (style: CellStateStyle): Cell => {
  const cell = new Cell();
  cell.style = style;
  return cell;
};
