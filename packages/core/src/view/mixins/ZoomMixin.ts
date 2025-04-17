/*
Copyright 2021-present The maxGraph project Contributors

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

import Rectangle from '../geometry/Rectangle';
import { hasScrollbars } from '../../util/styleUtils';
import type { AbstractGraph } from '../AbstractGraph';

type PartialGraph = Pick<
  AbstractGraph,
  'getView' | 'getSelectionCell' | 'getContainer' | 'scrollRectToVisible'
>;
type PartialZoom = Pick<
  AbstractGraph,
  | 'zoomFactor'
  | 'keepSelectionVisibleOnZoom'
  | 'centerZoom'
  | 'zoomIn'
  | 'zoomOut'
  | 'zoomActual'
  | 'zoomTo'
  | 'zoom'
  | 'zoomToRect'
>;
type PartialType = PartialGraph & PartialZoom;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const ZoomMixin: PartialType = {
  zoomFactor: 1.2,

  keepSelectionVisibleOnZoom: false,

  centerZoom: true,

  zoomIn() {
    this.zoom(this.zoomFactor);
  },

  zoomOut() {
    this.zoom(1 / this.zoomFactor);
  },

  zoomActual() {
    if (this.getView().scale === 1) {
      this.getView().setTranslate(0, 0);
    } else {
      this.getView().translate.x = 0;
      this.getView().translate.y = 0;

      this.getView().setScale(1);
    }
  },

  zoomTo(scale, center = false) {
    this.zoom(scale / this.getView().scale, center);
  },

  zoom(factor, center) {
    center = center ?? this.centerZoom;

    const scale = Math.round(this.getView().scale * factor * 100) / 100;
    const state = this.getView().getState(this.getSelectionCell());
    const container = this.getContainer();
    factor = scale / this.getView().scale;

    if (this.keepSelectionVisibleOnZoom && state != null) {
      const rect = new Rectangle(
        state.x * factor,
        state.y * factor,
        state.width * factor,
        state.height * factor
      );

      // Refreshes the display only once if a scroll is carried out
      this.getView().scale = scale;

      if (!this.scrollRectToVisible(rect)) {
        this.getView().revalidate();

        // Forces an event to be fired but does not revalidate again
        this.getView().setScale(scale);
      }
    } else {
      const _hasScrollbars = hasScrollbars(this.getContainer());

      if (center && !_hasScrollbars) {
        let dx = container.offsetWidth;
        let dy = container.offsetHeight;

        if (factor > 1) {
          const f = (factor - 1) / (scale * 2);
          dx *= -f;
          dy *= -f;
        } else {
          const f = (1 / factor - 1) / (this.getView().scale * 2);
          dx *= f;
          dy *= f;
        }

        this.getView().scaleAndTranslate(
          scale,
          this.getView().translate.x + dx,
          this.getView().translate.y + dy
        );
      } else {
        // Allows for changes of translate and scrollbars during setscale
        const tx = this.getView().translate.x;
        const ty = this.getView().translate.y;
        const sl = container.scrollLeft;
        const st = container.scrollTop;

        this.getView().setScale(scale);

        if (_hasScrollbars) {
          let dx = 0;
          let dy = 0;

          if (center) {
            dx = (container.offsetWidth * (factor - 1)) / 2;
            dy = (container.offsetHeight * (factor - 1)) / 2;
          }

          container.scrollLeft =
            (this.getView().translate.x - tx) * this.getView().scale +
            Math.round(sl * factor + dx);
          container.scrollTop =
            (this.getView().translate.y - ty) * this.getView().scale +
            Math.round(st * factor + dy);
        }
      }
    }
  },

  zoomToRect(rect) {
    const container = this.getContainer();
    const scaleX = container.clientWidth / rect.width;
    const scaleY = container.clientHeight / rect.height;
    const aspectFactor = scaleX / scaleY;

    // Remove any overlap of the rect outside the client area
    rect.x = Math.max(0, rect.x);
    rect.y = Math.max(0, rect.y);
    let rectRight = Math.min(container.scrollWidth, rect.x + rect.width);
    let rectBottom = Math.min(container.scrollHeight, rect.y + rect.height);
    rect.width = rectRight - rect.x;
    rect.height = rectBottom - rect.y;

    // The selection area has to be increased to the same aspect
    // ratio as the container, centred around the centre point of the
    // original rect passed in.
    if (aspectFactor < 1.0) {
      // Height needs increasing
      const newHeight = rect.height / aspectFactor;
      const deltaHeightBuffer = (newHeight - rect.height) / 2.0;
      rect.height = newHeight;

      // Assign up to half the buffer to the upper part of the rect, not crossing 0
      // put the rest on the bottom
      const upperBuffer = Math.min(rect.y, deltaHeightBuffer);
      rect.y -= upperBuffer;

      // Check if the bottom has extended too far
      rectBottom = Math.min(container.scrollHeight, rect.y + rect.height);
      rect.height = rectBottom - rect.y;
    } else {
      // Width needs increasing
      const newWidth = rect.width * aspectFactor;
      const deltaWidthBuffer = (newWidth - rect.width) / 2.0;
      rect.width = newWidth;

      // Assign up to half the buffer to the upper part of the rect, not crossing 0
      // put the rest on the bottom
      const leftBuffer = Math.min(rect.x, deltaWidthBuffer);
      rect.x -= leftBuffer;

      // Check if the right hand side has extended too far
      rectRight = Math.min(container.scrollWidth, rect.x + rect.width);
      rect.width = rectRight - rect.x;
    }

    const scale = container.clientWidth / rect.width;
    const newScale = this.getView().scale * scale;

    if (!hasScrollbars(this.getContainer())) {
      this.getView().scaleAndTranslate(
        newScale,
        this.getView().translate.x - rect.x / this.getView().scale,
        this.getView().translate.y - rect.y / this.getView().scale
      );
    } else {
      this.getView().setScale(newScale);
      container.scrollLeft = Math.round(rect.x * scale);
      container.scrollTop = Math.round(rect.y * scale);
    }
  },
};
