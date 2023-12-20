/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2015, JGraph Ltd

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
Scrollbars
This example demonstrates using a scrollable table with different sections in a cell label.
*/

import {
  Cell,
  CellRenderer,
  CellEditorHandler,
  Client,
  ConnectionHandler,
  constants,
  DomHelpers,
  domUtils,
  EdgeStyle,
  ImageBox,
  InternalEvent,
  Graph,
  GraphView,
  KeyHandler,
  PanningHandler,
  Perimeter,
  Point,
  Rectangle,
  RubberBandHandler,
  SelectionCellsHandler,
  SelectionHandler,
  xmlUtils,
} from '@maxgraph/core';
import {
  contextMenuTypes,
  contextMenuValues,
  globalValues,
  globalTypes,
} from './shared/args.js';
// style required by RubberBand
import '@maxgraph/core/css/common.css';

const CSS_TEMPLATE = `
table.title {
  border-color: black;
  border-collapse: collapse;
  cursor: move;
  height: 26px;
  border-bottom-style: none;
  color: black;
}
table.title th {
  font-size: 10pt;
  font-family: Verdana;
  white-space: nowrap;
  background: lightgray;
  font-weight: bold;
}
table.erd {
  font-size: 10pt;
  font-family: Verdana;
  border-color: black;
  border-collapse: collapse;
  overflow: auto;
  cursor: move;
  white-space: nowrap;
}
table.erd td {
  border-color: black;
  text-align: left;
  color: black;
}
button {
  position:absolute;
}
`;

// TODO apply this settings to the container used by the Graph
const HTML_TEMPLATE = `
<!-- Page passes the container for the graph to the program -->
<body onload="main(document.getElementById('graphContainer'))">

  <!-- Creates a container for the graph with a grid wallpaper. Width, height and cursor in the style are for IE only -->
  <div id="graphContainer"
    style="cursor:default;position:absolute;top:30px;left:0px;bottom:0px;right:0px;background:url('editors/images/grid.gif')">
  </div>
</body>
`;

export default {
  title: 'Misc/Scrollbars',
  argTypes: {
    ...contextMenuTypes,
    ...globalTypes,
  },
  args: {
    ...contextMenuValues,
    ...globalValues,
  },
};

const Template = ({ label, ...args }) => {
  const styleElm = document.createElement('style');
  styleElm.innerText = CSS_TEMPLATE;
  document.head.appendChild(styleElm);

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';

  // Disables foreignObjects
  Client.NO_FO = true;

  class MyCustomSelectionHandler extends SelectionHandler {
    // Enables move preview in HTML to appear on top
    htmlPreview = true;
  }

  // Disables the context menu
  InternalEvent.disableContextMenu(container);

  // Defines global helper function to get y-coordinate for a given cell state and row
  let getRowY = function (state, tr) {
    let s = state.view.scale;
    let div = tr.parentNode.parentNode.parentNode;
    let offsetTop = parseInt(div.style.top);
    let y =
      state.y + (tr.offsetTop + tr.offsetHeight / 2 - div.scrollTop + offsetTop) * s;
    y = Math.min(state.y + state.height, Math.max(state.y + offsetTop * s, y));
    return y;
  };

  // If connect preview is not moved away then getCellAt is used to detect the cell under
  // the mouse if the mouse is over the preview shape in IE (no event transparency), ie.
  // the built-in hit-detection of the HTML document will not be used in this case. This is
  // not a problem here since the preview moves away from the mouse as soon as it connects
  // to any given table row. This is because the edge connects to the outside of the row and
  // is aligned to the grid during the preview.
  class MyCustomConnectionHandler extends ConnectionHandler {
    movePreviewAway = false;

    // Enables connect icons to appear on top of HTML
    moveIconFront = true;

    // Defines an icon for creating new connections in the connection handler.
    // This will automatically disable the highlighting of the source vertex.
    connectImage = new ImageBox('images/connector.gif', 16, 16);

    // Overrides target perimeter point for connection previews
    getTargetPerimeterPoint(state, me) {
      // Determines the y-coordinate of the target perimeter point
      // by using the currentRowNode assigned in updateRow
      let y = me.getY();
      if (this.currentRowNode != null) {
        y = getRowY(state, this.currentRowNode);
      }

      // Checks on which side of the terminal to leave
      let x = state.x;
      if (this.previous.getCenterX() > state.getCenterX()) {
        x += state.width;
      }
      return new Point(x, y);
    }

    // Overrides source perimeter point for connection previews
    getSourcePerimeterPoint(state, next, me) {
      let y = me.getY();
      if (this.sourceRowNode != null) {
        y = getRowY(state, this.sourceRowNode);
      }

      // Checks on which side of the terminal to leave
      let x = state.x;
      if (next.x > state.getCenterX()) {
        x += state.width;
      }
      return new Point(x, y);
    }

    // Disables connections to invalid rows
    isValidTarget(cell) {
      return this.currentRowNode != null;
    }

    // Adds a new function to update the currentRow based on the given event
    // and return the DOM node for that row
    updateRow(target) {
      while (target != null && target.nodeName != 'TR') {
        target = target.parentNode;
      }
      this.currentRow = null;

      // Checks if we're dealing with a row in the correct table
      if (target != null && target.parentNode.parentNode.className == 'erd') {
        // Stores the current row number in a property so that it can
        // be retrieved to create the preview and final edge
        let rowNumber = 0;
        let current = target.parentNode.firstChild;

        while (target != current && current != null) {
          current = current.nextSibling;
          rowNumber++;
        }

        this.currentRow = rowNumber + 1;
      } else {
        target = null;
      }
      return target;
    }

    // Adds placement of the connect icon based on the mouse event target (row)
    updateIcons(state, icons, me) {
      let target = me.getSource();
      target = this.updateRow(target);

      if (target != null && this.currentRow != null) {
        let div = target.parentNode.parentNode.parentNode;
        let s = state.view.scale;

        icons[0].node.style.visibility = 'visible';
        icons[0].bounds.x =
          state.x +
          target.offsetLeft +
          Math.min(state.width, target.offsetWidth * s) -
          this.icons[0].bounds.width -
          2;
        icons[0].bounds.y =
          state.y -
          this.icons[0].bounds.height / 2 +
          (target.offsetTop + target.offsetHeight / 2 - div.scrollTop + div.offsetTop) *
            s;
        icons[0].redraw();

        this.currentRowNode = target;
      } else {
        icons[0].node.style.visibility = 'hidden';
      }
    }

    // Updates the targetRow in the preview edge State
    mouseMove(sender, me) {
      if (this.edgeState != null) {
        this.currentRowNode = this.updateRow(me.getSource());

        if (this.currentRow != null) {
          this.edgeState.cell.value.setAttribute('targetRow', this.currentRow);
        } else {
          this.edgeState.cell.value.setAttribute('targetRow', '0');
        }

        // Destroys icon to prevent event redirection via image in IE
        this.destroyIcons();
      }
      super.mouseMove.apply(this, arguments);
    }

    // Creates the edge state that may be used for preview
    createEdgeState(me) {
      let relation = doc.createElement('Relation');
      relation.setAttribute('sourceRow', this.currentRow || '0');
      relation.setAttribute('targetRow', '0');

      let edge = this.createEdge(relation);
      let style = this.graph.getCellStyle(edge);
      let state = new Cell(this.graph.view, edge, style);

      // Stores the source row in the handler
      this.sourceRowNode = this.currentRowNode;

      return state;
    }
  }

  class MyCustomCellRenderer extends CellRenderer {
    // Scroll events should not start moving the vertex
    isLabelEvent(state, evt) {
      let source = InternalEvent.getSource(evt);

      return (
        state.text != null &&
        source != state.text.node &&
        source != state.text.node.getElementsByTagName('div')[0]
      );
    }

    // Adds scrollbars to the outermost div and keeps the
    // DIV position and size the same as the vertex
    redrawLabel(state) {
      super.redrawLabel.apply(this, arguments); // "supercall"
      let graph = state.view.graph;
      let model = graph.model;

      if (state.cell.isVertex() && state.text != null) {
        // Scrollbars are on the div
        let s = graph.view.scale;
        let div = state.text.node.getElementsByTagName('div')[2];

        if (div != null) {
          // Installs the handler for updating connected edges
          if (div.scrollHandler == null) {
            div.scrollHandler = true;

            let updateEdges = () => {
              let edgeCount = state.cell.getEdgeCount();

              // Only updates edges to avoid update in DOM order
              // for text label which would reset the scrollbar
              for (let i = 0; i < edgeCount; i++) {
                let edge = state.cell.getEdgeAt(i);
                graph.view.invalidate(edge, true, false);
                graph.view.validate(edge);
              }
            };

            InternalEvent.addListener(div, 'scroll', updateEdges);
            InternalEvent.addListener(div, 'mouseup', updateEdges);
          }
        }
      }
    }
  }

  class MyCustomGraphView extends GraphView {
    // Implements a special perimeter for table rows inside the table markup
    updateFloatingTerminalPoint(edge, start, end, source) {
      let next = this.getNextPoint(edge, end, source);
      let div = start.text.node.getElementsByTagName('div')[2];

      let x = start.x;
      let y = start.getCenterY();

      // Checks on which side of the terminal to leave
      if (next.x > x + start.width / 2) {
        x += start.width;
      }

      if (div != null) {
        y = start.getCenterY() - div.scrollTop;

        if (domUtils.isNode(edge.cell.value) && !start.cell.isCollapsed()) {
          let attr = source ? 'sourceRow' : 'targetRow';
          let row = parseInt(edge.cell.value.getAttribute(attr));

          // HTML labels contain an outer table which is built-in
          let table = div.getElementsByTagName('table')[0];
          let trs = table.getElementsByTagName('tr');
          let tr = trs[Math.min(trs.length - 1, row - 1)];

          // Gets vertical center of source or target row
          if (tr != null) {
            y = getRowY(start, tr);
          }
        }

        // Keeps vertical coordinate inside start
        let offsetTop = parseInt(div.style.top) * start.view.scale;
        y = Math.min(
          isNaN(start.y + start.height) ? 9999999999999 : start.y + start.height,
          isNaN(Math.max(start.y + offsetTop, y))
            ? 9999999999999
            : Math.max(start.y + offsetTop, y)
        );

        // Updates the vertical position of the nearest point if we're not
        // dealing with a connection preview, in which case either the
        // edgeState or the absolutePoints are null
        if (edge != null && edge.absolutePoints != null) {
          next.y = y;
        }
      }

      edge.setAbsoluteTerminalPoint(new Point(x, y), source);

      // Routes multiple incoming edges along common waypoints if
      // the edges have a common target row
      if (source && domUtils.isNode(edge.cell.value) && start != null && end != null) {
        let edges = this.graph.getEdgesBetween(start.cell, end.cell, true);
        let tmp = [];

        // Filters the edges with the same source row
        let row = edge.cell.value.getAttribute('targetRow');

        for (let i = 0; i < edges.length; i++) {
          if (
            domUtils.isNode(edges[i].value) &&
            edges[i].value.getAttribute('targetRow') == row
          ) {
            tmp.push(edges[i]);
          }
        }

        edges = tmp;

        if (edges.length > 1 && edge.cell === edges[edges.length - 1]) {
          // Finds the vertical center
          let states = [];
          let y = 0;

          for (let i = 0; i < edges.length; i++) {
            states[i] = this.getState(edges[i]);
            y += states[i].absolutePoints[0].y;
          }

          y /= edges.length;

          for (let i = 0; i < states.length; i++) {
            let x = states[i].absolutePoints[1].x;

            if (states[i].absolutePoints.length < 5) {
              states[i].absolutePoints.splice(2, 0, new Point(x, y));
            } else {
              states[i].absolutePoints[2] = new Point(x, y);
            }

            // Must redraw the previous edges with the changed point
            if (i < states.length - 1) {
              this.graph.cellRenderer.redraw(states[i]);
            }
          }
        }
      }
    }
  }

  class MyCustomGraph extends Graph {
    // Override folding to allow for tables
    isCellFoldable(cell, collapse) {
      return cell.isVertex();
    }

    // Overrides connectable state
    isCellConnectable(cell) {
      return !cell.isCollapsed();
    }

    // Overrides getLabel to return empty labels for edges and
    // short markup for collapsed cells.
    getLabel(cell) {
      if (cell.isVertex()) {
        if (cell.isCollapsed()) {
          return (
            '<table style="overflow:hidden;" width="100%" height="100%" border="1" cellpadding="4" class="title" style="height:100%;">' +
            '<tr><th>Customers</th></tr>' +
            '</table>'
          );
        } else {
          return (
            '<table style="overflow:hidden;" width="100%" border="1" cellpadding="4" class="title">' +
            '<tr><th colspan="2">Customers</th></tr>' +
            '</table>' +
            '<div style="overflow:auto;cursor:default;top:26px;bottom:0px;position:absolute;width:100%;">' +
            '<table width="100%" height="100%" border="1" cellpadding="4" class="erd">' +
            '<tr><td>' +
            '<img align="center" src="images/key.png"/>' +
            '<img align="center" src="images/plus.png"/>' +
            '</td><td>' +
            '<u>customerId</u></td></tr><tr><td></td><td>number</td></tr>' +
            '<tr><td></td><td>firstName</td></tr><tr><td></td><td>lastName</td></tr>' +
            '<tr><td></td><td>streetAddress</td></tr><tr><td></td><td>city</td></tr>' +
            '<tr><td></td><td>state</td></tr><tr><td></td><td>zip</td></tr>' +
            '</table></div>'
          );
        }
      } else {
        return '';
      }
    }

    createCellRenderer() {
      return new MyCustomCellRenderer();
    }

    createGraphView() {
      return new MyCustomGraphView(this);
    }
  }

  // Creates the graph inside the given container
  let graph = new MyCustomGraph(
    container,
    null,
    // use a dedicated set of plugins
    [
      CellEditorHandler,
      ConnectionHandler,
      MyCustomConnectionHandler,
      MyCustomSelectionHandler,
      PanningHandler,
      RubberBandHandler,
      SelectionCellsHandler,
    ]
  );

  // Uses the entity perimeter (below) as default
  graph.stylesheet.getDefaultVertexStyle().verticalAlign = constants.ALIGN.TOP;
  graph.stylesheet.getDefaultVertexStyle().perimeter = Perimeter.RectanglePerimeter;
  graph.stylesheet.getDefaultVertexStyle().shadow = true;
  graph.stylesheet.getDefaultVertexStyle().fillColor = '#DDEAFF';
  graph.stylesheet.getDefaultVertexStyle().gradientColor = '#A9C4EB';
  delete graph.stylesheet.getDefaultVertexStyle().strokeColor;

  // Used for HTML labels that use up the complete vertex space (see
  // graph.cellRenderer.redrawLabel below for syncing the size)
  graph.stylesheet.getDefaultVertexStyle().overflow = 'fill';

  // Uses the entity edge style as default
  graph.stylesheet.getDefaultEdgeStyle().edge = EdgeStyle.EntityRelation;
  graph.stylesheet.getDefaultEdgeStyle().strokeColor = 'black';
  graph.stylesheet.getDefaultEdgeStyle().fontColor = 'black';

  // Allows new connections to be made but do not allow existing
  // connections to be changed for the sake of simplicity of this
  // example
  graph.setCellsDisconnectable(false);
  graph.setAllowDanglingEdges(false);
  graph.setCellsEditable(false);
  graph.setConnectable(true);
  graph.setPanning(true);
  graph.centerZoom = false;

  // Enables HTML markup in all labels
  graph.setHtmlLabels(true);

  // User objects (data) for the individual cells
  let doc = xmlUtils.createXmlDocument();

  // Same should be used to create the XML node for the table
  // description and the rows (most probably as child nodes)
  let relation = doc.createElement('Relation');
  relation.setAttribute('sourceRow', '4');
  relation.setAttribute('targetRow', '6');

  // Enables key handling (eg. escape)
  new KeyHandler(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  let parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  let width = 160;
  let height = 230;

  graph.batchUpdate(() => {
    let v1 = graph.insertVertex(parent, null, '', 20, 20, width, height);
    v1.geometry.alternateBounds = new Rectangle(0, 0, width, 26);

    let v2 = graph.insertVertex(parent, null, '', 400, 150, width, height);
    v2.geometry.alternateBounds = new Rectangle(0, 0, width, 26);

    graph.insertEdge(parent, null, relation, v1, v2);
  });

  let btn1 = DomHelpers.button('+', function () {
    graph.zoomIn();
  });
  btn1.style.marginLeft = '20px';

  document.body.appendChild(btn1);
  document.body.appendChild(
    DomHelpers.button('-', function () {
      graph.zoomOut();
    })
  );

  return container;
};

export const Default = Template.bind({});
