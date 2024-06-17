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

import type { Graph } from '../Graph';

type PartialPorts = Pick<
  Graph,
  'portsEnabled' | 'isPort' | 'getTerminalForPort' | 'isPortsEnabled' | 'setPortsEnabled'
>;
type PartialType = PartialPorts;

export const PortsMixin: PartialType = {
  portsEnabled: true,

  isPort(cell) {
    return false;
  },

  getTerminalForPort(cell, _source = false) {
    return cell.getParent();
  },

  isPortsEnabled() {
    return this.portsEnabled;
  },

  setPortsEnabled(value) {
    this.portsEnabled = value;
  },
};
