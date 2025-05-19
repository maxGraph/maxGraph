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
 * A plugin providing methods to fit the graph within its container.
 * @since 0.17.0
 * @category Navigation
 * @category Plugin
 */
export class FitPlugin implements GraphPlugin {
  static readonly pluginId = 'fit';

  /**
   * Specifies the maximum scale to be applied during fit operations. Set this to `null` to allow any value.
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
