import { error } from '../../packages/core/src/util/gui/MaxWindow';

<!--[if IE]><meta http-equiv="X-UA-Compatible" content="IE=5,IE=9" ><![endif]-->
/**
 * Copyright (c) 2006-2013, JGraph Ltd
 */

import React from 'react';
import mxEvent from '../mxgraph/util/mxEvent';
import mxGraph from '../mxgraph/view/mxGraph';
import mxRubberband from '../mxgraph/handler/mxRubberband';
import { convertPoint, createImage, getRotatedPoint, getValue, toRadians } from '../../packages/core/src/util/utils';

class Touch extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    // A container for the graph
    return (
      <>
        <h1>Touch</h1>
        This example demonstrates handling of touch,
        mouse and pointer events.

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

export default Touch;


  <style type="text/css">
    body div.mxPopupMenu {
      position: absolute;
      padding: 3px;
    }
    body table.mxPopupMenu {
      border-collapse: collapse;
      margin: 0px;
    }
    body tr.mxPopupMenuItem {
      cursor: default;
    }
    body td.mxPopupMenuItem {
      padding: 10px 60px 10px 30px;
      font-family: Arial;
      font-size: 9pt;
    }
    body td.mxPopupMenuIcon {
      padding: 0px;
    }
    table.mxPopupMenu hr {
      border-top: solid 1px #cccccc;
    }
    table.mxPopupMenu tr {
      font-size: 4pt;
    }
  </style>

    // Program starts here. Creates a sample graph in the
    // DOM node with the specified ID. This function is invoked
    // from the onLoad event handler of the document (see below).
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
        // To detect if touch events are actually supported, the following condition is recommended:
        // Client.IS_TOUCH || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0

        // Disables built-in text selection and context menu while not editing text
        let textEditing =  ((evt) =>
        {
          return graph.isEditing();
        });

        container.onselectstart = textEditing;
        container.onmousedown = textEditing;
        container.oncontextmenu = textEditing;

        // Creates the graph inside the given container
        let graph = new mxGraph(container);
        graph.centerZoom = false;
        graph.setConnectable(true);
        graph.setPanning(true);

        // Creates rubberband selection
          let rubberband = new mxRubberband(graph);

        graph.getPlugin('PopupMenuHandler').autoExpand = true;

        graph.getPlugin('PopupMenuHandler').isSelectOnPopup = function(me)
        {
          return mxEvent.isMouseEvent(me.getEvent());
        };

          // Installs context menu
        graph.getPlugin('PopupMenuHandler').factoryMethod = function(menu, cell, evt)
        {
          menu.addItem('Item 1', null, function()
            {
            alert('Item 1');
            });

          menu.addSeparator();

          var submenu1 = menu.addItem('Submenu 1', null, null);

          menu.addItem('Subitem 1', null, function()
            {
            alert('Subitem 1');
            }, submenu1);
          menu.addItem('Subitem 1', null, function()
            {
            alert('Subitem 2');
            }, submenu1);
        };

        // Context menu trigger implementation depending on current selection state
        // combined with support for normal popup trigger.
        let cellSelected = false;
        let selectionEmpty = false;
        let menuShowing = false;

        graph.fireMouseEvent = function(evtName, me, sender)
        {
          if (evtName == mxEvent.MOUSE_DOWN)
          {
            // For hit detection on edges
            me = this.updateMouseEvent(me);

            cellSelected = this.isCellSelected(me.getCell());
            selectionEmpty = this.isSelectionEmpty();
            menuShowing = graph.getPlugin('PopupMenuHandler').isMenuShowing();
          }

          mxGraph.prototype.fireMouseEvent.apply(this, arguments);
        };

        // Shows popup menu if cell was selected or selection was empty and background was clicked
        graph.getPlugin('PopupMenuHandler').mouseUp = function(sender, me)
        {
          this.popupTrigger = !graph.isEditing() && (this.popupTrigger || (!menuShowing &&
              !graph.isEditing() && !mxEvent.isMouseEvent(me.getEvent()) &&
              ((selectionEmpty && me.getCell() == null && graph.isSelectionEmpty()) ||
              (cellSelected && graph.isCellSelected(me.getCell())))));
          PopupMenuHandler.prototype.mouseUp.apply(this, arguments);
        };

        // Tap and hold on background starts rubberband for multiple selected
        // cells the cell associated with the event is deselected
        graph.addListener(mxEvent.TAP_AND_HOLD, function(sender, evt)
        {
          if (!mxEvent.isMultiTouchEvent(evt))
          {
            let me = evt.getProperty('event');
            let cell = evt.getProperty('cell');

            if (cell == null)
            {
              let pt = convertPoint(this.container,
                  mxEvent.getClientX(me), mxEvent.getClientY(me));
              rubberband.start(pt.x, pt.y);
            }
            else if (graph.getSelectionCount() > 1 && graph.isCellSelected(cell))
            {
              graph.removeSelectionCell(cell);
            }

            // Blocks further processing of the event
            evt.consume();
          }
        });

        // Adds mouse wheel handling for zoom
        mxEvent.addMouseWheelListener(function(evt, up)
        {
          if (up)
          {
            graph.zoomIn();
          }
          else
          {
            graph.zoomOut();
          }

          mxEvent.consume(evt);
        });

        // Gets the default parent for inserting new cells. This
        // is normally the first child of the root (ie. layer 0).
        let parent = graph.getDefaultParent();

        // Adds cells to the model in a single step
        graph.getDataModel().beginUpdate();
        try
        {
          var v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
          var v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
          var e1 = graph.insertEdge(parent, null, '', v1, v2);
        }
        finally
        {
          // Updates the display
          graph.getDataModel().endUpdate();
        }

        // Disables new connections via "hotspot"
        graph.getPlugin('ConnectionHandler').marker.isEnabled = function()
        {
          return this.graph.getPlugin('ConnectionHandler').first != null;
        };

        // Adds custom hit detection if native hit detection found no cell
        graph.updateMouseEvent = function(me)
        {
          let me = mxGraph.prototype.updateMouseEvent.apply(this, arguments);

          if (me.getState() == null)
          {
            let cell = this.getCellAt(me.graphX, me.graphY);

            if (cell != null && this.isSwimlane(cell) && this.hitsSwimlaneContent(cell, me.graphX, me.graphY))
            {
              cell = null;
            }
            else
            {
              me.state = this.view.getState(cell);

              if (me.state != null && me.state.shape != null)
              {
                this.container.style.cursor = me.state.shape.node.style.cursor;
              }
            }
          }

          if (me.getState() == null)
          {
            this.container.style.cursor = 'default';
          }

          return me;
        };
      }
    };

    (function()
    {
      // Enables rotation handle
      VertexHandler.prototype.rotationEnabled = true;

      // Enables managing of sizers
      VertexHandler.prototype.manageSizers = true;

      // Enables live preview
      VertexHandler.prototype.livePreview = true;

      // Sets constants for touch style
      mxConstants.HANDLE_SIZE = 16;
      mxConstants.LABEL_HANDLE_SIZE = 7;

      // Larger tolerance and grid for real touch devices
      if (Client.IS_TOUCH || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0)
      {
        Shape.prototype.svgStrokeTolerance = 18;
        VertexHandler.prototype.tolerance = 12;
        mxEdgeHandler.prototype.tolerance = 12;
        mxGraph.prototype.tolerance = 12;
      }

      // One finger pans (no rubberband selection) must start regardless of mouse button
      PanningHandler.prototype.isPanningTrigger = function(me)
      {
        let evt = me.getEvent();

         return (me.getState() == null && !mxEvent.isMouseEvent(evt)) ||
           (mxEvent.isPopupTrigger(evt) && (me.getState() == null ||
           mxEvent.isControlDown(evt) || mxEvent.isShiftDown(evt)));
      };

      // Don't clear selection if multiple cells selected
      let graphHandlerMouseDown = SelectionHandler.prototype.mouseDown;
      SelectionHandler.prototype.mouseDown = function(sender, me)
      {
        graphHandlerMouseDown.apply(this, arguments);

        if (this.graph.isCellSelected(me.getCell()) && this.graph.getSelectionCount() > 1)
        {
          this.delayedSelection = false;
        }
      };

      // On connect the target is selected and we clone the cell of the preview edge for insert
      ConnectionHandler.prototype.selectCells = function(edge, target)
      {
        if (target != null)
        {
          this.graph.setSelectionCell(target);
        }
        else
        {
          this.graph.setSelectionCell(edge);
        }
      };

      // Overrides double click handling to use the tolerance
      let graphDblClick = mxGraph.prototype.dblClick;
      mxGraph.prototype.dblClick = function(evt, cell)
      {
        if (cell == null)
        {
          let pt = convertPoint(this.container,
            mxEvent.getClientX(evt), mxEvent.getClientY(evt));
          cell = this.getCellAt(pt.x, pt.y);
        }

        graphDblClick.call(this, evt, cell);
      };

      // Rounded edge and vertex handles
      let touchHandle = new Image('images/handle-main.png', 17, 17);
      VertexHandler.prototype.handleImage = touchHandle;
      mxEdgeHandler.prototype.handleImage = touchHandle;
      Outline.prototype.sizerImage = touchHandle;

      // Pre-fetches touch handle
      new Image().src = touchHandle.src;

      // Adds connect icon to selected vertex
      let connectorSrc = 'images/handle-connect.png';

      let vertexHandlerInit = VertexHandler.prototype.init;
      VertexHandler.prototype.init = function()
      {
        // TODO: Use 4 sizers, move outside of shape
        //this.singleSizer = this.state.width < 30 && this.state.height < 30;
        vertexHandlerInit.apply(this, arguments);

        // Only show connector image on one cell and do not show on containers
        if (this.graph.getPlugin('ConnectionHandler').isEnabled() &&
          this.state.cell.isConnectable() &&
          this.graph.getSelectionCount() == 1)
        {
          this.connectorImg = createImage(connectorSrc);
          this.connectorImg.style.cursor = 'pointer';
          this.connectorImg.style.width = '29px';
          this.connectorImg.style.height = '29px';
          this.connectorImg.style.position = 'absolute';

          if (!Client.IS_TOUCH)
          {
            this.connectorImg.setAttribute('title', Translations.get('connect'));
            mxEvent.redirectMouseEvents(this.connectorImg, this.graph, this.state);
          }

          // Starts connecting on touch/mouse down
          mxEvent.addGestureListeners(this.connectorImg,
            ((evt) =>
            {
              this.graph.getPlugin('PopupMenuHandler').hideMenu();
              this.graph.stopEditing(false);

              let pt = convertPoint(this.graph.container,
                  mxEvent.getClientX(evt), mxEvent.getClientY(evt));
              this.graph.getPlugin('ConnectionHandler').start(this.state, pt.x, pt.y);
              this.graph.isMouseDown = true;
              this.graph.isMouseTrigger = mxEvent.isMouseEvent(evt);
              mxEvent.consume(evt);
            })
          );

          this.graph.container.appendChild(this.connectorImg);
        }

        this.redrawHandles();
      };

      let vertexHandlerHideSizers = VertexHandler.prototype.hideSizers;
      VertexHandler.prototype.hideSizers = function()
      {
        vertexHandlerHideSizers.apply(this, arguments);

        if (this.connectorImg != null)
        {
          this.connectorImg.style.visibility = 'hidden';
        }
      };

      let vertexHandlerReset = VertexHandler.prototype.reset;
      VertexHandler.prototype.reset = function()
      {
        vertexHandlerReset.apply(this, arguments);

        if (this.connectorImg != null)
        {
          this.connectorImg.style.visibility = '';
        }
      };

      let vertexHandlerRedrawHandles = VertexHandler.prototype.redrawHandles;
      VertexHandler.prototype.redrawHandles = function()
      {
        vertexHandlerRedrawHandles.apply(this);

        if (this.state != null && this.connectorImg != null)
        {
          let pt = new Point();
          let s = this.state;

          // Top right for single-sizer
          if (VertexHandler.prototype.singleSizer)
          {
            pt.x = s.x + s.width - this.connectorImg.offsetWidth / 2;
            pt.y = s.y - this.connectorImg.offsetHeight / 2;
          }
          else
          {
            pt.x = s.x + s.width + mxConstants.HANDLE_SIZE / 2 + 4 + this.connectorImg.offsetWidth / 2;
            pt.y = s.y + s.height / 2;
          }

          let alpha = toRadians(getValue(s.style, 'rotation', 0));

          if (alpha != 0)
          {
            let cos = Math.cos(alpha);
            let sin = Math.sin(alpha);

            let ct = new Point(s.getCenterX(), s.getCenterY());
            pt = getRotatedPoint(pt, cos, sin, ct);
          }

          this.connectorImg.style.left = (pt.x - this.connectorImg.offsetWidth / 2) + 'px';
          this.connectorImg.style.top = (pt.y - this.connectorImg.offsetHeight / 2) + 'px';
        }
      };

      let vertexHandlerDestroy = VertexHandler.prototype.destroy;
      VertexHandler.prototype.destroy = function(sender, me)
      {
        vertexHandlerDestroy.apply(this, arguments);

        if (this.connectorImg != null)
        {
          this.connectorImg.parentNode.removeChild(this.connectorImg);
          this.connectorImg = null;
        }
      };

      // Pre-fetches touch connector
      new Image().src = connectorSrc;
    })();
  </script>
</head>

<!-- Page passes the container for the graph to the program -->
<body onload="main(document.getElementById('graphContainer'))">

  <!-- Creates a container for the graph with a grid wallpaper -->
  <div id="graphContainer"
    style="position:relative;overflow:hidden;width:640px;height:480px;background:url('editors/images/grid.gif');cursor:default;">
  </div>
</body>
</html>
