/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2013, JGraph Ltd

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

/*
Menustyle

This example demonstrates using CSS to style the mxPopupMenu.
*/

import {
  Client,
  CellOverlay,
  CellRenderer,
  EventObject,
  ImageBox,
  InternalEvent,
  InternalMouseEvent,
  RubberBandHandler,
  Graph,
  PopupMenuHandler,
  CellEditorHandler,
  TooltipHandler,
  SelectionCellsHandler,
  ConnectionHandler,
  SelectionHandler,
  PanningHandler,
} from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';
// style required by RubberBand
import '@maxgraph/core/css/common.css';

const CSS_TEMPLATE = `
body div.mxPopupMenu {
  -webkit-box-shadow: 3px 3px 6px #C0C0C0;
  -moz-box-shadow: 3px 3px 6px #C0C0C0;
  box-shadow: 3px 3px 6px #C0C0C0;
  background: white;
  position: absolute;
  border: 3px solid #e7e7e7;
  padding: 3px;
}
body table.mxPopupMenu {
  border-collapse: collapse;
  margin: 0px;
}
body tr.mxPopupMenuItem {
  color: black;
  cursor: default;
}
body td.mxPopupMenuItem {
  padding: 6px 60px 6px 30px;
  font-family: Arial;
  font-size: 10pt;
}
body td.mxPopupMenuIcon {
  background-color: white;
  padding: 0px;
}
body tr.mxPopupMenuItemHover {
  background-color: #eeeeee;
  color: black;
}
table.mxPopupMenu hr {
  border-top: solid 1px #cccccc;
}
table.mxPopupMenu tr {
  font-size: 4pt;
}
`;

// TODO apply this settings to the container used by the Graph
const HTML_TEMPLATE = `
<body onload="main(document.getElementById('graphContainer'))">
  <!-- Creates a container for the graph with a grid wallpaper -->
  <div id="graphContainer"
    style="overflow:hidden;width:321px;height:241px;background:url('./images/grid.gif');cursor:default;">
  </div>
</body>
</html>
`;

export default {
  title: 'Misc/MenuStyle',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }) => {
  const styleElm = document.createElement('style');
  styleElm.innerText = CSS_TEMPLATE;
  document.head.appendChild(styleElm);

  const container = createGraphContainer(args);

  // Disables built-in context menu
  InternalEvent.disableContextMenu(container);

  // Changes some default colors
  // TODO Find a way of modifying globally or setting locally! See https://github.com/maxGraph/maxGraph/issues/192
  //constants.HANDLE_FILLCOLOR = '#99ccff';
  //constants.HANDLE_STROKECOLOR = '#0088cf';
  //constants.VERTEX_SELECTION_COLOR = '#00a8ff';

  class MyCustomCellRenderer extends CellRenderer {
    installCellOverlayListeners(state, overlay, shape) {
      super.installCellOverlayListeners.apply(this, arguments);
      let graph = state.view.graph;

      InternalEvent.addGestureListeners(
        shape.node,
        function (evt) {
          graph.fireMouseEvent(
            InternalEvent.MOUSE_DOWN,
            new InternalMouseEvent(evt, state)
          );
        },
        function (evt) {
          graph.fireMouseEvent(
            InternalEvent.MOUSE_MOVE,
            new InternalMouseEvent(evt, state)
          );
        },
        function (evt) {}
      );

      if (!Client.IS_TOUCH) {
        InternalEvent.addListener(shape.node, 'mouseup', function (evt) {
          overlay.fireEvent(
            new EventObject(InternalEvent.CLICK, 'event', evt, 'cell', state.cell)
          );
        });
      }
    }
  }

  class MyCustomPopupMenuHandler extends PopupMenuHandler {
    // Configures automatic expand on mouseover
    autoExpand = true;

    constructor(graph) {
      super(graph);

      // Installs context menu
      this.factoryMethod = function (menu, cell, evt) {
        menu.addItem('Item 1', null, function () {
          alert('Item 1');
        });
        menu.addItem('Item 2', null, function () {
          alert('Item 2');
        });
        menu.addSeparator();

        let submenu1 = menu.addItem('Submenu 1', null, null);
        menu.addItem(
          'Subitem 1',
          null,
          function () {
            alert('Subitem 1');
          },
          submenu1
        );
        menu.addItem(
          'Subitem 1',
          null,
          function () {
            alert('Subitem 2');
          },
          submenu1
        );
      };
    }
  }

  class MyCustomGraph extends Graph {
    createCellRenderer() {
      return new MyCustomCellRenderer();
    }
  }

  // Creates the graph inside the given container
  let graph = new MyCustomGraph(container, null, [
    CellEditorHandler,
    TooltipHandler,
    SelectionCellsHandler,
    MyCustomPopupMenuHandler,
    ConnectionHandler,
    SelectionHandler,
    PanningHandler,
    RubberBandHandler,
  ]);
  graph.setTooltips(true);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  let parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  let v1;
  graph.batchUpdate(() => {
    v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
    let v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    let e1 = graph.insertEdge(parent, null, '', v1, v2);
  });

  // Creates a new overlay with an image and a tooltip and makes it "transparent" to events
  // and sets the overlay for the cell in the graph
  let overlay = new CellOverlay(
    new ImageBox('images/overlays/check.png', 16, 16),
    'Overlay tooltip'
  );
  graph.addCellOverlay(v1, overlay);

  return container;
};

export const Default = Template.bind({});
