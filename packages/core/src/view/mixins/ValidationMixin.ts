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

import type Cell from '../cell/Cell';
import { isNode } from '../../util/domUtils';
import type { AbstractGraph } from '../AbstractGraph';
import { translate } from '../../internal/i18n-utils';

type PartialGraph = Pick<
  AbstractGraph,
  | 'getDataModel'
  | 'isAllowLoops'
  | 'isMultigraph'
  | 'getView'
  | 'isValidRoot'
  | 'getContainsValidationErrorsResource'
  | 'getAlreadyConnectedResource'
  | 'isAllowDanglingEdges'
  | 'isValidConnection'
  | 'setCellWarning'
>;
type PartialValidation = Pick<
  AbstractGraph,
  | 'multiplicities'
  | 'validationAlert'
  | 'isEdgeValid'
  | 'getEdgeValidationError'
  | 'validateEdge'
  | 'validateGraph'
  | 'getCellValidationError'
  | 'validateCell'
>;
type PartialType = PartialGraph & PartialValidation;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const ValidationMixin: PartialType = {
  validationAlert(message: string) {
    alert(message);
  },

  isEdgeValid(edge: Cell | null, source: Cell | null, target: Cell | null) {
    return !this.getEdgeValidationError(edge, source, target);
  },

  getEdgeValidationError(
    edge: Cell | null = null,
    source: Cell | null = null,
    target: Cell | null = null
  ) {
    if (edge && !this.isAllowDanglingEdges() && (!source || !target)) {
      return '';
    }

    if (edge && !edge.getTerminal(true) && !edge.getTerminal(false)) {
      return null;
    }

    // Checks if we're dealing with a loop
    if (!this.isAllowLoops() && source === target && source) {
      return '';
    }

    // Checks if the connection is generally allowed
    if (!this.isValidConnection(source, target)) {
      return '';
    }

    if (source && target) {
      let error = '';

      // Checks if the cells are already connected
      // and adds an error message if required
      if (!this.isMultigraph()) {
        const tmp = this.getDataModel().getEdgesBetween(source, target, true);

        // Checks if the source and target are not connected by another edge
        if (tmp.length > 1 || (tmp.length === 1 && tmp[0] !== edge)) {
          error += `${
            translate(this.getAlreadyConnectedResource()) ||
            this.getAlreadyConnectedResource()
          }\n`;
        }
      }

      // Gets the number of outgoing edges from the source
      // and the number of incoming edges from the target
      // without counting the edge being currently changed.
      const sourceOut = source.getDirectedEdgeCount(true, edge);
      const targetIn = target.getDirectedEdgeCount(false, edge);

      // Checks the change against each multiplicity rule
      for (const multiplicity of this.multiplicities) {
        const err = multiplicity.check(
          <AbstractGraph>(<unknown>this), // needs to cast to Graph
          <Cell>edge,
          source,
          target,
          sourceOut,
          targetIn
        );

        if (err != null) {
          error += err;
        }
      }

      // Validates the source and target terminals independently
      const err = this.validateEdge(<Cell>edge, source, target);
      if (err != null) {
        error += err;
      }
      return error.length > 0 ? error : null;
    }

    return this.isAllowDanglingEdges() ? null : '';
  },

  validateEdge(
    edge: Cell | null = null,
    source: Cell | null = null,
    target: Cell | null = null
  ) {
    return null;
  },

  validateGraph(cell: Cell | null = null, context) {
    cell = cell ?? this.getDataModel().getRoot();

    if (!cell) {
      return 'The root does not exist!';
    }

    context = context ?? {};

    let isValid = true;
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      const tmp = cell.getChildAt(i);
      let ctx = context;

      if (this.isValidRoot(tmp)) {
        ctx = {};
      }

      const warn = this.validateGraph(tmp, ctx);

      if (warn) {
        this.setCellWarning(tmp, warn.replace(/\n/g, '<br>'));
      } else {
        this.setCellWarning(tmp, null);
      }

      isValid = isValid && warn == null;
    }

    let warning = '';

    // Adds error for invalid children if collapsed (children invisible)
    if (cell && cell.isCollapsed() && !isValid) {
      warning += `${
        translate(this.getContainsValidationErrorsResource()) ||
        this.getContainsValidationErrorsResource()
      }\n`;
    }

    // Checks edges and cells using the defined multiplicities
    if (cell && cell.isEdge()) {
      warning +=
        this.getEdgeValidationError(
          cell,
          cell.getTerminal(true),
          cell.getTerminal(false)
        ) || '';
    } else {
      warning += this.getCellValidationError(<Cell>cell) || '';
    }

    // Checks custom validation rules
    const err = this.validateCell(<Cell>cell, context);

    if (err != null) {
      warning += err;
    }

    // Updates the display with the warning icons
    // before any potential alerts are displayed.
    // LATER: Move this into addCellOverlay. Redraw
    // should check if overlay was added or removed.
    if (cell.getParent() == null) {
      this.getView().validate();
    }
    return warning.length > 0 || !isValid ? warning : null;
  },

  getCellValidationError(cell: Cell) {
    const outCount = cell.getDirectedEdgeCount(true);
    const inCount = cell.getDirectedEdgeCount(false);
    const value = cell.getValue();
    let error = '';

    for (let i = 0; i < this.multiplicities.length; i += 1) {
      const rule = this.multiplicities[i];

      if (
        rule.source &&
        isNode(value, rule.type, rule.attr, rule.value) &&
        (outCount > rule.max || outCount < rule.min)
      ) {
        error += `${rule.countError}\n`;
      } else if (
        !rule.source &&
        isNode(value, rule.type, rule.attr, rule.value) &&
        (inCount > rule.max || inCount < rule.min)
      ) {
        error += `${rule.countError}\n`;
      }
    }

    return error.length > 0 ? error : null;
  },

  validateCell(cell: Cell, context) {
    return null;
  },
};
