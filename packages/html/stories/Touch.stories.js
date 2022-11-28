/**
 * Copyright (c) 2006-2013, JGraph Ltd
 * 
 * Touch
 * 
 * This example demonstrates handling of touch,
 * mouse and pointer events.
 */

import { globalTypes } from "../.storybook/preview";
import { getValue } from '@maxgraph/core/src/util/Utils';
import * as Constants from "@maxgraph/core/src/util/Constants";
import { createImage } from '@maxgraph/core/src/util/domUtils';
import { convertPoint } from '@maxgraph/core/src/util/styleUtils';
import TooltipHandler from "@maxgraph/core/src/view/handler/TooltipHandler";
import { getRotatedPoint, toRadians } from '@maxgraph/core/src/util/mathUtils';
import CellEditorHandler from "@maxgraph/core/src/view/handler/CellEditorHandler";
import SelectionCellsHandler from "@maxgraph/core/src/view/handler/SelectionCellsHandler";
import ConnectionHandlerCellMarker from "@maxgraph/core/src/view/handler/ConnectionHandlerCellMarker";
import {
  ConnectionHandler, EdgeHandler,
  Graph, Outline,
  PanningHandler,
  Point,
  PopupMenuHandler,
  SelectionHandler, Translations,
  VertexHandler,
  Client,
  RubberBandHandler,
  InternalEvent
} from "@maxgraph/core/src";

export default {
  title: 'DnD_CopyPaste/Touch',
  argTypes: {
    ...globalTypes,
    /*rubberBand: {
      type: 'boolean',
      defaultValue: true,
    },*/
  },
};

const HTML_TEMPLATE = `
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

<!-- Page passes the container for the graph to the program -->
<body onload="main(document.getElementById('graphContainer'))">

  <!-- Creates a container for the graph with a grid wallpaper -->
  <div id="graphContainer"
    style="position:relative;overflow:hidden;width:640px;height:480px;background:url('editors/images/grid.gif');cursor:default;">
  </div>
</body>
`

const Template = ({ label, ...args }) => {
  // To detect if touch events are actually supported, the following condition is recommended:
  // Client.IS_TOUCH || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0

  // Disables built-in text selection and context menu while not editing text
  let textEditing = (evt) => {
    return graph.isEditing();
  };

  const container = document.createElement('div');
  container.onselectstart = textEditing;
  container.onmousedown = textEditing;
  container.oncontextmenu = textEditing;

  // Rounded edge and vertex handles
  let touchHandle = new Image('images/handle-main.png', 17, 17);
  Outline.prototype.sizerImage = touchHandle;

  // Adds connect icon to selected vertex
  let connectorSrc = 'images/handle-connect.png';

  // Sets constants for touch style
  // TODO: Find a means of altering these constants (ts conversion)
  //Constants.HANDLE_SIZE = 16;
  //Constants.LABEL_HANDLE_SIZE = 7;

  // Context menu trigger implementation depending on current selection state
  // combined with support for normal popup trigger.
  let cellSelected = false;
  let selectionEmpty = false;
  let menuShowing = false;

  // Larger tolerance and grid for real touch devices
  let vertexHandlerTolerance,
      edgeHandlerTolerance,
      graphTolerance;

  if (Client.IS_TOUCH || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0) {
    //Shape.prototype.svgStrokeTolerance = 18;  // TODO: Find if there's a way to replicate the previous behaviour - having this value for all shapes (ts conversion)
    vertexHandlerTolerance = 12;
    edgeHandlerTolerance = 12;
    graphTolerance = 12;
  } else {
    vertexHandlerTolerance = 0;
    edgeHandlerTolerance = 0;
    graphTolerance = 0;
  }

  class MyEdgeHandler extends EdgeHandler {
    tolerance = edgeHandlerTolerance;
    handleImage = touchHandle
  }

  class MyPopupMenuHandler extends PopupMenuHandler {
    autoExpand = true;

    isSelectOnPopup(me) {
      return InternalEvent.isMouseEvent(me.getEvent());
    };

    // Installs context menu
    factoryMethod(menu, cell, evt) {
      menu.addItem('Item 1', null, function () {
        alert('Item 1');
      });
      menu.addSeparator();

      var submenu1 = menu.addItem('Submenu 1', null, null);
      menu.addItem('Subitem 1', null, function () {
        alert('Subitem 1');
      }, submenu1);
      menu.addItem('Subitem 1', null, function () {
        alert('Subitem 2');
      }, submenu1);
    };

    // Shows popup menu if cell was selected or selection was empty and background was clicked
    mouseUp(sender, me) {
      this.popupTrigger = !graph.isEditing() && (this.popupTrigger || (!menuShowing &&
          !graph.isEditing() && !InternalEvent.isMouseEvent(me.getEvent()) &&
          ((selectionEmpty && me.getCell() == null && graph.isSelectionEmpty()) ||
              (cellSelected && graph.isCellSelected(me.getCell())))));
      super.apply(this, arguments);
    };
  }

  class MyVertexHandler extends VertexHandler {
    rotationEnabled = true;  // Enables rotation handle
    manageSizers = true;  // Enables managing of sizers
    livePreview = true;  // Enables live preview
    handleImage = touchHandle;
    tolerance = vertexHandlerTolerance;

    init() {
      // TODO: Use 4 sizers, move outside of shape
      //this.singleSizer = this.state.width < 30 && this.state.height < 30;
      super.apply(this, arguments);

      // Only show connector image on one cell and do not show on containers
      if (
          this.graph.getPlugin('ConnectionHandler').isEnabled() &&
          this.state.cell.isConnectable() &&
          this.graph.getSelectionCount() === 1
      ) {
        this.connectorImg = createImage(connectorSrc);
        this.connectorImg.style.cursor = 'pointer';
        this.connectorImg.style.width = '29px';
        this.connectorImg.style.height = '29px';
        this.connectorImg.style.position = 'absolute';

        if (!Client.IS_TOUCH) {
          this.connectorImg.setAttribute('title', Translations.get('connect'));
          InternalEvent.redirectMouseEvents(this.connectorImg, this.graph, this.state);
        }

        // Starts connecting on touch/mouse down
        InternalEvent.addGestureListeners(this.connectorImg,
            ((evt) => {
              this.graph.getPlugin('PopupMenuHandler').hideMenu();
              this.graph.stopEditing(false);

              let pt = convertPoint(this.graph.container,
                  InternalEvent.getClientX(evt), InternalEvent.getClientY(evt));
              this.graph.getPlugin('ConnectionHandler').start(this.state, pt.x, pt.y);
              this.graph.isMouseDown = true;
              this.graph.isMouseTrigger = InternalEvent.isMouseEvent(evt);
              InternalEvent.consume(evt);
            })
        );

        this.graph.container.appendChild(this.connectorImg);
      }

      this.redrawHandles();
    };

    hideSizers() {
      super.apply(this, arguments);

      if (this.connectorImg != null) {
        this.connectorImg.style.visibility = 'hidden';
      }
    };

    reset() {
      super.apply(this, arguments);

      if (this.connectorImg != null) {
        this.connectorImg.style.visibility = '';
      }
    };

    redrawHandles() {
      super.apply(this);

      if (this.state != null && this.connectorImg != null) {
        let pt = new Point();
        let s = this.state;

        // Top right for single-sizer
        if (this.singleSizer) {
          pt.x = s.x + s.width - this.connectorImg.offsetWidth / 2;
          pt.y = s.y - this.connectorImg.offsetHeight / 2;
        } else {
          pt.x = s.x + s.width + Constants.HANDLE_SIZE / 2 + 4 + this.connectorImg.offsetWidth / 2;
          pt.y = s.y + s.height / 2;
        }

        let alpha = toRadians(getValue(s.style, 'rotation', 0));
        if (alpha !== 0) {
          let cos = Math.cos(alpha);
          let sin = Math.sin(alpha);

          let ct = new Point(s.getCenterX(), s.getCenterY());
          pt = getRotatedPoint(pt, cos, sin, ct);
        }

        this.connectorImg.style.left = (pt.x - this.connectorImg.offsetWidth / 2) + 'px';
        this.connectorImg.style.top = (pt.y - this.connectorImg.offsetHeight / 2) + 'px';
      }
    };

    destroy(sender, me) {
      super.apply(this, arguments);

      if (this.connectorImg != null) {
        this.connectorImg.parentNode.removeChild(this.connectorImg);
        this.connectorImg = null;
      }
    };
  }

  class MyPanningHandler extends PanningHandler {
    // One finger pans (no rubberband selection) must start regardless of mouse button
    isPanningTrigger(me) {
      let evt = me.getEvent();

      return (me.getState() == null && !InternalEvent.isMouseEvent(evt)) ||
          (InternalEvent.isPopupTrigger(evt) && (me.getState() == null ||
              InternalEvent.isControlDown(evt) || InternalEvent.isShiftDown(evt)));
    };
  }

  class MySelectionHandler extends SelectionHandler {
    // Don't clear selection if multiple cells selected
    mouseDown = function (sender, me) {
      super.apply(this, arguments);

      if (this.graph.isCellSelected(me.getCell()) && this.graph.getSelectionCount() > 1) {
        this.delayedSelection = false;
      }
    };
  }

  class MyConnectionHandler extends ConnectionHandler {
    createMarker() {
      class MyMarker extends ConnectionHandlerCellMarker {  // TODO: export this currently private class (ts conversion)
        // Disable new connections via "hotspot"
        isEnabled() {
          return this.graph.getPlugin('ConnectionHandler').first != null;
        };
      }
      return new MyMarker(this.graph, this);
    }

    // On connect the target is selected, and we clone the cell of the preview edge for insert
    selectCells(edge, target) {
      if (target != null) {
        this.graph.setSelectionCell(target);
      } else {
        this.graph.setSelectionCell(edge);
      }
    };
  }

  class MyCustomGraph extends Graph {
    tolerance = graphTolerance;  // TODO: Check this works with the mixins (ts conversion)

    createVertexHandler(state) {
      return new MyVertexHandler(state);
    }

    fireMouseEvent(evtName, me, sender) {
      if (evtName === InternalEvent.MOUSE_DOWN) {
        // For hit detection on edges
        me = this.updateMouseEvent(me);

        cellSelected = this.isCellSelected(me.getCell());
        selectionEmpty = this.isSelectionEmpty();
        menuShowing = graph.getPlugin('PopupMenuHandler').isMenuShowing();
      }
      this.fireMouseEvent.apply(this, arguments);
    };

    // Adds custom hit detection if native hit detection found no cell
    updateMouseEvent(me) {
      me = super.apply(this, arguments);

      if (me.getState() == null) {
        let cell = this.getCellAt(me.graphX, me.graphY);
        if (cell != null && this.isSwimlane(cell) && this.hitsSwimlaneContent(cell, me.graphX, me.graphY)) {
          cell = null;
        } else {
          me.state = this.view.getState(cell);

          if (me.state != null && me.state.shape != null) {
            this.container.style.cursor = me.state.shape.node.style.cursor;
          }
        }
      }

      if (me.getState() == null) {
        this.container.style.cursor = 'default';
      }
      return me;
    };

    // Overrides double click handling to use the tolerance
    dblClick(evt, cell) {
      if (cell == null) {
        let pt = convertPoint(this.container,
            InternalEvent.getClientX(evt), InternalEvent.getClientY(evt));
        cell = this.getCellAt(pt.x, pt.y);
      }
      super.call(this, evt, cell);
    };
  }

  // Creates the graph inside the given container
  let graph = new MyCustomGraph(container, null, [
    CellEditorHandler,
    TooltipHandler,
    SelectionCellsHandler,
    MyPopupMenuHandler,
    MyConnectionHandler,
    MySelectionHandler,
    MyPanningHandler,
  ]);

  graph.centerZoom = false;
  graph.setConnectable(true);
  graph.setPanning(true);

  // Creates rubberband selection
  let rubberband = new RubberBandHandler(graph);

  // Tap and hold on background starts rubberband for multiple selected
  // cells the cell associated with the event is deselected
  graph.addListener(InternalEvent.TAP_AND_HOLD, function (sender, evt) {
    if (!InternalEvent.isMultiTouchEvent(evt)) {
      let me = evt.getProperty('event');
      let cell = evt.getProperty('cell');

      if (cell == null) {
        let pt = convertPoint(this.container,
            InternalEvent.getClientX(me), InternalEvent.getClientY(me));
        rubberband.start(pt.x, pt.y);
      } else if (graph.getSelectionCount() > 1 && graph.isCellSelected(cell)) {
        graph.removeSelectionCell(cell);
      }

      // Blocks further processing of the event
      evt.consume();
    }
  });

  // Adds mouse wheel handling for zoom
  InternalEvent.addMouseWheelListener(function (evt, up) {
    if (up) {
      graph.zoomIn();
    } else {
      graph.zoomOut();
    }
    InternalEvent.consume(evt);
  });

  graph.batchUpdate(() => {
    // Get the default parent for inserting new cells. This
    // is normally the first child of the root (ie. layer 0).
    let parent = graph.getDefaultParent();

    var v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
    var v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    var e1 = graph.insertEdge(parent, null, '', v1, v2);
  });

  // Pre-fetches touch handle+connector image
  new Image().src = touchHandle.src;
  new Image().src = connectorSrc;

  return container;
};

export const Default = Template.bind({});
