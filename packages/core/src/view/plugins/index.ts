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
import CellEditorHandler from './CellEditorHandler';
import TooltipHandler from './TooltipHandler';
import SelectionCellsHandler from './SelectionCellsHandler';
import PopupMenuHandler from './PopupMenuHandler';
import ConnectionHandler from './ConnectionHandler';
import SelectionHandler from './SelectionHandler';
import PanningHandler from './PanningHandler';
import { FitPlugin } from './FitPlugin';

// Export all plugins and types to have them in the root barrel file
export { default as CellEditorHandler } from './CellEditorHandler';
export { default as ConnectionHandler } from './ConnectionHandler';
export * from './FitPlugin';
export { default as PanningHandler } from './PanningHandler';
export { default as PopupMenuHandler } from './PopupMenuHandler';
export { default as RubberBandHandler } from './RubberBandHandler';
export { default as SelectionCellsHandler } from './SelectionCellsHandler';
export { default as SelectionHandler } from './SelectionHandler';
export { default as TooltipHandler } from './TooltipHandler';

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
  FitPlugin,
];
