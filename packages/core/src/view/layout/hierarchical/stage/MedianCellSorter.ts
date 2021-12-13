class MedianCellSorter {
  constructor() {
    // empty
  }

  /**
   * Variable: medianValue
   *
   * The weighted value of the cell stored.
   */
  medianValue: number = 0;

  /**
   * Variable: cell
   *
   * The cell whose median value is being calculated
   */
  cell: boolean = false;

  /**
   * Function: compare
   *
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
