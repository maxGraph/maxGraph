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
import type Rectangle from '../geometry/Rectangle';

declare module '../AbstractGraph' {
  interface AbstractGraph {
    /** @default null */
    shiftPreview1: HTMLElement | null;

    /** @default null */
    shiftPreview2: HTMLElement | null;

    /**
     * Specifies if scrollbars should be used for panning in {@link panGraph} if any scrollbars are available.
     *
     * If scrollbars are enabled in CSS, but no scrollbars appear because the graph is smaller than the container size,
     * then no panning occurs if this is `true`.
     * @default true
     */
    useScrollbarsForPanning: boolean;

    /**
     * Specifies if auto scrolling should be carried out via {@link PanningHandler} even if the container has scrollbars.
     *
     * This disables {@link scrollPointToVisible} and uses {@link PanningManager} instead. If this is `true` then {@link autoExtend} is disabled.
     *
     * It should only be used with a scroll buffer or when scrollbars are visible and scrollable in all directions.
     * @default false
     */
    timerAutoScroll: boolean;

    /**
     * Specifies if panning via {@link panGraph} should be allowed to implement autoscroll if no scrollbars are available in {@link scrollPointToVisible}.
     *
     * To enable panning inside the container, near the edge, set {@link PanningManager.border} to a positive value.
     * @default false
     */
    allowAutoPanning: boolean;

    /**
     * Current horizontal panning value.
     * @default 0
     */
    panDx: number;

    /**
     * Current vertical panning value.
     * @default 0
     */
    panDy: number;

    isUseScrollbarsForPanning: () => boolean;
    isTimerAutoScroll: () => boolean;
    isAllowAutoPanning: () => boolean;
    getPanDx: () => number;
    setPanDx: (dx: number) => void;
    getPanDy: () => number;
    setPanDy: (dy: number) => void;

    /**
     * Shifts the graph display by the given amount. This is used to preview panning operations, use {@link GraphView.setTranslate} to set a persistent
     * translation of the view.
     *
     * Fires {@link InternalEvent.PAN}.
     *
     * @param dx Amount to shift the graph along the x-axis.
     * @param dy Amount to shift the graph along the y-axis.
     */
    panGraph: (dx: number, dy: number) => void;

    /**
     * Pans the graph so that it shows the given cell. Optionally the cell may be centered in the container.
     *
     * To center a given graph if the {@link container} has no scrollbars, use the following code.
     *
     * ```javascript
     * const bounds = graph.getGraphBounds();
     * graph.view.setTranslate(-bounds.x - (bounds.width - container.clientWidth) / 2,
     * 						   -bounds.y - (bounds.height - container.clientHeight) / 2);
     * ```
     *
     * @param cell {@link Cell} to be made visible.
     * @param center Optional boolean flag. Default is `false`.
     */
    scrollCellToVisible: (cell: Cell, center?: boolean) => void;

    /**
     * Pans the graph so that it shows the given rectangle.
     *
     * @param rect {@link Rectangle} to be made visible.
     */
    scrollRectToVisible: (rect: Rectangle) => boolean;

    /**
     * Specifies if panning should be enabled. This implementation updates {@link PanningHandler.panningEnabled}.
     *
     **IMPORTANT**: only has an effect if the {@link PanningHandler} plugin is available.
     *
     * @param enabled Boolean indicating if panning should be enabled.
     */
    setPanning: (enabled: boolean) => void;
  }
}
