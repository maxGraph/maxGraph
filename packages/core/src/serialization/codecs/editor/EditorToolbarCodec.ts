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
import { EditorToolbar } from '../../../editor/EditorToolbar.js';
import type Codec from '../../Codec.js';
import type Editor from '../../../editor/Editor.js';
import { GlobalConfig } from '../../../util/config.js';
import { convertPoint } from '../../../util/styleUtils.js';
import { getClientX, getClientY } from '../../../util/EventUtils.js';
import InternalEvent from '../../../view/event/InternalEvent.js';
import { getChildNodes, getTextContent } from '../../../util/domUtils.js';
import { doEval, isElement } from '../../../internal/utils.js';
import { translate } from '../../../internal/i18n-utils.js';

type HTMLOptionElementWithCellStyle = HTMLOptionElement & { cellStyle?: string | null };

/**
 * Custom codec for configuring {@link EditorToolbar}s.
 *
 * This class is created and registered dynamically at load time and used implicitly via {@link Codec} and the {@link CodecRegistry}.
 *
 * This codec only reads configuration data for existing toolbars handlers, it does not encode or create toolbars.
 *
 * @category Serialization with Codecs
 */
export class EditorToolbarCodec extends ObjectCodec {
  constructor() {
    super(new EditorToolbar());
  }

  /**
   * Returns `null`.
   */
  encode(_enc: any, _obj: any) {
    return null;
  }

  /**
   * Reads a sequence of the following child nodes and attributes:
   *
   * Child Nodes:
   *
   * add - Adds a new item to the toolbar. See below for attributes.
   * separator - Adds a vertical separator. No attributes.
   * hr - Adds a horizontal separator. No attributes.
   * br - Adds a linefeed. No attributes.
   *
   * Attributes:
   *
   * as - Resource key for the label.
   * action - Name of the action to execute in enclosing editor.
   * mode - Mode name (see below).
   * template - Template name for cell insertion.
   * style - Optional style to override the template style.
   * icon - Icon (relative/absolute URL).
   * pressedIcon - Optional icon for pressed state (relative/absolute URL).
   * id - Optional ID to be used for the created DOM element.
   * toggle - Optional 0 or 1 to disable toggling of the element. Default is 1 (true).
   *
   * The action, mode and template attributes are mutually exclusive. The style can only be used with the template attribute.
   * The add node may contain another sequence of add nodes with "as" and action attributes to create a combo box in the toolbar.
   * If the icon is specified then a list of the child node is expected to have its template attribute set and the action is ignored instead.
   *
   * Nodes with a specified template may define a function to be used for inserting the cloned template into the graph.
   * Here is an example of such a node:
   *
   * ```javascript
   * <add as="Swimlane" template="swimlane" icon="images/swimlane.gif"><![CDATA[
   *   function (editor, cell, evt, targetCell)
   *   {
   *     let pt = mxUtils.convertPoint(
   *       editor.graph.container, mxEvent.getClientX(evt),
   *         mxEvent.getClientY(evt));
   *     return editor.addVertex(targetCell, cell, pt.x, pt.y);
   *   }
   * ]]></add>
   * ```
   *
   * In the above function, editor is the enclosing {@link Editor} instance, cell is the clone of the template, evt is the mouse event that represents the
   * drop and targetCell is the cell under the mouse pointer where the drop occurred. The targetCell is retrieved using {@link AbstractGraph.getCellAt}.
   *
   * Furthermore, nodes with the mode attribute may define a function to be executed upon selection of the respective toolbar icon. In the
   * example below, the default edge style is set when this specific
   * connect-mode is activated:
   *
   * ```javascript
   * <add as="connect" mode="connect"><![CDATA[
   *   function (editor)
   *   {
   *     if (editor.defaultEdge != null)
   *     {
   *       editor.defaultEdge.style = 'straightEdge';
   *     }
   *   }
   * ]]></add>
   * ```
   *
   * Both functions require {@link allowEval} to be set to `true`.
   *
   * Modes:
   *
   * select - Left mouse button used for rubberband- & cell-selection.
   * connect - Allows connecting vertices by inserting new edges.
   * pan - Disables selection and switches to panning on the left button.
   *
   * Example:
   *
   * To add items to the toolbar:
   *
   * ```javascript
   * <EditorToolbar as="toolbar">
   *   <add as="save" action="save" icon="images/save.gif"/>
   *   <br/><hr/>
   *   <add as="select" mode="select" icon="images/select.gif"/>
   *   <add as="connect" mode="connect" icon="images/connect.gif"/>
   * </EditorToolbar>
   * ```
   */
  decode(dec: Codec, _node: Element, into: EditorToolbar) {
    if (into != null) {
      const editor: Editor = into.editor!;
      let node: Element | null = <Element | null>_node.firstChild;

      while (node != null) {
        if (isElement(node)) {
          if (!this.processInclude(dec, node, into)) {
            if (node.nodeName === 'separator') {
              into.addSeparator();
            } else if (node.nodeName === 'br') {
              into.toolbar!.addBreak();
            } else if (node.nodeName === 'hr') {
              into.toolbar!.addLine();
            } else if (node.nodeName === 'add') {
              let as = <string>node.getAttribute('as');
              as = translate(as) || as;
              const icon = node.getAttribute('icon');
              const pressedIcon = node.getAttribute('pressedIcon');
              const action = node.getAttribute('action');
              const mode = node.getAttribute('mode');
              const template = node.getAttribute('template');
              const toggle = node.getAttribute('toggle') != '0';
              const text = getTextContent(<Text>(<unknown>node));
              let elt = null;
              let funct: any;

              if (action != null) {
                elt = into.addItem(as, icon, action, pressedIcon);
              } else if (mode != null) {
                funct = EditorToolbarCodec.allowEval ? doEval(text) : null;
                elt = into.addMode(as, icon!, mode, pressedIcon, funct);
              } else if (template != null || (text != null && text.length > 0)) {
                let cell = template ? editor.templates[template] : null;
                const style = node.getAttribute('style');

                if (cell != null && style != null) {
                  cell = editor.graph.cloneCell(cell);
                  cell.setStyle(style);
                }

                let insertFunction = null;

                if (text != null && text.length > 0 && EditorToolbarCodec.allowEval) {
                  insertFunction = doEval(text);
                }

                elt = into.addPrototype(
                  as,
                  icon,
                  cell,
                  pressedIcon!,
                  insertFunction,
                  toggle
                );
              } else {
                const children = getChildNodes(node);

                if (children.length > 0) {
                  if (icon == null) {
                    const combo = into.addActionCombo(as);

                    for (let i = 0; i < children.length; i += 1) {
                      const child = <Element>children[i];

                      if (child.nodeName === 'separator') {
                        into.addOption(combo, '---');
                      } else if (child.nodeName === 'add') {
                        const lab = child.getAttribute('as')!;
                        const act = child.getAttribute('action')!;
                        into.addActionOption(combo, lab, act);
                      }
                    }
                  } else {
                    const select: HTMLSelectElement = into.addCombo();

                    const create = () => {
                      const template = editor.templates[select.value];

                      if (template != null) {
                        const clone = template.clone();
                        const style = (
                          select.options[
                            select.selectedIndex
                          ] as HTMLOptionElementWithCellStyle
                        ).cellStyle;

                        if (style) {
                          clone.setStyle(style);
                        }

                        return clone;
                      }
                      GlobalConfig.logger.warn(`Template ${template} not found`);

                      return null;
                    };

                    const img = into.addPrototype(as, icon, create, null!, null!, toggle);

                    // Selects the toolbar icon if a selection change is made in the corresponding combobox.
                    InternalEvent.addListener(select, 'change', () => {
                      into.toolbar!.selectMode(img, (evt: MouseEvent) => {
                        const pt = convertPoint(
                          editor.graph.container,
                          getClientX(evt),
                          getClientY(evt)
                        );

                        return editor.addVertex(null, funct(), pt.x, pt.y);
                      });

                      into.toolbar!.noReset = false;
                    });

                    // Adds the entries to the combobox
                    for (let i = 0; i < children.length; i += 1) {
                      const child = <Element>children[i];

                      if (child.nodeName === 'separator') {
                        into.addOption(select, '---');
                      } else if (child.nodeName === 'add') {
                        const lab = child.getAttribute('as')!;
                        const tmp = child.getAttribute('template');
                        const option = into.addOption(
                          select,
                          lab,
                          tmp || template
                        ) as HTMLOptionElementWithCellStyle;
                        option.cellStyle = child.getAttribute('style');
                      }
                    }
                  }
                }
              }

              // Assigns an ID to the created element to access it later.
              if (elt != null) {
                const id = node.getAttribute('id');

                if (id != null && id.length > 0) {
                  elt.setAttribute('id', id);
                }
              }
            }
          }
        }

        node = <Element | null>node.nextSibling;
      }
    }
    return into;
  }
}
