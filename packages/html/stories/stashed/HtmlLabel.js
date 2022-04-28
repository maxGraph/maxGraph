// @ts-check
/**
 * Copyright (c) 2006-2013, JGraph Ltd
 * 
 * HTML label
 * 
 * This example demonstrates using
 * HTML labels that are connected to the state of the user object.
 */

import React from 'react';
import mxEvent from '../mxgraph/util/mxEvent';
import mxGraph from '../mxgraph/view/mxGraph';
import mxRubberband from '../mxgraph/handler/mxRubberband';


const HTML_TEMPLATE = `
<!-- Page passes the container for the graph to the program -->
<body onload="main(document.getElementById('graphContainer'))">

  <!-- Creates a container for the graph with a grid wallpaper -->
  <div id="graphContainer"
    style="position:relative;overflow:hidden;width:321px;height:241px;background:url('editors/images/grid.gif');cursor:default;">
  </div>
</body>
`


// Disables the built-in context menu
mxEvent.disableContextMenu(container);

// Creates the graph inside the given container
let graph = new mxGraph(container);

// Enables HTML labels
graph.setHtmlLabels(true);

// Enables rubberband selection
new mxRubberband(graph);

// Creates a user object that stores the state
let doc = mxUtils.createXmlDocument();
let obj = doc.createElement('UserObject');
obj.setAttribute('label', 'Hello, World!');
obj.setAttribute('checked', 'false');

// Adds optional caching for the HTML label
let cached = true;

if (cached) {
  // Ignores cached label in codec
  CodecRegistry.getCodec(mxCell).exclude.push('div');

  // Invalidates cached labels
  graph.model.setValue = function(cell, value) {
    cell.div = null;
    mxGraphModel.prototype.setValue.apply(this, arguments);
  };
}

// Overrides method to provide a cell label in the display
graph.convertValueToString = function(cell) {
  if (cached && cell.div != null) {
    // Uses cached label
    return cell.div;
  } else if (mxUtils.isNode(cell.value) && cell.value.nodeName.toLowerCase() == 'userobject') {
    // Returns a DOM for the label
    let div = document.createElement('div');
    div.innerHTML = cell.getAttribute('label');
    mxUtils.br(div);

    let checkbox = document.createElement('input');
    checkbox.setAttribute('type', 'checkbox');

    if (cell.getAttribute('checked') == 'true') {
      checkbox.setAttribute('checked', 'checked');
      checkbox.defaultChecked = true;
    }

    // Writes back to cell if checkbox is clicked
    mxEvent.addListener(checkbox, 'change', function(evt) {
      let elt = cell.value.cloneNode(true);
      elt.setAttribute('checked', (checkbox.checked) ? 'true' : 'false');

      graph.model.setValue(cell, elt);
    });

    div.appendChild(checkbox);

    if (cached) {
      // Caches label
      cell.div = div;
    }
    return div;
  }
  return '';
};

// Overrides method to store a cell label in the model
let cellLabelChanged = graph.cellLabelChanged;
graph.cellLabelChanged = function(cell, newValue, autoSize) {
  if (mxUtils.isNode(cell.value) && cell.value.nodeName.toLowerCase() == 'userobject') {
    // Clones the value for correct undo/redo
    let elt = cell.value.cloneNode(true);
    elt.setAttribute('label', newValue);
    newValue = elt;
  }

  cellLabelChanged.apply(this, arguments);
};

// Overrides method to create the editing value
let getEditingValue = graph.getEditingValue;
graph.getEditingValue = function(cell) {
  if (mxUtils.isNode(cell.value) && cell.value.nodeName.toLowerCase() == 'userobject') {
    return cell.getAttribute('label');
  }
};

let parent = graph.getDefaultParent();
graph.insertVertex(parent, null, obj, 20, 20, 80, 60);

// Undo/redo
let undoManager = new UndoManager();
let listener = function(sender, evt) {
  undoManager.undoableEditHappened(evt.getProperty('edit'));
};
graph.getDataModel().addListener(mxEvent.UNDO, listener);
graph.getView().addListener(mxEvent.UNDO, listener);

document.body.appendChild(mxUtils.button('Undo', function() {
  undoManager.undo();
}));

document.body.appendChild(mxUtils.button('Redo', function() {
  undoManager.redo();
}));

