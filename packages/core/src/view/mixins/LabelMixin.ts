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

import type { AbstractGraph } from '../AbstractGraph.js';

type PartialGraph = Pick<
  AbstractGraph,
  | 'convertValueToString'
  | 'getCurrentCellStyle'
  | 'isCellLocked'
  | 'isEdgeLabelsMovable'
  | 'isVertexLabelsMovable'
>;
type PartialLabel = Pick<
  AbstractGraph,
  | 'labelsVisible'
  | 'htmlLabels'
  | 'getLabel'
  | 'isHtmlLabel'
  | 'isLabelsVisible'
  | 'isHtmlLabels'
  | 'setHtmlLabels'
  | 'isWrapping'
  | 'isLabelClipped'
  | 'isLabelMovable'
>;
type PartialType = PartialGraph & PartialLabel;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const LabelMixin: PartialType = {
  getLabel(cell) {
    let result: string | null = '';

    if (this.isLabelsVisible() && cell != null) {
      const style = this.getCurrentCellStyle(cell);

      if (!(style.noLabel ?? false)) {
        result = this.convertValueToString(cell);
      }
    }

    return result;
  },

  isHtmlLabel(_cell) {
    return this.isHtmlLabels();
  },

  labelsVisible: true,

  isLabelsVisible() {
    return this.labelsVisible;
  },

  htmlLabels: false,

  isHtmlLabels() {
    return this.htmlLabels;
  },

  setHtmlLabels(value: boolean) {
    this.htmlLabels = value;
  },

  isWrapping(cell) {
    return this.getCurrentCellStyle(cell).whiteSpace === 'wrap';
  },

  isLabelClipped(cell) {
    return this.getCurrentCellStyle(cell).overflow === 'hidden';
  },

  isLabelMovable(cell) {
    return (
      !this.isCellLocked(cell) &&
      ((cell.isEdge() && this.isEdgeLabelsMovable()) ||
        (cell.isVertex() && this.isVertexLabelsMovable()))
    );
  },
};
