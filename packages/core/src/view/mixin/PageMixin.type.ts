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
import type Shape from '../shape/Shape.js';

declare module '../AbstractGraph' {
  interface AbstractGraph {
    /**
     * Specifies if the background page should be visible.
     * Not yet implemented.
     * @default false
     */
    pageVisible: boolean;

    /**
     * Specifies if a dashed line should be drawn between multiple pages.
     * If you change this value while a graph is being displayed then you
     * should call {@link sizeDidChange} to force an update of the display.
     * @default false
     */
    pageBreaksVisible: boolean;

    /**
     * Specifies the color for page breaks.
     * @default gray
     */
    pageBreakColor: string;

    /**
     * Specifies the page breaks should be dashed.
     * @default true
     */
    pageBreakDashed: boolean;

    /**
     * Specifies the minimum distance in pixels for page breaks to be visible.
     * @default 20
     */
    minPageBreakDist: number;

    /**
     * Specifies if the graph size should be rounded to the next page number in
     * {@link sizeDidChange}. This is only used if the graph container has scrollbars.
     * @default false
     */
    preferPageSize: boolean;

    /**
     * Specifies the scale of the background page.
     * Not yet implemented.
     * @default 1.5
     */
    pageScale: number;

    /** Returns {@link pageVisible}. */
    isPageVisible: () => boolean;

    /** Returns {@link pageBreaksVisible}. */
    isPageBreaksVisible: () => boolean;

    /** Returns {@link pageBreakColor}. */
    getPageBreakColor: () => string;

    /** Returns {@link pageBreakDashed}. */
    isPageBreakDashed: () => boolean;

    /** Returns {@link minPageBreakDist}. */
    getMinPageBreakDist: () => number;

    /** Returns {@link preferPageSize}. */
    isPreferPageSize: () => boolean;

    /** Returns {@link pageFormat}. */
    getPageFormat: () => Rectangle;

    /** Returns {@link pageScale}. */
    getPageScale: () => number;

    /**
     * Returns the preferred size of the background page if {@link preferPageSize} is true.
     */
    getPreferredPageSize: (bounds: Rectangle, width: number, height: number) => Rectangle;

    /** @default null */
    horizontalPageBreaks: Shape[] | null;

    /** @default null */
    verticalPageBreaks: Shape[] | null;

    /**
     * Invokes from {@link sizeDidChange} to redraw the page breaks.
     *
     * @param visible Boolean that specifies if page breaks should be shown.
     * @param width Specifies the width of the container in pixels.
     * @param height Specifies the height of the container in pixels.
     */
    updatePageBreaks: (visible: boolean, width: number, height: number) => void;
  }
}
