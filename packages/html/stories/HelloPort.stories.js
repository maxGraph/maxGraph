import {
  Graph,
  RubberBandHandler,
  EdgeStyle,
  Point,
  constants,
  DomHelpers,
  Client,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';
import { popup } from '@maxgraph/core/gui/MaxWindow';
import { getPrettyXml } from '@maxgraph/core/util/xmlUtils';

export default {
  title: 'Connections/HelloPort',
  argTypes: {
    ...globalTypes,
    rubberBand: {
      type: 'boolean',
      defaultValue: true,
    },
  },
};

const Template = ({ label, ...args }) => {
  Client.setImageBasePath('/images');

  const div = document.createElement('div');

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';
  div.appendChild(container);

  // Creates the graph inside the given container
  const graph = new Graph(container);
  graph.setConnectable(true);
  graph.setTooltips(true);

  // Sets the default edge style
  const style = graph.getStylesheet().getDefaultEdgeStyle();
  style.edgeStyle = EdgeStyle.ElbowConnector;
  style.bendable=true

  // Ports are not used as terminals for edges, they are
  // only used to compute the graphical connection point
  graph.isPort = function (cell) {
    const geo = cell.getGeometry();

    return geo != null ? geo.relative : false;
  };

  // Implements a tooltip that shows the actual
  // source and target of an edge
  graph.getTooltipForCell = function (cell) {
    if (cell.isEdge()) {
      return `${this.convertValueToString(
        cell.getTerminal(true)
      )} => ${this.convertValueToString(cell.getTerminal(false))}`;
    }

    return Graph.prototype.getTooltipForCell.apply(this, arguments);
  };

  // Removes the folding icon and disables any folding
  graph.isCellFoldable = function (cell) {
    return false;
  };

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'Hello', 20, 80, 80, 30);
    v1.setConnectable(false);
    const v11 = graph.insertVertex(v1, null, '', 1, 1, 10, 10);
    v11.geometry.offset = new Point(-5, -5);
    v11.geometry.relative = true;
    const v12 = graph.insertVertex(v1, null, '', 1, 0, 10, 10);
    v12.geometry.offset = new Point(-5, -5);
    v12.geometry.relative = true;
    const v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    const v3 = graph.insertVertex(parent, null, 'World2', 200, 20, 80, 30);
    var e1 = graph.insertEdge(parent, null, '', v11, v2);
    var e1 = graph.insertEdge(parent, null, '', v12, v3);
  });

  const controller = document.createElement('div');
  div.appendChild(controller);

  const button = DomHelpers.button('View XML', function () {
    const encoder = new Codec();
    const node = encoder.encode(graph.getDataModel());
    popup(getPrettyXml(node), true);
  });

  controller.appendChild(button);

  return div;
};

export const Default = Template.bind({});
