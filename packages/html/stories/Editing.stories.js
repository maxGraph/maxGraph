/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2020, JGraph Ltd

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

import {
  Graph,
  KeyHandler,
  styleUtils,
  domUtils,
  cloneUtils,
  eventUtils,
} from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';

export default {
  title: 'Editing/Editing',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }) => {
  const div = document.createElement('div');
  div.innerHTML = `
    Double-click the upper/lower half of the cell to edit different fields
    of the user object.
  `;

  const container = createGraphContainer(args);
  div.appendChild(container);

  class MyCustomGraph extends Graph {
    getLabel(cell) {
      // Returns a HTML representation of the cell where the
      // upper half is the first value, lower half is second
      // value

      const table = document.createElement('table');
      table.style.height = '100%';
      table.style.width = '100%';

      const body = document.createElement('tbody');
      const tr1 = document.createElement('tr');
      const td1 = document.createElement('td');
      td1.style.textAlign = 'center';
      td1.style.fontSize = '12px';
      td1.style.color = '#774400';
      domUtils.write(td1, cell.value.first);

      const tr2 = document.createElement('tr');
      const td2 = document.createElement('td');
      td2.style.textAlign = 'center';
      td2.style.fontSize = '12px';
      td2.style.color = '#774400';
      domUtils.write(td2, cell.value.second);

      tr1.appendChild(td1);
      tr2.appendChild(td2);
      body.appendChild(tr1);
      body.appendChild(tr2);
      table.appendChild(body);

      return table;
    }

    getEditingValue(cell, evt) {
      // Returns the editing value for the given cell and event
      evt.fieldname = this.__getFieldnameForEvent(cell, evt);
      return cell.value[evt.fieldname] || '';
    }

    __getFieldnameForEvent(cell, evt) {
      // Helper method that returns the fieldname to be used for
      // a mouse event
      if (evt != null) {
        // Finds the relative coordinates inside the cell
        const point = styleUtils.convertPoint(
          this.container,
          eventUtils.getClientX(evt),
          eventUtils.getClientY(evt)
        );
        const state = this.getView().getState(cell);

        if (state != null) {
          point.x -= state.x;
          point.y -= state.y;

          // Returns second if mouse in second half of cell
          if (point.y > state.height / 2) {
            return 'second';
          }
        }
      }
      return 'first';
    }

    labelChanged(cell, newValue, trigger) {
      // Sets the new value for the given cell and trigger
      const name = trigger != null ? trigger.fieldname : null;

      if (name != null) {
        // Clones the user object for correct undo and puts
        // the new value in the correct field.
        const value = cloneUtils.clone(cell.value);
        value[name] = newValue;
        newValue = value;

        super.labelChanged(cell, newValue, trigger);
      }
    }
  }

  // Creates the graph inside the given container
  const graph = new MyCustomGraph(container);
  graph.setHtmlLabels(true);

  // Adds handling of return and escape keystrokes for editing
  const keyHandler = new KeyHandler(graph);

  // Sample user objects with 2 fields
  const value = {};
  value.first = 'First value';
  value.second = 'Second value';

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value,
      position: [100, 60],
      size: [120, 80],
      style: { overflow: 'fill' },
    });
  });

  return div;
};

export const Default = Template.bind({});
