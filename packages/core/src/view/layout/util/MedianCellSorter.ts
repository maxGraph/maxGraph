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

import GraphAbstractHierarchyCell from "../datatypes/GraphAbstractHierarchyCell";

/**
 * Class: MedianCellSorter
 *
 * A utility class used to track cells whilst sorting occurs on the median
 * values. Does not violate (x.compareTo(y)==0) == (x.equals(y))
 *
 * Constructor: MedianCellSorter
 *
 * Constructs a new median cell sorter.
 */
class MedianCellSorter {
  constructor() {
    // empty
  }

  /**
   * The weighted value of the cell stored.
   */
  medianValue: number = 0;

  /**
   * The cell whose median value is being calculated
   */
  cell: GraphAbstractHierarchyCell | boolean = false;

  /**
   * Compares two MedianCellSorters.
   */
  compare(a: MedianCellSorter, b: MedianCellSorter) {
    if (a != null && b != null) {
      if (b.medianValue > a.medianValue) {
        return -1;
      }
      if (b.medianValue < a.medianValue) {
        return 1;
      }
      return 0;
    }
    return 0;
  }
}

export default MedianCellSorter;
