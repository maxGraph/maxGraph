/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2015, JGraph Ltd
Copyright (c) 2006-2015, Gaudenz Alder

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

import { isNode } from '../../util/domUtils.js';
import type Cell from '../cell/Cell.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import { translate } from '../../internal/i18n-utils.js';

/**
 * @class Multiplicity
 *
 * Defines invalid connections along with the error messages that they produce.
 * To add or remove rules on a graph, you must add/remove instances of this
 * class to {@link AbstractGraph.multiplicities}.
 *
 * ### Example
 *
 * ```javascript
 * graph.multiplicities.push(new mxMultiplicity(
 *   true, 'rectangle', null, null, 0, 2, ['circle'],
 *   'Only 2 targets allowed',
 *   'Only circle targets allowed'));
 * ```
 *
 * Defines a rule where each rectangle must be connected to no more than 2
 * circles and no other types of targets are allowed.
 */
class Multiplicity {
  constructor(
    source: boolean,
    type: string,
    attr: string,
    value: string,
    min: number | null | undefined,
    max: number | null | undefined,
    validNeighbors: string[],
    countError: string,
    typeError: string,
    validNeighborsAllowed = true
  ) {
    this.source = source;
    this.type = type;
    this.attr = attr;
    this.value = value;
    this.min = min ?? 0;
    this.max = max ?? Number.MAX_VALUE;
    this.validNeighbors = validNeighbors;
    this.countError = translate(countError) || countError;
    this.typeError = translate(typeError) || typeError;
    this.validNeighborsAllowed = validNeighborsAllowed;
  }

  /**
   * Defines the type of the source or target terminal. The type is a string
   * passed to {@link mxUtils.isNode} together with the source or target vertex
   * value as the first argument.
   */
  type: string;

  /**
   * Optional string that specifies the attributename to be passed to
   * {@link mxUtils.isNode} to check if the rule applies to a cell.
   */
  attr: string;

  /**
   * Optional string that specifies the value of the attribute to be passed
   * to {@link mxUtils.isNode} to check if the rule applies to a cell.
   */
  value: string;

  /**
   * Boolean that specifies if the rule is applied to the source or target
   * terminal of an edge.
   */
  source: boolean;

  /**
   * Defines the minimum number of connections for which this rule applies.
   * @default 0
   */
  min: number;

  /**
   * Defines the maximum number of connections for which this rule applies.
   * @default {@link Number.MAX_VALUE}
   */
  max: number;

  /**
   * Holds an array of strings that specify the type of neighbor for which
   * this rule applies. The strings are used in {@link Cell.is} on the opposite
   * terminal to check if the rule applies to the connection.
   */
  validNeighbors: Array<string>;

  /**
   * Boolean indicating if the list of validNeighbors are those that are allowed
   * for this rule or those that are not allowed for this rule.
   */
  validNeighborsAllowed = true;

  /**
   * Holds the localized error message to be displayed if the number of
   * connections for which the rule applies is smaller than {@link min} or greater
   * than {@link max}.
   */
  countError: string;

  /**
   * Holds the localized error message to be displayed if the type of the
   * neighbor for a connection does not match the rule.
   */
  typeError: string;

  /**
   * Checks the multiplicity for the given arguments and returns the error
   * for the given connection or null if the multiplicity does not apply.
   *
   * @param graph Reference to the enclosing {@link AbstractGraph} instance.
   * @param edge {@link Cell} that represents the edge to validate.
   * @param source {@link Cell} that represents the source terminal.
   * @param target {@link Cell} that represents the target terminal.
   * @param sourceOut Number of outgoing edges from the source terminal.
   * @param targetIn Number of incoming edges for the target terminal.
   */
  check(
    graph: AbstractGraph,
    edge: Cell,
    source: Cell,
    target: Cell,
    sourceOut: number,
    targetIn: number
  ): string | null {
    let error = '';

    if (
      (this.source && this.checkTerminal(graph, source, edge)) ||
      (!this.source && this.checkTerminal(graph, target, edge))
    ) {
      if (
        this.countError != null &&
        ((this.source && (this.max === 0 || sourceOut >= this.max)) ||
          (!this.source && (this.max === 0 || targetIn >= this.max)))
      ) {
        error += `${this.countError}\n`;
      }

      if (
        this.validNeighbors != null &&
        this.typeError != null &&
        this.validNeighbors.length > 0
      ) {
        const isValid = this.checkNeighbors(graph, edge, source, target);

        if (!isValid) {
          error += `${this.typeError}\n`;
        }
      }
    }

    return error.length > 0 ? error : null;
  }

  /**
   * Checks if there are any valid neighbours in {@link validNeighbors}. This is only
   * called if {@link validNeighbors} is a non-empty array.
   */
  checkNeighbors(graph: AbstractGraph, edge: Cell, source: Cell, target: Cell): boolean {
    const sourceValue = source.getValue();
    const targetValue = target.getValue();
    let isValid = !this.validNeighborsAllowed;
    const valid = this.validNeighbors;

    for (let j = 0; j < valid.length; j++) {
      if (this.source && this.checkType(graph, targetValue, valid[j])) {
        isValid = this.validNeighborsAllowed;
        break;
      } else if (!this.source && this.checkType(graph, sourceValue, valid[j])) {
        isValid = this.validNeighborsAllowed;
        break;
      }
    }

    return isValid;
  }

  /**
   * Checks the given terminal cell and returns true if this rule applies. The
   * given cell is the source or target of the given edge, depending on
   * {@link source}. This implementation uses {@link checkType} on the terminal's value.
   */
  checkTerminal(graph: AbstractGraph, edge: Cell, terminal: Cell): boolean {
    const value = terminal?.getValue() ?? null;

    return this.checkType(graph, value, this.type, this.attr, this.value);
  }

  /**
   * Checks the type of the given value.
   */
  checkType(
    graph: AbstractGraph,
    value: string | Element | Cell,
    type: string,
    attr?: string,
    attrValue?: any
  ): boolean {
    if (value != null) {
      if (
        typeof value !== 'string' &&
        'nodeType' in value &&
        !Number.isNaN(value.nodeType)
      ) {
        // Checks if value is a DOM node
        return isNode(value, type, attr, attrValue);
      }
      return value === type;
    }
    return false;
  }
}

export default Multiplicity;
