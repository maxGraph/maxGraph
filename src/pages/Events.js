<!--
  Copyright (c) 2006-2013, JGraph Ltd
  
  Events example for mxGraph. This example demonstrates creating
  a graph container and using the mxDivResizer to update the size,
  interaction on the graph, including marquee selection, custom 
  tooltips, context menu handling and changing the default menu
  opacity. It also demonstrates how to use an edgestyle in the 
  default stylesheet, and handle the doubleclick on the adjustment
  point. See also: overlays.html for click event handling.
-->

import React from 'react';
import mxEvent from '../mxgraph/util/mxEvent';
import mxGraph from '../mxgraph/view/mxGraph';
import mxRubberband from '../mxgraph/handler/mxRubberband';

class MYNAMEHERE extends React.Component {
  constructor(props) {
    super(props);
  }

  render = () => {
    // A container for the graph
    return (
      <>
        <h1></h1>

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

  componentDidMount = () => {

  };
}

export default MYNAMEHERE;


<html>
<head>
	<title>Events example for mxGraph</title>

	<!-- Sets the basepath for the library if not in same directory -->
	<script type="text/javascript">
		mxBasePath = '../src';
	</script>

	<!-- Loads and initializes the library -->
	<script type="text/javascript" src="../src/js/mxClient.js"></script>

	<!-- Example code -->
	<script type="text/javascript">
		// Program starts here. Creates a sample graph in the dynamically
		// created DOM node called container which is created below.
		function main()
		{
			// Sets the image to be used for creating new connections
			mxConnectionHandler.prototype.connectImage = new mxImage('images/green-dot.gif', 14, 14);
			
			// Checks if browser is supported
			if (!mxClient.isBrowserSupported())
			{
				// Displays an error message if the browser is
				// not supported.
				mxUtils.error('Browser is not supported!', 200, false);
			}
			else
			{
				let container = document.createElement('div');
				container.style.position = 'absolute';
				container.style.overflow = 'hidden';
				container.style.left = '0px';
				container.style.top = '0px';
				container.style.right = '0px';
				container.style.bottom = '0px';
				container.style.background = 'url("editors/images/grid.gif")';

				// Disables built-in context menu
				mxEvent.disableContextMenu(container);

				document.body.appendChild(container);
			
				// Creates the graph inside the DOM node.
				// Optionally you can enable panning, tooltips and connections
				// using graph.setPanning(), setTooltips() & setConnectable().
				// To enable rubberband selection and basic keyboard events,
				// use new mxRubberband(graph) and new mxKeyHandler(graph).
				let graph = new mxGraph(container);

				// Enables tooltips, new connections and panning
				graph.setPanning(true);
				graph.setTooltips(true);
				graph.setConnectable(true);
				
				// Automatically handle parallel edges
 				let layout = new mxParallelEdgeLayout(graph);
 				let layoutMgr = new mxLayoutManager(graph);
 				
 				layoutMgr.getLayout = function(cell)
				{
					if (cell.getChildCount() > 0)
					{
						return layout;
					}
				};
				
				// Enables rubberband (marquee) selection and a handler
				// for basic keystrokes (eg. return, escape during editing).
				let rubberband = new mxRubberband(graph);
				let keyHandler = new mxKeyHandler(graph);

				// Changes the default style for edges "in-place" and assigns
				// an alternate edge style which is applied in mxGraph.flip
				// when the user double clicks on the adjustment control point
				// of the edge. The ElbowConnector edge style switches to TopToBottom
				// if the horizontal style is true.
				let style = graph.getStylesheet().getDefaultEdgeStyle();
				style[mxConstants.STYLE_ROUNDED] = true;
				style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
		
				graph.alternateEdgeStyle = 'elbow=vertical';

				// Installs a custom tooltip for cells
				graph.getTooltipForCell = function(cell)
				{
					return 'Doubleclick and right- or shiftclick';
				}
				
				// Installs a popupmenu handler using local function (see below).
				graph.popupMenuHandler.factoryMethod = function(menu, cell, evt)
				{
					return createPopupMenu(graph, menu, cell, evt);
				};
				
				// Gets the default parent for inserting new cells. This
				// is normally the first child of the root (ie. layer 0).
				let parent = graph.getDefaultParent();
								
				// Adds cells to the model in a single step
				graph.getModel().beginUpdate();
				try
				{
					var v1 = graph.insertVertex(parent, null, 'Doubleclick', 20, 20, 80, 30);
					var v2 = graph.insertVertex(parent, null, 'Right-/Shiftclick', 200, 150, 120, 30);
					var v3 = graph.insertVertex(parent, null, 'Connect/Reconnect', 200, 20, 120, 30);
					var v4 = graph.insertVertex(parent, null, 'Control-Drag', 20, 150, 100, 30);
					var e1 = graph.insertEdge(parent, null, 'Tooltips', v1, v2);
					var e2 = graph.insertEdge(parent, null, '', v2, v3);
				}
				finally
				{
					// Updates the display
					graph.getModel().endUpdate();
				}
			}
		};
		
		// Function to create the entries in the popupmenu
		function createPopupMenu(graph, menu, cell, evt)
		{
			if (cell != null)
			{
				menu.addItem('Cell Item', 'editors/images/image.gif', function()
				{
					mxUtils.alert('MenuItem1');
				});
			}
			else
			{
				menu.addItem('No-Cell Item', 'editors/images/image.gif', function()
				{
					mxUtils.alert('MenuItem2');
				});
			}
			menu.addSeparator();
			menu.addItem('MenuItem3', '../src/images/warning.gif', function()
			{
				mxUtils.alert('MenuItem3: '+graph.getSelectionCount()+' selected');
			});
		};
	</script>
</head>

<!-- Calls the main function after the page has loaded. Container is dynamically created. -->
<body onload="main();">
</body>
</html>