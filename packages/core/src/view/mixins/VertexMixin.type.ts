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

import type Cell from '../cell/Cell';
import type { CellStyle, VertexParameters } from '../../types';
import type Geometry from '../geometry/Geometry';

declare module '../Graph' {
  interface Graph {
    /**
     * Specifies the return value for vertices in {@link isLabelMovable}.
     * @default false
     */
    vertexLabelsMovable: boolean;
    /**
     * Specifies if negative coordinates for vertices are allowed.
     * @default true
     */
    allowNegativeCoordinates: boolean;
    /**
     * Returns {@link allowNegativeCoordinates}.
     */
    isAllowNegativeCoordinates: () => boolean;
    /**
     * Sets {@link allowNegativeCoordinates}.
     */
    setAllowNegativeCoordinates: (value: boolean) => void;

    /**
     * Adds a new vertex into the given parent {@link Cell} using value as the user
     * object and the given coordinates as the {@link Geometry} of the new vertex.
     * The id and style are used for the respective properties of the new `Cell`, which is returned.
     *
     * **IMPORTANT**:
     * - This is a legacy method to ease the migration from `mxGraph`. Use the {@link insertVertex} method with a single object parameter instead.
     * - If the position of the vertex is not set at vertex creation (by setting the `x` and `y` parameters), it is advised to use a {@link GraphLayout} or a {@link LayoutManager} to automatically compute the actual position.
     * - If the size of the vertex is not set at vertex creation (by setting the `width` and the `height` parameters), it is advised to later set the size on the geometry of the vertex instance.
     * Otherwise, the vertex has no size and it is not displayed.
     *
     * When adding new vertices from a mouse event, one should take into
     * account the offset of the graph container and the scale and translation
     * of the view in order to find the correct unscaled, untranslated
     * coordinates using {@link Graph#getPointForEvent} as follows:
     *
     * ```javascript
     * const pt = graph.getPointForEvent(evt);
     * const parent = graph.getDefaultParent();
     * graph.insertVertex(parent, null, 'Hello, World!', pt.x, pt.y, 220, 30);
     * ```
     *
     * For adding image cells, the style parameter can be assigned as
     *
     * ```javascript
     * style: {
     *  image: imageUrl,
     * }
     * ```
     *
     * See {@link Graph} for more information on using images.
     *
     * @param parent the parent of the new vertex. If not set, use the default parent.
     * @param id Optional string that defines the id of the new vertex. If not set, the id is auto-generated when creating the vertex.
     * @param value Object to be used as the user object.
     * @param x the x coordinate of the vertex.
     * @param y the y coordinate of the vertex.
     * @param width the width of the vertex.
     * @param height the height of the vertex.
     * @param style the cell style.
     * @param relative specifies if the geometry is relative. Default is `false`.
     * @param geometryClass class reference to a class derived from {@link Geometry}.
     *                      This can be useful for defining custom constraints. Default is {@link Geometry}.
     */
    insertVertex(
      parent: Cell | null,
      id: string | null | undefined,
      value: any,
      x?: number,
      y?: number,
      width?: number,
      height?: number,
      style?: CellStyle,
      relative?: boolean,
      geometryClass?: typeof Geometry
    ): Cell;

    /**
     * Adds a new vertex into the given parent {@link Cell} using value as the user
     * object and the given coordinates as the {@link Geometry} of the new vertex.
     * The id and style are used for the respective properties of the new `Cell`, which is returned.
     *
     * When adding new vertices from a mouse event, one should take into
     * account the offset of the graph container and the scale and translation
     * of the view in order to find the correct unscaled, untranslated
     * coordinates using {@link Graph#getPointForEvent} as follows:
     *
     * ```javascript
     * const pt = graph.getPointForEvent(evt);
     * const parent = graph.getDefaultParent();
     * graph.insertVertex({
     *   parent,
     *   position: [pt.x, pt.y],
     *   size: [220, 30],
     *   value: 'Hello, World!',
     * });
     * ```
     *
     * For adding image cells, the style parameter can be assigned as
     *
     * ```javascript
     * style: {
     *  image: imageUrl,
     * }
     * ```
     *
     * See {@link Graph} for more information on using images.
     *
     * @param params the parameters used to create the new vertex.
     */
    insertVertex(params: VertexParameters): Cell;

    /**
     * Hook method that creates the new vertex for {@link insertVertex}.
     *
     * **IMPORTANT**:
     * - If the position of the vertex is not set at vertex creation (by setting the `x` and `y` parameters), it is advised to use a {@link GraphLayout} or a {@link LayoutManager} to automatically compute the actual position.
     * - If the size of the vertex is not set at vertex creation (by setting the `width` and the `height` parameters), it is advised to later set the size on the geometry of the vertex instance.
     * Otherwise, the vertex has no size and it is not displayed.
     *
     * @param parent the parent of the new vertex. If not set, use the default parent.
     * @param id Optional string that defines the id of the new vertex. If not set, the id is auto-generated when creating the vertex.
     * @param value Object to be used as the user object.
     * @param x the x coordinate of the vertex.
     * @param y the y coordinate of the vertex.
     * @param width the width of the vertex.
     * @param height the height of the vertex.
     * @param style the cell style.
     * @param relative specifies if the geometry is relative. Default is `false`.
     * @param geometryClass class reference to a class derived from {@link Geometry}.
     *                      This can be useful for defining custom constraints. Default is {@link Geometry}.
     */
    createVertex(
      parent: Cell | null,
      id: string | null | undefined,
      value: any,
      x?: number,
      y?: number,
      width?: number,
      height?: number,
      style?: CellStyle,
      relative?: boolean,
      geometryClass?: typeof Geometry
    ): Cell;

    /**
     * Returns the visible child vertices of the given parent.
     *
     * @param parent the {@link Cell} whose children should be returned.
     */
    getChildVertices: (parent?: Cell | null) => Cell[];
    /**
     * Returns {@link vertexLabelsMovable}.
     */
    isVertexLabelsMovable: () => boolean;
    /**
     * Sets {@link vertexLabelsMovable}.
     */
    setVertexLabelsMovable: (value: boolean) => void;
  }
}
