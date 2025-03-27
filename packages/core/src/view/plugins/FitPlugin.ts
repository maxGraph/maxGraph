/*
Copyright 2025-present The maxGraph project Contributors

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

import type { GraphPlugin } from '../../types';
import type { AbstractGraph } from '../AbstractGraph';
import { hasScrollbars } from '../../util/styleUtils';

function keep2digits(value: number): number {
  return Number(value.toFixed(2));
}

/**
 * Options of the {@link FitPlugin.fitCenter} method.
 * @since 0.17.0
 * @category Navigation
 */
export type FitCenterOptions = {
  /**
   * Margin between the graph and the container.
   * @default 2
   */
  margin?: number;
};

/**
 * Options of the {@link FitPlugin.fit} method.
 * @since 0.21.0
 * @category Navigation
 */
export type FitOptions = {
  /**
   * Optional number that specifies the border.
   * @default{@link Graph.getBorder}
   */
  border?: number;
  /**
   * Optional boolean that specifies if the "translate" should be changed.
   * @default false
   */
  keepOrigin?: boolean;
  /**
   * Optional margin in pixels.
   * @default 0
   */
  margin?: number;
  /**
   * Optional boolean that specifies if the scale should be set (when `true`) or just returned.
   * @default true
   */
  enabled?: boolean;
  /**
   * Optional boolean that specifies if the width should be ignored.
   * @default false
   */
  ignoreWidth?: boolean;
  /**
   * Optional boolean that specifies if the height should be ignored.
   * @default false
   */
  ignoreHeight?: boolean;
  /**
   * Optional maximum height. When set to `null`, the height is ignored i.e. use the maximum available height within the container.
   * @default null
   */
  maxHeight?: number | null;
};

/**
 * A plugin providing methods to fit the graph within its container.
 * @since 0.17.0
 * @category Navigation
 * @category Plugin
 */
export class FitPlugin implements GraphPlugin {
  static readonly pluginId = 'fit';

  /**
   * Specifies the minimum scale to be applied in {@link fit}. Set this to `null` to allow any value.
   * @default 0.1
   * @since 0.21.0
   */
  minFitScale: number | null = 0.1;

  /**
   * Specifies the maximum scale to be applied in {@link fit} and  {@link fitCenter}. Set this to `null` to allow any value.
   * @default 8
   */
  maxFitScale: number | null = 8;

  /**
   * Constructs the plugin that provides `fit` methods.
   *
   * @param graph Reference to the enclosing {@link AbstractGraph}.
   */
  constructor(private readonly graph: AbstractGraph) {}

  /**
   * Scales the graph such that the complete diagram fits into {@link Graph.container} and returns the current scale in the view.
   * To fit an initial graph prior to rendering, set {@link GraphView.rendering} to `false` prior to changing the model
   * and execute the following after changing the model.
   *
   * ```javascript
   * graph.view.rendering = false;
   * // here, change the model
   * graph.getPlugin<FitPlugin>('fit')?.fit();
   * graph.view.rendering = true;
   * graph.refresh();
   * ```
   *
   * To fit and center the graph, use {@link fitCenter}.
   *
   * @param options Optional number that specifies the border.
   * @since 0.21.0
   */
  fit(options: FitOptions = {}): number {
    const {
      border = this.graph.getBorder(),
      keepOrigin = false,
      margin = 0,
      enabled = true,
      ignoreWidth = false,
      ignoreHeight = false,
      maxHeight = null,
    } = options;
    const { backgroundImage, container, view } = this.graph;
    if (container) {
      // Adds spacing and border from css
      const cssBorder = this.graph.getBorderSizes();
      let w1: number = container.offsetWidth - cssBorder.x - cssBorder.width - 1;
      let h1: number =
        maxHeight ?? container.offsetHeight - cssBorder.y - cssBorder.height - 1;
      let bounds = view.getGraphBounds();

      if (bounds.width > 0 && bounds.height > 0) {
        if (keepOrigin && bounds.x != null && bounds.y != null) {
          bounds = bounds.clone();
          bounds.width += bounds.x;
          bounds.height += bounds.y;
          bounds.x = 0;
          bounds.y = 0;
        }

        // LATER: Use unscaled bounding boxes to fix rounding errors
        const originalScale = view.scale;
        let w2 = bounds.width / originalScale;
        let h2 = bounds.height / originalScale;

        // Fits to the size of the background image if required
        if (backgroundImage) {
          w2 = Math.max(w2, backgroundImage.width - bounds.x / originalScale);
          h2 = Math.max(h2, backgroundImage.height - bounds.y / originalScale);
        }

        const b: number = (keepOrigin ? border : 2 * border) + margin + 1;

        w1 -= b;
        h1 -= b;

        let newScale = ignoreWidth
          ? h1 / h2
          : ignoreHeight
            ? w1 / w2
            : Math.min(w1 / w2, h1 / h2);

        const minScale = this.minFitScale ?? 0;
        const maxScale = this.maxFitScale ?? Infinity;
        newScale = Math.max(Math.min(newScale, maxScale), minScale);

        if (enabled) {
          if (!keepOrigin) {
            if (!hasScrollbars(container)) {
              const x0 =
                bounds.x != null
                  ? Math.floor(
                      view.translate.x -
                        bounds.x / originalScale +
                        border / newScale +
                        margin / 2
                    )
                  : border;
              const y0 =
                bounds.y != null
                  ? Math.floor(
                      view.translate.y -
                        bounds.y / originalScale +
                        border / newScale +
                        margin / 2
                    )
                  : border;

              view.scaleAndTranslate(newScale, x0, y0);
            } else {
              view.setScale(newScale);
              const newBounds = this.graph.getGraphBounds();

              if (newBounds.x != null) {
                container.scrollLeft = newBounds.x;
              }

              if (newBounds.y != null) {
                container.scrollTop = newBounds.y;
              }
            }
          } else if (view.scale != newScale) {
            view.setScale(newScale);
          }
        } else {
          return newScale;
        }
      }
    }
    return view.scale;
  }

  /**
   * Fit and center the graph within its container.
   *
   * @param options Optional options to customize the fit behavior.
   * @returns The current scale in the view.
   */
  fitCenter(options?: FitCenterOptions): number {
    // Inspired by the former examples provided in the Graph.fit JSDoc: https://github.com/maxGraph/maxGraph/blob/v0.16.0/packages/core/src/view/Graph.ts#L845-L861
    const margin = options?.margin ?? 2;
    const { container, view } = this.graph;

    const clientWidth = container.clientWidth - 2 * margin;
    const clientHeight = container.clientHeight - 2 * margin;

    const bounds = this.graph.getGraphBounds();
    const originalScale = view.scale;
    const width = bounds.width / originalScale;
    const height = bounds.height / originalScale;

    // Apply workarounds to avoid rounding impact if fitCenter is called multiple times
    // Use precise scale value when computing translation values, but round the applied scale
    // Translate using integer values as this is done in Graph.fit

    let newScale = Math.min(
      this.maxFitScale ?? Infinity,
      clientWidth / width,
      clientHeight / height
    );
    if (!Number.isFinite(newScale)) {
      newScale = originalScale;
    }

    const translateX = Math.floor(
      view.translate.x +
        (container.clientWidth - width * newScale) / (2 * newScale) -
        bounds.x / originalScale
    );
    const translateY = Math.floor(
      view.translate.y +
        (container.clientHeight - height * newScale) / (2 * newScale) -
        bounds.y / originalScale
    );

    newScale = keep2digits(newScale);
    view.scaleAndTranslate(newScale, translateX, translateY);

    return newScale;
  }

  /** Do nothing here. */
  onDestroy() {
    // no-op
  }
}
