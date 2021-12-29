import {
  Graph,
  InternalEvent,
  RubberBandHandler,
  Clipboard,
  xmlUtils,
  eventUtils,
  Client,
  Codec,
  GraphModel,
  styleUtils,
  stringUtils,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'DnD_CopyPaste/Clipboard',
  argTypes: {
    ...globalTypes,
    contextMenu: {
      type: 'boolean',
      defaultValue: false,
    },
    rubberBand: {
      type: 'boolean',
      defaultValue: true,
    },
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

  // Disables the built-in context menu
  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Creates the graph inside the given this.el
  const graph = new Graph(container);

  // Public helper method for shared clipboard.
  Clipboard.cellsToString = function (cells) {
    const codec = new Codec();
    const model = new GraphModel();
    const parent = model.getRoot().getChildAt(0);

    for (let i = 0; i < cells.length; i++) {
      model.add(parent, cells[i]);
    }
    return xmlUtils.getXml(codec.encode(model));
  };

  // Focused but invisible textarea during control or meta key events
  const textInput = document.createElement('textarea');
  styleUtils.setOpacity(textInput, 0);
  textInput.style.width = '1px';
  textInput.style.height = '1px';
  let restoreFocus = false;
  const gs = graph.gridSize;
  let lastPaste = null;
  let dx = 0;
  let dy = 0;

  // Workaround for no copy event in IE/FF if empty
  textInput.value = ' ';

  // Shows a textare when control/cmd is pressed to handle native clipboard actions
  InternalEvent.addListener(document, 'keydown', function (evt) {
    // No dialog visible
    const source = eventUtils.getSource(evt);

    if (
      graph.isEnabled() &&
      !graph.isMouseDown &&
      !graph.isEditing() &&
      source.nodeName !== 'INPUT'
    ) {
      if (
        evt.keyCode === 224 /* FF */ ||
        (!Client.IS_MAC && evt.keyCode === 17) /* Control */ ||
        (Client.IS_MAC &&
          (evt.keyCode === 91 || evt.keyCode === 93)) /* Left/Right Meta */
      ) {
        // Cannot use parentNode for check in IE
        if (!restoreFocus) {
          // Avoid autoscroll but allow handling of events
          textInput.style.position = 'absolute';
          textInput.style.left = `${graph.container.scrollLeft + 10}px`;
          textInput.style.top = `${graph.container.scrollTop + 10}px`;
          graph.container.appendChild(textInput);

          restoreFocus = true;
          textInput.focus();
          textInput.select();
        }
      }
    }
  });

  // Restores focus on graph this.el and removes text input from DOM
  InternalEvent.addListener(document, 'keyup', function (evt) {
    if (
      restoreFocus &&
      (evt.keyCode === 224 /* FF */ ||
        evt.keyCode === 17 /* Control */ ||
        evt.keyCode === 91 ||
        evt.keyCode === 93) /* Meta */
    ) {
      restoreFocus = false;

      if (!graph.isEditing()) {
        graph.container.focus();
      }

      textInput.parentNode.removeChild(textInput);
    }
  });

  // Inserts the XML for the given cells into the text input for copy
  const copyCells = function (graph, cells) {
    if (cells.length > 0) {
      const clones = graph.cloneCells(cells);

      // Checks for orphaned relative children and makes absolute
      for (let i = 0; i < clones.length; i++) {
        const state = graph.view.getState(cells[i]);

        if (state != null) {
          const geo = clones[i].getGeometry();

          if (geo != null && geo.relative) {
            geo.relative = false;
            geo.x = state.x / state.view.scale - state.view.translate.x;
            geo.y = state.y / state.view.scale - state.view.translate.y;
          }
        }
      }

      textInput.value = Clipboard.cellsToString(clones);
    }

    textInput.select();
    lastPaste = textInput.value;
  };

  // Handles copy event by putting XML for current selection into text input
  InternalEvent.addListener(textInput, 'copy', (evt) => {
    if (graph.isEnabled() && !graph.isSelectionEmpty()) {
      copyCells(
        graph,
        utils.sortCells(graph.model.getTopmostCells(graph.getSelectionCells()))
      );
      dx = 0;
      dy = 0;
    }
  });

  // Handles cut event by removing cells putting XML into text input
  InternalEvent.addListener(textInput, 'cut', (evt) => {
    if (graph.isEnabled() && !graph.isSelectionEmpty()) {
      copyCells(graph, graph.removeCells());
      dx = -gs;
      dy = -gs;
    }
  });

  // Merges XML into existing graph and layers
  const importXml = function (xml, dx, dy) {
    dx = dx != null ? dx : 0;
    dy = dy != null ? dy : 0;
    let cells = [];

    try {
      const doc = utils.parseXml(xml);
      const node = doc.documentElement;

      if (node != null) {
        const model = new GraphModel();
        const codec = new Codec(node.ownerDocument);
        codec.decode(node, model);

        const childCount = model.getRoot().getChildCount();
        const targetChildCount = graph.model.getRoot().getChildCount();

        // Merges existing layers and adds new layers
        graph.model.beginUpdate();
        try {
          for (let i = 0; i < childCount; i++) {
            let parent = model.getRoot().getChildAt(i);

            // Adds cells to existing layers if not locked
            if (targetChildCount > i) {
              // Inserts into active layer if only one layer is being pasted
              const target =
                childCount === 1
                  ? graph.getDefaultParent()
                  : graph.model.getRoot().getChildAt(i);

              if (!graph.isCellLocked(target)) {
                const children = parent.getChildren();
                cells = cells.concat(graph.importCells(children, dx, dy, target));
              }
            } else {
              // Delta is non cascading, needs separate move for layers
              parent = graph.importCells([parent], 0, 0, graph.model.getRoot())[0];
              const children = parent.getChildren();
              graph.moveCells(children, dx, dy);
              cells = cells.concat(children);
            }
          }
        } finally {
          graph.model.endUpdate();
        }
      }
    } catch (e) {
      alert(e);
      throw e;
    }

    return cells;
  };

  // Parses and inserts XML into graph
  const pasteText = function (text) {
    const xml = stringUtils.trim(text);
    const x = graph.container.scrollLeft / graph.view.scale - graph.view.translate.x;
    const y = graph.container.scrollTop / graph.view.scale - graph.view.translate.y;

    if (xml.length > 0) {
      if (lastPaste !== xml) {
        lastPaste = xml;
        dx = 0;
        dy = 0;
      } else {
        dx += gs;
        dy += gs;
      }

      // Standard paste via control-v
      if (xml.substring(0, 14) === '<Transactions>') {
        graph.setSelectionCells(importXml(xml, dx, dy));
        graph.scrollCellToVisible(graph.getSelectionCell());
      }
    }
  };

  // Function to fetch text from paste events
  const extractGraphModelFromEvent = function (evt) {
    let data = null;

    if (evt != null) {
      const provider = evt.dataTransfer != null ? evt.dataTransfer : evt.clipboardData;

      if (provider != null) {
        data =
          provider.types.indexOf('text/html') >= 0 ? provider.getData('text/html') : null;

        if (provider.types.indexOf('text/plain') && (data == null || data.length === 0)) {
          data = provider.getData('text/plain');
        }
      }
    }

    return data;
  };

  // Handles paste event by parsing and inserting XML
  InternalEvent.addListener(textInput, 'paste', function (evt) {
    // Clears existing contents before paste - should not be needed
    // because all text is selected, but doesn't hurt since the
    // actual pasting of the new text is delayed in all cases.
    textInput.value = '';

    if (graph.isEnabled()) {
      const xml = extractGraphModelFromEvent(evt);

      if (xml != null && xml.length > 0) {
        pasteText(xml);
      } else {
        // Timeout for new value to appear
        window.setTimeout(() => {
          pasteText(textInput.value);
        }, 0);
      }
    }

    textInput.select();
  });

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Hello,',
      position: [20, 20],
      size: [80, 30],
    });
    const v2 = graph.insertVertex({
      parent,
      value: 'World!',
      position: [200, 150],
      size: [80, 30],
    });
    const e1 = graph.insertEdge({ parent, source: v1, target: v2 });
  });

  return container;
};

export const Default = Template.bind({});
