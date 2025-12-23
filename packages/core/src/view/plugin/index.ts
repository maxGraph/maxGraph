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

import type { GraphPluginConstructor } from '../../types.js';
import CellEditorHandler from './CellEditorHandler.js';
import TooltipHandler from './TooltipHandler.js';
import SelectionCellsHandler from './SelectionCellsHandler.js';
import PopupMenuHandler from './PopupMenuHandler.js';
import ConnectionHandler from './ConnectionHandler.js';
import SelectionHandler from './SelectionHandler.js';
import PanningHandler from './PanningHandler.js';
import { FitPlugin } from './FitPlugin.js';

// Export all plugins and types to have them in the root barrel file
export { default as CellEditorHandler } from './CellEditorHandler.js';
export { default as ConnectionHandler } from './ConnectionHandler.js';
export * from './FitPlugin.js';
export { default as PanningHandler } from './PanningHandler.js';
export { default as PopupMenuHandler } from './PopupMenuHandler.js';
export { default as RubberBandHandler } from './RubberBandHandler.js';
export { default as SelectionCellsHandler } from './SelectionCellsHandler.js';
export { default as SelectionHandler } from './SelectionHandler.js';
export { default as TooltipHandler } from './TooltipHandler.js';

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
