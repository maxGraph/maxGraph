/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import Editor from './Editor';
import MaxWindow from '../gui/MaxWindow';
import ObjectCodec from '../serialization/ObjectCodec';
import CodecRegistry from '../serialization/CodecRegistry';
import { getChildNodes } from '../util/domUtils';
import Codec from 'src/serialization/Codec';
import Translations from 'src/util/Translations';
import Client from 'src/Client';

/**
 * Codec for <Editor>s. This class is created and registered
 * dynamically at load time and used implicitly via <Codec>
 * and the <CodecRegistry>.
 *
 * Transient Fields:
 *
 * - modified
 * - lastSnapshot
 * - ignoredChanges
 * - undoManager
 * - graphContainer
 * - toolbarContainer
 */
class EditorCodec extends ObjectCodec {
  constructor() {
    super(new Editor(), [
      'modified',
      'lastSnapshot',
      'ignoredChanges',
      'undoManager',
      'graphContainer',
      'toolbarContainer',
    ]);
  }

  /**
   * Decodes the ui-part of the configuration node by reading
   * a sequence of the following child nodes and attributes
   * and passes the control to the default decoding mechanism:
   *
   * Child Nodes:
   *
   * stylesheet - Adds a CSS stylesheet to the document.
   * resource - Adds the basename of a resource bundle.
   * add - Creates or configures a known UI element.
   *
   * These elements may appear in any order given that the
   * graph UI element is added before the toolbar element
   * (see Known Keys).
   *
   * Attributes:
   *
   * as - Key for the UI element (see below).
   * element - ID for the element in the document.
   * style - CSS style to be used for the element or window.
   * x - X coordinate for the new window.
   * y - Y coordinate for the new window.
   * width - Width for the new window.
   * height - Optional height for the new window.
   * name - Name of the stylesheet (absolute/relative URL).
   * basename - Basename of the resource bundle (see <mxResources>).
   *
   * The x, y, width and height attributes are used to create a new
   * <MaxWindow> if the element attribute is not specified in an add
   * node. The name and basename are only used in the stylesheet and
   * resource nodes, respectively.
   *
   * Known Keys:
   *
   * graph - Main graph element (see <Editor.setGraphContainer>).
   * title - Title element (see <Editor.setTitleContainer>).
   * toolbar - Toolbar element (see <Editor.setToolbarContainer>).
   * status - Status bar element (see <Editor.setStatusContainer>).
   *
   * Example:
   *
   * ```javascript
   * <ui>
   *   <stylesheet name="css/process.css"/>
   *   <resource basename="resources/app"/>
   *   <add as="graph" element="graph"
   *     style="left:70px;right:20px;top:20px;bottom:40px"/>
   *   <add as="status" element="status"/>
   *   <add as="toolbar" x="10" y="20" width="54"/>
   * </ui>
   * ```
   */
  afterDecode(dec: Codec, node: Element, obj: any) {
    // Assigns the specified templates for edges
    const defaultEdge = node.getAttribute('defaultEdge');

    if (defaultEdge != null) {
      node.removeAttribute('defaultEdge');
      obj.defaultEdge = obj.templates[defaultEdge];
    }

    // Assigns the specified templates for groups
    const defaultGroup = node.getAttribute('defaultGroup');

    if (defaultGroup != null) {
      node.removeAttribute('defaultGroup');
      obj.defaultGroup = obj.templates[defaultGroup];
    }
    return obj;
  }

  /**
   * Overrides decode child to handle special child nodes.
   */
  decodeChild(dec: Codec, child: Element, obj: any) {
    if (child.nodeName === 'Array') {
      const role = child.getAttribute('as');

      if (role === 'templates') {
        this.decodeTemplates(dec, child, obj);
        return;
      }
    } else if (child.nodeName === 'ui') {
      this.decodeUi(dec, child, obj);
      return;
    }
    super.decodeChild.apply(this, [dec, child, obj]);
  }

  /**
   * Decodes the ui elements from the given node.
   */
  decodeUi(dec: Codec, node: Element, editor: Editor) {
    let tmp = <Element>node.firstChild;
    while (tmp != null) {
      if (tmp.nodeName === 'add') {
        const as = <string>tmp.getAttribute('as');
        const elt = tmp.getAttribute('element');
        const style = tmp.getAttribute('style');
        let element = null;

        if (elt != null) {
          element = document.getElementById(elt);

          if (element != null && style != null) {
            element.style.cssText += `;${style}`;
          }
        } else {
          const x = parseInt(<string>tmp.getAttribute('x'));
          const y = parseInt(<string>tmp.getAttribute('y'));
          const width = tmp.getAttribute('width') || null;
          const height = tmp.getAttribute('height') || null;

          // Creates a new window around the element
          element = document.createElement('div');
          if (style != null) {
            element.style.cssText = style;
          }

          const wnd = new MaxWindow(
            Translations.get(as) || as,
            element,
            x,
            y,
            width ? parseInt(width) : null,
            height ? parseInt(height) : null,
            false,
            true
          );
          wnd.setVisible(true);
        }

        // TODO: Make more generic
        if (as === 'graph') {
          editor.setGraphContainer(element);
        } else if (as === 'toolbar') {
          editor.setToolbarContainer(element);
        } else if (as === 'title') {
          editor.setTitleContainer(element);
        } else if (as === 'status') {
          editor.setStatusContainer(element);
        } else if (as === 'map') {
          editor.setMapContainer(element);
        }
      } else if (tmp.nodeName === 'resource') {
        Translations.add(<string>tmp.getAttribute('basename'));
      } else if (tmp.nodeName === 'stylesheet') {
        Client.link('stylesheet', <string>tmp.getAttribute('name'));
      }

      tmp = <Element>tmp.nextSibling;
    }
  }

  /**
   * Decodes the cells from the given node as templates.
   */
  decodeTemplates(dec: Codec, node: Element, editor: Editor) {
    if (editor.templates == null) {
      editor.templates = [];
    }

    const children = <Element[]>getChildNodes(node);
    for (let j = 0; j < children.length; j++) {
      const name = <string>children[j].getAttribute('as');
      let child = <Element | null>children[j].firstChild;

      while (child != null && child.nodeType !== 1) {
        child = <Element | null>child.nextSibling;
      }

      if (child != null) {
        // LATER: Only single cells means you need
        // to group multiple cells within another
        // cell. This should be changed to support
        // arrays of cells, or the wrapper must
        // be automatically handled in this class.
        editor.templates[name] = dec.decodeCell(child);
      }
    }
  }
}

// CodecRegistry.register(new EditorCodec());
export default EditorCodec;
