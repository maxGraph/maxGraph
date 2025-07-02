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

import { _mxCompactTreeLayoutNode } from '../CompactTreeLayout.js';
import GraphAbstractHierarchyCell from '../datatypes/GraphAbstractHierarchyCell.js';

/**
 * A utility class used to track cells whilst sorting occurs on the weighted
 * sum of their connected edges. Does not violate (x.compareTo(y)==0) ==
 * (x.equals(y))
 *
 * @category Layout
 */
class WeightedCellSorter {
  constructor(
    cell: _mxCompactTreeLayoutNode | GraphAbstractHierarchyCell,
    weightedValue = 0
  ) {
    this.cell = cell;
    this.weightedValue = weightedValue;
  }

  /**
   * The weighted value of the cell stored.
   */
  weightedValue = 0;

  /**
   * Whether or not to flip equal weight values.
   */
  nudge = false;

  /**
   * Whether or not this cell has been visited in the current assignment.
   */
  visited = false;

  /**
   * The index this cell is in the model rank.
   */
  rankIndex: number | null = null;

  /**
   * The cell whose median value is being calculated.
   */
  cell: _mxCompactTreeLayoutNode | GraphAbstractHierarchyCell;

  /**
   * Compares two WeightedCellSorters.
   */
  static compare(a: WeightedCellSorter, b: WeightedCellSorter): number {
    if (a != null && b != null) {
      if (b.weightedValue > a.weightedValue) {
        return -1;
      }
      if (b.weightedValue < a.weightedValue) {
        return 1;
      }
      if (b.nudge) {
        return -1;
      }
      return 1;
    }
    return 0;
  }
}

export default WeightedCellSorter;
