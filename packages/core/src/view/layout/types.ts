/*
Copyright 2022-present The maxGraph project Contributors

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
import type Dictionary from '../../util/Dictionary';
import type GraphHierarchyNode from './datatypes/GraphHierarchyNode';

export interface GraphLayoutTraverseArgs {
  vertex: Cell | null;
  directed: boolean | null;
  func: Function | null;
  edge: Cell | null;
  visited: Dictionary<Cell, boolean> | null;
}

export interface HierarchicalGraphLayoutTraverseArgs extends GraphLayoutTraverseArgs {
  allVertices: { [key: string]: Cell } | null;
  currentComp: { [key: string]: Cell | null };
  hierarchyVertices: GraphHierarchyNode[];
  filledVertexSet: { [key: string]: Cell } | null;
}

export interface SwimlaneGraphLayoutTraverseArgs extends HierarchicalGraphLayoutTraverseArgs {
  swimlaneIndex: number;
}
