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

import {
  HANDLE_FILLCOLOR,
  HANDLE_SIZE,
  HANDLE_STROKECOLOR,
  VERTEX_SELECTION_COLOR,
  VERTEX_SELECTION_DASHED,
  VERTEX_SELECTION_STROKEWIDTH,
} from '../../util/Constants';

/**
 * Global configuration for {@link VertexHandler}.
 *
 * @experimental subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.12.0
 * @category Configuration
 */
export const VertexHandlerConfig = {
  /**
   * Enable rotation handle
   * @default false
   */
  rotationEnabled: false,

  /**
   * Defines the color to be used for the selection border of vertices. Use
   * 'none' for no color.
   * @default {@link VERTEX_SELECTION_COLOR}
   * @since 0.14.0
   */
  selectionColor: VERTEX_SELECTION_COLOR,

  /**
   * Defines the strokewidth to be used for vertex selections.
   * @default {@link VERTEX_SELECTION_STROKEWIDTH}
   * @since 0.14.0
   */
  selectionStrokeWidth: VERTEX_SELECTION_STROKEWIDTH,

  /**
   * Defines the dashed state to be used for the vertex selection border.
   * @default {@link VERTEX_SELECTION_DASHED}
   * @since 0.14.0
   */
  selectionDashed: VERTEX_SELECTION_DASHED,
};

/**
 * Resets {@link VertexHandlerConfig} to default values.
 */
export const resetVertexHandlerConfig = (): void => {
  VertexHandlerConfig.rotationEnabled = false;
  VertexHandlerConfig.selectionColor = VERTEX_SELECTION_COLOR;
  VertexHandlerConfig.selectionStrokeWidth = VERTEX_SELECTION_STROKEWIDTH;
  VertexHandlerConfig.selectionDashed = VERTEX_SELECTION_DASHED;
};

/**
 * Global configuration for handles, used {@link VertexHandler} and EdgeHandler (including subclasses).
 *
 * @experimental subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.14.0
 * @category Configuration
 */
export const HandleConfig = {
  fillColor: HANDLE_FILLCOLOR,
  size: HANDLE_SIZE,
  strokeColor: HANDLE_STROKECOLOR,
};

/**
 * Resets {@link HandleConfig} to default values.
 */
export const resetHandleConfig = (): void => {
  HandleConfig.fillColor = HANDLE_FILLCOLOR;
  HandleConfig.size = HANDLE_SIZE;
  HandleConfig.strokeColor = HANDLE_STROKECOLOR;
};
