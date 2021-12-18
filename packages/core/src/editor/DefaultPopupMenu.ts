/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import Cell from '../view/cell/Cell';
import PopupMenu from '../gui/PopupMenu';
import { getTextContent } from '../util/domUtils';
import Resources from '../util/Resources';
import Editor from './Editor';
import { PopupMenuItem } from 'src/types';

/**
 * Creates popupmenus for mouse events.  This object holds an XML node which is a description of the popup menu to be created.  In {@link createMenu}, the configuration is applied to the context and the resulting menu items are added to the menu dynamically.  See {@link createMenu} for a description of the configuration format.
 * This class does not create the DOM nodes required for the popup menu, it only parses an XML description to invoke the respective methods on an {@link mxPopupMenu} each time the menu is displayed.
 *
 * @Codec
 * This class uses the {@link DefaultPopupMenuCodec} to read configuration data into an existing instance, however, the actual parsing is done by this class during program execution, so the format is described below.
 */
class DefaultPopupMenu {
  constructor(config: Element | null=null) {
    this.config = config;
  }

  /**
   * Base path for all icon attributes in the config.  Default is null.
   *
   * @default null
   */
  imageBasePath: string | null = null;

  /**
   * XML node used as the description of new menu items.  This node is used in {@link createMenu} to dynamically create the menu items if their respective conditions evaluate to true for the given arguments.
   */
  config: Element | null;

  /**
   * This function is called from {@link Editor} to add items to the
   * given menu based on {@link config}. The config is a sequence of
   * the following nodes and attributes.
   *
   * @ChildNodes:
   *
   * add - Adds a new menu item. See below for attributes.
   * separator - Adds a separator. No attributes.
   * condition - Adds a custom condition. Name attribute.
   *
   * The add-node may have a child node that defines a function to be invoked
   * before the action is executed (or instead of an action to be executed).
   *
   * @Attributes:
   *
   * as - Resource key for the label (needs entry in property file).
   * action - Name of the action to execute in enclosing editor.
   * icon - Optional icon (relative/absolute URL).
   * iconCls - Optional CSS class for the icon.
   * if - Optional name of condition that must be true (see below).
   * enabled-if - Optional name of condition that specifies if the menu item
   * should be enabled.
   * name - Name of custom condition. Only for condition nodes.
   *
   * @Conditions:
   *
   * nocell - No cell under the mouse.
   * ncells - More than one cell selected.
   * notRoot - Drilling position is other than home.
   * cell - Cell under the mouse.
   * notEmpty - Exactly one cell with children under mouse.
   * expandable - Exactly one expandable cell under mouse.
   * collapsable - Exactly one collapsable cell under mouse.
   * validRoot - Exactly one cell which is a possible root under mouse.
   * swimlane - Exactly one cell which is a swimlane under mouse.
   *
   * @Example:
   *
   * To add a new item for a given action to the popupmenu:
   *
   * ```
   * <DefaultPopupMenu as="popupHandler">
   *   <add as="delete" action="delete" icon="images/delete.gif" if="cell"/>
   * </DefaultPopupMenu>
   * ```
   *
   * To add a new item for a custom function:
   *
   * ```
   * <DefaultPopupMenu as="popupHandler">
   *   <add as="action1"><![CDATA[
   *		function (editor, cell, evt)
   *		{
   *			editor.execute('action1', cell, 'myArg');
   *		}
   *   ]]></add>
   * </DefaultPopupMenu>
   * ```
   *
   * The above example invokes action1 with an additional third argument via
   * the editor instance. The third argument is passed to the function that
   * defines action1. If the add-node has no action-attribute, then only the
   * function defined in the text content is executed, otherwise first the
   * function and then the action defined in the action-attribute is
   * executed. The function in the text content has 3 arguments, namely the
   * {@link Editor} instance, the {@link mxCell} instance under the mouse, and the
   * native mouse event.
   *
   * Custom Conditions:
   *
   * To add a new condition for popupmenu items:
   *
   * ```
   * <condition name="condition1"><![CDATA[
   *   function (editor, cell, evt)
   *   {
   *     return cell != null;
   *   }
   * ]]></condition>
   * ```
   *
   * The new condition can then be used in any item as follows:
   *
   * ```
   * <add as="action1" action="action1" icon="action1.gif" if="condition1"/>
   * ```
   *
   * The order in which the items and conditions appear is not significant as
   * all conditions are evaluated before any items are created.
   *
   * Parameters:
   *
   * @param editor - Enclosing {@link Editor} instance.
   * @param menu - {@link mxPopupMenu} that is used for adding items and separators.
   * @param cell - Optional {@link mxCell} which is under the mousepointer.
   * @param evt - Optional mouse event which triggered the menu.
   */
  createMenu(editor: Editor, menu: PopupMenu, cell?: Cell, evt?: MouseEvent) {
    if (this.config != null) {
      const conditions = this.createConditions(editor, cell, evt);
      const item = <Element>this.config.firstChild;
      this.addItems(editor, menu, cell, evt, conditions, item, null);
    }
  }

  /**
   * Function: addItems
   *
   * Recursively adds the given items and all of its children into the given menu.
   *
   * Parameters:
   *
   * editor - Enclosing <Editor> instance.
   * menu - <mxPopupMenu> that is used for adding items and separators.
   * cell - Optional <Cell> which is under the mousepointer.
   * evt - Optional mouse event which triggered the menu.
   * conditions - Array of names boolean conditions.
   * item - XML node that represents the current menu item.
   * parent - DOM node that represents the parent menu item.
   */
  addItems(
    editor: Editor, 
    menu: PopupMenu, 
    cell: Cell | null=null, 
    evt: MouseEvent | null=null, 
    conditions: any, 
    item: Element, 
    parent: PopupMenuItem | null=null
  ) {
    let addSeparator = false;

    while (item != null) {
      if (item.nodeName === 'add') {
        const condition = item.getAttribute('if');

        if (condition == null || conditions[condition]) {
          let as = <string>item.getAttribute('as');
          as = Resources.get(as) || as;
          const funct = eval(getTextContent(item));
          const action = item.getAttribute('action');
          let icon = item.getAttribute('icon');
          const iconCls = item.getAttribute('iconCls');
          const enabledCond = item.getAttribute('enabled-if');
          const enabled = enabledCond == null || conditions[enabledCond];

          if (addSeparator) {
            menu.addSeparator(parent);
            addSeparator = false;
          }

          if (icon != null && this.imageBasePath) {
            icon = this.imageBasePath + icon;
          }

          const row = this.addAction(
            menu,
            editor,
            as,
            icon,
            funct,
            action,
            cell,
            parent,
            iconCls,
            enabled
          );
          this.addItems(
            editor,
            menu,
            cell,
            evt,
            conditions,
            // @ts-ignore
            item.firstChild,
            row
          );
        }
      } else if (item.nodeName === 'separator') {
        addSeparator = true;
      }

      // @ts-ignore
      item = item.nextSibling;
    }
  }

  /**
   * Function: addAction
   *
   * Helper method to bind an action to a new menu item.
   *
   * Parameters:
   *
   * menu - <mxPopupMenu> that is used for adding items and separators.
   * editor - Enclosing <Editor> instance.
   * lab - String that represents the label of the menu item.
   * icon - Optional URL that represents the icon of the menu item.
   * action - Optional name of the action to execute in the given editor.
   * funct - Optional function to execute before the optional action. The
   * function takes an <Editor>, the <Cell> under the mouse and the
   * mouse event that triggered the call.
   * cell - Optional <Cell> to use as an argument for the action.
   * parent - DOM node that represents the parent menu item.
   * iconCls - Optional CSS class for the menu icon.
   * enabled - Optional boolean that specifies if the menu item is enabled.
   * Default is true.
   */
  addAction(
    menu: PopupMenu,
    editor: Editor,
    lab: string,
    icon?: string,
    funct: Function | null=null,
    action?: string,
    cell?: Cell,
    parent?: PopupMenuItem,
    iconCls?: string,
    enabled: boolean=true
  ) {
    const clickHandler = (evt: MouseEvent) => {
      if (typeof funct === 'function') {
        funct.call(editor, editor, cell, evt);
      }
      if (action != null) {
        editor.execute(action, cell, evt);
      }
    };
    return menu.addItem(lab, icon || null, clickHandler, parent, iconCls, enabled);
  }

  /**
   * Evaluates the default conditions for the given context.
   *
   * @param editor
   * @param cell
   * @param evt
   */
  createConditions(editor: Editor, cell: Cell | null=null, evt: MouseEvent | null=null): void {
    // Creates array with conditions
    const model = editor.graph.getModel();
    const childCount = cell ? cell.getChildCount() : 0;

    // Adds some frequently used conditions
    const conditions: any = {};
    conditions.nocell = cell == null;
    conditions.ncells = editor.graph.getSelectionCount() > 1;
    conditions.notRoot =
      model.getRoot() !== editor.graph.getDefaultParent().getParent();
    conditions.cell = cell != null;

    const isCell = cell != null && editor.graph.getSelectionCount() === 1;
    conditions.nonEmpty = isCell && childCount > 0;
    conditions.expandable = isCell && editor.graph.isCellFoldable(cell, false);
    conditions.collapsable = isCell && editor.graph.isCellFoldable(cell, true);
    conditions.validRoot = isCell && editor.graph.isValidRoot(cell);
    conditions.emptyValidRoot = conditions.validRoot && childCount === 0;
    conditions.swimlane = isCell && editor.graph.isSwimlane(cell);

    // Evaluates dynamic conditions from config file
    const condNodes = this.config.getElementsByTagName('condition');

    for (let i = 0; i < condNodes.length; i += 1) {
      const funct = eval(getTextContent(condNodes[i]));
      const name = condNodes[i].getAttribute('name');

      if (name != null && typeof funct === 'function') {
        conditions[name] = funct(editor, cell, evt);
      }
    }

    return conditions;
  }
}

export default DefaultPopupMenu;
