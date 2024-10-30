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
Show region

This example demonstrates using a custom rubberband handler to show the selected region in a new window.
*/

import {
  eventUtils,
  Graph,
  InternalEvent,
  MaxPopupMenu,
  type PopupMenuHandler,
  printUtils,
  RubberBandHandler,
  styleUtils,
} from '@maxgraph/core';
import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';
import EventSource from '@maxgraph/core/lib/view/event/EventSource.ts';
import InternalMouseEvent from '@maxgraph/core/lib/view/event/InternalMouseEvent.ts';
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

export default {
  title: 'Misc/ShowRegion',
  argTypes: {
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...globalValues,
    ...rubberBandValues,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  const styleElm = document.createElement('style');
  styleElm.innerText = CSS_TEMPLATE;
  document.head.appendChild(styleElm);

  const mainDiv = document.createElement('div');
  const divMessage = document.createElement('div');
  divMessage.innerHTML =
    'Use the right mouse button to select a region of the diagram and select <i>Show this</i>.';
  mainDiv.appendChild(divMessage);

  const container = createGraphContainer(args);
  mainDiv.appendChild(container);

  // Disables built-in context menu
  InternalEvent.disableContextMenu(container);

  // Changes some default colors
  // TODO Find a way of modifying globally or setting locally! See https://github.com/maxGraph/maxGraph/issues/192
  //constants.HANDLE_FILLCOLOR = '#99ccff';
  //constants.HANDLE_STROKECOLOR = '#0088cf';
  //constants.VERTEX_SELECTION_COLOR = '#00a8ff';

  // Creates the graph inside the given container
  const graph = new Graph(container);

  class MyCustomRubberBandHandler extends RubberBandHandler {
    isForceRubberbandEvent(me: InternalMouseEvent) {
      return super.isForceRubberbandEvent(me) || me.isPopupTrigger();
    }

    // Defines a new popup menu for region selection in the rubberband handler
    popupMenu = new MaxPopupMenu(function (menu, _cell, _evt) {
      // @ts-ignore TODO fix https://github.com/maxGraph/maxGraph/issues/308
      menu.addItem('Show this', null, function () {
        rubberband.popupMenu.hideMenu();
        const bounds = graph.getGraphBounds();
        printUtils.show(
          graph,
          null,
          bounds.x - rubberband.x,
          bounds.y - rubberband.y,
          rubberband.width,
          rubberband.height
        );
      });
    });

    mouseDown(sender: EventSource, me: InternalMouseEvent) {
      this.popupMenu.hideMenu();
      super.mouseDown(sender, me);
    }

    mouseUp(sender: EventSource, me: InternalMouseEvent) {
      if (eventUtils.isPopupTrigger(me.getEvent())) {
        if (!graph.getPlugin<PopupMenuHandler>('PopupMenuHandler').isMenuShowing()) {
          const origin = styleUtils.getScrollOrigin();
          this.popupMenu.popup(
            me.getX() + origin.x + 1,
            me.getY() + origin.y + 1,
            null,
            me.getEvent()
          );
          this.reset();
        }
      } else {
        super.mouseUp(sender, me);
      }
    }
  }

  // Enables rubberband selection
  const rubberband = new MyCustomRubberBandHandler(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
    const v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    graph.insertEdge(parent, null, '', v1, v2);
  });

  return mainDiv;
};

export const Default = Template.bind({});
