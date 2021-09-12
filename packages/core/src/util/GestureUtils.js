import DragSource from '../view/drag_drop/DragSource';
import Point from '../view/geometry/Point';
import { TOOLTIP_VERTICAL_OFFSET } from './Constants';

/**
 * Function: makeDraggable
 *
 * Configures the given DOM element to act as a drag source for the
 * specified graph. Returns a a new <mxDragSource>. If
 * <mxDragSource.guideEnabled> is enabled then the x and y arguments must
 * be used in funct to match the preview location.
 *
 * Example:
 *
 * (code)
 * let funct = (graph, evt, cell, x, y)=>
 * {
 *   if (graph.canImportCell(cell))
 *   {
 *     let parent = graph.getDefaultParent();
 *     let vertex = null;
 *
 *     graph.getModel().beginUpdate();
 *     try
 *     {
 *        vertex = graph.insertVertex(parent, null, 'Hello', x, y, 80, 30);
 *     }
 *     finally
 *     {
 *       graph.getModel().endUpdate();
 *     }
 *
 *     graph.setSelectionCell(vertex);
 *   }
 * }
 *
 * let img = document.createElement('img');
 * img.setAttribute('src', 'editors/images/rectangle.gif');
 * img.style.position = 'absolute';
 * img.style.left = '0px';
 * img.style.top = '0px';
 * img.style.width = '16px';
 * img.style.height = '16px';
 *
 * let dragImage = img.cloneNode(true);
 * dragImage.style.width = '32px';
 * dragImage.style.height = '32px';
 * mxUtils.makeDraggable(img, graph, funct, dragImage);
 * document.body.appendChild(img);
 * (end)
 *
 * Parameters:
 *
 * element - DOM element to make draggable.
 * graphF - <mxGraph> that acts as the drop target or a function that takes a
 * mouse event and returns the current <mxGraph>.
 * funct - Function to execute on a successful drop.
 * dragElement - Optional DOM node to be used for the drag preview.
 * dx - Optional horizontal offset between the cursor and the drag
 * preview.
 * dy - Optional vertical offset between the cursor and the drag
 * preview.
 * autoscroll - Optional boolean that specifies if autoscroll should be
 * used. Default is mxGraph.autoscroll.
 * scalePreview - Optional boolean that specifies if the preview element
 * should be scaled according to the graph scale. If this is true, then
 * the offsets will also be scaled. Default is false.
 * highlightDropTargets - Optional boolean that specifies if dropTargets
 * should be highlighted. Default is true.
 * getDropTarget - Optional function to return the drop target for a given
 * location (x, y). Default is mxGraph.getCellAt.
 */
export const makeDraggable = (
  element,
  graphF,
  funct,
  dragElement,
  dx,
  dy,
  autoscroll,
  scalePreview,
  highlightDropTargets,
  getDropTarget
) => {
  const dragSource = new DragSource(element, funct);
  dragSource.dragOffset = new Point(
    dx != null ? dx : 0,
    dy != null ? dy : TOOLTIP_VERTICAL_OFFSET
  );
  dragSource.autoscroll = autoscroll;

  // Cannot enable this by default. This needs to be enabled in the caller
  // if the funct argument uses the new x- and y-arguments.
  dragSource.setGuidesEnabled(false);

  if (highlightDropTargets != null) {
    dragSource.highlightDropTargets = highlightDropTargets;
  }

  // Overrides function to find drop target cell
  if (getDropTarget != null) {
    dragSource.getDropTarget = getDropTarget;
  }

  // Overrides function to get current graph
  dragSource.getGraphForEvent = (evt) => {
    return typeof graphF === 'function' ? graphF(evt) : graphF;
  };

  // Translates switches into dragSource customizations
  if (dragElement != null) {
    dragSource.createDragElement = () => {
      return dragElement.cloneNode(true);
    };

    if (scalePreview) {
      dragSource.createPreviewElement = (graph) => {
        const elt = dragElement.cloneNode(true);

        const w = parseInt(elt.style.width);
        const h = parseInt(elt.style.height);
        elt.style.width = `${Math.round(w * graph.view.scale)}px`;
        elt.style.height = `${Math.round(h * graph.view.scale)}px`;

        return elt;
      };
    }
  }

  return dragSource;
};
