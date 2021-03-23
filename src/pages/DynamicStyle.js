<!--
  Copyright (c) 2006-2013, JGraph Ltd
  
  Dynamic Style example for mxGraph. This example demonstrates changing
  the style of a cell dynamically by overriding mxGraphModel.getStyle.
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
	<title>Dynamic Style example for mxGraph</title>

	<!-- Sets the basepath for the library if not in same directory -->
	<script type="text/javascript">
		mxBasePath = '../src';
	</script>

	<!-- Loads and initializes the library -->
	<script type="text/javascript" src="../src/js/mxClient.js"></script>

	<!-- Example code -->
	<script type="text/javascript">
		// Program starts here. Creates a sample graph in the
		// DOM node with the specified ID. This function is invoked
		// from the onLoad event handler of the document (see below).
		function main(container)
		{
			// Checks if the browser is supported
			if (!mxClient.isBrowserSupported())
			{
				// Displays an error message if the browser is not supported.
				mxUtils.error('Browser is not supported!', 200, false);
			}
			else
			{
				// Creates the graph inside the given container
				let graph = new mxGraph(container);

				// Disables moving of edge labels in this examples
				graph.edgeLabelsMovable = false;
				
				// Enables rubberband selection
				new mxRubberband(graph);

				// Needs to set a flag to check for dynamic style changes,
				// that is, changes to styles on cells where the style was
				// not explicitely changed using mxStyleChange
				graph.getView().updateStyle = true;
				
				// Overrides mxGraphModel.getStyle to return a specific style
				// for edges that reflects their target terminal (in this case
				// the strokeColor will be equal to the target's fillColor).
				let previous = graph.model.getStyle;
				
				graph.model.getStyle = function(cell)
				{
					if (cell != null)
					{
						let style = previous.apply(this, arguments);
						
						if (this.isEdge(cell))
						{
							let target = this.getTerminal(cell, false);

							if (target != null)
							{
								let targetStyle = graph.getCurrentCellStyle(target);
								let fill = mxUtils.getValue(targetStyle, mxConstants.STYLE_FILLCOLOR);
								
								if (fill != null)
								{
									style += ';strokeColor='+fill;
								}
							}
						}
						else if (this.isVertex(cell))
						{
							let geometry = this.getGeometry(cell);
							
							if (geometry != null &&
								geometry.width > 80)
							{
								style += ';fillColor=green';
							}
						}
						
						return style;
					}
					
					return null;
				};
				
				// Gets the default parent for inserting new cells. This
				// is normally the first child of the root (ie. layer 0).
				let parent = graph.getDefaultParent();
								
				// Adds cells to the model in a single step
				graph.getModel().beginUpdate();
				try
				{
					var v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30, 'fillColor=green');
					var v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30, 'fillColor=blue');
					var v3 = graph.insertVertex(parent, null, 'World!', 20, 150, 80, 30, 'fillColor=red');
					var e1 = graph.insertEdge(parent, null, 'Connect', v1, v2, 'perimeterSpacing=4;strokeWidth=4;labelBackgroundColor=white;fontStyle=1');
				}
				finally
				{
					// Updates the display
					graph.getModel().endUpdate();
				}
			}
		};
	</script>
</head>

<!-- Page passes the container for the graph to the program -->
<body onload="main(document.getElementById('graphContainer'))">

	<!-- Creates a container for the graph with a grid wallpaper -->
	<div id="graphContainer"
		style="overflow:hidden;width:321px;height:241px;background:url('editors/images/grid.gif')">
	</div>
</body>
</html>