/*
Copyright 2023-present The maxGraph project Contributors

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

import ObjectCodec from '../../ObjectCodec.js';
import Editor from '../../../editor/Editor.js';
import type Codec from '../../Codec.js';
import MaxWindow from '../../../gui/MaxWindow.js';
import { addLinkToHead, getChildNodes } from '../../../util/domUtils.js';
import { GlobalConfig } from '../../../util/config.js';
import { translate } from '../../../internal/i18n-utils.js';

/**
 * Codec for {@link Editor}s.
 *
 * This class is created and registered dynamically at load time and used implicitly via {@link Codec} and the {@link CodecRegistry}.
 *
 * Transient Fields:
 *
 * - modified
 * - lastSnapshot
 * - ignoredChanges
 * - undoManager
 * - graphContainer
 * - toolbarContainer
 *
 * @category Serialization with Codecs
 */
export class EditorCodec extends ObjectCodec {
  constructor() {
    const __dummy: any = undefined;
    super(new Editor(__dummy), [
      'modified',
      'lastSnapshot',
      'ignoredChanges',
      'undoManager',
      'graphContainer',
      'toolbarContainer',
    ] as Array<keyof Editor>);
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
   * basename - Basename of the resource bundle (see {@link Resources}).
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
  override afterDecode(_dec: Codec, node: Element, obj: Editor) {
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
  override decodeChild(dec: Codec, child: Element, obj: Editor) {
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
  decodeUi(_dec: Codec, node: Element, editor: Editor) {
    let tmp = <Element>node.firstChild;
    while (tmp != null) {
      switch (tmp.nodeName) {
        case 'add': {
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
            const x = Number.parseInt(<string>tmp.getAttribute('x'));
            const y = Number.parseInt(<string>tmp.getAttribute('y'));
            const width = tmp.getAttribute('width') || null;
            const height = tmp.getAttribute('height') || null;

            // Creates a new window around the element
            element = document.createElement('div');
            if (style != null) {
              element.style.cssText = style;
            }

            const wnd = new MaxWindow(
              translate(as) || as,
              element,
              x,
              y,
              width ? Number.parseInt(width) : null,
              height ? Number.parseInt(height) : null,
              false,
              true
            );
            wnd.setVisible(true);
          }

          // TODO: Make more generic
          switch (as) {
            case 'graph': {
              editor.setGraphContainer(element);
              break;
            }
            case 'toolbar': {
              editor.setToolbarContainer(element);
              break;
            }
            case 'title': {
              editor.setTitleContainer(element);
              break;
            }
            case 'status': {
              editor.setStatusContainer(element);
              break;
            }
            case 'map': {
              throw new Error('Unimplemented');
            }
            // No default
          }

          break;
        }
        case 'resource': {
          GlobalConfig.i18n.addResource(tmp.getAttribute('basename'));
          break;
        }
        case 'stylesheet': {
          addLinkToHead('stylesheet', tmp.getAttribute('name')!);
          break;
        }
        // No default
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
