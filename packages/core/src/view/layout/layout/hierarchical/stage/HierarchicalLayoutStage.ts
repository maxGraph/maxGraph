/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

/**
 * Class: mxHierarchicalLayoutStage
 *
 * The specific layout interface for hierarchical layouts. It adds a
 * <code>run</code> method with a parameter for the hierarchical layout model
 * that is shared between the layout stages.
 *
 * Constructor: mxHierarchicalLayoutStage
 *
 * Constructs a new hierarchical layout stage.
 */
class MxHierarchicalLayoutStage {
  constructor() {}

  /**
   * Function: execute
   *
   * Takes the graph detail and configuration information within the facade
   * and creates the resulting laid out graph within that facade for further
   * use.
   */
  execute(parent) {}
}

export default MxHierarchicalLayoutStage;
