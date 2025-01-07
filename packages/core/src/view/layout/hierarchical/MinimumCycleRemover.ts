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

import HierarchicalLayoutStage from './HierarchicalLayoutStage';
import { remove } from '../../../util/arrayUtils';
import { clone } from '../../../util/cloneUtils';
import Cell from '../../cell/Cell';
import GraphHierarchyNode from '../datatypes/GraphHierarchyNode';
import GraphHierarchyEdge from '../datatypes/GraphHierarchyEdge';
import HierarchicalLayout from '../HierarchicalLayout';
import GraphHierarchyModel from './GraphHierarchyModel';

/**
 * An implementation of the first stage of the Sugiyama layout. Straightforward
 * longest path calculation of layer assignment
 *
 * @category Layout
 */
class MinimumCycleRemover extends HierarchicalLayoutStage {
  /**
   * Creates a cycle remover for the given internal model.
   */
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
    const model = <GraphHierarchyModel>this.layout.getDataModel();
    const seenNodes: { [key: string]: GraphHierarchyNode } = {};
    const unseenNodesArray = model.vertexMapper.getValues();
    const unseenNodes: { [key: string]: GraphHierarchyNode } = {};

    for (let i = 0; i < unseenNodesArray.length; i += 1) {
      unseenNodes[unseenNodesArray[i].id] = unseenNodesArray[i];
    }

    // Perform a dfs through the internal model. If a cycle is found,
    // reverse it.
    let rootsArray: GraphHierarchyNode[] | null = null;

    if (model.roots != null) {
      const modelRoots = model.roots;
      rootsArray = [];

      for (let i = 0; i < modelRoots.length; i += 1) {
        rootsArray[i] = <GraphHierarchyNode>model.vertexMapper.get(modelRoots[i]);
      }
    }

    model.visit(
      (
        parent: GraphHierarchyNode | null,
        node: GraphHierarchyNode,
        connectingEdge: GraphHierarchyEdge | null,
        layer: number,
        seen: number
      ) => {
        // Check if the cell is in it's own ancestor list, if so
        // invert the connecting edge and reverse the target/source
        // relationship to that edge in the parent and the cell
        if (parent && connectingEdge && node.isAncestor(parent)) {
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
      (
        parent: GraphHierarchyNode | null,
        node: GraphHierarchyNode,
        connectingEdge: GraphHierarchyEdge | null,
        layer: any,
        seen: any
      ) => {
        // Check if the cell is in it's own ancestor list, if so
        // invert the connecting edge and reverse the target/source
        // relationship to that edge in the parent and the cell
        if (parent && connectingEdge && node.isAncestor(parent)) {
          connectingEdge.invert();
          remove(connectingEdge, parent.connectsAsSource);
          node.connectsAsSource.push(connectingEdge);
          parent.connectsAsTarget.push(connectingEdge);
          remove(connectingEdge, node.connectsAsTarget);
        }

        seenNodes[node.id] = node;
        delete unseenNodes[node.id];
      },
      Object.values(unseenNodes),
      true,
      seenNodesCopy
    );
  }
}

export default MinimumCycleRemover;
