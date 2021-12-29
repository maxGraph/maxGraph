import { Graph, constants } from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';
import { clone } from '@maxgraph/core/util/cloneUtils';
import { button } from '@maxgraph/core/util/domHelpers';
import { load } from '@maxgraph/core/util/MaxXmlRequest';

export default {
  title: 'Xml_Json/FileIO',
  argTypes: {
    ...globalTypes,
  },
};

const Template = ({ label, ...args }) => {
  const div = document.createElement('div');

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';
  div.appendChild(container);

  // Program starts here. Creates a sample graph in the
  // DOM node with the specified ID. This function is invoked
  // from the onLoad event handler of the document (see below).
  function main(container) {
    // Checks if browser is supported
    if (!Client.isBrowserSupported()) {
      // Displays an error message if the browser is
      // not supported.
      alert('Browser is not supported!', 200, false);
    } else {
      // Creates the graph inside the given container
      const graph = new Graph(container);

      graph.setEnabled(false);
      graph.setPanning(true);
      graph.setTooltips(true);
      graph.getPlugin('PanningHandler').useLeftButtonForPanning = true;

      // Adds a highlight on the cell under the mousepointer
      new CellTracker(graph);

      // Changes the default vertex style in-place
      let style = graph.getStylesheet().getDefaultVertexStyle();
      style.shape = constants.SHAPE.ROUNDED;
      style.perimiter = Perimeter.RectanglePerimeter;
      style.gradientColor = 'white';
      style.perimeterSpacing = 4;
      style.shadow = true;

      style = graph.getStylesheet().getDefaultEdgeStyle();
      style.labelBackgroundColor = 'white';

      style = clone(style);
      style.startArrow = constants.ARROW.CLASSIC;
      graph.getStylesheet().putCellStyle('2way', style);

      graph.isHtmlLabel = function (cell) {
        return true;
      };

      // Larger grid size yields cleaner layout result
      graph.gridSize = 20;

      // Creates a layout algorithm to be used
      // with the graph
      const layout = new MxFastOrganicLayout(graph);

      // Moves stuff wider apart than usual
      layout.forceConstant = 140;

      // Adds a button to execute the layout
      this.el2.appendChild(
        button('Arrange', function (evt) {
          const parent = graph.getDefaultParent();
          layout.execute(parent);
        })
      );

      // Load cells and layouts the graph
      graph.getModel().beginUpdate();
      try {
        // Loads the custom file format (TXT file)
        parse(graph, 'fileio.txt');

        // Loads the Graph file format (XML file)
        // read(graph, 'fileio.xml');

        // Gets the default parent for inserting new cells. This
        // is normally the first child of the root (ie. layer 0).
        const parent = graph.getDefaultParent();

        // Executes the layout
        layout.execute(parent);
      } finally {
        // Updates the display
        graph.getModel().endUpdate();
      }

      graph.dblClick = function (evt, cell) {
        const mxe = new EventObject(InternalEvent.DOUBLE_CLICK, { event: evt, cell });
        this.fireEvent(mxe);

        if (
          this.isEnabled() &&
          !InternalEvent.isConsumed(evt) &&
          !mxe.isConsumed() &&
          cell != null
        ) {
          alert(`Show properties for cell ${cell.customId || cell.getId()}`);
        }
      };
    }
  }

  // Custom parser for simple file format
  function parse(graph, filename) {
    const model = graph.getModel();

    // Gets the default parent for inserting new cells. This
    // is normally the first child of the root (ie. layer 0).
    const parent = graph.getDefaultParent();

    const req = load(filename);
    const text = req.getText();

    const lines = text.split('\n');

    // Creates the lookup table for the vertices
    const vertices = [];

    // Parses all lines (vertices must be first in the file)
    graph.getModel().beginUpdate();
    try {
      for (let i = 0; i < lines.length; i++) {
        // Ignores comments (starting with #)
        const colon = lines[i].indexOf(':');

        if (lines[i].substring(0, 1) != '#' || colon == -1) {
          const comma = lines[i].indexOf(',');
          const value = lines[i].substring(colon + 2, lines[i].length);

          if (comma == -1 || comma > colon) {
            const key = lines[i].substring(0, colon);

            if (key.length > 0) {
              vertices[key] = graph.insertVertex(parent, null, value, 0, 0, 80, 70);
            }
          } else if (comma < colon) {
            // Looks up the vertices in the lookup table
            const source = vertices[lines[i].substring(0, comma)];
            const target = vertices[lines[i].substring(comma + 1, colon)];

            if (source != null && target != null) {
              const e = graph.insertEdge(parent, null, value, source, target);

              // Uses the special 2-way style for 2-way labels
              if (value.indexOf('2-Way') >= 0) {
                e.style = '2way';
              }
            }
          }
        }
      }
    } finally {
      graph.getModel().endUpdate();
    }
  }

  // Parses the Graph XML file format
  function read(graph, filename) {
    const req = load(filename);
    const root = req.getDocumentElement();
    const dec = new Codec(root.ownerDocument);

    dec.decode(root, graph.getModel());
  }

  return div;
};

export const Default = Template.bind({});
