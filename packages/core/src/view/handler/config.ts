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
  CONNECT_HANDLE_FILLCOLOR,
  EDGE_SELECTION_COLOR,
  EDGE_SELECTION_DASHED,
  EDGE_SELECTION_STROKEWIDTH,
  HANDLE_FILLCOLOR,
  HANDLE_SIZE,
  HANDLE_STROKECOLOR,
  LABEL_HANDLE_FILLCOLOR,
  LABEL_HANDLE_SIZE,
  VERTEX_SELECTION_COLOR,
  VERTEX_SELECTION_DASHED,
  VERTEX_SELECTION_STROKEWIDTH,
} from '../../util/Constants.js';
import { shallowCopy } from '../../internal/clone-utils.js';

/**
 * Describes {@link EdgeHandlerConfig}.
 *
 * @experimental Subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.14.0
 * @category Configuration
 */
export type EdgeHandlerConfigType = {
  /**
   * Specifies if adding bends by shift-click is enabled.
   *
   * **Note**: This experimental feature is not recommended for production use.
   * @default false
   * @since 0.15.0
   */
  addBendOnShiftClickEnabled: boolean;
  /**
   * Defines the color to be used for the connect handle fill color. Use `none` for no color.
   * @default {@link CONNECT_HANDLE_FILLCOLOR}
   */
  connectFillColor: string;
  /**
   * Defines the cursor for a movable bend.
   * @default 'crosshair'
   * @since 0.20.0
   */
  cursorBend: string;
  /**
   * Defines the cursor for a movable edge.
   * @default 'move'
   * @since 0.20.0
   */
  cursorMovable: string;
  /**
   * Defines the cursor for a terminal handle.
   * @default 'pointer'
   * @since 0.20.0
   */
  cursorTerminal: string;
  /**
   * Defines the cursor for a movable virtural bend.
   * @default 'crosshair'
   * @since 0.20.0
   */
  cursorVirtualBend: string;
  /**
   * Kind of shape to be used for edge handles.
   * @default 'square'
   */
  handleShape: 'circle' | 'square';
  /**
   * Specifies if removing bends by shift-click is enabled.
   *
   * **Note**: This experimental feature is not recommended for production use.
   * @default false
   * @since 0.15.0
   */
  removeBendOnShiftClickEnabled: boolean;
  /**
   * Defines the default color to be used for the selection border of edges. Use `none` for no color.
   * @default {@link EDGE_SELECTION_COLOR}
   */
  selectionColor: string;
  /**
   * Defines the default dashed state to be used for the edge selection border.
   * @default {@link EDGE_SELECTION_DASHED}
   */
  selectionDashed: boolean;
  /**
   * Defines the default stroke width to be used for edge selections.
   * @default {@link EDGE_SELECTION_STROKEWIDTH}
   */
  selectionStrokeWidth: number;
  /**
   * Opacity to be used for virtual bends (see {@link virtualBendsEnabled}).
   * @default 20
   * @since 0.15.0
   */
  virtualBendOpacity: number;
  /**
   * Specifies if virtual bends should be added in the center of each segment.
   * These bends can then be used to add new waypoints.
   * @default false
   * @since 0.15.0
   */
  virtualBendsEnabled: boolean;
};

/**
 * Global configuration for {@link EdgeHandler} (including subclasses).
 *
 * @experimental Subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.14.0
 * @category Configuration
 */
export const EdgeHandlerConfig: EdgeHandlerConfigType = {
  addBendOnShiftClickEnabled: false,

  connectFillColor: CONNECT_HANDLE_FILLCOLOR,

  cursorBend: 'crosshair',

  cursorMovable: 'move',

  cursorTerminal: 'pointer',

  cursorVirtualBend: 'crosshair',

  handleShape: 'square',

  removeBendOnShiftClickEnabled: false,

  selectionColor: EDGE_SELECTION_COLOR,

  selectionDashed: EDGE_SELECTION_DASHED,

  selectionStrokeWidth: EDGE_SELECTION_STROKEWIDTH,

  virtualBendOpacity: 20,

  virtualBendsEnabled: false,
};

const defaultEdgeHandlerConfig: EdgeHandlerConfigType = { ...EdgeHandlerConfig };
/**
 * Resets {@link EdgeHandlerConfig} to default values.
 *
 * @experimental Subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.14.0
 * @category Configuration
 */
export const resetEdgeHandlerConfig = (): void => {
  shallowCopy(defaultEdgeHandlerConfig, EdgeHandlerConfig);
};

/**
 * Global configuration for handles, used {@link VertexHandler} and {@link EdgeHandler} (including subclasses).
 *
 * @experimental Subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.14.0
 * @category Configuration
 */
export const HandleConfig = {
  /**
   * Defines the default color to be used for the handle fill color. Use `none` for no color.
   * @default {@link HANDLE_FILLCOLOR}
   */
  fillColor: HANDLE_FILLCOLOR,

  /**
   * Defines the cursor to be used for the label handle.
   * @default 'default'
   * @since 0.20.0
   */
  labelCursor: 'default',

  /**
   * Defines the color to be used for the label handle fill color. Use `none` for no color.
   * @default {@link LABEL_HANDLE_FILLCOLOR}
   */
  labelFillColor: LABEL_HANDLE_FILLCOLOR,

  /**
   * Defines the default size for label handles.
   * @default {@link LABEL_HANDLE_SIZE}
   */
  labelSize: LABEL_HANDLE_SIZE,

  /**
   * Defines the default size for handles.
   * @default {@link HANDLE_SIZE}
   */
  size: HANDLE_SIZE,
  /**
   * Defines the default color to be used for the handle stroke color. Use `none` for no color.
   * @default {@link HANDLE_STROKECOLOR}
   */
  strokeColor: HANDLE_STROKECOLOR,
};

const defaultHandleConfig = { ...HandleConfig };
/**
 * Resets {@link HandleConfig} to default values.
 *
 * @experimental Subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.14.0
 * @category Configuration
 */
export const resetHandleConfig = (): void => {
  shallowCopy(defaultHandleConfig, HandleConfig);
};

/**
 * Global configuration for {@link VertexHandler}.
 *
 * @experimental Subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.12.0
 * @category Configuration
 */
export const VertexHandlerConfig = {
  /**
   * Defines the cursor for a movable vertex.
   * @since 0.20.0
   */
  cursorMovable: 'move',

  /**
   * Margin to be added between the selection border and the vertex's bounding box.
   * @default 0
   * @since 0.22.0
   */
  margin: 0,

  /**
   * Enable rotation handle
   * @default false
   */
  rotationEnabled: false,

  /**
   * Defines the default color to be used for the selection border of vertices. Use `none` for no color.
   * @default {@link VERTEX_SELECTION_COLOR}
   * @since 0.14.0
   */
  selectionColor: VERTEX_SELECTION_COLOR,

  /**
   * Defines the default dashed state to be used for the vertex selection border.
   * @default {@link VERTEX_SELECTION_DASHED}
   * @since 0.14.0
   */
  selectionDashed: VERTEX_SELECTION_DASHED,

  /**
   * Defines the default stroke width to be used for vertex selections.
   * @default {@link VERTEX_SELECTION_STROKEWIDTH}
   * @since 0.14.0
   */
  selectionStrokeWidth: VERTEX_SELECTION_STROKEWIDTH,

  /**
   * Specifies if the selection border should match the shape of the vertex. If false, the border is rectangular.
   * This mimics the behavior of {@link CellRenderer}: first check if the shape is available in the {@link StencilShapeRegistry}, otherwise use the shape of the vertex.
   *
   * @default false
   * @since 0.22.0
   */
  selectionShapeMatchVertex: false,
};

const defaultVertexHandlerConfig = { ...VertexHandlerConfig };
/**
 * Resets {@link VertexHandlerConfig} to default values.
 *
 * @experimental Subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.14.0
 * @category Configuration
 */
export const resetVertexHandlerConfig = (): void => {
  shallowCopy(defaultVertexHandlerConfig, VertexHandlerConfig);
};
