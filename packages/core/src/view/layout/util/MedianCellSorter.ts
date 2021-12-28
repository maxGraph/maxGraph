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
