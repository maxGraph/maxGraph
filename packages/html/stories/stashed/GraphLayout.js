/**
 * Copyright (c) 2006-2013, JGraph Ltd
 * 
 * Graph Layout
 * 
 * This example demonstrates using
 * automatic graph layouts and listening to changes of the graph size
 * to keep the container size in sync.
 */

import React from 'react';
import mxEvent from '../mxgraph/util/mxEvent';
import mxGraph from '../mxgraph/view/mxGraph';
import mxRubberband from '../mxgraph/handler/mxRubberband';
import mxUtils from "../mxgraph/util/mxUtils";
import mxCircleLayout from "../mxgraph/layout/mxCircleLayout";


const HTML_TEMPLATE = `
<!-- Page passes the container for the graph to the program -->
<body onload="main(document.getElementById('graphContainer'))">

  <!-- Creates a container for the graph with a grid wallpaper. Make sure to define the position
    and overflow attributes! See comments on the adding of the size-listener on line 54 ff!  -->
  <div id="graphContainer"
    style="position:relative;overflow:auto;width:821px;height:641px;background:url('editors/images/grid.gif');">
  </div>
  <br>
  <input type="checkbox" id="animate" checked="checked"/> Transitions
</body>
`

    
// Creates the graph inside the given container
let graph = new mxGraph(container);

// Disables basic selection and cell handling
graph.setEnabled(false);

// Changes the default vertex style in-place
let style = graph.getStylesheet().getDefaultVertexStyle();
style.shape = mxConstants.SHAPE_ELLIPSE;
style.perimiter = Perimeter.EllipsePerimeter;
style.gradientColor = 'white';
style.fontSize = '10';

// Updates the size of the container to match
// the size of the graph when it changes. If
// this is commented-out, and the DIV style's
// overflow is set to "auto", then scrollbars
// will appear for the diagram. If overflow is
// set to "visible", then the diagram will be
// visible even when outside the parent DIV.
// With the code below, the parent DIV will be
// resized to contain the complete graph.
//graph.setResizeContainer(true);

// Larger grid size yields cleaner layout result
graph.gridSize = 40;

// Gets the default parent for inserting new cells. This
// is normally the first child of the root (ie. layer 0).
let parent = graph.getDefaultParent();

// Creates a layout algorithm to be used
// with the graph
let layout = new MxFastOrganicLayout(graph);

// Moves stuff wider apart than usual
layout.forceConstant = 80;

// Reference to the transition checkbox
let animate = document.getElementById('animate');

// Adds a button to execute the layout
this.el2.insertBefore(mxUtils.button('Circle Layout',
  function(evt) {
    graph.getDataModel().beginUpdate();
    try {
      // Creates a layout algorithm to be used
      // with the graph
      let circleLayout = new mxCircleLayout(graph);
      circleLayout.execute(parent);
    } catch (e) {
      throw e;
    } finally {
      if (animate.checked) {
        let morph = new Morphing(graph);
        morph.addListener(mxEvent.DONE, function() {
          graph.getDataModel().endUpdate();
        });
        morph.startAnimation();
      } else {
        graph.getDataModel().endUpdate();
      }
    }
  }
), document.body.firstChild);

// Adds a button to execute the layout
document.body.insertBefore(mxUtils.button('Organic Layout',
  function(evt)
  {
    graph.getDataModel().beginUpdate();
    try {
      layout.execute(parent);
    } catch (e) {
      throw e;
    } finally {
      if (animate.checked) {
        // Default values are 6, 1.5, 20
        let morph = new Morphing(graph, 10, 1.7, 20);
        morph.addListener(mxEvent.DONE, function() {
          graph.getDataModel().endUpdate();
        });
        morph.startAnimation();
      } else {
        graph.getDataModel().endUpdate();
      }
    }
  }
), document.body.firstChild);

// Adds cells to the model in a single step
graph.getDataModel().beginUpdate();
let w = 30;
let h = 30;
try {
  var v1 = graph.insertVertex(parent, null, 'A', 0, 0, w, h);
  var v2 = graph.insertVertex(parent, null, 'B', 0, 0, w, h);
  var v3 = graph.insertVertex(parent, null, 'C', 0, 0, w, h);
  var v4 = graph.insertVertex(parent, null, 'D', 0, 0, w, h);
  var v5 = graph.insertVertex(parent, null, 'E', 0, 0, w, h);
  var v6 = graph.insertVertex(parent, null, 'F', 0, 0, w, h);
  var v7 = graph.insertVertex(parent, null, 'G', 0, 0, w, h);
  var v8 = graph.insertVertex(parent, null, 'H', 0, 0, w, h);
  var e1 = graph.insertEdge(parent, null, 'ab', v1, v2);
  var e2 = graph.insertEdge(parent, null, 'ac', v1, v3);
  var e3 = graph.insertEdge(parent, null, 'cd', v3, v4);
  var e4 = graph.insertEdge(parent, null, 'be', v2, v5);
  var e5 = graph.insertEdge(parent, null, 'cf', v3, v6);
  var e6 = graph.insertEdge(parent, null, 'ag', v1, v7);
  var e7 = graph.insertEdge(parent, null, 'gh', v7, v8);
  var e8 = graph.insertEdge(parent, null, 'gc', v7, v3);
  var e9 = graph.insertEdge(parent, null, 'gd', v7, v4);
  var e10 = graph.insertEdge(parent, null, 'eh', v5, v8);

  // Executes the layout
  layout.execute(parent);
} finally {
  // Updates the display
  graph.getDataModel().endUpdate();
}

