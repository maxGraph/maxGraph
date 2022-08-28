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

import { Graph, CylinderShape, constants, CellRenderer } from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Shapes/Shape',
  argTypes: {
    ...globalTypes,
  },
};

const Template = ({ label, ...args }) => {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';

  /*
    The example shape is a "3D box" that looks like this:
              ____
             /   /|
            /___/ |
            |   | /
            |___|/

    The code below defines the shape. The BoxShape function
    it the constructor which creates a new object instance.
    
    The next lines use an CylinderShape instance to augment the
    prototype of the shape ("inheritance") and reset the
    constructor to the topmost function of the c'tor chain.
  */

  class BoxShape extends CylinderShape {
    // Defines the extrusion of the box as a "static class variable"
    extrude = 10;

    /*
          Next, the CylinderShape's redrawPath method is "overridden".
          This method has a isForeground argument to separate two
          paths, one for the background (which must be closed and
          might be filled) and one for the foreground, which is
          just a stroke.

          Foreground:       /
                      _____/
                          |
                          |
                        ____
          Background:  /    |
                      /     |
                      |     /
                      |____/
    */
    redrawPath(path, x, y, w, h, isForeground) {
      const dy = this.extrude * this.scale;
      const dx = this.extrude * this.scale;

      if (isForeground) {
        path.moveTo(0, dy);
        path.lineTo(w - dx, dy);
        path.lineTo(w, 0);
        path.moveTo(w - dx, dy);
        path.lineTo(w - dx, h);
      } else {
        path.moveTo(0, dy);
        path.lineTo(dx, 0);
        path.lineTo(w, 0);
        path.lineTo(w, h - dy);
        path.lineTo(w - dx, h);
        path.lineTo(0, h);
        path.lineTo(0, dy);
        path.lineTo(dx, 0);
        path.close();
      }
    }
  }
  CellRenderer.registerShape('box', BoxShape);

  // Creates the graph inside the DOM node.
  const graph = new Graph(container);

  // Disables basic selection and cell handling
  graph.setEnabled(false);

  // Changes the default style for vertices "in-place"
  // to use the custom shape.
  const style = graph.getStylesheet().getDefaultVertexStyle();
  style.shape = 'box';

  // Adds a spacing for the label that matches the
  // extrusion size
  style.spacingTop = BoxShape.prototype.extrude;
  style.spacingRight = BoxShape.prototype.extrude;

  // Adds a gradient and shadow to improve the user experience
  style.gradientColor = '#FFFFFF';
  style.shadow = true;

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'Custom', 20, 20, 80, 60);
    const v2 = graph.insertVertex(parent, null, 'Shape', 200, 150, 80, 60);
    const e1 = graph.insertEdge(parent, null, '', v1, v2);
  });

  return container;
};

export const Default = Template.bind({});
