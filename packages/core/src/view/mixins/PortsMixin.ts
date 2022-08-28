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

import { mixInto } from '../../util/Utils';
import Cell from '../cell/Cell';
import { Graph } from '../Graph';

declare module '../Graph' {
  interface Graph {
    portsEnabled: boolean;

    isPort: (cell: Cell | null) => boolean;
    getTerminalForPort: (cell: Cell, source: boolean) => Cell | null;
    isPortsEnabled: () => boolean;
    setPortsEnabled: (value: boolean) => void;
  }
}

type PartialPorts = Pick<
  Graph,
  'portsEnabled' | 'isPort' | 'getTerminalForPort' | 'isPortsEnabled' | 'setPortsEnabled'
>;
type PartialType = PartialPorts;

const PortsMixin: PartialType = {
  /**
   * Specifies if ports are enabled. This is used in {@link cellConnected} to update
   * the respective style.
   * @default true
   */
  portsEnabled: true,

  /*****************************************************************************
   * Group: Drilldown
   *****************************************************************************/

  /**
   * Returns true if the given cell is a "port", that is, when connecting to
   * it, the cell returned by getTerminalForPort should be used as the
   * terminal and the port should be referenced by the ID in either the
   * mxConstants.STYLE_SOURCE_PORT or the or the
   * mxConstants.STYLE_TARGET_PORT. Note that a port should not be movable.
   * This implementation always returns false.
   *
   * A typical implementation is the following:
   *
   * ```javascript
   * graph.isPort = function(cell)
   * {
   *   var geo = cell.getGeometry();
   *
   *   return (geo != null) ? geo.relative : false;
   * };
   * ```
   *
   * @param cell {@link mxCell} that represents the port.
   */
  isPort(cell) {
    return false;
  },

  /**
   * Returns the terminal to be used for a given port. This implementation
   * always returns the parent cell.
   *
   * @param cell {@link mxCell} that represents the port.
   * @param source If the cell is the source or target port.
   */
  getTerminalForPort(cell, source = false) {
    return cell.getParent();
  },

  /*****************************************************************************
   * Group: Graph behaviour
   *****************************************************************************/

  /**
   * Returns {@link portsEnabled} as a boolean.
   */
  isPortsEnabled() {
    return this.portsEnabled;
  },

  /**
   * Specifies if the ports should be enabled.
   *
   * @param value Boolean indicating if the ports should be enabled.
   */
  setPortsEnabled(value) {
    this.portsEnabled = value;
  },
};

mixInto(Graph)(PortsMixin);
