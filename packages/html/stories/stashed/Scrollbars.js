/**
 * Copyright (c) 2006-2015, JGraph Ltd
  

 */

import React from 'react';
import mxEvent from '../mxgraph/util/mxEvent';
import mxGraph from '../mxgraph/view/mxGraph';
import mxRubberband from '../mxgraph/handler/mxRubberband';
import { error } from '../../packages/core/src/util/gui/MaxWindow';
import { createXmlDocument } from '../../packages/core/src/util/xmlUtils';
import { button } from '../../packages/core/src/util/dom/DomHelpers';
import { isNode } from '../../packages/core/src/util/domUtils';

class Scrollbars extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    // A container for the graph
    return (
      <>
        <h1>Scrollbars</h1>
        This example demonstrates using
        a scrollable table with different sections in a cell label.

        <div
          ref={el => {
            this.el = el;
          }}
          style={{

          }}
        />
      </>
    );
  };

  componentDidMount() {

  };
}

export default Scrollbars;


  <style type="text/css" media="screen">
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
  </style>

    function main(container)
    {
      // Checks if the browser is supported
      if (!Client.isBrowserSupported())
      {
        // Displays an error message if the browser is not supported.
        error('Browser is not supported!', 200, false);
      }
      else
      {
        // Must be disabled to compute positions inside the DOM tree of the cell label.
        mxGraphView.prototype.optimizeVmlReflows = false;

        // If connect preview is not moved away then getCellAt is used to detect the cell under
        // the mouse if the mouse is over the preview shape in IE (no event transparency), ie.
        // the built-in hit-detection of the HTML document will not be used in this case. This is
        // not a problem here since the preview moves away from the mouse as soon as it connects
        // to any given table row. This is because the edge connects to the outside of the row and
        // is aligned to the grid during the preview.
        ConnectionHandler.prototype.movePreviewAway = false;

        // Disables foreignObjects
        Client.NO_FO = true;

        // Enables move preview in HTML to appear on top
        SelectionHandler.prototype.htmlPreview = true;

        // Enables connect icons to appear on top of HTML
        ConnectionHandler.prototype.moveIconFront = true;

        // Defines an icon for creating new connections in the connection handler.
        // This will automatically disable the highlighting of the source vertex.
        ConnectionHandler.prototype.connectImage = new Image('images/connector.gif', 16, 16);

        // Disables the context menu
        mxEvent.disableContextMenu(container);

        // Overrides target perimeter point for connection previews
        ConnectionHandler.prototype.getTargetPerimeterPoint = function(state, me)
        {
          // Determines the y-coordinate of the target perimeter point
          // by using the currentRowNode assigned in updateRow
          let y = me.getY();

          if (this.currentRowNode != null)
          {
            y = getRowY(state, this.currentRowNode);
          }

          // Checks on which side of the terminal to leave
          let x = state.x;

          if (this.previous.getCenterX() > state.getCenterX())
          {
            x += state.width;
          }

          return new Point(x, y);
        };

        // Overrides source perimeter point for connection previews
        ConnectionHandler.prototype.getSourcePerimeterPoint = function(state, next, me)
        {
          let y = me.getY();

          if (this.sourceRowNode != null)
          {
            y = getRowY(state, this.sourceRowNode);
          }

          // Checks on which side of the terminal to leave
          let x = state.x;

          if (next.x > state.getCenterX())
          {
            x += state.width;
          }

          return new Point(x, y);
        };

        // Disables connections to invalid rows
        ConnectionHandler.prototype.isValidTarget = function(cell)
        {
          return this.currentRowNode != null;
        };

        // Creates the graph inside the given container
        let graph = new mxGraph(container);

        // Uses the entity perimeter (below) as default
        graph.stylesheet.getDefaultVertexStyle().verticalAlign = mxConstants.ALIGN_TOP;
        graph.stylesheet.getDefaultVertexStyle().perimiter =
          Perimeter.EntityPerimeter;
        graph.stylesheet.getDefaultVertexStyle().shadow = true;
        graph.stylesheet.getDefaultVertexStyle().fillColor = '#DDEAFF';
        graph.stylesheet.getDefaultVertexStyle().gradientColor = '#A9C4EB';
        delete graph.stylesheet.getDefaultVertexStyle().strokeColor;

        // Used for HTML labels that use up the complete vertex space (see
        // graph.cellRenderer.redrawLabel below for syncing the size)
        graph.stylesheet.getDefaultVertexStyle().overflow = 'fill';

        // Uses the entity edge style as default
        graph.stylesheet.getDefaultEdgeStyle().edge =
          mxEdgeStyle.EntityRelation;
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

        // Override folding to allow for tables
        graph.isCellFoldable = function(cell, collapse)
        {
          return cell.isVertex();
        };

        // Overrides connectable state
        graph.isCellConnectable = function(cell)
        {
          return !cell.isCollapsed();
        };

        // Enables HTML markup in all labels
        graph.setHtmlLabels(true);

        // Scroll events should not start moving the vertex
        graph.cellRenderer.isLabelEvent = function(state, evt)
        {
          let source = mxEvent.getSource(evt);

          return state.text != null && source != state.text.node &&
            source != state.text.node.getElementsByTagName('div')[0];
        };

        // Adds scrollbars to the outermost div and keeps the
        // DIV position and size the same as the vertex
        let oldRedrawLabel = graph.cellRenderer.redrawLabel;
        graph.cellRenderer.redrawLabel = function(state)
        {
          oldRedrawLabel.apply(this, arguments); // "supercall"
          let graph = state.view.graph;
          let model = graph.model;

          if (state.cell.isVertex() && state.text != null)
          {
            // Scrollbars are on the div
            let s = graph.view.scale;
            let div = state.text.node.getElementsByTagName('div')[2];

            if (div != null)
            {
              // Installs the handler for updating connected edges
              if (div.scrollHandler == null)
              {
                div.scrollHandler = true;

                let updateEdges = () =>
                {
                  let edgeCount = state.cell.getEdgeCount();

                  // Only updates edges to avoid update in DOM order
                  // for text label which would reset the scrollbar
                  for (let i = 0; i < edgeCount; i++)
                  {
                    let edge = state.cell.getEdgeAt(i);
                    graph.view.invalidate(edge, true, false);
                    graph.view.validate(edge);
                  }
                };

                mxEvent.addListener(div, 'scroll', updateEdges);
                mxEvent.addListener(div, 'mouseup', updateEdges);
              }
            }
          }
        };

        // Adds a new function to update the currentRow based on the given event
        // and return the DOM node for that row
        graph.connectionHandler.updateRow = function(target)
        {
          while (target != null && target.nodeName != 'TR')
          {
            target = target.parentNode;
          }

          this.currentRow = null;

          // Checks if we're dealing with a row in the correct table
          if (target != null && target.parentNode.parentNode.className == 'erd')
          {
            // Stores the current row number in a property so that it can
            // be retrieved to create the preview and final edge
            let rowNumber = 0;
            let current = target.parentNode.firstChild;

            while (target != current && current != null)
            {
              current = current.nextSibling;
              rowNumber++;
            }

            this.currentRow = rowNumber + 1;
          }
          else
          {
            target = null;
          }

          return target;
        };

        // Adds placement of the connect icon based on the mouse event target (row)
        graph.connectionHandler.updateIcons = function(state, icons, me)
        {
          let target = me.getSource();
          target = this.updateRow(target);

          if (target != null && this.currentRow != null)
          {
            let div = target.parentNode.parentNode.parentNode;
            let s = state.view.scale;

            icons[0].node.style.visibility = 'visible';
            icons[0].bounds.x = state.x + target.offsetLeft + Math.min(state.width,
              target.offsetWidth * s) - this.icons[0].bounds.width - 2;
            icons[0].bounds.y = state.y - this.icons[0].bounds.height / 2 + (target.offsetTop +
                target.offsetHeight / 2 - div.scrollTop + div.offsetTop) * s;
            icons[0].redraw();

            this.currentRowNode = target;
          }
          else
          {
            icons[0].node.style.visibility = 'hidden';
          }
        };

        // Updates the targetRow in the preview edge State
        let oldMouseMove = graph.connectionHandler.mouseMove;
        graph.connectionHandler.mouseMove = function(sender, me)
        {
          if (this.edgeState != null)
          {
            this.currentRowNode = this.updateRow(me.getSource());

            if (this.currentRow != null)
            {
              this.edgeState.cell.value.setAttribute('targetRow', this.currentRow);
            }
            else
            {
              this.edgeState.cell.value.setAttribute('targetRow', '0');
            }

            // Destroys icon to prevent event redirection via image in IE
            this.destroyIcons();
          }

          oldMouseMove.apply(this, arguments);
        };

        // Creates the edge state that may be used for preview
        graph.connectionHandler.createEdgeState = function(me)
        {
          let relation = doc.createElement('Relation');
          relation.setAttribute('sourceRow', this.currentRow || '0');
          relation.setAttribute('targetRow', '0');

          let edge = this.createEdge(relation);
          let style = this.graph.getCellStyle(edge);
          let state = new Cell(this.graph.view, edge, style);

          // Stores the source row in the handler
          this.sourceRowNode = this.currentRowNode;

          return state;
        };

        // Overrides getLabel to return empty labels for edges and
        // short markup for collapsed cells.
        graph.getLabel = function(cell)
        {
          if (cell.isVertex())
          {
            if (cell.isCollapsed())
            {
              return '<table style="overflow:hidden;" width="100%" height="100%" border="1" cellpadding="4" class="title" style="height:100%;">' +
                '<tr><th>Customers</th></tr>' +
                '</table>';
            }
            else
            {
              return '<table style="overflow:hidden;" width="100%" border="1" cellpadding="4" class="title">' +
                '<tr><th colspan="2">Customers</th></tr>' +
                '</table>'+
                '<div style="overflow:auto;cursor:default;top:26px;bottom:0px;position:absolute;width:100%;">'+
                '<table width="100%" height="100%" border="1" cellpadding="4" class="erd">' +
                '<tr><td>' +
                '<img align="center" src="images/key.png"/>' +
                '<img align="center" src="images/plus.png"/>' +
                '</td><td>' +
                '<u>customerId</u></td></tr><tr><td></td><td>number</td></tr>' +
                '<tr><td></td><td>firstName</td></tr><tr><td></td><td>lastName</td></tr>' +
                '<tr><td></td><td>streetAddress</td></tr><tr><td></td><td>city</td></tr>' +
                '<tr><td></td><td>state</td></tr><tr><td></td><td>zip</td></tr>' +
                '</table></div>';
            }
          }
          else
          {
            return '';
          }
        };

        // User objects (data) for the individual cells
        let doc = createXmlDocument();

        // Same should be used to create the XML node for the table
        // description and the rows (most probably as child nodes)
        let relation = doc.createElement('Relation');
        relation.setAttribute('sourceRow', '4');
        relation.setAttribute('targetRow', '6');

        // Enables rubberband selection
        new mxRubberband(graph);

        // Enables key handling (eg. escape)
        new KeyHandler(graph);

        // Gets the default parent for inserting new cells. This
        // is normally the first child of the root (ie. layer 0).
        let parent = graph.getDefaultParent();

        // Adds cells to the model in a single step
        let width = 160;
        let height = 230;
        graph.getModel().beginUpdate();
        try
        {
          var v1 = graph.insertVertex(parent, null, '', 20, 20, width, height);
          v1.geometry.alternateBounds = new Rectangle(0, 0, width, 26);

          var v2 = graph.insertVertex(parent, null, '', 400, 150, width, height);
          v2.geometry.alternateBounds = new Rectangle(0, 0, width, 26);

          graph.insertEdge(parent, null, relation, v1, v2);
        }
        finally
        {
          // Updates the display
          graph.getModel().endUpdate();
        }

        var btn1 = button('+', function()
        {
          graph.zoomIn();
        });
        btn1.style.marginLeft = '20px';

        document.body.appendChild(btn1);
        document.body.appendChild(button('-', function()
        {
          graph.zoomOut();
        }));
      }
    };

    // Implements a special perimeter for table rows inside the table markup
    mxGraphView.prototype.updateFloatingTerminalPoint = function(edge, start, end, source)
    {
      let next = this.getNextPoint(edge, end, source);
      let div = start.text.node.getElementsByTagName('div')[2];

      let x = start.x;
      let y = start.getCenterY();

      // Checks on which side of the terminal to leave
      if (next.x > x + start.width / 2)
      {
        x += start.width;
      }

      if (div != null)
      {
        y = start.getCenterY() - div.scrollTop;

        if (isNode(edge.cell.value) && !start.cell.isCollapsed())
        {
          let attr = (source) ? 'sourceRow' : 'targetRow';
          let row = parseInt(edge.cell.value.getAttribute(attr));

          // HTML labels contain an outer table which is built-in
          let table = div.getElementsByTagName('table')[0];
          let trs = table.getElementsByTagName('tr');
          let tr = trs[Math.min(trs.length - 1, row - 1)];

          // Gets vertical center of source or target row
          if (tr != null)
          {
            y = getRowY(start, tr);
          }
        }

        // Keeps vertical coordinate inside start
        let offsetTop = parseInt(div.style.top) * start.view.scale;
        y = Math.min(start.y + start.height, Math.max(start.y + offsetTop, y));

        // Updates the vertical position of the nearest point if we're not
        // dealing with a connection preview, in which case either the
        // edgeState or the absolutePoints are null
        if (edge != null && edge.absolutePoints != null)
        {
          next.y = y;
        }
      }

      edge.setAbsoluteTerminalPoint(new Point(x, y), source);

      // Routes multiple incoming edges along common waypoints if
      // the edges have a common target row
      if (source && isNode(edge.cell.value) && start != null && end != null)
      {
        let edges = this.graph.getEdgesBetween(start.cell, end.cell, true);
        let tmp = [];

        // Filters the edges with the same source row
        let row = edge.cell.value.getAttribute('targetRow');

        for (let i = 0; i < edges.length; i++)
        {
          if (isNode(edges[i].value) &&
            edges[i].value.getAttribute('targetRow') == row)
          {
            tmp.push(edges[i]);
          }
        }

        edges = tmp;

        if (edges.length > 1 && edge.cell == edges[edges.length - 1])
        {
          // Finds the vertical center
          let states = [];
          let y = 0;

          for (let i = 0; i < edges.length; i++)
            {
            states[i] = this.getState(edges[i]);
               y += states[i].absolutePoints[0].y;
            }

            y /= edges.length;

            for (let i = 0; i < states.length; i++)
            {
            let x = states[i].absolutePoints[1].x;

            if (states[i].absolutePoints.length < 5)
            {
              states[i].absolutePoints.splice(2, 0, new Point(x, y));
            }
            else
            {
              states[i].absolutePoints[2] = new Point(x, y);
            }

            // Must redraw the previous edges with the changed point
            if (i < states.length - 1)
            {
              this.graph.cellRenderer.redraw(states[i]);
            }
            }
        }
      }
    };

    // Defines global helper function to get y-coordinate for a given cell state and row
    let getRowY = function(state, tr)
    {
      let s = state.view.scale;
      let div = tr.parentNode.parentNode.parentNode;
      let offsetTop = parseInt(div.style.top);
      let y = state.y + (tr.offsetTop + tr.offsetHeight / 2 - div.scrollTop + offsetTop) * s;
      y = Math.min(state.y + state.height, Math.max(state.y + offsetTop * s, y));

      return y;
    };
  </script>
</head>

<!-- Page passes the container for the graph to the program -->
<body onload="main(document.getElementById('graphContainer'))">

  <!-- Creates a container for the graph with a grid wallpaper. Width, height and cursor in the style are for IE only -->
  <div id="graphContainer"
    style="cursor:default;position:absolute;top:30px;left:0px;bottom:0px;right:0px;background:url('editors/images/grid.gif')">
  </div>
</body>
</html>
