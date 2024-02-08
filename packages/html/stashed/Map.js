/**
 * Copyright (c) 2006-2013, JGraph Ltd
 * 
 * Google maps (Adding a Custom Overlay)
 * 
 * This example demonstrates using
 * a graph container as a Google Maps overlay.
 */

import React from 'react';
import mxEvent from '../mxgraph/util/mxEvent';
import mxGraph from '../mxgraph/view/mxGraph';
import mxRubberband from '../mxgraph/handler/mxRubberband';


HTML_TEMPLATE = `
<style>
  html, body, #map-canvas {
    height: 100%;
    margin: 0px;
    padding: 0px
  }
</style>
<script src="https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false"></script>

<!-- Page passes the container for the graph to the program -->
<body>
  <div id="map-canvas"></div>
</body>
`

// Keeps the font sizes independent of the scale
mxCellRenderer.prototype.getTextScale = function(state) {
  return 1;
};

// This example creates a custom overlay called mxGraphOverlay, containing
// a mxGraph container.

// Set the custom overlay object's prototype to a new instance
// of OverlayView. In effect, this will subclass the overlay class.
// Note that we set the prototype to an instance, rather than the
// parent class itself, because we do not wish to modify the parent class.

var overlay;
mxGraphOverlay.prototype = new google.maps.OverlayView();

// Initialize the map and the custom overlay.
function initialize() {
  let mapOptions = {
    zoom: 4,
    center: new google.maps.LatLng(34, -96),
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: [
      {featureType: "road", stylers: [{visibility: "off"}]},
      {"elementType": "labels", "stylers": [{"visibility": "off" }]}
    ],
  };

  let map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

  let swBound = new google.maps.LatLng(18, -126);
  let neBound = new google.maps.LatLng(50, -65);
  let bounds = new google.maps.LatLngBounds(swBound, neBound);

  // The custom mxGraphOverlay object contains the graph,
  // the bounds of the graph, and a reference to the map.
  overlay = new mxGraphOverlay(bounds, map);
}

function mxGraphOverlay(bounds, map) {
  // Initialize all properties.
  this.bounds_ = bounds;
  this.map_ = map;

  // Define a property to hold the graph's div. We'll
  // actually create this div upon receipt of the onAdd()
  // method so we'll leave it null for now.
  this.div_ = null;

  // Explicitly call setMap on this overlay.
  this.setMap(map);
}

/**
 * onAdd is called when the map's panes are ready and the overlay has been
 * added to the map.
 */
mxGraphOverlay.prototype.onAdd = function() {
  let div = document.createElement('div');
  div.style.borderStyle = 'none';
  div.style.borderWidth = '0px';
  div.style.overflow = 'visible';
  div.style.position = 'absolute';

  // Allows labels to be rendered outside the container
  Client.NO_FO = true;

  // Creates the graph inside the given container
  let graph = new mxGraph(div);
  graph.setHtmlLabels(true);
  graph.view.setTranslate(4, 4);

  // Sets default vertex style
  let style = {};
  style.shape = mxConstants.SHAPE_ELLIPSE;
  style.perimiter = mxPerimeter.EllipsePerimeter;
  style.fillColor = '#8CCDF5';
  style.strokeColor = '#1B78C8';
  style.fontColor = '#000000';
  style.opacity = '50';
  style.fontSize = '16';
  graph.getStylesheet().putDefaultVertexStyle(style);

  // Gets label from custom user object
  graph.convertValueToString = function(cell) {
    return (cell.value != null && cell.value.label != null) ? cell.value.label : mxGraph.prototype.convertValueToString.apply(this, arguments);
  };

  // Implements level of detail
  graph.isCellVisible = function(cell) {
    return (cell.value != null && cell.value.minScale != null) ? cell.value.minScale <= this.view.scale : mxGraph.prototype.isCellVisible.apply(this, arguments);
  };

  // Enables rubberband selection
  new mxRubberband(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  let parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.getDataModel().beginUpdate();
  try {
    var n1 = graph.insertVertex(parent, null, {label:'Seattle'}, 23, 23, 10, 10);
    var n2 = graph.insertVertex(parent, null, {label:'Sunnyvale'}, 25.76, 148.4, 10, 10);
    var n3 = graph.insertVertex(parent, null, {label:'Los Angeles'}, 59.8, 185.25, 10, 10);
    var n4 = graph.insertVertex(parent, null, {label:'Denver'}, 179.39, 121.25, 10, 10);
    var n5 = graph.insertVertex(parent, null, {label:'Kansas'}, 273.30, 128.63, 10, 10);
    var n6 = graph.insertVertex(parent, null, {label:'Houston'}, 266.36, 230.7, 10, 10);
    var n7 = graph.insertVertex(parent, null, {label:'Chicago'}, 336, 95.67, 10, 10);
    var n8 = graph.insertVertex(parent, null, {label:'Indianapolis'}, 349.38, 120.85, 10, 10);
    var n9 = graph.insertVertex(parent, null, {label:'Atlanta'}, 365.23, 188.51, 10, 10);
    var n10 = graph.insertVertex(parent, null, {label:'New York'}, 458.83, 109.61, 10, 10);
    var n11 = graph.insertVertex(parent, null, {label:'Washington'}, 432.93, 129.52, 10, 10);

    // This node and its connections are only visible for zoom 200% and above
    var n12 = graph.insertVertex(parent, null, {label:'Columbus', minScale:2}, 380, 120, 10, 10);

    let estyle = 'strokeWidth=2;endArrow=none;labelBackgroundColor=white;';
    let e = [
      graph.insertEdge(parent, null, '', n1, n2, estyle),
      graph.insertEdge(parent, null, '', n2, n3, estyle),
      graph.insertEdge(parent, null, '', n1, n4, estyle),
      graph.insertEdge(parent, null, '', n2, n4, estyle),
      graph.insertEdge(parent, null, '', n3, n6, estyle),
      graph.insertEdge(parent, null, '', n4, n5, estyle),
      graph.insertEdge(parent, null, '', n5, n6, estyle),
      graph.insertEdge(parent, null, '', n5, n8, estyle),
      graph.insertEdge(parent, null, '', n6, n9, estyle),
      graph.insertEdge(parent, null, '', n8, n7, estyle),
      graph.insertEdge(parent, null, '', n7, n10, estyle),
      graph.insertEdge(parent, null, '', n9, n11, estyle),
      graph.insertEdge(parent, null, '', n10, n11, estyle),
      graph.insertEdge(parent, null, '', n8, n9, estyle),
      graph.insertEdge(parent, null, '', n8, n12, estyle),
      graph.insertEdge(parent, null, '', n12, n11, estyle),
    ];
  } finally {
    // Updates the display
    graph.getDataModel().endUpdate();
  }

  // Writes some random numbers on the connections
  window.setInterval(function() {
    graph.getDataModel().beginUpdate();
    try {
      for (let i = 0; i < e.length; i++)
      {
        let rnd = Math.random();
        graph.getDataModel().setValue(e[i], Math.round(rnd * 100));
      }
    } finally {
      graph.getDataModel().endUpdate();
    }
  }, 1000);

  this.graph_ = graph;
  this.div_ = div;

  // Add the element to the "overlayLayer" pane.
  let panes = this.getPanes();
  panes.overlayLayer.appendChild(div);
};

mxGraphOverlay.prototype.draw = function() {
  // We use the south-west and north-east
  // coordinates of the overlay to peg it to the correct position and size.
  // To do this, we need to retrieve the projection from the overlay.
  let overlayProjection = this.getProjection();

  // Retrieve the south-west and north-east coordinates of this overlay
  // in LatLngs and convert them to pixel coordinates.
  // We'll use these coordinates to resize the div.
  let sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
  let ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());

  // Resize the graph's div to fit the indicated dimensions.
  let div = this.div_;
  div.style.left = sw.x + 'px';
  div.style.top = ne.y + 'px';
  let w = (ne.x - sw.x);
  let h = (sw.y - ne.y);
  div.style.width = w + 'px';
  div.style.height = h + 'px';

  // Sets the scale of the graph based on reference width
  this.graph_.view.setScale(w / 550);
};

// The onRemove() method will be called automatically from the API if
// we ever set the overlay's map property to 'null'.
mxGraphOverlay.prototype.onRemove = function() {
  this.div_.parentNode.removeChild(this.div_);
  this.div_ = null;
};

google.maps.event.addDomListener(window, 'load', initialize);
