/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import HierarchicalLayoutStage from './HierarchicalLayoutStage';
import { remove } from '../../../../util/arrayUtils';
import { clone } from '../../../../util/cloneUtils';
import Cell from '../../../cell/Cell';
import GraphHierarchyNode from '../model/GraphHierarchyNode';
import GraphHierarchyEdge from '../model/GraphHierarchyEdge';
import HierarchicalLayout from '../HierarchicalLayout';

/**
 * An implementation of the first stage of the Sugiyama layout. Straightforward
 * longest path calculation of layer assignment
 *
 * Constructor: mxMinimumCycleRemover
 *
 * Creates a cycle remover for the given internal model.
 */
class MinimumCycleRemover extends HierarchicalLayoutStage {
  constructor(layout: HierarchicalLayout) {
    super();
    this.layout = layout;
  }

  /**
   * Reference to the enclosing <HierarchicalLayout>.
   */
  layout: HierarchicalLayout;

  /**
   * Takes the graph detail and configuration information within the facade
   * and creates the resulting laid out graph within that facade for further
   * use.
   */
  execute(parent: Cell): void {
    const model = this.layout.getModel();
    const seenNodes = {};
    const unseenNodesArray = model.vertexMapper.getValues();
    const unseenNodes = {};

    for (let i = 0; i < unseenNodesArray.length; i += 1) {
      unseenNodes[unseenNodesArray[i].id] = unseenNodesArray[i];
    }

    // Perform a dfs through the internal model. If a cycle is found,
    // reverse it.
    let rootsArray = null;

    if (model.roots != null) {
      const modelRoots = model.roots;
      rootsArray = [];

      for (let i = 0; i < modelRoots.length; i += 1) {
        rootsArray[i] = model.vertexMapper.get(modelRoots[i]);
      }
    }

    model.visit(
      (parent: GraphHierarchyNode, node: GraphHierarchyNode, connectingEdge: GraphHierarchyEdge, layer, seen) => {
        // Check if the cell is in it's own ancestor list, if so
        // invert the connecting edge and reverse the target/source
        // relationship to that edge in the parent and the cell
        if (node.isAncestor(parent)) {
          connectingEdge.invert();
          remove(connectingEdge, parent.connectsAsSource);
          parent.connectsAsTarget.push(connectingEdge);
          remove(connectingEdge, node.connectsAsTarget);
          node.connectsAsSource.push(connectingEdge);
        }

        seenNodes[node.id] = node;
        delete unseenNodes[node.id];
      },
      rootsArray,
      true,
      null
    );

    // If there are any nodes that should be nodes that the dfs can miss
    // these need to be processed with the dfs and the roots assigned
    // correctly to form a correct internal model
    const seenNodesCopy = clone(seenNodes, null, true);

    // Pick a random cell and dfs from it
    model.visit(
      (parent: GraphHierarchyNode, node: GraphHierarchyNode, connectingEdge: GraphHierarchyEdge, layer, seen) => {
        // Check if the cell is in it's own ancestor list, if so
        // invert the connecting edge and reverse the target/source
        // relationship to that edge in the parent and the cell
        if (node.isAncestor(parent)) {
          connectingEdge.invert();
          remove(connectingEdge, parent.connectsAsSource);
          node.connectsAsSource.push(connectingEdge);
          parent.connectsAsTarget.push(connectingEdge);
          remove(connectingEdge, node.connectsAsTarget);
        }

        seenNodes[node.id] = node;
        delete unseenNodes[node.id];
      },
      unseenNodes,
      true,
      seenNodesCopy
    );
  }
}

export default MinimumCycleRemover;
