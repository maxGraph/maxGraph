/*
Copyright 2024-present The maxGraph project Contributors

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

import type { GraphPluginConstructor } from '../../types';
import CellEditorHandler from '../handler/CellEditorHandler';
import TooltipHandler from '../handler/TooltipHandler';
import SelectionCellsHandler from '../handler/SelectionCellsHandler';
import PopupMenuHandler from '../handler/PopupMenuHandler';
import ConnectionHandler from '../handler/ConnectionHandler';
import SelectionHandler from '../handler/SelectionHandler';
import PanningHandler from '../handler/PanningHandler';

/**
 * Returns the list of plugins used by default in `maxGraph`.
 *
 * The function returns a new array each time it is called.
 *
 * @category Plugin
 * @since 0.13.0
 */
export const getDefaultPlugins = (): GraphPluginConstructor[] => [
  CellEditorHandler,
  TooltipHandler,
  SelectionCellsHandler,
  PopupMenuHandler,
  ConnectionHandler,
  SelectionHandler,
  PanningHandler,
];
