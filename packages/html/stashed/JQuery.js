/**
 * Copyright (c) 2006-2013, JGraph Ltd
 *
 * JQuery plugin for labels
 *
 * This example demonstrates using
 * a JQuery plugin to generate labels for vertices on the fly.
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
    style="position:relative;overflow:hidden;width:821px;height:661px;cursor:default;border:1px solid gray;">
  </div>

</body>
`;

// Fixes possible clipping issues in Chrome
Client.NO_FO = true;

// Disables the built-in context menu
mxEvent.disableContextMenu(container);

// Creates the graph inside the given container
let graph = new mxGraph(container);

// Adds custom HTML labels
graph.setHtmlLabels(true);

let chartColors = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)',
};

let randomScalingFactor = function () {
  return (Math.random() > 0.5 ? 1.0 : -1.0) * Math.round(Math.random() * 100);
};

let MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
let config = {
  type: 'line',
  data: {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'My First dataset',
        backgroundColor: chartColors.red,
        borderColor: chartColors.red,
        data: [
          randomScalingFactor(),
          randomScalingFactor(),
          randomScalingFactor(),
          randomScalingFactor(),
          randomScalingFactor(),
          randomScalingFactor(),
          randomScalingFactor(),
        ],
        fill: false,
      },
      {
        label: 'My Second dataset',
        fill: false,
        backgroundColor: chartColors.blue,
        borderColor: chartColors.blue,
        data: [
          randomScalingFactor(),
          randomScalingFactor(),
          randomScalingFactor(),
          randomScalingFactor(),
          randomScalingFactor(),
          randomScalingFactor(),
          randomScalingFactor(),
        ],
      },
    ],
  },
  options: {
    responsive: true,
    title: {
      display: true,
      text: 'Chart.js Line Chart',
    },
    tooltips: {
      mode: 'index',
      intersect: false,
    },
    hover: {
      mode: 'nearest',
      intersect: true,
    },
    scales: {
      xAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Month',
          },
        },
      ],
      yAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Value',
          },
        },
      ],
    },
  },
};

// Returns canvas with dynamic chart for vertex labels
let graphConvertValueToString = graph.convertValueToString;
graph.convertValueToString = function (cell) {
  if (cell.isVertex()) {
    let node = document.createElement('canvas');
    node.setAttribute('width', cell.geometry.width);
    node.setAttribute('height', cell.geometry.height);

    // Document for empty output if not in DOM
    document.body.appendChild(node);

    let ctx = node.getContext('2d');
    new Chart(ctx, config);

    return node;
  }
  return graphConvertValueToString.apply(this, arguments);
};

// Enables rubberband selection
new mxRubberband(graph);

// Gets the default parent for inserting new cells. This
// is normally the first child of the root (ie. layer 0).
let parent = graph.getDefaultParent();

// Adds cells to the model in a single step
graph.batchUpdate(() => {
  var v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 300, 240, {
    overflow: 'fill',
    fillColor: 'none',
    fontColor: '#000000',
  });
  var v2 = graph.insertVertex(parent, null, 'Hello,', 480, 320, 300, 240, {
    overflow: 'fill',
    fillColor: 'none',
    fontColor: '#000000',
  });
  var e1 = graph.insertEdge(parent, null, '', v1, v2);
});

document.body.appendChild(
  mxUtils.button('+', function () {
    graph.zoomIn();
  })
);

document.body.appendChild(
  mxUtils.button('-', function () {
    graph.zoomOut();
  })
);
