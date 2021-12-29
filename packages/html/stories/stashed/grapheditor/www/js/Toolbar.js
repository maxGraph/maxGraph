/**
 * Copyright (c) 2006-2012, JGraph Ltd
 */
const { getOffset } = require('../../../../../packages/core/src/util/utils');
const { write } = require('../../../../../packages/core/src/util/domUtils');
const { htmlEntities } = require('../../../../../packages/core/src/util/stringUtils');

/**
 * Construcs a new toolbar for the given editor.
 */
function Toolbar(editorUi, container)
{
	this.editorUi = editorUi;
	this.container = container;
	this.staticElements = [];
	this.init();

	// Global handler to hide the current menu
	this.gestureHandler = ((evt) =>
	{
		if (this.editorUi.currentMenu != null && mxEvent.getSource(evt) != this.editorUi.currentMenu.div)
		{
			this.hideMenu();
		}
	});

	mxEvent.addGestureListeners(document, this.gestureHandler);
};

/**
 * Image for the dropdown arrow.
 */
Toolbar.prototype.dropdownImage = (!Client.IS_SVG) ? IMAGE_PATH + '/dropdown.gif' : 'data:image/gif;base64,R0lGODlhDQANAIABAHt7e////yH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4wLWMwNjAgNjEuMTM0Nzc3LCAyMDEwLzAyLzEyLTE3OjMyOjAwICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpCREM1NkJFMjE0NEMxMUU1ODk1Q0M5MjQ0MTA4QjNDMSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpCREM1NkJFMzE0NEMxMUU1ODk1Q0M5MjQ0MTA4QjNDMSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkQzOUMzMjZCMTQ0QjExRTU4OTVDQzkyNDQxMDhCM0MxIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkQzOUMzMjZDMTQ0QjExRTU4OTVDQzkyNDQxMDhCM0MxIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Af/+/fz7+vn49/b19PPy8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcC/vr28u7q5uLe2tbSzsrGwr66trKuqqainpqWko6KhoJ+enZybmpmYl5aVlJOSkZCPjo2Mi4qJiIeGhYSDgoGAf359fHt6eXh3dnV0c3JxcG9ubWxramloZ2ZlZGNiYWBfXl1cW1pZWFdWVVRTUlFQT05NTEtKSUhHRkVEQ0JBQD8+PTw7Ojk4NzY1NDMyMTAvLi0sKyopKCcmJSQjIiEgHx4dHBsaGRgXFhUUExIREA8ODQwLCgkIBwYFBAMCAQAAIfkEAQAAAQAsAAAAAA0ADQAAAhGMj6nL3QAjVHIu6azbvPtWAAA7';

/**
 * Image element for the dropdown arrow.
 */
Toolbar.prototype.dropdownImageHtml = '<img border="0" style="position:absolute;right:4px;top:' +
	((!EditorUi.compactUi) ? 8 : 6) + 'px;" src="' + Toolbar.prototype.dropdownImage + '" valign="middle"/>';

/**
 * Defines the background for selected buttons.
 */
Toolbar.prototype.selectedBackground = '#d0d0d0';

/**
 * Defines the background for selected buttons.
 */
Toolbar.prototype.unselectedBackground = 'none';

/**
 * Array that contains the DOM nodes that should never be removed.
 */
Toolbar.prototype.staticElements = null;

/**
 * Adds the toolbar elements.
 */
Toolbar.prototype.init = function()
{
	let sw = screen.width;
	
	// Takes into account initial compact mode
	sw -= (screen.height > 740) ? 56 : 0;
	
	if (sw >= 700)
	{
		let formatMenu = this.addMenu('', Translations.get('view') + ' (' + Translations.get('panTooltip') + ')', true, 'viewPanels', null, true);
		this.addDropDownArrow(formatMenu, 'geSprite-formatpanel', 38, 50, -4, -3, 36, -8);
		this.addSeparator();
	}
	
	let viewMenu = this.addMenu('', Translations.get('zoom') + ' (Alt+Mousewheel)', true, 'viewZoom', null, true);
	viewMenu.showDisabled = true;
	viewMenu.style.whiteSpace = 'nowrap';
	viewMenu.style.position = 'relative';
	viewMenu.style.overflow = 'hidden';
	
	if (EditorUi.compactUi)
	{
		viewMenu.style.width = '50px';
	}
	else
	{
		viewMenu.style.width = '36px';
	}
	
	if (sw >= 420)
	{
		this.addSeparator();
		let elts = this.addItems(['zoomIn', 'zoomOut']);
		elts[0].setAttribute('title', Translations.get('zoomIn') + ' (' + this.editorUi.actions.get('zoomIn').shortcut + ')');
		elts[1].setAttribute('title', Translations.get('zoomOut') + ' (' + this.editorUi.actions.get('zoomOut').shortcut + ')');
	}
	
	// Updates the label if the scale changes
	this.updateZoom = (() =>
	{
		viewMenu.innerHTML = Math.round(this.editorUi.editor.graph.view.scale * 100) + '%' +
			this.dropdownImageHtml;
		
		if (EditorUi.compactUi)
		{
			viewMenu.getElementsByTagName('img')[0].style.right = '1px';
			viewMenu.getElementsByTagName('img')[0].style.top = '5px';
		}
	});

	this.editorUi.editor.graph.view.addListener(mxEvent.EVENT_SCALE, this.updateZoom);
	this.editorUi.editor.addListener('resetGraphView', this.updateZoom);

	let elts = this.addItems(['-', 'undo', 'redo']);
	elts[1].setAttribute('title', Translations.get('undo') + ' (' + this.editorUi.actions.get('undo').shortcut + ')');
	elts[2].setAttribute('title', Translations.get('redo') + ' (' + this.editorUi.actions.get('redo').shortcut + ')');
	
	if (sw >= 320)
	{
		let elts = this.addItems(['-', 'delete']);
		elts[1].setAttribute('title', Translations.get('delete') + ' (' + this.editorUi.actions.get('delete').shortcut + ')');
	}
	
	if (sw >= 550)
	{
		this.addItems(['-', 'toFront', 'toBack']);
	}

	if (sw >= 740)
	{
		this.addItems(['-', 'fillColor']);
		
		if (sw >= 780)
		{
			this.addItems(['strokeColor']);
			
			if (sw >= 820)
			{
				this.addItems(['shadow']);
			}
		}
	}
	
	if (sw >= 400)
	{
		this.addSeparator();
		
		if (sw >= 440)
		{
			this.edgeShapeMenu = this.addMenuFunction('', Translations.get('connection'), false, ((menu) =>
			{
				this.editorUi.menus.edgeStyleChange(menu, '', ['shape', 'width'], [null, null], 'geIcon geSprite geSprite-connection', null, true).setAttribute('title', Translations.get('line'));
				this.editorUi.menus.edgeStyleChange(menu, '', ['shape', 'width'], ['link', null], 'geIcon geSprite geSprite-linkedge', null, true).setAttribute('title', Translations.get('link'));
				this.editorUi.menus.edgeStyleChange(menu, '', ['shape', 'width'], ['flexArrow', null], 'geIcon geSprite geSprite-arrow', null, true).setAttribute('title', Translations.get('arrow'));
				this.editorUi.menus.edgeStyleChange(menu, '', ['shape', 'width'], ['arrow', null], 'geIcon geSprite geSprite-simplearrow', null, true).setAttribute('title', Translations.get('simpleArrow'));
			}));
	
			this.addDropDownArrow(this.edgeShapeMenu, 'geSprite-connection', 44, 50, 0, 0, 22, -4);
		}
	
		this.edgeStyleMenu = this.addMenuFunction('geSprite-orthogonal', Translations.get('waypoints'), false, ((menu) =>
		{
			this.editorUi.menus.edgeStyleChange(menu, '', ['edge', 'curved', 'noEdgeStyle'], [null, null, null], 'geIcon geSprite geSprite-straight', null, true).setAttribute('title', Translations.get('straight'));
			this.editorUi.menus.edgeStyleChange(menu, '', ['edge', 'curved', 'noEdgeStyle'], ['orthogonalEdgeStyle', null, null], 'geIcon geSprite geSprite-orthogonal', null, true).setAttribute('title', Translations.get('orthogonal'));
			this.editorUi.menus.edgeStyleChange(menu, '', ['edge', 'elbow', 'curved', 'noEdgeStyle'], ['elbowEdgeStyle', null, null, null], 'geIcon geSprite geSprite-horizontalelbow', null, true).setAttribute('title', Translations.get('simple'));
			this.editorUi.menus.edgeStyleChange(menu, '', ['edge', 'elbow', 'curved', 'noEdgeStyle'], ['elbowEdgeStyle', 'vertical', null, null], 'geIcon geSprite geSprite-verticalelbow', null, true).setAttribute('title', Translations.get('simple'));
			this.editorUi.menus.edgeStyleChange(menu, '', ['edge', 'elbow', 'curved', 'noEdgeStyle'], ['isometricEdgeStyle', null, null, null], 'geIcon geSprite geSprite-horizontalisometric', null, true).setAttribute('title', Translations.get('isometric'));
			this.editorUi.menus.edgeStyleChange(menu, '', ['edge', 'elbow', 'curved', 'noEdgeStyle'], ['isometricEdgeStyle', 'vertical', null, null], 'geIcon geSprite geSprite-verticalisometric', null, true).setAttribute('title', Translations.get('isometric'));
			this.editorUi.menus.edgeStyleChange(menu, '', ['edge', 'curved', 'noEdgeStyle'], ['orthogonalEdgeStyle', '1', null], 'geIcon geSprite geSprite-curved', null, true).setAttribute('title', Translations.get('curved'));
			this.editorUi.menus.edgeStyleChange(menu, '', ['edge', 'curved', 'noEdgeStyle'], ['entityRelationEdgeStyle', null, null], 'geIcon geSprite geSprite-entity', null, true).setAttribute('title', Translations.get('entityRelation'));
		}));
		
		this.addDropDownArrow(this.edgeStyleMenu, 'geSprite-orthogonal', 44, 50, 0, 0, 22, -4);
	}

	this.addSeparator();
	let insertMenu = this.addMenu('', Translations.get('insert') + ' (' + Translations.get('doubleClickTooltip') + ')', true, 'insert', null, true);
	this.addDropDownArrow(insertMenu, 'geSprite-plus', 38, 48, -4, -3, 36, -8);
	this.addTableDropDown();
};

/**
 * Adds the toolbar elements.
 */
Toolbar.prototype.addTableDropDown = function()
{
	this.addSeparator();
	
	// KNOWN: All table stuff does not work with undo/redo
	// KNOWN: Lost focus after click on submenu with text (not icon) in quirks and IE8. This is because the TD seems
	// to catch the focus on click in these browsers. NOTE: Workaround in mxPopupMenu for icon items (without text).
	let menuElt = this.addMenuFunction('geIcon geSprite geSprite-table', Translations.get('table'), false, ((menu) =>
	{
		let graph = this.editorUi.editor.graph;
		let cell = graph.getSelectionCell();

		if (!graph.isTableCell(cell) && !graph.isTableRow(cell) && !graph.isTable(cell))
		{
			this.editorUi.menus.addInsertTableCellItem(menu);
    	}
		else
    	{
			let elt = menu.addItem('', null, (() =>
			{
				try
				{
					graph.insertTableColumn(cell, true);
				}
				catch (e)
				{
					this.editorUi.handleError(e);
				}
			}), null, 'geIcon geSprite geSprite-insertcolumnbefore');
			elt.setAttribute('title', Translations.get('insertColumnBefore'));
			
			elt = menu.addItem('', null, (() =>
			{	
				try
				{
					graph.insertTableColumn(cell, false);
				}
				catch (e)
				{
					this.editorUi.handleError(e);
				}
			}), null, 'geIcon geSprite geSprite-insertcolumnafter');
			elt.setAttribute('title', Translations.get('insertColumnAfter'));

			elt = menu.addItem('Delete column', null, (() =>
			{
				if (cell != null)
				{
					try
					{
						graph.deleteTableColumn(cell);
					}
					catch (e)
					{
						this.editorUi.handleError(e);
					}
				}
			}), null, 'geIcon geSprite geSprite-deletecolumn');
			elt.setAttribute('title', Translations.get('deleteColumn'));
			
			elt = menu.addItem('', null, (() =>
			{
				try
				{
					graph.insertTableRow(cell, true);
				}
				catch (e)
				{
					this.editorUi.handleError(e);
				}
			}), null, 'geIcon geSprite geSprite-insertrowbefore');
			elt.setAttribute('title', Translations.get('insertRowBefore'));

			elt = menu.addItem('', null, (() =>
			{
				try
				{
					graph.insertTableRow(cell, false);
				}
				catch (e)
				{
					this.editorUi.handleError(e);
				}
			}), null, 'geIcon geSprite geSprite-insertrowafter');
			elt.setAttribute('title', Translations.get('insertRowAfter'));

			elt = menu.addItem('', null, (() =>
			{
				try
				{
					graph.deleteTableRow(cell);
				}
				catch (e)
				{
					this.editorUi.handleError(e);
				}
			}), null, 'geIcon geSprite geSprite-deleterow');
			elt.setAttribute('title', Translations.get('deleteRow'));
    	}
	}));
	
	menuElt.style.position = 'relative';
	menuElt.style.whiteSpace = 'nowrap';
	menuElt.style.overflow = 'hidden';
	menuElt.innerHTML = '<div class="geSprite geSprite-table" style="margin-left:-2px;"></div>' + this.dropdownImageHtml;
	menuElt.style.width = '30px';

	// Fix for item size in kennedy theme
	if (EditorUi.compactUi)
	{
		menuElt.getElementsByTagName('img')[0].style.left = '22px';
		menuElt.getElementsByTagName('img')[0].style.top = '5px';
	}
	
	// Connects to insert menu enabled state
	let menu = this.editorUi.menus.get('insert');
	
	// Workaround for possible not a function
	// when extending HTML objects
	if (menu != null && typeof menuElt.setEnabled === 'function')
	{
		menu.addListener('stateChanged', function()
		{
			menuElt.setEnabled(menu.enabled);
		});
	}
	
	return menuElt;
};

/**
 * Adds the toolbar elements.
 */
Toolbar.prototype.addDropDownArrow = function(menu, sprite, width, atlasWidth, left, top, atlasDelta, atlasLeft)
{
	atlasDelta = (atlasDelta != null) ? atlasDelta : 32;
	left = (EditorUi.compactUi) ? left : atlasLeft;
	
	menu.style.whiteSpace = 'nowrap';
	menu.style.overflow = 'hidden';
	menu.style.position = 'relative';
	menu.innerHTML = '<div class="geSprite ' + sprite + '" style="margin-left:' + left + 'px;margin-top:' + top + 'px;"></div>' +
		this.dropdownImageHtml;
	menu.style.width = (atlasWidth - atlasDelta) + 'px';

	// Fix for item size in kennedy theme
	if (EditorUi.compactUi)
	{
		menu.getElementsByTagName('img')[0].style.left = '24px';
		menu.getElementsByTagName('img')[0].style.top = '5px';
		menu.style.width = (width - 10) + 'px';
	}
};

/**
 * Sets the current font name.
 */
Toolbar.prototype.setFontName = function(value)
{
	if (this.fontMenu != null)
	{
		this.fontMenu.innerHTML = '<div style="width:60px;overflow:hidden;display:inline-block;">' +
			htmlEntities(value) + '</div>' + this.dropdownImageHtml;
	}
};

/**
 * Sets the current font name.
 */
Toolbar.prototype.setFontSize = function(value)
{
	if (this.sizeMenu != null)
	{
		this.sizeMenu.innerHTML = '<div style="width:24px;overflow:hidden;display:inline-block;">' +
			htmlEntities(value) + '</div>' + this.dropdownImageHtml;
	}
};

/**
 * Hides the current menu.
 */
Toolbar.prototype.createTextToolbar = function()
{
	let graph = this.editorUi.editor.graph;

	let styleElt = this.addMenu('', Translations.get('style'), true, 'formatBlock');
	styleElt.style.position = 'relative';
	styleElt.style.whiteSpace = 'nowrap';
	styleElt.style.overflow = 'hidden';
	styleElt.innerHTML = Translations.get('style') + this.dropdownImageHtml;
	
	if (EditorUi.compactUi)
	{
		styleElt.style.paddingRight = '18px';
		styleElt.getElementsByTagName('img')[0].style.right = '1px';
		styleElt.getElementsByTagName('img')[0].style.top = '5px';
	}
	
	this.addSeparator();
	
	this.fontMenu = this.addMenu('', Translations.get('fontFamily'), true, 'fontFamily');
	this.fontMenu.style.position = 'relative';
	this.fontMenu.style.whiteSpace = 'nowrap';
	this.fontMenu.style.overflow = 'hidden';
	this.fontMenu.style.width = '60px';
	
	this.setFontName(Menus.prototype.defaultFont);
	
	if (EditorUi.compactUi)
	{
		this.fontMenu.style.paddingRight = '18px';
		this.fontMenu.getElementsByTagName('img')[0].style.right = '1px';
		this.fontMenu.getElementsByTagName('img')[0].style.top = '5px';
	}
	
	this.addSeparator();
	
	this.sizeMenu = this.addMenu(Menus.prototype.defaultFontSize, Translations.get('fontSize'), true, 'fontSize');
	this.sizeMenu.style.position = 'relative';
	this.sizeMenu.style.whiteSpace = 'nowrap';
	this.sizeMenu.style.overflow = 'hidden';
	this.sizeMenu.style.width = '24px';
	
	this.setFontSize(Menus.prototype.defaultFontSize);
	
	if (EditorUi.compactUi)
	{
		this.sizeMenu.style.paddingRight = '18px';
		this.sizeMenu.getElementsByTagName('img')[0].style.right = '1px';
		this.sizeMenu.getElementsByTagName('img')[0].style.top = '5px';
	}
	
	let elts = this.addItems(['-', 'undo', 'redo','-', 'bold', 'italic', 'underline']);
	elts[1].setAttribute('title', Translations.get('undo') + ' (' + this.editorUi.actions.get('undo').shortcut + ')');
	elts[2].setAttribute('title', Translations.get('redo') + ' (' + this.editorUi.actions.get('redo').shortcut + ')');
	elts[4].setAttribute('title', Translations.get('bold') + ' (' + this.editorUi.actions.get('bold').shortcut + ')');
	elts[5].setAttribute('title', Translations.get('italic') + ' (' + this.editorUi.actions.get('italic').shortcut + ')');
	elts[6].setAttribute('title', Translations.get('underline') + ' (' + this.editorUi.actions.get('underline').shortcut + ')');

	// KNOWN: Lost focus after click on submenu with text (not icon) in quirks and IE8. This is because the TD seems
	// to catch the focus on click in these browsers. NOTE: Workaround in mxPopupMenu for icon items (without text).
	let alignMenu = this.addMenuFunction('', Translations.get('align'), false, ((menu) =>
	{
		elt = menu.addItem('', null, ((evt) =>
		{
			graph.cellEditor.alignText(mxConstants.ALIGN_LEFT, evt);
		}), null, 'geIcon geSprite geSprite-left');
		elt.setAttribute('title', Translations.get('left'));

		elt = menu.addItem('', null, ((evt) =>
		{
			graph.cellEditor.alignText(mxConstants.ALIGN_CENTER, evt);
		}), null, 'geIcon geSprite geSprite-center');
		elt.setAttribute('title', Translations.get('center'));

		elt = menu.addItem('', null, ((evt) =>
		{
			graph.cellEditor.alignText(mxConstants.ALIGN_RIGHT, evt);
		}), null, 'geIcon geSprite geSprite-right');
		elt.setAttribute('title', Translations.get('right'));

		elt = menu.addItem('', null, (() =>
		{
			document.execCommand('justifyfull', false, null);
		}), null, 'geIcon geSprite geSprite-justifyfull');
		elt.setAttribute('title', Translations.get('justifyfull'));
		
		elt = menu.addItem('', null, (() =>
		{
			document.execCommand('insertorderedlist', false, null);
		}), null, 'geIcon geSprite geSprite-orderedlist');
		elt.setAttribute('title', Translations.get('numberedList'));
		
		elt = menu.addItem('', null, (() =>
		{
			document.execCommand('insertunorderedlist', false, null);
		}), null, 'geIcon geSprite geSprite-unorderedlist');
		elt.setAttribute('title', Translations.get('bulletedList'));
		
		elt = menu.addItem('', null, (() =>
		{
			document.execCommand('outdent', false, null);
		}), null, 'geIcon geSprite geSprite-outdent');
		elt.setAttribute('title', Translations.get('decreaseIndent'));
		
		elt = menu.addItem('', null, (() =>
		{
			document.execCommand('indent', false, null);
		}), null, 'geIcon geSprite geSprite-indent');
		elt.setAttribute('title', Translations.get('increaseIndent'));
	}));

	alignMenu.style.position = 'relative';
	alignMenu.style.whiteSpace = 'nowrap';
	alignMenu.style.overflow = 'hidden';
	alignMenu.innerHTML = '<div class="geSprite geSprite-left" style="margin-left:-2px;"></div>' + this.dropdownImageHtml;
	alignMenu.style.width = '30px';

	if (EditorUi.compactUi)
	{
		alignMenu.getElementsByTagName('img')[0].style.left = '22px';
		alignMenu.getElementsByTagName('img')[0].style.top = '5px';
	}
	
	let formatMenu = this.addMenuFunction('', Translations.get('format'), false, ((menu) =>
	{
		elt = menu.addItem('', null, this.editorUi.actions.get('subscript').funct,
			null, 'geIcon geSprite geSprite-subscript');
		elt.setAttribute('title', Translations.get('subscript') + ' (' + Editor.ctrlKey + '+,)');

		elt = menu.addItem('', null, this.editorUi.actions.get('superscript').funct,
			null, 'geIcon geSprite geSprite-superscript');
		elt.setAttribute('title', Translations.get('superscript') + ' (' + Editor.ctrlKey + '+.)');

		// KNOWN: IE+FF don't return keyboard focus after color dialog (calling focus doesn't help)
		elt = menu.addItem('', null, this.editorUi.actions.get('fontColor').funct,
			null, 'geIcon geSprite geSprite-fontcolor');
		elt.setAttribute('title', Translations.get('fontColor'));
		
		elt = menu.addItem('', null, this.editorUi.actions.get('backgroundColor').funct,
			null, 'geIcon geSprite geSprite-fontbackground');
		elt.setAttribute('title', Translations.get('backgroundColor'));
		
		elt = menu.addItem('', null, (() =>
		{
			document.execCommand('removeformat', false, null);
		}), null, 'geIcon geSprite geSprite-removeformat');
		elt.setAttribute('title', Translations.get('removeFormat'));
	}));

	formatMenu.style.position = 'relative';
	formatMenu.style.whiteSpace = 'nowrap';
	formatMenu.style.overflow = 'hidden';
	formatMenu.innerHTML = '<div class="geSprite geSprite-dots" style="margin-left:-2px;"></div>' +
		this.dropdownImageHtml;
	formatMenu.style.width = '30px';

	if (EditorUi.compactUi)
	{
		formatMenu.getElementsByTagName('img')[0].style.left = '22px';
		formatMenu.getElementsByTagName('img')[0].style.top = '5px';
	}

	this.addSeparator();

	this.addButton('geIcon geSprite geSprite-code', Translations.get('html'), function()
	{
		graph.cellEditor.toggleViewMode();
		
		if (graph.cellEditor.textarea.innerHTML.length > 0 && (graph.cellEditor.textarea.innerHTML != '&nbsp;' || !graph.cellEditor.clearOnChange))
		{
			window.setTimeout(function()
			{
				document.execCommand('selectAll', false, null);
			});
		}
	});
	
	this.addSeparator();
	
	let insertMenu = this.addMenuFunction('', Translations.get('insert'), true, ((menu) =>
	{
		menu.addItem(Translations.get('insertLink'), null, (() =>
		{
			this.editorUi.actions.get('link').funct();
		}));
		
		menu.addItem(Translations.get('insertImage'), null, (() =>
		{
			this.editorUi.actions.get('image').funct();
		}));
		
		menu.addItem(Translations.get('insertHorizontalRule'), null, (() =>
		{
			document.execCommand('inserthorizontalrule', false, null);
		}));
	}));
	
	insertMenu.style.whiteSpace = 'nowrap';
	insertMenu.style.overflow = 'hidden';
	insertMenu.style.position = 'relative';
	insertMenu.innerHTML = '<div class="geSprite geSprite-plus" style="margin-left:-4px;margin-top:-3px;"></div>' +
		this.dropdownImageHtml;
	insertMenu.style.width = '16px';
	
	// Fix for item size in kennedy theme
	if (EditorUi.compactUi)
	{
		insertMenu.getElementsByTagName('img')[0].style.left = '24px';
		insertMenu.getElementsByTagName('img')[0].style.top = '5px';
		insertMenu.style.width = '30px';
	}
	
	this.addSeparator();
	
	// KNOWN: All table stuff does not work with undo/redo
	// KNOWN: Lost focus after click on submenu with text (not icon) in quirks and IE8. This is because the TD seems
	// to catch the focus on click in these browsers. NOTE: Workaround in mxPopupMenu for icon items (without text).
	let elt = this.addMenuFunction('geIcon geSprite geSprite-table', Translations.get('table'), false, ((menu) =>
	{
		let elt = graph.getSelectedElement();
		let cell = graph.getParentByNames(elt, ['TD', 'TH'], graph.cellEditor.text2);
		let row = graph.getParentByName(elt, 'TR', graph.cellEditor.text2);

		if (row == null)
    	{
			function createTable(rows, cols)
			{
				let html = ['<table>'];
				
				for (let i = 0; i < rows; i++)
				{
					html.push('<tr>');
					
					for (let j = 0; j < cols; j++)
					{
						html.push('<td><br></td>');
					}
					
					html.push('</tr>');
				}
				
				html.push('</table>');
				
				return html.join('');
			};
			
			this.editorUi.menus.addInsertTableItem(menu);
    	}
		else
    	{
			let table = graph.getParentByName(row, 'TABLE', graph.cellEditor.text2);

			elt = menu.addItem('', null, (() =>
			{
				try
				{
					graph.selectNode(graph.insertColumn(table, (cell != null) ? cell.cellIndex : 0));
				}
				catch (e)
				{
					this.editorUi.handleError(e);
				}
			}), null, 'geIcon geSprite geSprite-insertcolumnbefore');
			elt.setAttribute('title', Translations.get('insertColumnBefore'));
			
			elt = menu.addItem('', null, (() =>
			{	
				try
				{
					graph.selectNode(graph.insertColumn(table, (cell != null) ? cell.cellIndex + 1 : -1));
				}
				catch (e)
				{
					this.editorUi.handleError(e);
				}
			}), null, 'geIcon geSprite geSprite-insertcolumnafter');
			elt.setAttribute('title', Translations.get('insertColumnAfter'));

			elt = menu.addItem('Delete column', null, (() =>
			{
				if (cell != null)
				{
					try
					{
						graph.deleteColumn(table, cell.cellIndex);
					}
					catch (e)
					{
						this.editorUi.handleError(e);
					}
				}
			}), null, 'geIcon geSprite geSprite-deletecolumn');
			elt.setAttribute('title', Translations.get('deleteColumn'));
			
			elt = menu.addItem('', null, (() =>
			{
				try
				{
					graph.selectNode(graph.insertRow(table, row.sectionRowIndex));
				}
				catch (e)
				{
					this.editorUi.handleError(e);
				}
			}), null, 'geIcon geSprite geSprite-insertrowbefore');
			elt.setAttribute('title', Translations.get('insertRowBefore'));

			elt = menu.addItem('', null, (() =>
			{
				try
				{
					graph.selectNode(graph.insertRow(table, row.sectionRowIndex + 1));
				}
				catch (e)
				{
					this.editorUi.handleError(e);
				}
			}), null, 'geIcon geSprite geSprite-insertrowafter');
			elt.setAttribute('title', Translations.get('insertRowAfter'));

			elt = menu.addItem('', null, (() =>
			{
				try
				{
					graph.deleteRow(table, row.sectionRowIndex);
				}
				catch (e)
				{
					this.editorUi.handleError(e);
				}
			}), null, 'geIcon geSprite geSprite-deleterow');
			elt.setAttribute('title', Translations.get('deleteRow'));
			
			elt = menu.addItem('', null, (() =>
			{
				// Converts rgb(r,g,b) values
				let color = table.style.borderColor.replace(
					    /\brgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g,
					    function($0, $1, $2, $3) {
					        return "#" + ("0"+Number($1).toString(16)).substr(-2) + ("0"+Number($2).toString(16)).substr(-2) + ("0"+Number($3).toString(16)).substr(-2);
					    });
				this.editorUi.pickColor(color, function(newColor)
				{
					if (newColor == null || newColor == mxConstants.NONE)
					{
						table.removeAttribute('border');
						table.style.border = '';
						table.style.borderCollapse = '';
					}
					else
					{
						table.setAttribute('border', '1');
						table.style.border = '1px solid ' + newColor;
						table.style.borderCollapse = 'collapse';
					}
				});
			}), null, 'geIcon geSprite geSprite-strokecolor');
			elt.setAttribute('title', Translations.get('borderColor'));
			
			elt = menu.addItem('', null, (() =>
			{
				// Converts rgb(r,g,b) values
				let color = table.style.backgroundColor.replace(
					    /\brgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g,
					    function($0, $1, $2, $3) {
					        return "#" + ("0"+Number($1).toString(16)).substr(-2) + ("0"+Number($2).toString(16)).substr(-2) + ("0"+Number($3).toString(16)).substr(-2);
					    });
				this.editorUi.pickColor(color, function(newColor)
				{
					if (newColor == null || newColor == mxConstants.NONE)
					{
						table.style.backgroundColor = '';
					}
					else
					{
						table.style.backgroundColor = newColor;
					}
				});
			}), null, 'geIcon geSprite geSprite-fillcolor');
			elt.setAttribute('title', Translations.get('backgroundColor'));
			
			elt = menu.addItem('', null, (() =>
			{
				let value = table.getAttribute('cellPadding') || 0;
				
				let dlg = new FilenameDialog(this.editorUi, value, Translations.get('apply'), ((newValue) =>
				{
					if (newValue != null && newValue.length > 0)
					{
						table.setAttribute('cellPadding', newValue);
					}
					else
					{
						table.removeAttribute('cellPadding');
					}
				}), Translations.get('spacing'));
				this.editorUi.showDialog(dlg.container, 300, 80, true, true);
				dlg.init();
			}), null, 'geIcon geSprite geSprite-fit');
			elt.setAttribute('title', Translations.get('spacing'));
			
			elt = menu.addItem('', null, (() =>
			{
				table.setAttribute('align', 'left');
			}), null, 'geIcon geSprite geSprite-left');
			elt.setAttribute('title', Translations.get('left'));

			elt = menu.addItem('', null, (() =>
			{
				table.setAttribute('align', 'center');
			}), null, 'geIcon geSprite geSprite-center');
			elt.setAttribute('title', Translations.get('center'));
				
			elt = menu.addItem('', null, (() =>
			{
				table.setAttribute('align', 'right');
			}), null, 'geIcon geSprite geSprite-right');
			elt.setAttribute('title', Translations.get('right'));
    	}
	}));
	
	elt.style.position = 'relative';
	elt.style.whiteSpace = 'nowrap';
	elt.style.overflow = 'hidden';
	elt.innerHTML = '<div class="geSprite geSprite-table" style="margin-left:-2px;"></div>' + this.dropdownImageHtml;
	elt.style.width = '30px';

	// Fix for item size in kennedy theme
	if (EditorUi.compactUi)
	{
		elt.getElementsByTagName('img')[0].style.left = '22px';
		elt.getElementsByTagName('img')[0].style.top = '5px';
	}
};

/**
 * Hides the current menu.
 */
Toolbar.prototype.hideMenu = function()
{
	this.editorUi.hideCurrentMenu();
};

/**
 * Adds a label to the toolbar.
 */
Toolbar.prototype.addMenu = function(label, tooltip, showLabels, name, c, showAll, ignoreState)
{
	let menu = this.editorUi.menus.get(name);
	let elt = this.addMenuFunction(label, tooltip, showLabels, function()
	{
		menu.funct.apply(menu, arguments);
	}, c, showAll);
	
	// Workaround for possible not a function
	// when extending HTML objects
	if (!ignoreState && typeof elt.setEnabled === 'function')
	{
		menu.addListener('stateChanged', function()
		{
			elt.setEnabled(menu.enabled);
		});
	}
	
	return elt;
};

/**
 * Adds a label to the toolbar.
 */
Toolbar.prototype.addMenuFunction = function(label, tooltip, showLabels, funct, c, showAll)
{
	return this.addMenuFunctionInContainer((c != null) ? c : this.container, label, tooltip, showLabels, funct, showAll);
};

/**
 * Adds a label to the toolbar.
 */
Toolbar.prototype.addMenuFunctionInContainer = function(container, label, tooltip, showLabels, funct, showAll)
{
	let elt = (showLabels) ? this.createLabel(label) : this.createButton(label);
	this.initElement(elt, tooltip);
	this.addMenuHandler(elt, showLabels, funct, showAll);
	container.appendChild(elt);
	
	return elt;
};

/**
 * Adds a separator to the separator.
 */
Toolbar.prototype.addSeparator = function(c)
{
	c = (c != null) ? c : this.container;
	let elt = document.createElement('div');
	elt.className = 'geSeparator';
	c.appendChild(elt);
	
	return elt;
};

/**
 * Adds given action item
 */
Toolbar.prototype.addItems = function(keys, c, ignoreDisabled)
{
	let items = [];
	
	for (let i = 0; i < keys.length; i++)
	{
		let key = keys[i];
		
		if (key == '-')
		{
			items.push(this.addSeparator(c));
		}
		else
		{
			items.push(this.addItem('geSprite-' + key.toLowerCase(), key, c, ignoreDisabled));
		}
	}
	
	return items;
};

/**
 * Adds given action item
 */
Toolbar.prototype.addItem = function(sprite, key, c, ignoreDisabled)
{
	let action = this.editorUi.actions.get(key);
	let elt = null;
	
	if (action != null)
	{
		let tooltip = action.label;
		
		if (action.shortcut != null)
		{
			tooltip += ' (' + action.shortcut + ')';
		}
		
		elt = this.addButton(sprite, tooltip, action.funct, c);

		// Workaround for possible not a function
		// when extending HTML objects
		if (!ignoreDisabled && typeof elt.setEnabled === 'function')
		{
			elt.setEnabled(action.enabled);
			
			action.addListener('stateChanged', function()
			{
				elt.setEnabled(action.enabled);
			});
		}
	}
	
	return elt;
};

/**
 * Adds a button to the toolbar.
 */
Toolbar.prototype.addButton = function(classname, tooltip, funct, c)
{
	let elt = this.createButton(classname);
	c = (c != null) ? c : this.container;
	
	this.initElement(elt, tooltip);
	this.addClickHandler(elt, funct);
	c.appendChild(elt);
	
	return elt;
};

/**
 * Initializes the given toolbar element.
 */
Toolbar.prototype.initElement = function(elt, tooltip)
{
	// Adds tooltip
	if (tooltip != null)
	{
		elt.setAttribute('title', tooltip);
	}

	this.addEnabledState(elt);
};

/**
 * Adds enabled state with setter to DOM node (avoids JS wrapper).
 */
Toolbar.prototype.addEnabledState = function(elt)
{
	let classname = elt.className;
	
	elt.setEnabled = function(value)
	{
		elt.enabled = value;
		
		if (value)
		{
			elt.className = classname;
		}
		else
		{
			elt.className = classname + ' mxDisabled';
		}
	};
	
	elt.setEnabled(true);
};

/**
 * Adds enabled state with setter to DOM node (avoids JS wrapper).
 */
Toolbar.prototype.addClickHandler = function(elt, funct)
{
	if (funct != null)
	{
		mxEvent.addListener(elt, 'click', function(evt)
		{
			if (elt.enabled)
			{
				funct(evt);
			}
			
			mxEvent.consume(evt);
		});
		
		// Prevents focus
	    mxEvent.addListener(elt, (Client.IS_POINTER) ? 'pointerdown' : 'mousedown',
        	((evt) =>
    	{
			evt.preventDefault();
		}));
	}
};

/**
 * Creates and returns a new button.
 */
Toolbar.prototype.createButton = function(classname)
{
	let elt = document.createElement('a');
	elt.className = 'geButton';

	let inner = document.createElement('div');
	
	if (classname != null)
	{
		inner.className = 'geSprite ' + classname;
	}
	
	elt.appendChild(inner);
	
	return elt;
};

/**
 * Creates and returns a new button.
 */
Toolbar.prototype.createLabel = function(label, tooltip)
{
	let elt = document.createElement('a');
	elt.className = 'geLabel';
	write(elt, label);
	
	return elt;
};

/**
 * Adds a handler for showing a menu in the given element.
 */
Toolbar.prototype.addMenuHandler = function(elt, showLabels, funct, showAll)
{
	if (funct != null)
	{
		let graph = this.editorUi.editor.graph;
		let menu = null;
		let show = true;

		mxEvent.addListener(elt, 'click', ((evt) =>
		{
			if (show && (elt.enabled == null || elt.enabled))
			{
				graph.getPlugin('PopupMenuHandler').hideMenu();
				menu = new mxPopupMenu(funct);
				menu.div.className += ' geToolbarMenu';
				menu.showDisabled = showAll;
				menu.labels = showLabels;
				menu.autoExpand = true;
				
				let offset = getOffset(elt);
				menu.popup(offset.x, offset.y + elt.offsetHeight, null, evt);
				this.editorUi.setCurrentMenu(menu, elt);
				
				// Workaround for scrollbar hiding menu items
				if (!showLabels && menu.div.scrollHeight > menu.div.clientHeight)
				{
					menu.div.style.width = '40px';
				}
				
				menu.hideMenu = (() =>
				{
					mxPopupMenu.prototype.hideMenu.apply(menu, arguments);
					this.editorUi.resetCurrentMenu();
					menu.destroy();
				});
				
				// Extends destroy to reset global state
				menu.addListener(mxEvent.EVENT_HIDE, (() =>
				{
					this.currentElt = null;
				}));
			}
			
			show = true;
			mxEvent.consume(evt);
		}));

		// Hides menu if already showing and prevents focus
        mxEvent.addListener(elt, (Client.IS_POINTER) ? 'pointerdown' : 'mousedown',
        	((evt) =>
		{
			show = this.currentElt != elt;
			evt.preventDefault();
		}));
	}
};

/**
 * Adds a handler for showing a menu in the given element.
 */
Toolbar.prototype.destroy = function()
{
	if (this.gestureHandler != null)
	{	
		mxEvent.removeGestureListeners(document, this.gestureHandler);
		this.gestureHandler = null;
	}
};
