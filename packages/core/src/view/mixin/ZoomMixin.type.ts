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

import type Rectangle from '../geometry/Rectangle.js';

declare module '../AbstractGraph' {
  interface AbstractGraph {
    /**
     * Specifies the factor used for {@link zoomIn} and {@link zoomOut}.
     * @default 1.2 (120%)
     */
    zoomFactor: number;

    /**
     * Specifies if the viewport should automatically contain the selection cells after a zoom operation.
     * @default false
     */
    keepSelectionVisibleOnZoom: boolean;

    /**
     * Specifies if the zoom operations should go into the center of the actual
     * diagram rather than going from top, left.
     * @default true
     */
    centerZoom: boolean;

    /**
     * Zooms into the graph by {@link zoomFactor}.
     */
    zoomIn: () => void;

    /**
     * Zooms out of the graph by {@link zoomFactor}.
     */
    zoomOut: () => void;

    /**
     * Resets the zoom in the view to the original scale.
     */
    zoomActual: () => void;

    /**
     * Zooms the graph to the given scale with an optional boolean center
     * argument, which is passed to {@link zoom}.
     */
    zoomTo: (scale: number, center?: boolean) => void;

    /**
     * Zooms the graph using the given factor. Center is an optional boolean
     * argument that keeps the graph scrolled to the center. If the center argument
     * is omitted, then {@link centerZoom} will be used as its value.
     */
    zoom: (factor: number, center?: boolean) => void;

    /**
     * Zooms the graph to the specified rectangle. If the rectangle does not have same aspect
     * ratio as the display container, it is increased in the smaller relative dimension only
     * until the aspect match. The original rectangle is centralised within this expanded one.
     *
     * Note that the input rectangular must be un-scaled and un-translated.
     *
     * @param rect The un-scaled and un-translated rectangluar region that should be just visible
     * after the operation
     */
    zoomToRect: (rect: Rectangle) => void;
  }
}
