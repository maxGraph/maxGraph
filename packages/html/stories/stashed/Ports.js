/**
 * Copyright (c) 2006-2013, JGraph Ltd
 */

import React from 'react';
import mxEvent from '../mxgraph/util/mxEvent';
import mxGraph from '../mxgraph/view/mxGraph';
import mxRubberband from '../mxgraph/handler/mxRubberband';
import { error } from '../../packages/core/src/util/gui/MaxWindow';
import { load } from '../../packages/core/src/util/network/MaxXmlRequest';
import { setOpacity } from '../../packages/core/src/util/utils';
import { write, writeln } from '../../packages/core/src/util/domUtils';
import { createXmlDocument, getPrettyXml } from '../../packages/core/src/util/xmlUtils';
import { makeDraggable } from '../../packages/core/src/util/gestureUtils';

class Ports extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    // A container for the graph
    return (
      <>
        <h1>Ports example</h1>
        This example demonstrates implementing
        ports as child vertices with relative positions and drag and drop
        as well as the use of images and HTML in cells.

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

export default Ports;



  <style type="text/css" media="screen">
    BODY {
      font-family: Arial;
    }
    H1 {
      font-size: 18px;
    }
    H2 {
      font-size: 16px;
    }
  </style>


    function main(container, outline, toolbar, sidebar, status)
    {
      // Checks if the browser is supported
      if (!Client.isBrowserSupported())
      {
        // Displays an error message if the browser is not supported.
        error('Browser is not supported!', 200, false);
      }
      else
      {
        // Assigns some global constants for general behaviour, eg. minimum
        // size (in pixels) of the active region for triggering creation of
        // new connections, the portion (100%) of the cell area to be used
        // for triggering new connections, as well as some fading options for
        // windows and the rubberband selection.
        mxConstants.MIN_HOTSPOT_SIZE = 16;
        mxConstants.DEFAULT_HOTSPOT = 1;

        // Enables guides
        SelectionHandler.prototype.guidesEnabled = true;

          // Alt disables guides
          mxGuide.prototype.isEnabledForEvent = function(evt)
        {
          return !mxEvent.isAltDown(evt);
        };

        // Enables snapping waypoints to terminals
        mxEdgeHandler.prototype.snapToTerminals = true;

        // Creates a wrapper editor with a graph inside the given container.
        // The editor is used to create certain functionality for the
        // graph, such as the rubberband selection, but most parts
        // of the UI are custom in this example.
        let editor = new Editor();
        let graph = editor.graph;
        let model = graph.getDataModel();

        // Disable highlight of cells when dragging from toolbar
        graph.setDropEnabled(false);

        // Uses the port icon while connections are previewed
        graph.getPlugin('ConnectionHandler').getConnectImage = function(state)
        {
          return new Image(state.style.image, 16, 16);
        };

        // Centers the port icon on the target port
        graph.getPlugin('ConnectionHandler').targetConnectImage = true;

        // Does not allow dangling edges
        graph.setAllowDanglingEdges(false);

        // Sets the graph container and configures the editor
        editor.setGraphContainer(container);
        let config = load(
          'editors/config/keyhandler-commons.xml').
            getDocumentElement();
        editor.configure(config);

        // Defines the default group to be used for grouping. The
        // default group is a field in the Editor instance that
        // is supposed to be a cell which is cloned for new cells.
        // The groupBorderSize is used to define the spacing between
        // the children of a group and the group bounds.
        let group = new Cell('Group', new Geometry(), 'group');
        group.setVertex(true);
        group.setConnectable(false);
        editor.defaultGroup = group;
        editor.groupBorderSize = 20;

        // Disables drag-and-drop into non-swimlanes.
        graph.isValidDropTarget = function(cell, cells, evt)
        {
          return this.isSwimlane(cell);
        };

        // Disables drilling into non-swimlanes.
        graph.isValidRoot = function(cell)
        {
          return this.isValidDropTarget(cell);
        }

        // Does not allow selection of locked cells
        graph.isCellSelectable = function(cell)
        {
          return !this.isCellLocked(cell);
        };

        // Returns a shorter label if the cell is collapsed and no
        // label for expanded groups
        graph.getLabel = function(cell)
        {
          let tmp = mxGraph.prototype.getLabel.apply(this, arguments); // "supercall"

          if (this.isCellLocked(cell))
          {
            // Returns an empty label but makes sure an HTML
            // element is created for the label (for event
            // processing wrt the parent label)
            return '';
          }
          else if (cell.isCollapsed())
          {
            let index = tmp.indexOf('</h1>');

            if (index > 0)
            {
              tmp = tmp.substring(0, index+5);
            }
          }

          return tmp;
        }

        // Disables HTML labels for swimlanes to avoid conflict
        // for the event processing on the child cells. HTML
        // labels consume events before underlying cells get the
        // chance to process those events.
        //
        // NOTE: Use of HTML labels is only recommended if the specific
        // features of such labels are required, such as special label
        // styles or interactive form fields. Otherwise non-HTML labels
        // should be used by not overidding the following function.
        // See also: configureStylesheet.
        graph.isHtmlLabel = function(cell)
        {
          return !this.isSwimlane(cell);
        }

        // To disable the folding icon, use the following code:
        /*graph.isCellFoldable = function(cell)
        {
          return false;
        }*/

        // Shows a "modal" window when double clicking a vertex.
        graph.dblClick = function(evt, cell)
        {
          // Do not fire a DOUBLE_CLICK event here as Editor will
          // consume the event and start the in-place editor.
          if (this.isEnabled() &&
            !mxEvent.isConsumed(evt) &&
            cell != null &&
            this.isCellEditable(cell))
          {
            if (cell.isEdge() ||
              !this.isHtmlLabel(cell))
            {
              this.startEditingAtCell(cell);
            }
            else
            {
              let content = document.createElement('div');
              content.innerHTML = this.convertValueToString(cell);
              showModalWindow(this, 'Properties', content, 400, 300);
            }
          }

          // Disables any default behaviour for the double click
          mxEvent.consume(evt);
        };

        // Enables new connections
        graph.setConnectable(true);

        // Adds all required styles to the graph (see below)
        configureStylesheet(graph);

        // Adds sidebar icons.
        //
        // NOTE: For non-HTML labels a simple string as the third argument
        // and the alternative style as shown in configureStylesheet should
        // be used. For example, the first call to addSidebar icon would
        // be as follows:
        // addSidebarIcon(graph, sidebar, 'Website', 'images/icons48/earth.png');
        addSidebarIcon(graph, sidebar,
          '<h1 style="margin:0px;">Website</h1><br>'+
          '<img src="images/icons48/earth.png" width="48" height="48">'+
          '<br>'+
          '<a href="http://www.jgraph.com" target="_blank">Browse</a>',
          'images/icons48/earth.png');
        addSidebarIcon(graph, sidebar,
          '<h1 style="margin:0px;">Process</h1><br>'+
          '<img src="images/icons48/gear.png" width="48" height="48">'+
          '<br><select><option>Value1</option><option>Value2</option></select><br>',
          'images/icons48/gear.png');
        addSidebarIcon(graph, sidebar,
          '<h1 style="margin:0px;">Keys</h1><br>'+
          '<img src="images/icons48/keys.png" width="48" height="48">'+
          '<br>'+
          '<button onclick="mxUtils.alert(\'generate\');">Generate</button>',
          'images/icons48/keys.png');
        addSidebarIcon(graph, sidebar,
          '<h1 style="margin:0px;">New Mail</h1><br>'+
          '<img src="images/icons48/mail_new.png" width="48" height="48">'+
          '<br><input type="checkbox"/>CC Archive',
          'images/icons48/mail_new.png');
        addSidebarIcon(graph, sidebar,
          '<h1 style="margin:0px;">Server</h1><br>'+
          '<img src="images/icons48/server.png" width="48" height="48">'+
          '<br>'+
          '<input type="text" size="12" value="127.0.0.1"/>',
          'images/icons48/server.png');

        // Displays useful hints in a small semi-transparent box.
        let hints = document.createElement('div');
        hints.style.position = 'absolute';
        hints.style.overflow = 'hidden';
        hints.style.width = '230px';
        hints.style.bottom = '56px';
        hints.style.height = '76px';
        hints.style.right = '20px';

        hints.style.background = 'black';
        hints.style.color = 'white';
        hints.style.fontFamily = 'Arial';
        hints.style.fontSize = '10px';
        hints.style.padding = '4px';

        setOpacity(hints, 50);

        writeln(hints, '- Drag an image from the sidebar to the graph');
        writeln(hints, '- Doubleclick on a vertex or edge to edit');
        writeln(hints, '- Shift- or Rightclick and drag for panning');
        writeln(hints, '- Move the mouse over a cell to see a tooltip');
        writeln(hints, '- Click and drag a vertex to move and connect');
        document.body.appendChild(hints);

        // Creates a new DIV that is used as a toolbar and adds
        // toolbar buttons.
        let spacer = document.createElement('div');
        spacer.style.display = 'inline';
        spacer.style.padding = '8px';

        addToolbarButton(editor, toolbar, 'groupOrUngroup', '(Un)group', 'images/group.png');

        // Defines a new action for deleting or ungrouping
        editor.addAction('groupOrUngroup', function(editor, cell)
        {
          cell = cell || editor.graph.getSelectionCell();
          if (cell != null && editor.graph.isSwimlane(cell))
          {
            editor.execute('ungroup', cell);
          }
          else
          {
            editor.execute('group');
          }
        });

        addToolbarButton(editor, toolbar, 'delete', 'Delete', 'images/delete2.png');

        toolbar.appendChild(spacer.cloneNode(true));

        addToolbarButton(editor, toolbar, 'cut', 'Cut', 'images/cut.png');
        addToolbarButton(editor, toolbar, 'copy', 'Copy', 'images/copy.png');
        addToolbarButton(editor, toolbar, 'paste', 'Paste', 'images/paste.png');

        toolbar.appendChild(spacer.cloneNode(true));

        addToolbarButton(editor, toolbar, 'undo', '', 'images/undo.png');
        addToolbarButton(editor, toolbar, 'redo', '', 'images/redo.png');

        toolbar.appendChild(spacer.cloneNode(true));

        addToolbarButton(editor, toolbar, 'show', 'Show', 'images/camera.png');
        addToolbarButton(editor, toolbar, 'print', 'Print', 'images/printer.png');

        toolbar.appendChild(spacer.cloneNode(true));

        // Defines a new export action
        editor.addAction('export', function(editor, cell)
        {
          let textarea = document.createElement('textarea');
          textarea.style.width = '400px';
          textarea.style.height = '400px';
          let enc = new Codec(createXmlDocument());
          let node = enc.encode(editor.graph.getDataModel());
          textarea.value = getPrettyXml(node);
          showModalWindow(graph, 'XML', textarea, 410, 440);
        });

        addToolbarButton(editor, toolbar, 'export', 'Export', 'images/export1.png');

        // ---

        // Adds toolbar buttons into the status bar at the bottom
        // of the window.
        addToolbarButton(editor, status, 'collapseAll', 'Collapse All', 'images/navigate_minus.png', true);
        addToolbarButton(editor, status, 'expandAll', 'Expand All', 'images/navigate_plus.png', true);

        status.appendChild(spacer.cloneNode(true));

        addToolbarButton(editor, status, 'enterGroup', 'Enter', 'images/view_next.png', true);
        addToolbarButton(editor, status, 'exitGroup', 'Exit', 'images/view_previous.png', true);

        status.appendChild(spacer.cloneNode(true));

        addToolbarButton(editor, status, 'zoomIn', '', 'images/zoom_in.png', true);
        addToolbarButton(editor, status, 'zoomOut', '', 'images/zoom_out.png', true);
        addToolbarButton(editor, status, 'actualSize', '', 'images/view_1_1.png', true);
        addToolbarButton(editor, status, 'fit', '', 'images/fit_to_size.png', true);

        // Creates the outline (navigator, overview) for moving
        // around the graph in the top, right corner of the window.
        let outln = new outline(graph, outline);

        // To show the images in the outline, uncomment the following code
        //outln.outline.labelsVisible = true;
        //outln.outline.setHtmlLabels(true);

        // Fades-out the splash screen after the UI has been loaded.
        let splash = document.getElementById('splash');
        if (splash != null)
        {
          try
          {
            mxEvent.release(splash);
            Effects.fadeOut(splash, 100, true);
          }
          catch (e)
          {

            // mxUtils is not available (library not loaded)
            splash.parentNode.removeChild(splash);
          }
        }
      }
    };

    function addToolbarButton(editor, toolbar, action, label, image, isTransparent)
    {
      let button = document.createElement('button');
      button.style.fontSize = '10';
      if (image != null)
      {
        let img = document.createElement('img');
        img.setAttribute('src', image);
        img.style.width = '16px';
        img.style.height = '16px';
        img.style.verticalAlign = 'middle';
        img.style.marginRight = '2px';
        button.appendChild(img);
      }
      if (isTransparent)
      {
        button.style.background = 'transparent';
        button.style.color = '#FFFFFF';
        button.style.border = 'none';
      }
      mxEvent.addListener(button, 'click', function(evt)
      {
        editor.execute(action);
      });
      write(button, label);
      toolbar.appendChild(button);
    };

    function showModalWindow(graph, title, content, width, height)
    {
      let background = document.createElement('div');
      background.style.position = 'absolute';
      background.style.left = '0px';
      background.style.top = '0px';
      background.style.right = '0px';
      background.style.bottom = '0px';
      background.style.background = 'black';
      setOpacity(background, 50);
      document.body.appendChild(background);

      let x = Math.max(0, document.body.scrollWidth/2-width/2);
      let y = Math.max(10, (document.body.scrollHeight ||
            document.documentElement.scrollHeight)/2-height*2/3);
      let wnd = new MaxWindow(title, content, x, y, width, height, false, true);
      wnd.setClosable(true);

      // Fades the background out after after the window has been closed
      wnd.addListener(mxEvent.DESTROY, function(evt)
      {
        graph.setEnabled(true);
        Effects.fadeOut(background, 50, true,
          10, 30, true);
      });

      graph.setEnabled(false);
      graph.getPlugin('TooltipHandler').hide();
      wnd.setVisible(true);
    };

    function addSidebarIcon(graph, sidebar, label, image)
    {
      // Function that is executed when the image is dropped on
      // the graph. The cell argument points to the cell under
      // the mousepointer if there is one.
      let funct = function(graph, evt, cell, x, y)
      {
        let parent = graph.getDefaultParent();
        let model = graph.getDataModel();

        var v1 = null;

        model.beginUpdate();
        try
        {
          // NOTE: For non-HTML labels the image must be displayed via the style
          // rather than the label markup, so use 'image=' + image for the style.
          // as follows: v1 = graph.insertVertex(parent, null, label,
          // pt.x, pt.y, 120, 120, 'image=' + image);
          v1 = graph.insertVertex(parent, null, label, x, y, 120, 120);
          v1.setConnectable(false);

          // Presets the collapsed size
          v1.geometry.alternateBounds = new Rectangle(0, 0, 120, 40);

          // Adds the ports at various relative locations
          let port = graph.insertVertex(v1, null, 'Trigger', 0, 0.25, 16, 16,
              'port;image=editors/images/overlays/flash.png;align=right;imageAlign=right;spacingRight=18', true);
          port.geometry.offset = new Point(-6, -8);

          let port = graph.insertVertex(v1, null, 'Input', 0, 0.75, 16, 16,
              'port;image=editors/images/overlays/check.png;align=right;imageAlign=right;spacingRight=18', true);
          port.geometry.offset = new Point(-6, -4);

          let port = graph.insertVertex(v1, null, 'Error', 1, 0.25, 16, 16,
              'port;image=editors/images/overlays/error.png;spacingLeft=18', true);
          port.geometry.offset = new Point(-8, -8);

          let port = graph.insertVertex(v1, null, 'Result', 1, 0.75, 16, 16,
              'port;image=editors/images/overlays/information.png;spacingLeft=18', true);
          port.geometry.offset = new Point(-8, -4);
        }
        finally
        {
          model.endUpdate();
        }

        graph.setSelectionCell(v1);
      }

      // Creates the image which is used as the sidebar icon (drag source)
      let img = document.createElement('img');
      img.setAttribute('src', image);
      img.style.width = '48px';
      img.style.height = '48px';
      img.title = 'Drag this to the diagram to create a new vertex';
      sidebar.appendChild(img);

      let dragElt = document.createElement('div');
      dragElt.style.border = 'dashed black 1px';
      dragElt.style.width = '120px';
      dragElt.style.height = '120px';

      // Creates the image which is used as the drag icon (preview)
      let ds = makeDraggable(img, graph, funct, dragElt, 0, 0, true, true);
      ds.setGuidesEnabled(true);
    };

    function configureStylesheet(graph)
    {
      let style = {};
      style.shape = mxConstants.SHAPE_RECTANGLE;
      style.perimiter = Perimeter.RectanglePerimeter;
      style.align = mxConstants.ALIGN_CENTER;
      style.verticalAlign = mxConstants.ALIGN_MIDDLE;
      style.gradientColor = '#41B9F5';
      style.fillColor = '#8CCDF5';
      style.strokeColor = '#1B78C8';
      style.fontColor = '#000000';
      style.rounded = true;
      style.opacity = '80';
      style.fontSize = '12';
      style.fontStyle = 0;
      style.imageWidth = '48';
      style.imageHeight = '48';
      graph.getStylesheet().putDefaultVertexStyle(style);

      // NOTE: Alternative vertex style for non-HTML labels should be as
      // follows. This repaces the above style for HTML labels.
      /*let style = {};
      style.shape = mxConstants.SHAPE_LABEL;
      style.perimiter = mxPerimeter.RectanglePerimeter;
      style.verticalAlign = mxConstants.ALIGN_TOP;
      style.align = mxConstants.ALIGN_CENTER;
      style.imageAlign = mxConstants.ALIGN_CENTER;
      style.imageVerticalAlign = mxConstants.ALIGN_TOP;
      style.spacingTop = '56';
      style.gradientColor = '#7d85df';
      style.strokeColor = '#5d65df';
      style.fillColor = '#adc5ff';
      style.fontColor = '#1d258f';
      style.fontFamily = 'Verdana';
      style.fontSize = '12';
      style.fontStyle = '1';
      style.rounded = '1';
      style.imageWidth = '48';
      style.imageHeight = '48';
      style.opacity = '80';
      graph.getStylesheet().putDefaultVertexStyle(style);*/

      style = {};
      style.shape = mxConstants.SHAPE_SWIMLANE;
      style.perimiter = Perimeter.RectanglePerimeter;
      style.align = mxConstants.ALIGN_CENTER;
      style.verticalAlign = mxConstants.ALIGN_TOP;
      style.fillColor = '#FF9103';
      style.gradientColor = '#F8C48B';
      style.strokeColor = '#E86A00';
      style.fontColor = '#000000';
      style.rounded = true;
      style.opacity = '80';
      style.startSize = '30';
      style.fontSize = '16';
      style.fontStyle = 1;
      graph.getStylesheet().putCellStyle('group', style);

      style = {};
      style.shape = mxConstants.SHAPE_IMAGE;
      style.fontColor = '#774400';
      style.perimiter = Perimeter.RectanglePerimeter;
      style.perimeterSpacing = '6';
      style.align = mxConstants.ALIGN_LEFT;
      style.verticalAlign = mxConstants.ALIGN_MIDDLE;
      style.fontSize = '10';
      style.fontStyle = 2;
      style.imageWidth = '16';
      style.imageHeight = '16';
      graph.getStylesheet().putCellStyle('port', style);

      style = graph.getStylesheet().getDefaultEdgeStyle();
      style.labelBackgroundColor = '#FFFFFF';
      style.strokeWidth = '2';
      style.rounded = true;
      style.edge = mxEdgeStyle.EntityRelation;
    };
  </script>
</head>

<!-- Page passes the container for the graph to the program -->
<body onload="main(document.getElementById('graphContainer'),
      document.getElementById('outlineContainer'),
       document.getElementById('toolbarContainer'),
      document.getElementById('sidebarContainer'),
      document.getElementById('statusContainer'));" style="margin:0px;">

  <!-- Creates a container for the splash screen -->
  <div id="splash"
    style="position:absolute;top:0px;left:0px;width:100%;height:100%;background:white;z-index:1;">
    <center id="splash" style="padding-top:230px;">
      <img src="editors/images/loading.gif">
    </center>
  </div>

  <!-- Creates a container for the sidebar -->
  <div id="toolbarContainer"
    style="position:absolute;white-space:nowrap;overflow:hidden;top:0px;left:0px;max-height:24px;height:36px;right:0px;padding:6px;background-image:url('images/toolbar_bg.gif');">
  </div>

  <!-- Creates a container for the toolboox -->
  <div id="sidebarContainer"
    style="position:absolute;overflow:hidden;top:36px;left:0px;bottom:36px;max-width:52px;width:56px;padding-top:10px;padding-left:4px;background-image:url('images/sidebar_bg.gif');">
  </div>

  <!-- Creates a container for the graph -->
  <div id="graphContainer"
    style="position:absolute;overflow:hidden;top:36px;left:60px;bottom:36px;right:0px;background-image:url('editors/images/grid.gif');cursor:default;">
  </div>

  <!-- Creates a container for the outline -->
  <div id="outlineContainer"
    style="position:absolute;overflow:hidden;top:36px;right:0px;width:200px;height:140px;background:transparent;border-style:solid;border-color:black;">
  </div>

  <!-- Creates a container for the sidebar -->
  <div id="statusContainer"
    style="text-align:right;position:absolute;overflow:hidden;bottom:0px;left:0px;max-height:24px;height:36px;right:0px;color:white;padding:6px;background-image:url('images/toolbar_bg.gif');">
    <div style="font-size:10pt;float:left;">
      Created with <a href="http://www.jgraph.com" target="_blank">mxGraph</a>
    </div>
  </div>
</body>
</html>
