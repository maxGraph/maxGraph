/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2015, JGraph Ltd
Copyright (c) 2006-2015, Gaudenz Alder

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

import { getValue } from '../../util/Utils';
import { getAlignmentAsPoint, setPrefixedStyle } from '../../util/styleUtils';
import Rectangle from '../geometry/Rectangle';
import InternalEvent from '../event/InternalEvent';
import Client from '../../Client';
import {
  ABSOLUTE_LINE_HEIGHT,
  ALIGN,
  DEFAULT_FONTFAMILY,
  DEFAULT_FONTSIZE,
  DEFAULT_TEXT_DIRECTION,
  DIALECT,
  FONT,
  LINE_HEIGHT,
  NONE,
  WORD_WRAP,
} from '../../util/Constants';
import TextShape from '../geometry/node/TextShape';
import Cell from '../cell/Cell';
import InternalMouseEvent from '../event/InternalMouseEvent';
import CellState from '../cell/CellState';
import Shape from '../geometry/Shape';
import { clearSelection, extractTextWithWhitespace, isNode } from '../../util/domUtils';
import {
  getStringValue,
  htmlEntities,
  replaceTrailingNewlines,
} from '../../util/StringUtils';
import {
  getSource,
  isConsumed,
  isControlDown,
  isMetaDown,
  isShiftDown,
} from '../../util/EventUtils';
import EventSource from '../event/EventSource';

import type { Graph } from '../Graph';
import type { GraphPlugin } from '../../types';
import TooltipHandler from './TooltipHandler';

/**
 * In-place editor for the graph. To control this editor, use
 * {@link Graph#invokesStopCellEditing}, {@link Graph#enterStopsCellEditing} and
 * {@link Graph#escapeEnabled}. If {@link Graph#enterStopsCellEditing} is true then
 * ctrl-enter or shift-enter can be used to create a linefeed. The F2 and
 * escape keys can always be used to stop editing.
 *
 * To customize the location of the textbox in the graph, override
 * <getEditorBounds> as follows:
 *
 * ```javascript
 * graph.cellEditor.getEditorBounds = (state)=>
 * {
 *   let result = getEditorBounds.apply(this, arguments);
 *
 *   if (this.graph.getDataModel().isEdge(state.cell))
 *   {
 *     result.x = state.getCenterX() - result.width / 2;
 *     result.y = state.getCenterY() - result.height / 2;
 *   }
 *
 *   return result;
 * };
 * ```
 *
 * Note that this hook is only called if <autoSize> is false. If <autoSize> is true,
 * then {@link Shape#getLabelBounds} is used to compute the current bounds of the textbox.
 *
 * The textarea uses the mxCellEditor CSS class. You can modify this class in
 * your custom CSS. Note: You should modify the CSS after loading the client
 * in the page.
 *
 * Example:
 *
 * To only allow numeric input in the in-place editor, use the following code.
 *
 * ```javascript
 * let text = graph.cellEditor.textarea;
 *
 * mxEvent.addListener(text, 'keydown', function (evt)
 * {
 *   if (!(evt.keyCode >= 48 && evt.keyCode <= 57) &&
 *       !(evt.keyCode >= 96 && evt.keyCode <= 105))
 *   {
 *     mxEvent.consume(evt);
 *   }
 * });
 * ```
 *
 * Placeholder:
 *
 * To implement a placeholder for cells without a label, use the
 * <emptyLabelText> variable.
 *
 * Resize in Chrome:
 *
 * Resize of the textarea is disabled by default. If you want to enable
 * this feature extend <init> and set this.textarea.style.resize = ''.
 *
 * To start editing on a key press event, the container of the graph
 * should have focus or a focusable parent should be used to add the
 * key press handler as follows.
 *
 * ```javascript
 * mxEvent.addListener(graph.container, 'keypress', mxUtils.bind(this, (evt)=>
 * {
 *   if (!graph.isEditing() && !graph.isSelectionEmpty() && evt.which !== 0 &&
 *       !mxEvent.isAltDown(evt) && !mxEvent.isControlDown(evt) && !mxEvent.isMetaDown(evt))
 *   {
 *     graph.startEditing();
 *
 *     if (Client.IS_FF)
 *     {
 *       graph.cellEditor.textarea.value = String.fromCharCode(evt.which);
 *     }
 *   }
 * }));
 * ```
 *
 * To allow focus for a DIV, and hence to receive key press events, some browsers
 * require it to have a valid tabindex attribute. In this case the following
 * code may be used to keep the container focused.
 *
 * ```javascript
 * let graphFireMouseEvent = graph.fireMouseEvent;
 * graph.fireMouseEvent = (evtName, me, sender)=>
 * {
 *   if (evtName == mxEvent.MOUSE_DOWN)
 *   {
 *     this.container.focus();
 *   }
 *
 *   graphFireMouseEvent.apply(this, arguments);
 * };
 * ```
 *
 * @category Plugin
 */
class CellEditorHandler implements GraphPlugin {
  static pluginId = 'CellEditorHandler';

  constructor(graph: Graph) {
    this.graph = graph;

    // Stops editing after zoom changes
    this.zoomHandler = () => {
      if (this.graph.isEditing()) {
        this.resize();
      }
    };

    // Handling of deleted cells while editing
    this.changeHandler = (sender: EventSource) => {
      if (this.editingCell && !this.graph.getView().getState(this.editingCell, false)) {
        this.stopEditing(true);
      }
    };

    this.graph.getView().addListener(InternalEvent.SCALE, this.zoomHandler);
    this.graph.getView().addListener(InternalEvent.SCALE_AND_TRANSLATE, this.zoomHandler);
    this.graph.getDataModel().addListener(InternalEvent.CHANGE, this.changeHandler);
  }

  // TODO: Document me!
  changeHandler: (sender: EventSource) => void;

  zoomHandler: () => void;

  clearOnChange = false;

  bounds: Rectangle | null = null;

  resizeThread: number | null = null;

  textDirection: '' | 'auto' | 'ltr' | 'rtl' | null = null;

  /**
   * Reference to the enclosing {@link Graph}.
   */
  graph: Graph;

  /**
   * Holds the DIV that is used for text editing. Note that this may be null before the first
   * edit. Instantiated in <init>.
   */
  textarea: HTMLElement | null = null;

  /**
   * Reference to the <Cell> that is currently being edited.
   */
  // editingCell: mxCell;
  editingCell: Cell | null = null;

  /**
   * Reference to the event that was used to start editing.
   */
  // trigger: MouseEvent;
  trigger: InternalMouseEvent | MouseEvent | null = null;

  /**
   * Specifies if the label has been modified.
   */
  // modified: boolean;
  modified = false;

  /**
   * Specifies if the textarea should be resized while the text is being edited.
   * Default is true.
   */
  // autoSize: boolean;
  autoSize = true;

  /**
   * Specifies if the text should be selected when editing starts. Default is
   * true.
   */
  // selectText: boolean;
  selectText = true;

  /**
   * Text to be displayed for empty labels. Default is '' or '<br>' in Firefox as
   * a workaround for the missing cursor bug for empty content editable. This can
   * be set to eg. "[Type Here]" to easier visualize editing of empty labels. The
   * value is only displayed before the first keystroke and is never used as the
   * actual editing value.
   */
  // emptyLabelText: '<br>' | '';
  emptyLabelText: string = Client.IS_FF ? '<br>' : '';

  /**
   * If true, pressing the escape key will stop editing and not accept the new
   * value. Change this to false to accept the new value on escape, and cancel
   * editing on Shift+Escape instead. Default is true.
   */
  // escapeCancelsEditing: boolean;
  escapeCancelsEditing = true;

  /**
   * Reference to the label DOM node that has been hidden.
   */
  // textNode: string;
  textNode: SVGGElement | null = null;

  /**
   * Specifies the zIndex for the textarea. Default is 5.
   */
  // zIndex: number;
  zIndex = 5;

  /**
   * Defines the minimum width and height to be used in <resize>. Default is 0x20px.
   */
  // minResize: mxRectangle;
  minResize: Rectangle = new Rectangle(0, 20);

  /**
   * Correction factor for word wrapping width. Default is 2 in quirks, 0 in IE
   * 11 and 1 in all other browsers and modes.
   */
  // wordWrapPadding: 2 | 1 | 0;
  wordWrapPadding = 0;

  /**
   * If <focusLost> should be called if <textarea> loses the focus. Default is false.
   */
  // blurEnabled: boolean;
  blurEnabled = false;

  /**
   * Holds the initial editing value to check if the current value was modified.
   */
  // initialValue: string;
  initialValue: string | null = null;

  /**
   * Holds the current temporary horizontal alignment for the cell style. If this
   * is modified then the current text alignment is changed and the cell style is
   * updated when the value is applied.
   */
  align: string | null = null;

  /**
   * Creates the <textarea> and installs the event listeners. The key handler
   * updates the {@link odified} state.
   */
  init() {
    this.textarea = document.createElement('div');
    this.textarea.className = 'mxCellEditor mxPlainTextEditor';
    this.textarea.contentEditable = String(true);

    // Workaround for selection outside of DIV if height is 0
    if (Client.IS_GC) {
      this.textarea.style.minHeight = '1em';
    }

    this.textarea.style.position = 'relative';
    this.installListeners(this.textarea);
  }

  /**
   * Called in <stopEditing> if cancel is false to invoke {@link Graph#labelChanged}.
   */
  // applyValue(state: CellState, value: string): void;
  applyValue(state: CellState, value: any) {
    this.graph.labelChanged(state.cell, value, <InternalMouseEvent>this.trigger);
  }

  /**
   * Sets the temporary horizontal alignment for the current editing session.
   */
  setAlign(align: string) {
    if (this.textarea) {
      this.textarea.style.textAlign = align;
    }

    this.align = align;
    this.resize();
  }

  /**
   * Gets the initial editing value for the given cell.
   */
  getInitialValue(state: CellState, trigger: MouseEvent | null) {
    let result = htmlEntities(this.graph.getEditingValue(state.cell, trigger), false);
    result = replaceTrailingNewlines(result, '<div><br></div>');
    return result.replace(/\n/g, '<br>');
  }

  /**
   * Returns the current editing value.
   */
  getCurrentValue(state: CellState) {
    if (!this.textarea) return null;

    return extractTextWithWhitespace(<Element[]>Array.from(this.textarea.childNodes));
  }

  /**
   * Returns true if <escapeCancelsEditing> is true and shift, control and meta
   * are not pressed.
   */
  // isCancelEditingKeyEvent(evt: Event): boolean;
  isCancelEditingKeyEvent(evt: MouseEvent | KeyboardEvent) {
    return (
      this.escapeCancelsEditing ||
      isShiftDown(<MouseEvent>(<unknown>evt)) ||
      isControlDown(<MouseEvent>(<unknown>evt)) ||
      isMetaDown(<MouseEvent>(<unknown>evt))
    );
  }

  /**
   * Installs listeners for focus, change and standard key event handling.
   */
  // installListeners(elt: Element): void;
  installListeners(elt: HTMLElement) {
    // Applies value if text is dragged
    // LATER: Gesture mouse events ignored for starting move
    InternalEvent.addListener(elt, 'dragstart', (evt: Event) => {
      this.graph.stopEditing(false);
      InternalEvent.consume(evt);
    });

    // Applies value if focus is lost
    InternalEvent.addListener(elt, 'blur', (evt: Event) => {
      if (this.blurEnabled) {
        this.focusLost();
      }
    });

    // Updates modified state and handles placeholder text
    InternalEvent.addListener(elt, 'keydown', (evt: KeyboardEvent) => {
      if (!isConsumed(evt)) {
        if (this.isStopEditingEvent(evt)) {
          this.graph.stopEditing(false);
          InternalEvent.consume(evt);
        } else if (evt.keyCode === 27 /* Escape */) {
          this.graph.stopEditing(this.isCancelEditingKeyEvent(evt));
          InternalEvent.consume(evt);
        }
      }
    });

    // Keypress only fires if printable key was pressed and handles removing the empty placeholder
    const keypressHandler = (evt: KeyboardEvent) => {
      if (this.editingCell != null) {
        // Clears the initial empty label on the first keystroke
        // and workaround for FF which fires keypress for delete and backspace
        if (
          this.clearOnChange &&
          elt.innerHTML === this.getEmptyLabelText() &&
          (!Client.IS_FF ||
            (evt.keyCode !== 8 /* Backspace */ && evt.keyCode !== 46)) /* Delete */
        ) {
          this.clearOnChange = false;
          elt.innerHTML = '';
        }
      }
    };

    InternalEvent.addListener(elt, 'keypress', keypressHandler);
    InternalEvent.addListener(elt, 'paste', keypressHandler);

    // Handler for updating the empty label text value after a change
    const keyupHandler = (evt: KeyboardEvent) => {
      if (this.editingCell != null) {
        // Uses an optional text value for sempty labels which is cleared
        // when the first keystroke appears. This makes it easier to see
        // that a label is being edited even if the label is empty.
        // In Safari and FF, an empty text is represented by <BR> which isn't enough to force a valid size
        const textarea = <HTMLElement>this.textarea;

        if (textarea.innerHTML.length === 0 || textarea.innerHTML === '<br>') {
          textarea.innerHTML = this.getEmptyLabelText();
          this.clearOnChange = textarea.innerHTML.length > 0;
        } else {
          this.clearOnChange = false;
        }
      }
    };

    InternalEvent.addListener(elt, 'input', keyupHandler);
    InternalEvent.addListener(elt, 'cut', keyupHandler);
    InternalEvent.addListener(elt, 'paste', keyupHandler);

    // Adds automatic resizing of the textbox while typing using input, keyup and/or DOM change events
    const evtName = 'input';

    const resizeHandler = (evt: MouseEvent) => {
      if (this.editingCell != null && this.autoSize && !isConsumed(evt)) {
        // Asynchronous is needed for keydown and shows better results for input events overall
        // (ie non-blocking and cases where the offsetWidth/-Height was wrong at this time)
        if (this.resizeThread != null) {
          window.clearTimeout(this.resizeThread);
        }

        this.resizeThread = window.setTimeout(() => {
          this.resizeThread = null;
          this.resize();
        }, 0);
      }
    };

    InternalEvent.addListener(elt, evtName, resizeHandler);
    InternalEvent.addListener(window, 'resize', resizeHandler);
    InternalEvent.addListener(elt, 'cut', resizeHandler);
    InternalEvent.addListener(elt, 'paste', resizeHandler);
  }

  /**
   * Returns true if the given keydown event should stop cell editing. This
   * returns true if F2 is pressed of if {@link Graph#enterStopsCellEditing} is true
   * and enter is pressed without control or shift.
   */
  isStopEditingEvent(evt: KeyboardEvent) {
    return (
      evt.keyCode === 113 /* F2 */ ||
      (this.graph.isEnterStopsCellEditing() &&
        evt.keyCode === 13 /* Enter */ &&
        !isControlDown(<MouseEvent>(<unknown>evt)) &&
        !isShiftDown(<MouseEvent>(<unknown>evt)))
    );
  }

  /**
   * Returns true if this editor is the source for the given native event.
   */
  isEventSource(evt: MouseEvent | KeyboardEvent) {
    return getSource(evt) === this.textarea;
  }

  /**
   * Returns {@link odified}.
   */
  resize() {
    const state = this.editingCell
      ? this.graph.getView().getState(this.editingCell)
      : null;

    if (!state) {
      this.stopEditing(true);
    } else if (this.textarea != null) {
      const isEdge = state.cell.isEdge();
      const { scale } = this.graph.getView();
      let m = null;

      if (!this.autoSize || state.style.overflow === 'fill') {
        // Specifies the bounds of the editor box
        this.bounds = <Rectangle>this.getEditorBounds(state);
        this.textarea.style.width = `${Math.round(this.bounds.width / scale)}px`;
        this.textarea.style.height = `${Math.round(this.bounds.height / scale)}px`;

        // FIXME: Offset when scaled
        this.textarea.style.left = `${Math.max(0, Math.round(this.bounds.x + 1))}px`;
        this.textarea.style.top = `${Math.max(0, Math.round(this.bounds.y + 1))}px`;

        // Installs native word wrapping and avoids word wrap for empty label placeholder
        if (
          this.graph.isWrapping(state.cell) &&
          (this.bounds.width >= 2 || this.bounds.height >= 2) &&
          this.textarea.innerHTML !== this.getEmptyLabelText()
        ) {
          this.textarea.style.wordWrap = WORD_WRAP;
          this.textarea.style.whiteSpace = 'normal';

          if (state.style.overflow !== 'fill') {
            this.textarea.style.width = `${
              Math.round(this.bounds.width / scale) + this.wordWrapPadding
            }px`;
          }
        } else {
          this.textarea.style.whiteSpace = 'nowrap';

          if (state.style.overflow !== 'fill') {
            this.textarea.style.width = '';
          }
        }
      } else {
        const lw = getValue(state.style, 'labelWidth', null);
        m = state.text != null && this.align == null ? state.text.margin : null;

        if (m == null) {
          m = getAlignmentAsPoint(
            this.align || getValue(state.style, 'align', ALIGN.CENTER),
            getValue(state.style, 'verticalAlign', ALIGN.MIDDLE)
          );
        }

        if (isEdge) {
          this.bounds = new Rectangle(
            state.absoluteOffset.x,
            state.absoluteOffset.y,
            0,
            0
          );

          if (lw != null) {
            const tmp = (parseFloat(lw) + 2) * scale;
            this.bounds.width = tmp;
            this.bounds.x += m.x * tmp;
          }
        } else {
          let bounds = Rectangle.fromRectangle(state);
          let hpos = getValue(state.style, 'labelPosition', ALIGN.CENTER);
          let vpos = getValue(state.style, 'verticalLabelPosition', ALIGN.MIDDLE);

          bounds =
            state.shape != null && hpos === 'center' && vpos === 'middle'
              ? state.shape.getLabelBounds(bounds)
              : bounds;

          if (lw != null) {
            bounds.width = parseFloat(lw) * scale;
          }

          if (
            !(<Graph>state.view.graph).cellRenderer.legacySpacing ||
            state.style.overflow !== 'width'
          ) {
            // @ts-ignore
            const dummy = new TextShape(); // FIXME!!!! ===================================================================================================
            const spacing = (state.style.spacing ?? 2) * scale;
            const spacingTop =
              ((state.style.spacingTop ?? 0) + dummy.baseSpacingTop) * scale + spacing;
            const spacingRight =
              ((state.style.spacingRight ?? 0) + dummy.baseSpacingRight) * scale +
              spacing;
            const spacingBottom =
              ((state.style.spacingBottom ?? 0) + dummy.baseSpacingBottom) * scale +
              spacing;
            const spacingLeft =
              ((state.style.spacingLeft ?? 0) + dummy.baseSpacingLeft) * scale + spacing;

            hpos =
              state.style.labelPosition != null ? state.style.labelPosition : 'center';
            vpos =
              state.style.verticalLabelPosition != null
                ? state.style.verticalLabelPosition
                : 'middle';

            bounds = new Rectangle(
              bounds.x + spacingLeft,
              bounds.y + spacingTop,
              bounds.width -
                (hpos === ALIGN.CENTER && lw == null ? spacingLeft + spacingRight : 0),
              bounds.height - (vpos === ALIGN.MIDDLE ? spacingTop + spacingBottom : 0)
            );
          }

          this.bounds = new Rectangle(
            bounds.x + state.absoluteOffset.x,
            bounds.y + state.absoluteOffset.y,
            bounds.width,
            bounds.height
          );
        }

        // Needed for word wrap inside text blocks with oversize lines to match the final result where
        // the width of the longest line is used as the reference for text alignment in the cell
        // TODO: Fix word wrapping preview for edge labels in helloworld.html
        if (
          this.graph.isWrapping(state.cell) &&
          (this.bounds.width >= 2 || this.bounds.height >= 2) &&
          this.textarea.innerHTML !== this.getEmptyLabelText()
        ) {
          this.textarea.style.wordWrap = WORD_WRAP;
          this.textarea.style.whiteSpace = 'normal';

          // Forces automatic reflow if text is removed from an oversize label and normal word wrap
          const tmp = Math.round(this.bounds.width / scale) + this.wordWrapPadding;

          if (this.textarea.style.position !== 'relative') {
            this.textarea.style.width = `${tmp}px`;

            if (this.textarea.scrollWidth > tmp) {
              this.textarea.style.width = `${this.textarea.scrollWidth}px`;
            }
          } else {
            this.textarea.style.maxWidth = `${tmp}px`;
          }
        } else {
          // KNOWN: Trailing cursor in IE9 quirks mode is not visible
          this.textarea.style.whiteSpace = 'nowrap';
          this.textarea.style.width = '';
        }

        const ow = this.textarea.scrollWidth;
        const oh = this.textarea.scrollHeight;

        // TODO: Update CSS width and height if smaller than minResize or remove minResize
        // if (this.minResize != null)
        // {
        //  ow = Math.max(ow, this.minResize.width);
        //  oh = Math.max(oh, this.minResize.height);
        // }

        // LATER: Keep in visible area, add fine tuning for pixel precision
        this.textarea.style.left = `${Math.max(
          0,
          Math.round(this.bounds.x - m.x * (this.bounds.width - 2)) + 1
        )}px`;
        this.textarea.style.top = `${Math.max(
          0,
          Math.round(
            this.bounds.y - m.y * (this.bounds.height - 4) + (m.y === -1 ? 3 : 0)
          ) + 1
        )}px`;
      }

      setPrefixedStyle(this.textarea.style, 'transformOrigin', '0px 0px');
      setPrefixedStyle(
        this.textarea.style,
        'transform',
        `scale(${scale},${scale})${
          m == null ? '' : ` translate(${m.x * 100}%,${m.y * 100}%)`
        }`
      );
    }
  }

  /**
   * Called if the textarea has lost focus.
   */
  focusLost() {
    this.stopEditing(!this.graph.isInvokesStopCellEditing());
  }

  /**
   * Returns the background color for the in-place editor. This implementation
   * always returns NONE.
   */
  getBackgroundColor(state: CellState) {
    return NONE;
  }

  /**
   * Starts the editor for the given cell.
   *
   * @param cell <Cell> to start editing.
   * @param trigger Optional mouse event that triggered the editor.
   */
  startEditing(cell: Cell, trigger: MouseEvent | null = null) {
    this.stopEditing(true);
    this.align = null;

    // Creates new textarea instance
    if (this.textarea == null) {
      this.init();
    }

    const tooltipHandler = this.graph.getPlugin<TooltipHandler>('TooltipHandler');
    tooltipHandler?.hideTooltip();

    const state = this.graph.getView().getState(cell);

    if (state) {
      // Configures the style of the in-place editor
      const { scale } = this.graph.getView();
      const size = state.style.fontSize ?? DEFAULT_FONTSIZE;
      const family = state.style.fontFamily ?? DEFAULT_FONTFAMILY;
      const color = state.style.fontColor ?? 'black';
      const align = state.style.align ?? ALIGN.LEFT;
      const bold = (state.style.fontStyle || 0) & FONT.BOLD;
      const italic = (state.style.fontStyle || 0) & FONT.ITALIC;

      const txtDecor = [];
      if ((state.style.fontStyle || 0) & FONT.UNDERLINE) {
        txtDecor.push('underline');
      }
      if ((state.style.fontStyle || 0) & FONT.STRIKETHROUGH) {
        txtDecor.push('line-through');
      }

      const textarea = <HTMLElement>this.textarea;
      textarea.style.lineHeight = ABSOLUTE_LINE_HEIGHT
        ? `${Math.round(size * LINE_HEIGHT)}px`
        : String(LINE_HEIGHT);
      textarea.style.backgroundColor = this.getBackgroundColor(state) || 'transparent';
      textarea.style.textDecoration = txtDecor.join(' ');
      textarea.style.fontWeight = bold ? 'bold' : 'normal';
      textarea.style.fontStyle = italic ? 'italic' : '';
      textarea.style.fontSize = `${Math.round(size)}px`;
      textarea.style.zIndex = String(this.zIndex);
      textarea.style.fontFamily = family;
      textarea.style.textAlign = align;
      textarea.style.outline = 'none';
      textarea.style.color = color;

      let dir = (this.textDirection =
        state.style.textDirection ?? DEFAULT_TEXT_DIRECTION);

      if (dir === 'auto') {
        if (
          state.text !== null &&
          state.text.dialect !== DIALECT.STRICTHTML &&
          !isNode(state.text.value)
        ) {
          dir = state.text.getAutoDirection();
        }
      }

      if (dir === 'ltr' || dir === 'rtl') {
        textarea.setAttribute('dir', dir);
      } else {
        textarea.removeAttribute('dir');
      }

      // Sets the initial editing value
      textarea.innerHTML = this.getInitialValue(state, trigger) || '';
      this.initialValue = textarea.innerHTML;

      // Uses an optional text value for empty labels which is cleared
      // when the first keystroke appears. This makes it easier to see
      // that a label is being edited even if the label is empty.
      if (textarea.innerHTML.length === 0 || textarea.innerHTML === '<br>') {
        textarea.innerHTML = <string>this.getEmptyLabelText();
        this.clearOnChange = true;
      } else {
        this.clearOnChange = textarea.innerHTML === this.getEmptyLabelText();
      }

      // @ts-ignore
      this.graph.container.appendChild(textarea);

      // Update this after firing all potential events that could update the cleanOnChange flag
      this.editingCell = cell;
      this.trigger = trigger;
      this.textNode = null;

      if (state.text !== null && this.isHideLabel(state)) {
        this.textNode = <SVGGElement>state.text.node;
        this.textNode.style.visibility = 'hidden';
      }

      // Workaround for initial offsetHeight not ready for heading in markup
      if (this.autoSize && (state.cell.isEdge() || state.style.overflow !== 'fill')) {
        window.setTimeout(() => {
          this.resize();
        }, 0);
      }

      this.resize();

      // Workaround for NS_ERROR_FAILURE in FF
      try {
        // Prefers blinking cursor over no selected text if empty
        textarea.focus();

        if (
          this.isSelectText() &&
          textarea.innerHTML.length > 0 &&
          (textarea.innerHTML !== this.getEmptyLabelText() || !this.clearOnChange)
        ) {
          document.execCommand('selectAll', false);
        }
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Returns <selectText>.
   */
  isSelectText() {
    return this.selectText;
  }

  /**
  clearSelection() {
    const selection = window.getSelection();

    if (selection) {
      if (selection.empty) {
        selection.empty();
      } else if (selection.removeAllRanges) {
        selection.removeAllRanges();
      }
    }
  }

  /**
   * Stops the editor and applies the value if cancel is false.
   */
  stopEditing(cancel = false) {
    if (this.editingCell) {
      if (this.textNode) {
        this.textNode.style.visibility = 'visible';
        this.textNode = null;
      }

      const state = !cancel ? this.graph.view.getState(this.editingCell) : null;
      const textarea = <HTMLElement>this.textarea;

      const initial = this.initialValue;
      this.initialValue = null;
      this.editingCell = null;
      this.trigger = null;
      this.bounds = null;
      textarea.blur();
      clearSelection();

      if (textarea.parentNode) {
        textarea.parentNode.removeChild(textarea);
      }

      if (this.clearOnChange && textarea.innerHTML === this.getEmptyLabelText()) {
        textarea.innerHTML = '';
        this.clearOnChange = false;
      }

      if (state && (textarea.innerHTML !== initial || this.align !== null)) {
        this.prepareTextarea();
        const value = this.getCurrentValue(state);

        this.graph.batchUpdate(() => {
          if (value !== null) {
            this.applyValue(state, value);
          }

          if (this.align !== null) {
            this.graph.setCellStyles('align', this.align, [state.cell]);
          }
        });
      }

      // Forces new instance on next edit for undo history reset
      if (this.textarea) InternalEvent.release(this.textarea);

      this.textarea = null;
      this.align = null;
    }
  }

  /**
   * Prepares the textarea for getting its value in <stopEditing>.
   * This implementation removes the extra trailing linefeed in Firefox.
   */
  prepareTextarea() {
    const textarea = <HTMLElement>this.textarea;
    if (textarea.lastChild && textarea.lastChild.nodeName === 'BR') {
      textarea.removeChild(textarea.lastChild);
    }
  }

  /**
   * Returns true if the label should be hidden while the cell is being
   * edited.
   */
  isHideLabel(state: CellState | null = null) {
    return true;
  }

  /**
   * Returns the minimum width and height for editing the given state.
   */
  getMinimumSize(state: CellState) {
    const { scale } = this.graph.getView();
    const textarea = <HTMLElement>this.textarea;

    return new Rectangle(
      0,
      0,
      state.text === null ? 30 : state.text.size * scale + 20,
      textarea.style.textAlign === 'left' ? 120 : 40
    );
  }

  /**
   * Returns the {@link Rectangle} that defines the bounds of the editor.
   */
  getEditorBounds(state: CellState) {
    const isEdge = state.cell.isEdge();
    const { scale } = this.graph.getView();
    const minSize = this.getMinimumSize(state);
    const minWidth = minSize.width;
    const minHeight = minSize.height;
    let result = null;

    if (
      !isEdge &&
      (<Graph>state.view.graph).cellRenderer.legacySpacing &&
      state.style.overflow === 'fill'
    ) {
      result = (<Shape>state.shape).getLabelBounds(Rectangle.fromRectangle(state));
    } else {
      // @ts-ignore
      const dummy = new TextShape(); // FIXME!!!! ===================================================================================================
      const spacing: number = (state.style.spacing ?? 0) * scale;
      const spacingTop: number =
        ((state.style.spacingTop ?? 0) + dummy.baseSpacingTop) * scale + spacing;
      const spacingRight: number =
        ((state.style.spacingRight ?? 0) + dummy.baseSpacingRight) * scale + spacing;
      const spacingBottom: number =
        ((state.style.spacingBottom ?? 0) + dummy.baseSpacingBottom) * scale + spacing;
      const spacingLeft: number =
        ((state.style.spacingLeft ?? 0) + dummy.baseSpacingLeft) * scale + spacing;

      result = new Rectangle(
        state.x,
        state.y,
        Math.max(minWidth, state.width - spacingLeft - spacingRight),
        Math.max(minHeight, state.height - spacingTop - spacingBottom)
      );
      const hpos: string =
        state.style.labelPosition != null ? state.style.labelPosition : 'center';
      const vpos: string =
        state.style.verticalLabelPosition != null
          ? state.style.verticalLabelPosition
          : 'middle';

      result =
        state.shape != null && hpos === 'center' && vpos === 'middle'
          ? state.shape.getLabelBounds(result)
          : result;

      if (isEdge) {
        result.x = state.absoluteOffset.x;
        result.y = state.absoluteOffset.y;

        if (state.text != null && state.text.boundingBox != null) {
          // Workaround for label containing just spaces in which case
          // the bounding box location contains negative numbers
          if (state.text.boundingBox.x > 0) {
            result.x = state.text.boundingBox.x;
          }

          if (state.text.boundingBox.y > 0) {
            result.y = state.text.boundingBox.y;
          }
        }
      } else if (state.text != null && state.text.boundingBox != null) {
        result.x = Math.min(result.x, state.text.boundingBox.x);
        result.y = Math.min(result.y, state.text.boundingBox.y);
      }

      result.x += spacingLeft;
      result.y += spacingTop;

      if (state.text != null && state.text.boundingBox != null) {
        if (!isEdge) {
          result.width = Math.max(result.width, state.text.boundingBox.width);
          result.height = Math.max(result.height, state.text.boundingBox.height);
        } else {
          result.width = Math.max(minWidth, state.text.boundingBox.width);
          result.height = Math.max(minHeight, state.text.boundingBox.height);
        }
      }

      // Applies the horizontal and vertical label positions
      if (state.cell.isVertex()) {
        const horizontal: string = <string>(
          getStringValue(state.style, 'labelPosition', ALIGN.CENTER)
        );

        if (horizontal === 'left') {
          result.x -= state.width;
        } else if (horizontal === 'right') {
          result.x += state.width;
        }

        const vertical: string =
          state.style.verticalLabelPosition != null
            ? state.style.verticalLabelPosition
            : 'middle';

        if (vertical === 'top') {
          result.y -= state.height;
        } else if (vertical === 'bottom') {
          result.y += state.height;
        }
      }
    }

    return new Rectangle(
      Math.round(result.x),
      Math.round(result.y),
      Math.round(result.width),
      Math.round(result.height)
    );
  }

  /**
   * Returns the initial label value to be used of the label of the given
   * cell is empty. This label is displayed and cleared on the first keystroke.
   * This implementation returns <emptyLabelText>.
   *
   * @param cell <Cell> for which a text for an empty editing box should be
   * returned.
   */
  getEmptyLabelText(cell: Cell | null = null) {
    return this.emptyLabelText ?? '';
  }

  /**
   * Returns the cell that is currently being edited or null if no cell is
   * being edited.
   */
  getEditingCell() {
    return this.editingCell;
  }

  /**
   * Destroys the editor and removes all associated resources.
   */
  onDestroy() {
    if (this.textarea) {
      InternalEvent.release(this.textarea);
      if (this.textarea.parentNode) {
        this.textarea.parentNode.removeChild(this.textarea);
      }
      this.textarea = null;
    }

    this.graph.getDataModel().removeListener(this.changeHandler);
    this.graph.getView().removeListener(this.zoomHandler);
  }
}

export default CellEditorHandler;
