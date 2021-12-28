/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import HierarchicalLayoutStage from './HierarchicalLayoutStage';
import { remove } from '../../../util/arrayUtils';
import CellPath from '../../cell/CellPath';
import { clone } from '../../../util/cloneUtils';
import Cell from 'src/view/cell/Cell';
import GraphHierarchyNode from '../datatypes/GraphHierarchyNode';
import GraphHierarchyEdge from '../datatypes/GraphHierarchyEdge';
import GraphHierarchyModel from './GraphHierarchyModel';
import SwimlaneLayout from '../SwimlaneLayout';

/**
 * An implementation of the first stage of the Sugiyama layout. Straightforward
 * longest path calculation of layer assignment
 *
 * Constructor: SwimlaneOrdering
 *
 * Creates a cycle remover for the given internal model.
 */
class SwimlaneOrdering extends HierarchicalLayoutStage {
  constructor(layout: SwimlaneLayout) {
    super();

    this.layout = layout;
  }

  /**
   * Reference to the enclosing <HierarchicalLayout>.
   */
  layout: SwimlaneLayout;

  /**
   * Takes the graph detail and configuration information within the facade
   * and creates the resulting laid out graph within that facade for further
   * use.
   */
  execute(parent: Cell) {
    const model = <GraphHierarchyModel>this.layout.getModel();
    const seenNodes: { [key: string]: Cell } = {};
    const unseenNodes = clone(model.vertexMapper, null, true);

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
      (parent: GraphHierarchyNode, node: GraphHierarchyNode, connectingEdge: GraphHierarchyEdge, layer: any, seen: any) => {
        // Check if the cell is in it's own ancestor list, if so
        // invert the connecting edge and reverse the target/source
        // relationship to that edge in the parent and the cell
        // Ancestor hashes only line up within a swimlane
        const isAncestor =
          parent != null &&
          parent.swimlaneIndex === node.swimlaneIndex &&
          node.isAncestor(parent);

        // If the source->target swimlane indices go from higher to
        // lower, the edge is reverse
        const reversedOverSwimlane =
          parent != null &&
          connectingEdge != null &&
          <number>parent.swimlaneIndex < <number>node.swimlaneIndex &&
          connectingEdge.source === node;

        if (isAncestor) {
          connectingEdge.invert();
          remove(connectingEdge, parent.connectsAsSource);
          node.connectsAsSource.push(connectingEdge);
          parent.connectsAsTarget.push(connectingEdge);
          remove(connectingEdge, node.connectsAsTarget);
        } else if (reversedOverSwimlane) {
          connectingEdge.invert();
          remove(connectingEdge, parent.connectsAsTarget);
          node.connectsAsTarget.push(connectingEdge);
          parent.connectsAsSource.push(connectingEdge);
          remove(connectingEdge, node.connectsAsSource);
        }

        const cellId = CellPath.create(node.cell);
        seenNodes[cellId] = node;
        delete unseenNodes[cellId];
      },
      rootsArray,
      true,
      null
    );
  }
}

export default SwimlaneOrdering;
