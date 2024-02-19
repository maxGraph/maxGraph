/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2020, JGraph Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {
  Graph,
  EdgeHandler,
  SelectionHandler,
  CellRenderer,
  MarkerShape,
  CylinderShape,
  ArrowShape,
  Point,
} from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';

export default {
  title: 'Icon_Images/Markers',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }) => {
  const container = createGraphContainer(args);

  // Enables guides
  SelectionHandler.prototype.guidesEnabled = true;
  EdgeHandler.prototype.snapToTerminals = true;

  // Registers and defines the custom marker
  MarkerShape.addMarker(
    'dash',
    function (canvas, shape, type, pe, unitX, unitY, size, source, sw, filled) {
      const nx = unitX * (size + sw + 1);
      const ny = unitY * (size + sw + 1);

      return function () {
        canvas.begin();
        canvas.moveTo(pe.x - nx / 2 - ny / 2, pe.y - ny / 2 + nx / 2);
        canvas.lineTo(pe.x + ny / 2 - (3 * nx) / 2, pe.y - (3 * ny) / 2 - nx / 2);
        canvas.stroke();
      };
    }
  );

  // Defines custom message shape
  class MessageShape extends CylinderShape {
    redrawPath(path, x, y, w, h, isForeground) {
      if (isForeground) {
        path.moveTo(0, 0);
        path.lineTo(w / 2, h / 2);
        path.lineTo(w, 0);
      } else {
        path.moveTo(0, 0);
        path.lineTo(w, 0);
        path.lineTo(w, h);
        path.lineTo(0, h);
        path.close();
      }
    }
  }
  CellRenderer.registerShape('message', MessageShape);

  // Defines custom edge shape
  class LinkShape extends ArrowShape {
    paintEdgeShape(c, pts) {
      const width = 10;

      // Base vector (between end points)
      const p0 = pts[0];
      const pe = pts[pts.length - 1];

      const dx = pe.x - p0.x;
      const dy = pe.y - p0.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const length = dist;

      // Computes the norm and the inverse norm
      const nx = dx / dist;
      const ny = dy / dist;
      const basex = length * nx;
      const basey = length * ny;
      const floorx = (width * ny) / 3;
      const floory = (-width * nx) / 3;

      // Computes points
      const p0x = p0.x - floorx / 2;
      const p0y = p0.y - floory / 2;
      const p1x = p0x + floorx;
      const p1y = p0y + floory;
      const p2x = p1x + basex;
      const p2y = p1y + basey;
      const p3x = p2x + floorx;
      const p3y = p2y + floory;
      // p4 not necessary
      const p5x = p3x - 3 * floorx;
      const p5y = p3y - 3 * floory;

      c.begin();
      c.moveTo(p1x, p1y);
      c.lineTo(p2x, p2y);
      c.moveTo(p5x + floorx, p5y + floory);
      c.lineTo(p0x, p0y);
      c.stroke();
    }
  }
  CellRenderer.registerShape('link', LinkShape);

  // Creates the graph
  const graph = new Graph(container);

  // Sets default styles
  let style = graph.getStylesheet().getDefaultVertexStyle();
  style.fillColor = '#FFFFFF';
  style.strokeColor = '#000000';
  style.fontColor = '#000000';
  style.fontStyle = 1;

  style = graph.getStylesheet().getDefaultEdgeStyle();
  style.strokeColor = '#000000';
  style.fontColor = '#000000';
  style.fontStyle = 0;
  style.startSize = 8;
  style.endSize = 8;

  // Populates the graph
  const parent = graph.getDefaultParent();

  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'v1', 20, 20, 80, 30);
    const v2 = graph.insertVertex(parent, null, 'v2', 440, 20, 80, 30);
    const e1 = graph.insertEdge(parent, null, '', v1, v2, {
      dashed: 1,
      startArrow: 'oval',
      endArrow: 'block',
      sourcePerimeterSpacing: 4,
      startFill: false,
      endFill: false,
    });
    const e11 = graph.insertVertex(e1, null, 'Label', 0, 0, 20, 14, {
      shape: 'message',
      labelBackgroundColor: '#ffffff',
      labelPosition: 'left',
      spacingRight: 2,
      align: 'right',
      fontStyle: 0,
    });
    e11.geometry.offset = new Point(-10, -7);
    e11.geometry.relative = true;
    e11.connectable = false;

    const v3 = graph.insertVertex(parent, null, 'v3', 20, 120, 80, 30);
    const v4 = graph.insertVertex(parent, null, 'v4', 440, 120, 80, 30);
    const e2 = graph.insertEdge(parent, null, 'Label', v3, v4, {
      startArrow: 'dash',
      startSize: 12,
      endArrow: 'block',
      labelBackgroundColor: '#FFFFFF',
    });

    const v5 = graph.insertVertex(parent, null, 'v5', 40, 220, 40, 40, {
      shape: 'ellipse',
      perimeter: 'ellipsePerimeter',
    });
    const v6 = graph.insertVertex(parent, null, 'v6', 460, 220, 40, 40, {
      shape: 'doubleEllipse',
      perimeter: 'ellipsePerimeter',
    });
    const e3 = graph.insertEdge(parent, null, 'Link', v5, v6, {
      shape: 'link',
      labelBackgroundColor: '#FFFFFF',
    });
  });

  return container;
};

export const Default = Template.bind({});
