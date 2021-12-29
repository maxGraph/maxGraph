/**
 * Copyright (c) 2006-2012, JGraph Ltd
 */
const { getOffset } = require('../../../../../packages/core/src/util/utils');
const { getValue } = require('../../../../../packages/core/src/util/utils');
const { write } = require('../../../../../packages/core/src/util/domUtils');
/**
 * Constructs a new graph editor
 */
Menus = function(editorUi)
{
	this.editorUi = editorUi;
	this.menus = {};
	this.init();
	
	// Pre-fetches checkmark image
	if (!Client.IS_SVG)
	{
		new Image().src = this.checkmarkImage;
	}
};

/**
 * Sets the default font family.
 */
Menus.prototype.defaultFont = 'Helvetica';

/**
 * Sets the default font size.
 */
Menus.prototype.defaultFontSize = '12';

/**
 * Sets the default font size.
 */
Menus.prototype.defaultMenuItems = ['file', 'edit', 'view', 'arrange', 'extras', 'help'];

/**
 * Adds the label menu items to the given menu and parent.
 */
Menus.prototype.defaultFonts = ['Helvetica', 'Verdana', 'Times New Roman', 'Garamond', 'Comic Sans MS',
           		             'Courier New', 'Georgia', 'Lucida Console', 'Tahoma'];

/**
 * Adds the label menu items to the given menu and parent.
 */
Menus.prototype.init = function()
{
	let graph = this.editorUi.editor.graph;
	let isGraphEnabled = bind(graph, graph.isEnabled);

	this.customFonts = [];
	this.customFontSizes = [];

	this.put('fontFamily', new Menu(((menu, parent) =>
	{
		let addItem = ((fontname) =>
		{
			let tr = this.styleChange(menu, fontname, .fontFamily, [fontname], null, parent, function()
			{
				document.execCommand('fontname', false, fontname);
			}, function()
			{
				graph.updateLabelElements(graph.getSelectionCells(), function(elt)
				{
					elt.removeAttribute('face');
					elt.style.fontFamily = null;
					
					if (elt.nodeName == 'PRE')
					{
						graph.replaceElement(elt, 'div');
					}
				});
			});
			tr.firstChild.nextSibling.style.fontFamily = fontname;
		});
		
		for (let i = 0; i < this.defaultFonts.length; i++)
		{
			addItem(this.defaultFonts[i]);
		}

		menu.addSeparator(parent);
		
		if (this.customFonts.length > 0)
		{
			for (let i = 0; i < this.customFonts.length; i++)
			{
				addItem(this.customFonts[i]);
			}
			
			menu.addSeparator(parent);
			
			menu.addItem(Translations.get('reset'), null, (() =>
			{
				this.customFonts = [];
				this.editorUi.fireEvent(new EventObject('customFontsChanged'));
			}), parent);
			
			menu.addSeparator(parent);
		}
		
		this.promptChange(menu, Translations.get('custom') + '...', '', mxConstants.DEFAULT_FONTFAMILY, 'fontFamily', parent, true, ((newValue) =>
		{
			if (this.customFonts.indexOf(newValue) === -1)
			{
				this.customFonts.push(newValue);
				this.editorUi.fireEvent(new EventObject('customFontsChanged'));
			}
		}));
	})));
	this.put('formatBlock', new Menu(((menu, parent) =>
	{
		function addItem(label, tag)
		{
			return menu.addItem(label, null, (() =>
			{
				// TODO: Check if visible
				if (graph.cellEditor.textarea != null)
				{
					graph.cellEditor.textarea.focus();
		      		document.execCommand('formatBlock', false, '<' + tag + '>');
				}
			}), parent);
		};
		
		addItem(Translations.get('normal'), 'p');
		
		addItem('', 'h1').firstChild.nextSibling.innerHTML = '<h1 style="margin:0px;">' + Translations.get('heading') + ' 1</h1>';
		addItem('', 'h2').firstChild.nextSibling.innerHTML = '<h2 style="margin:0px;">' + Translations.get('heading') + ' 2</h2>';
		addItem('', 'h3').firstChild.nextSibling.innerHTML = '<h3 style="margin:0px;">' + Translations.get('heading') + ' 3</h3>';
		addItem('', 'h4').firstChild.nextSibling.innerHTML = '<h4 style="margin:0px;">' + Translations.get('heading') + ' 4</h4>';
		addItem('', 'h5').firstChild.nextSibling.innerHTML = '<h5 style="margin:0px;">' + Translations.get('heading') + ' 5</h5>';
		addItem('', 'h6').firstChild.nextSibling.innerHTML = '<h6 style="margin:0px;">' + Translations.get('heading') + ' 6</h6>';
		
		addItem('', 'pre').firstChild.nextSibling.innerHTML = '<pre style="margin:0px;">' + Translations.get('formatted') + '</pre>';
		addItem('', 'blockquote').firstChild.nextSibling.innerHTML = '<blockquote style="margin-top:0px;margin-bottom:0px;">' + Translations.get('blockquote') + '</blockquote>';
	})));
	this.put('fontSize', new Menu(((menu, parent) =>
	{
		let sizes = [6, 8, 9, 10, 11, 12, 14, 18, 24, 36, 48, 72];
		
		let addItem = ((fontsize) =>
		{
			this.styleChange(menu, fontsize, .fontSize, [fontsize], null, parent, function()
			{
				if (graph.cellEditor.textarea != null)
				{
					// Creates an element with arbitrary size 3
					document.execCommand('fontSize', false, '3');
					
					// Changes the css font size of the first font element inside the in-place editor with size 3
					// hopefully the above element that we've just created. LATER: Check for new element using
					// previous result of getElementsByTagName (see other actions)
					let elts = graph.cellEditor.textarea.getElementsByTagName('font');
					
					for (let i = 0; i < elts.length; i++)
					{
						if (elts[i].getAttribute('size') == '3')
						{
							elts[i].removeAttribute('size');
							elts[i].style.fontSize = fontsize + 'px';
							
							break;
						}
					}
				}
			});
		});
		
		for (let i = 0; i < sizes.length; i++)
		{
			addItem(sizes[i]);
		}

		menu.addSeparator(parent);
		
		if (this.customFontSizes.length > 0)
		{
			for (let i = 0; i < this.customFontSizes.length; i++)
			{
				addItem(this.customFontSizes[i]);
			}
			
			menu.addSeparator(parent);
			
			menu.addItem(Translations.get('reset'), null, (() =>
			{
				this.customFontSizes = [];
			}), parent);
			
			menu.addSeparator(parent);
		}
		
		this.promptChange(menu, Translations.get('custom') + '...', '(pt)', '12', 'fontSize', parent, true, ((newValue) =>
		{
			this.customFontSizes.push(newValue);
		}));
	})));
	this.put('direction', new Menu(((menu, parent) =>
	{
		menu.addItem(Translations.get('flipH'), null, function() { graph.toggleCellStyles('flipH', false); }, parent);
		menu.addItem(Translations.get('flipV'), null, function() { graph.toggleCellStyles('flipV', false); }, parent);
		this.addMenuItems(menu, ['-', 'rotation'], parent);
	})));
	this.put('align', new Menu(((menu, parent) =>
	{
		menu.addItem(Translations.get('leftAlign'), null, function() { graph.alignCells(mxConstants.ALIGN_LEFT); }, parent);
		menu.addItem(Translations.get('center'), null, function() { graph.alignCells(mxConstants.ALIGN_CENTER); }, parent);
		menu.addItem(Translations.get('rightAlign'), null, function() { graph.alignCells(mxConstants.ALIGN_RIGHT); }, parent);
		menu.addSeparator(parent);
		menu.addItem(Translations.get('topAlign'), null, function() { graph.alignCells(mxConstants.ALIGN_TOP); }, parent);
		menu.addItem(Translations.get('middle'), null, function() { graph.alignCells(mxConstants.ALIGN_MIDDLE); }, parent);
		menu.addItem(Translations.get('bottomAlign'), null, function() { graph.alignCells(mxConstants.ALIGN_BOTTOM); }, parent);
	})));
	this.put('distribute', new Menu(((menu, parent) =>
	{
		menu.addItem(Translations.get('horizontal'), null, function() { graph.distributeCells(true); }, parent);
		menu.addItem(Translations.get('vertical'), null, function() { graph.distributeCells(false); }, parent);
	})));
	this.put('layout', new Menu(((menu, parent) =>
	{
		let promptSpacing = ((defaultValue, fn) =>
		{
			let dlg = new FilenameDialog(this.editorUi, defaultValue, Translations.get('apply'), function(newValue)
			{
				fn(parseFloat(newValue));
			}, Translations.get('spacing'));
			this.editorUi.showDialog(dlg.container, 300, 80, true, true);
			dlg.init();
		});
		
		menu.addItem(Translations.get('horizontalFlow'), null, (() =>
		{
			let layout = new HierarchicalLayout(graph, mxConstants.DIRECTION_WEST);
			
    		this.editorUi.executeLayout(function()
    		{
    			let selectionCells = graph.getSelectionCells();
    			layout.execute(graph.getDefaultParent(), selectionCells.length == 0 ? null : selectionCells);
    		}, true);
		}), parent);
		menu.addItem(Translations.get('verticalFlow'), null, (() =>
		{
			let layout = new HierarchicalLayout(graph, mxConstants.DIRECTION_NORTH);
			
    		this.editorUi.executeLayout(function()
    		{
    			let selectionCells = graph.getSelectionCells();
    			layout.execute(graph.getDefaultParent(), selectionCells.length == 0 ? null : selectionCells);
    		}, true);
		}), parent);
		menu.addSeparator(parent);
		menu.addItem(Translations.get('horizontalTree'), null, (() =>
		{
			let tmp = graph.getSelectionCell();
			let roots = null;
			
			if (tmp == null || tmp.getChildCount() == 0)
			{
				if (tmp.getEdgeCount() == 0)
				{
					roots = graph.findTreeRoots(graph.getDefaultParent());
				}
			}
			else
			{
				roots = graph.findTreeRoots(tmp);
			}

			if (roots != null && roots.length > 0)
			{
				tmp = roots[0];
			}
			
			if (tmp != null)
			{
				let layout = new CompactTreeLayout(graph, true);
				layout.edgeRouting = false;
				layout.levelDistance = 30;
				
				promptSpacing(layout.levelDistance, ((newValue) =>
				{
					layout.levelDistance = newValue;
					
					this.editorUi.executeLayout(function()
		    		{
						layout.execute(graph.getDefaultParent(), tmp);
		    		}, true);
				}));
			}
		}), parent);
		menu.addItem(Translations.get('verticalTree'), null, (() =>
		{
			let tmp = graph.getSelectionCell();
			let roots = null;
			
			if (tmp == null || tmp.getChildCount() == 0)
			{
				if (tmp.getEdgeCount() == 0)
				{
					roots = graph.findTreeRoots(graph.getDefaultParent());
				}
			}
			else
			{
				roots = graph.findTreeRoots(tmp);
			}

			if (roots != null && roots.length > 0)
			{
				tmp = roots[0];
			}
			
			if (tmp != null)
			{
				let layout = new CompactTreeLayout(graph, false);
				layout.edgeRouting = false;
				layout.levelDistance = 30;
				
				promptSpacing(layout.levelDistance, ((newValue) =>
				{
					layout.levelDistance = newValue;
					
					this.editorUi.executeLayout(function()
		    		{
						layout.execute(graph.getDefaultParent(), tmp);
		    		}, true);
				}));
			}
		}), parent);
		menu.addItem(Translations.get('radialTree'), null, (() =>
		{
			let tmp = graph.getSelectionCell();
			let roots = null;
			
			if (tmp == null || tmp.getChildCount() == 0)
			{
				if (tmp.getEdgeCount() == 0)
				{
					roots = graph.findTreeRoots(graph.getDefaultParent());
				}
			}
			else
			{
				roots = graph.findTreeRoots(tmp);
			}

			if (roots != null && roots.length > 0)
			{
				tmp = roots[0];
			}
			
			if (tmp != null)
			{
				let layout = new RadialTreeLayout(graph, false);
				layout.levelDistance = 80;
				layout.autoRadius = true;
				
				promptSpacing(layout.levelDistance, ((newValue) =>
				{
					layout.levelDistance = newValue;
					
					this.editorUi.executeLayout(function()
		    		{
		    			layout.execute(graph.getDefaultParent(), tmp);
		    			
		    			if (!graph.isSelectionEmpty())
		    			{
			    			tmp = tmp.getParent();
			    			
			    			if (tmp.isVertex())
			    			{
			    				graph.updateGroupBounds([tmp], graph.gridSize * 2, true);
			    			}
		    			}
		    		}, true);
				}));
			}
		}), parent);
		menu.addSeparator(parent);
		menu.addItem(Translations.get('organic'), null, (() =>
		{
			let layout = new MxFastOrganicLayout(graph);
			
			promptSpacing(layout.forceConstant, ((newValue) =>
			{
				layout.forceConstant = newValue;
				
	    		this.editorUi.executeLayout(function()
	    		{
	    			let tmp = graph.getSelectionCell();
	    			
	    			if (tmp == null || tmp.getChildCount() == 0)
	    			{
	    				tmp = graph.getDefaultParent();
	    			}
	    			
	    			layout.execute(tmp);
	    			
	    			if (tmp.isVertex())
	    			{
	    				graph.updateGroupBounds([tmp], graph.gridSize * 2, true);
	    			}
	    		}, true);
			}));
		}), parent);
		menu.addItem(Translations.get('circle'), null, (() =>
		{
			let layout = new CircleLayout(graph);
			
    		this.editorUi.executeLayout(function()
    		{
    			let tmp = graph.getSelectionCell();
    			
    			if (tmp == null || tmp.getChildCount() == 0)
    			{
    				tmp = graph.getDefaultParent();
    			}
    			
    			layout.execute(tmp);
    			
    			if (tmp.isVertex())
    			{
    				graph.updateGroupBounds([tmp], graph.gridSize * 2, true);
    			}
    		}, true);
		}), parent);
	})));
	this.put('navigation', new Menu(((menu, parent) =>
	{
		this.addMenuItems(menu, ['home', '-', 'exitGroup', 'enterGroup', '-', 'expand', 'collapse', '-', 'collapsible'], parent);
	})));
	this.put('arrange', new Menu(((menu, parent) =>
	{
		this.addMenuItems(menu, ['toFront', 'toBack', '-'], parent);
		this.addSubmenu('direction', menu, parent);
		this.addMenuItems(menu, ['turn', '-'], parent);
		this.addSubmenu('align', menu, parent);
		this.addSubmenu('distribute', menu, parent);
		menu.addSeparator(parent);
		this.addSubmenu('navigation', menu, parent);
		this.addSubmenu('insert', menu, parent);
		this.addSubmenu('layout', menu, parent);
		this.addMenuItems(menu, ['-', 'group', 'ungroup', 'removeFromGroup', '-', 'clearWaypoints', 'autosize'], parent);
	}))).isEnabled = isGraphEnabled;
	this.put('insert', new Menu(((menu, parent) =>
	{
		this.addMenuItems(menu, ['insertLink', 'insertImage'], parent);
	})));
	this.put('view', new Menu(((menu, parent) =>
	{
		this.addMenuItems(menu, ((this.editorUi.format != null) ? ['formatPanel'] : []).
			concat(['outline', 'layers', '-', 'pageView', 'pageScale', '-', 'scrollbars', 'tooltips', '-',
			        'grid', 'guides', '-', 'connectionArrows', 'connectionPoints', '-',
			        'resetView', 'zoomIn', 'zoomOut'], parent));
	})));
	// Two special dropdowns that are only used in the toolbar
	this.put('viewPanels', new Menu(((menu, parent) =>
	{
		if (this.editorUi.format != null)
		{
			this.addMenuItems(menu, ['formatPanel'], parent);
		}
		
		this.addMenuItems(menu, ['outline', 'layers'], parent);
	})));
	this.put('viewZoom', new Menu(((menu, parent) =>
	{
		this.addMenuItems(menu, ['resetView', '-'], parent);
		let scales = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
		
		for (let i = 0; i < scales.length; i++)
		{
			(function(scale)
			{
				menu.addItem((scale * 100) + '%', null, function()
				{
					graph.zoomTo(scale);
				}, parent);
			})(scales[i]);
		}

		this.addMenuItems(menu, ['-', 'fitWindow', 'fitPageWidth', 'fitPage', 'fitTwoPages', '-', 'customZoom'], parent);
	})));
	this.put('file', new Menu(((menu, parent) =>
	{
		this.addMenuItems(menu, ['new', 'open', '-', 'save', 'saveAs', '-', 'import', 'export', '-', 'pageSetup', 'print'], parent);
	})));
	this.put('edit', new Menu(((menu, parent) =>
	{
		this.addMenuItems(menu, ['undo', 'redo', '-', 'cut', 'copy', 'paste', 'delete', '-', 'duplicate', '-',
			'editData', 'editTooltip', '-', 'editStyle', '-', 'edit', '-', 'editLink', 'openLink', '-',
			'selectVertices', 'selectEdges', 'selectAll', 'selectNone', '-', 'lockUnlock']);
	})));
	this.put('extras', new Menu(((menu, parent) =>
	{
		this.addMenuItems(menu, ['copyConnect', 'collapseExpand', '-', 'editDiagram']);
	})));
	this.put('help', new Menu(((menu, parent) =>
	{
		this.addMenuItems(menu, ['help', '-', 'about']);
	})));
};

/**
 * Adds the label menu items to the given menu and parent.
 */
Menus.prototype.put = function(name, menu)
{
	this.menus[name] = menu;
	
	return menu;
};

/**
 * Adds the label menu items to the given menu and parent.
 */
Menus.prototype.get = function(name)
{
	return this.menus[name];
};

/**
 * Adds the given submenu.
 */
Menus.prototype.addSubmenu = function(name, menu, parent, label)
{
	let entry = this.get(name);
	
	if (entry != null)
	{
		let enabled = entry.isEnabled();
	
		if (menu.showDisabled || enabled)
		{
			let submenu = menu.addItem(label || Translations.get(name), null, null, parent, null, enabled);
			this.addMenu(name, menu, submenu);
		}
	}
};

/**
 * Adds the label menu items to the given menu and parent.
 */
Menus.prototype.addMenu = function(name, popupMenu, parent)
{
	let menu = this.get(name);
	
	if (menu != null && (popupMenu.showDisabled || menu.isEnabled()))
	{
		this.get(name).execute(popupMenu, parent);
	}
};

/**
 * Adds a menu item to insert a table cell.
 */
Menus.prototype.addInsertTableCellItem = function(menu, parent)
{
	let graph = this.editorUi.editor.graph;
	
	this.addInsertTableItem(menu, ((evt, rows, cols) =>
	{
		let table = (mxEvent.isControlDown(evt) || mxEvent.isMetaDown(evt)) ?
			graph.createCrossFunctionalSwimlane(rows, cols) :
			graph.createTable(rows, cols, null, null,
			(mxEvent.isShiftDown(evt)) ? 'Table' : null);
		let pt = (mxEvent.isAltDown(evt)) ? graph.getFreeInsertPoint() :
			graph.getCenterInsertPoint(graph.getBoundingBoxFromGeometry([table], true));
		let select = graph.importCells([table], pt.x, pt.y);
		
		if (select != null && select.length > 0)
		{
			graph.scrollCellToVisible(select[0]);
			graph.setSelectionCells(select);
		}
	}), parent);
};	

/**
 * Adds a menu item to insert a table.
 */
Menus.prototype.addInsertTableItem = function(menu, insertFn, parent)
{
	insertFn = (insertFn != null) ? insertFn : ((evt, rows, cols) =>
	{
		let graph = this.editorUi.editor.graph;
		let td = graph.getParentByName(mxEvent.getSource(evt), 'TD');

		if (td != null && graph.cellEditor.textarea != null)
		{
			var row2 = graph.getParentByName(td, 'TR');
			
			// To find the new link, we create a list of all existing links first
    		// LATER: Refactor for reuse with code for finding inserted image below
			let tmp = graph.cellEditor.textarea.getElementsByTagName('table');
			let oldTables = [];
			
			for (let i = 0; i < tmp.length; i++)
			{
				oldTables.push(tmp[i]);
			}
			
			// Finding the new table will work with insertHTML, but IE does not support that
			graph.container.focus();
			graph.pasteHtmlAtCaret(createTable(rows, cols));
			
			// Moves cursor to first table cell
			let newTables = graph.cellEditor.textarea.getElementsByTagName('table');
			
			if (newTables.length == oldTables.length + 1)
			{
				// Inverse order in favor of appended tables
				for (let i = newTables.length - 1; i >= 0; i--)
				{
					if (i == 0 || newTables[i] != oldTables[i - 1])
					{
						graph.selectNode(newTables[i].rows[0].cells[0]);
						break;
					}
				}
			}
		}
	});
	
	// KNOWN: Does not work in IE8 standards and quirks
	let graph = this.editorUi.editor.graph;
	var row2 = null;
	let td = null;
	
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
	
	// Show table size dialog
	var elt2 = menu.addItem('', null, null, parent, null, null, null, true);
	
	// Quirks mode does not add cell padding if cell is empty, needs good old spacer solution
	let quirksCellHtml = '<img src="' + Client.imageBasePath + '/transparent.gif' + '" width="16" height="16"/>';

	function createPicker(rows, cols)
	{
		var table2 = document.createElement('table');
		table2.setAttribute('border', '1');
		table2.style.borderCollapse = 'collapse';
		table2.style.borderStyle = 'solid';

		for (let i = 0; i < rows; i++)
		{
			let row = table2.insertRow(i);
			
			for (let j = 0; j < cols; j++)
			{
				let cell = row.insertCell(-1);
			}
		}
		
		return table2;
	};

	function extendPicker(picker, rows, cols)
	{
		for (let i = picker.rows.length; i < rows; i++)
		{
			let row = picker.insertRow(i);
			
			for (let j = 0; j < picker.rows[0].cells.length; j++)
			{
				let cell = row.insertCell(-1);
			}
		}
		
		for (let i = 0; i < picker.rows.length; i++)
		{
			let row = picker.rows[i];
			
			for (let j = row.cells.length; j < cols; j++)
			{
				let cell = row.insertCell(-1);
			}
		}
	};
	
	elt2.firstChild.innerHTML = '';
	let picker = createPicker(5, 5);
	elt2.firstChild.appendChild(picker);
	
	let label = document.createElement('div');
	label.style.padding = '4px';
	label.style.fontSize = Menus.prototype.defaultFontSize + 'px';
	label.innerHTML = '1x1';
	elt2.firstChild.appendChild(label);
	
	function mouseover(e)
	{
		td = graph.getParentByName(mxEvent.getSource(e), 'TD');		
		let selected = false;
		
		if (td != null)
		{
			row2 = graph.getParentByName(td, 'TR');
			let ext = (mxEvent.isMouseEvent(e)) ? 2 : 4;
			extendPicker(picker, Math.min(20, row2.sectionRowIndex + ext), Math.min(20, td.cellIndex + ext));
			label.innerHTML = (td.cellIndex + 1) + 'x' + (row2.sectionRowIndex + 1);
			
			for (let i = 0; i < picker.rows.length; i++)
			{
				let r = picker.rows[i];
				
				for (let j = 0; j < r.cells.length; j++)
				{
					let cell = r.cells[j];
					
					if (i == row2.sectionRowIndex &&
						j == td.cellIndex)
					{
						selected = cell.style.backgroundColor == 'blue';
					}
					
					if (i <= row2.sectionRowIndex && j <= td.cellIndex)
					{
						cell.style.backgroundColor = 'blue';
					}
					else
					{
						cell.style.backgroundColor = 'transparent';
					}
				}
			}
		}
		
		mxEvent.consume(e);

		return selected;
	};
	
	mxEvent.addGestureListeners(picker, null, null, this.bind(function (e)
	{
		let selected = mouseover(e);
		
		if (td != null && row2 != null && selected)
		{
			insertFn(e, row2.sectionRowIndex + 1, td.cellIndex + 1);
			
			// Async required to block event for elements under menu
			window.setTimeout((() =>
			{
				this.editorUi.hideCurrentMenu();
			}), 0);
		}
	}));
	mxEvent.addListener(picker, 'mouseover', mouseover);
};

/**
 * Adds a style change item to the given menu.
 */
Menus.prototype.edgeStyleChange = function(menu, label, keys, values, sprite, parent, reset)
{
	return menu.addItem(label, null, (() =>
	{
		let graph = this.editorUi.editor.graph;
		graph.stopEditing(false);
		
		graph.getModel().beginUpdate();
		try
		{
			let cells = graph.getSelectionCells();
			let edges = [];
			
			for (let i = 0; i < cells.length; i++)
			{
				let cell = cells[i];
				
				if (cell.isEdge())
				{
					if (reset)
					{
						let geo = cell.getGeometry();
			
						// Resets all edge points
						if (geo != null)
						{
							geo = geo.clone();
							geo.points = null;
							graph.getModel().setGeometry(cell, geo);
						}
					}
					
					for (let j = 0; j < keys.length; j++)
					{
						graph.setCellStyles(keys[j], values[j], [cell]);
					}
					
					edges.push(cell);
				}
			}
			
			this.editorUi.fireEvent(new EventObject('styleChanged', 'keys', keys,
				'values', values, 'cells', edges));
		}
		finally
		{
			graph.getModel().endUpdate();
		}
	}), parent, sprite);
};

/**
 * Adds a style change item to the given menu.
 */
Menus.prototype.styleChange = function(menu, label, keys, values, sprite, parent, fn, post)
{
	let apply = this.createStyleChangeFunction(keys, values);
	
	return menu.addItem(label, null, (() =>
	{
		let graph = this.editorUi.editor.graph;
		
		if (fn != null && graph.cellEditor.isContentEditing())
		{
			fn();
		}
		else
		{
			apply(post);
		}
	}), parent, sprite);
};

/**
 * 
 */
Menus.prototype.createStyleChangeFunction = function(keys, values)
{
	return ((post) =>
	{
		let graph = this.editorUi.editor.graph;
		graph.stopEditing(false);
		
		graph.getModel().beginUpdate();
		try
		{
			let cells = graph.getSelectionCells();
			
			for (let i = 0; i < keys.length; i++)
			{
				graph.setCellStyles(keys[i], values[i], cells);

				// Removes CSS alignment to produce consistent output
				if (keys[i] == 'align')
				{
					graph.updateLabelElements(cells, function(elt)
					{
						elt.removeAttribute('align');
						elt.style.textAlign = null;
					});
				}
				
				// Updates autosize after font changes
				if (keys[i] == 'fontFamily')
				{
					for (let j = 0; j < cells.length; j++)
					{
						if (cells[j].getChildCount() == 0)
						{
							graph.autoSizeCell(cells[j], false);
						}
					}
				}
			}
			
			if (post != null)
			{
				post();
			}
			
			this.editorUi.fireEvent(new EventObject('styleChanged', { keys, values, cells }));
		}
		finally
		{
			graph.getModel().endUpdate();
		}
	});
};

/**
 * Adds a style change item with a prompt to the given menu.
 */
Menus.prototype.promptChange = function(menu, label, hint, defaultValue, key, parent, enabled, fn, sprite)
{
	return menu.addItem(label, null, (() =>
	{
		let graph = this.editorUi.editor.graph;
		let value = defaultValue;
    	let state = graph.getView().getState(graph.getSelectionCell());
    	
    	if (state != null)
    	{
    		value = state.style[key] || value;
    	}
    	
		let dlg = new FilenameDialog(this.editorUi, value, Translations.get('apply'), ((newValue) =>
		{
			if (newValue != null && newValue.length > 0)
			{
				graph.getModel().beginUpdate();
				try
				{
					graph.stopEditing(false);
					graph.setCellStyles(key, newValue);
				}
				finally
				{
					graph.getModel().endUpdate();
				}
				
				if (fn != null)
				{
					fn(newValue);
				}
			}
		}), Translations.get('enterValue') + ((hint.length > 0) ? (' ' + hint) : ''));
		this.editorUi.showDialog(dlg.container, 300, 80, true, true);
		dlg.init();
	}), parent, sprite, enabled);
};

/**
 * Adds a handler for showing a menu in the given element.
 */
Menus.prototype.pickColor = function(key, cmd, defaultValue)
{
	let graph = this.editorUi.editor.graph;
	let h = 226 + ((Math.ceil(ColorDialog.prototype.presetColors.length / 12) +
			Math.ceil(ColorDialog.prototype.defaultColors.length / 12)) * 17);
	
	if (cmd != null && graph.cellEditor.isContentEditing())
	{
		// Saves and restores text selection for in-place editor
		let selState = graph.cellEditor.saveSelection();
		
		let dlg = new ColorDialog(this.editorUi, defaultValue || '000000', ((color) =>
		{
			graph.cellEditor.restoreSelection(selState);
			document.execCommand(cmd, false, (color != mxConstants.NONE) ? color : 'transparent');
		}), function()
		{
			graph.cellEditor.restoreSelection(selState);
		});
		this.editorUi.showDialog(dlg.container, 230, h, true, true);
		dlg.init();
	}
	else
	{
		if (this.colorDialog == null)
		{
			this.colorDialog = new ColorDialog(this.editorUi);
		}
	
		this.colorDialog.currentColorKey = key;
		let state = graph.getView().getState(graph.getSelectionCell());
		let color = 'none';
		
		if (state != null)
		{
			color = state.style[key] || color;
		}
		
		if (color == 'none')
		{
			color = 'ffffff';
			this.colorDialog.picker.fromString('ffffff');
			this.colorDialog.colorInput.value = 'none';
		}
		else
		{
			this.colorDialog.picker.fromString(color);
		}
	
		this.editorUi.showDialog(this.colorDialog.container, 230, h, true, true);
		this.colorDialog.init();
	}
};

/**
 * Adds a handler for showing a menu in the given element.
 */
Menus.prototype.toggleStyle = function(key, defaultValue)
{
	let graph = this.editorUi.editor.graph;
	let value = graph.toggleCellStyles(key, defaultValue);
	this.editorUi.fireEvent(new EventObject('styleChanged', {
		keys: [key],
		values: [value],
		cells: graph.getSelectionCells(),
	}));
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.addMenuItem = function(menu, key, parent, trigger, sprite, label)
{
	let action = this.editorUi.actions.get(key);

	if (action != null && (menu.showDisabled || action.isEnabled()) && action.visible)
	{
		let item = menu.addItem(label || action.label, null, function()
		{
			action.funct(trigger);
		}, parent, sprite, action.isEnabled());
		
		// Adds checkmark image
		if (action.toggleAction && action.isSelected())
		{
			menu.addCheckmark(item, Editor.checkmarkImage);
		}

		this.addShortcut(item, action);
		
		return item;
	}
	
	return null;
};

/**
 * Adds a checkmark to the given menuitem.
 */
Menus.prototype.addShortcut = function(item, action)
{
	if (action.shortcut != null)
	{
		let td = item.firstChild.nextSibling.nextSibling;
		let span = document.createElement('span');
		span.style.color = 'gray';
		write(span, action.shortcut);
		td.appendChild(span);
	}
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.addMenuItems = function(menu, keys, parent, trigger, sprites)
{
	for (let i = 0; i < keys.length; i++)
	{
		if (keys[i] == '-')
		{
			menu.addSeparator(parent);
		}
		else
		{
			this.addMenuItem(menu, keys[i], parent, trigger, (sprites != null) ? sprites[i] : null);
		}
	}
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.createPopupMenu = function(menu, cell, evt)
{
	menu.smartSeparators = true;
	
	this.addPopupMenuHistoryItems(menu, cell, evt);
	this.addPopupMenuEditItems(menu, cell, evt);
	this.addPopupMenuStyleItems(menu, cell, evt);
	this.addPopupMenuArrangeItems(menu, cell, evt);
	this.addPopupMenuCellItems(menu, cell, evt);
	this.addPopupMenuSelectionItems(menu, cell, evt);
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.addPopupMenuHistoryItems = function(menu, cell, evt)
{
	if (this.editorUi.editor.graph.isSelectionEmpty())
	{
		this.addMenuItems(menu, ['undo', 'redo'], null, evt);
	}
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.addPopupMenuEditItems = function(menu, cell, evt)
{
	if (this.editorUi.editor.graph.isSelectionEmpty())
	{
		this.addMenuItems(menu, ['pasteHere'], null, evt);
	}
	else
	{
		this.addMenuItems(menu, ['delete', '-', 'cut', 'copy', '-', 'duplicate'], null, evt);
	}
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.addPopupMenuStyleItems = function(menu, cell, evt)
{
	if (this.editorUi.editor.graph.getSelectionCount() == 1)
	{
		this.addMenuItems(menu, ['-', 'setAsDefaultStyle'], null, evt);
	}
	else if (this.editorUi.editor.graph.isSelectionEmpty())
	{
		this.addMenuItems(menu, ['-', 'clearDefaultStyle'], null, evt);
	}
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.addPopupMenuArrangeItems = function(menu, cell, evt)
{
	let graph = this.editorUi.editor.graph;
	
	if (!graph.isSelectionEmpty())
	{
		this.addMenuItems(menu, ['-', 'toFront', 'toBack'], null, evt);
	}	

	if (graph.getSelectionCount() > 1)	
	{
		this.addMenuItems(menu, ['-', 'group'], null, evt);
	}
	else if (graph.getSelectionCount() == 1 && !cell.isEdge() &&
		!graph.isSwimlane(cell) && cell.getChildCount() > 0)
	{
		this.addMenuItems(menu, ['-', 'ungroup'], null, evt);
	}
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.addPopupMenuCellItems = function(menu, cell, evt)
{
	let graph = this.editorUi.editor.graph;
	cell = graph.getSelectionCell();
	let state = graph.view.getState(cell);
	menu.addSeparator();
	
	if (state != null)
	{
		let hasWaypoints = false;

		if (cell.isEdge() && getValue(state.style, 'edge', null) != 'entityRelationEdgeStyle' &&
			getValue(state.style, 'shape', null) != 'arrow')
		{
			let handler = graph.getPlugin('SelectionCellsHandler').getHandler(cell);
			let isWaypoint = false;
			
			if (handler instanceof mxEdgeHandler && handler.bends != null && handler.bends.length > 2)
			{
				let index = handler.getHandleForEvent(graph.updateMouseEvent(new InternalMouseEvent(evt)));
				
				// Configures removeWaypoint action before execution
				// Using trigger parameter is cleaner but have to find waypoint here anyway.
				let rmWaypointAction = this.editorUi.actions.get('removeWaypoint');
				rmWaypointAction.handler = handler;
				rmWaypointAction.index = index;

				isWaypoint = index > 0 && index < handler.bends.length - 1;
			}
			
			menu.addSeparator();
			this.addMenuItem(menu, 'turn', null, evt, null, Translations.get('reverse'));
			this.addMenuItems(menu, [(isWaypoint) ? 'removeWaypoint' : 'addWaypoint'], null, evt);
			
			// Adds reset waypoints option if waypoints exist
			let geo = cell.getGeometry();
			hasWaypoints = geo != null && geo.points != null && geo.points.length > 0;
		}

		if (graph.getSelectionCount() == 1 && (hasWaypoints || (cell.isVertex() &&
			cell.getEdgeCount() > 0)))
		{
			this.addMenuItems(menu, ['-', 'clearWaypoints'], null, evt);
		}
	
		if (graph.getSelectionCount() == 1)
		{
			this.addMenuItems(menu, ['-', 'editStyle', 'editData', 'editLink'], null, evt);
	
			// Shows edit image action if there is an image in the style
			if (cell.isVertex() && getValue(state.style, 'image', null) != null)
			{
				menu.addSeparator();
				this.addMenuItem(menu, 'image', null, evt).firstChild.nextSibling.innerHTML = Translations.get('editImage') + '...';
			}
		}
	}
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.addPopupMenuSelectionItems = function(menu, cell, evt)
{
	if (this.editorUi.editor.graph.isSelectionEmpty())
	{
		this.addMenuItems(menu, ['-', 'selectVertices', 'selectEdges', 'selectAll'], null, evt);
	}
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.createMenubar = function(container)
{
	let menubar = new Menubar(this.editorUi, container);
	let menus = this.defaultMenuItems;
	
	for (let i = 0; i < menus.length; i++)
	{
		(((menu) =>
		{
			let elt = menubar.addMenu(Translations.get(menus[i]), (() =>
			{
				// Allows extensions of menu.funct
				menu.funct.apply(this, arguments);
			}));
			
			this.menuCreated(menu, elt);
		}))(this.get(menus[i]));
	}

	return menubar;
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.menuCreated = function(menu, elt, className)
{
	if (elt != null)
	{
		className = (className != null) ? className : 'geItem';
		
		menu.addListener('stateChanged', function()
		{
			elt.enabled = menu.enabled;
			
			if (!menu.enabled)
			{
				elt.className = className + ' mxDisabled';
			}
			else
			{
				elt.className = className;
			}
		});
	}
};

/**
 * Construcs a new menubar for the given editor.
 */
function Menubar(editorUi, container)
{
	this.editorUi = editorUi;
	this.container = container;
};

/**
 * Adds the menubar elements.
 */
Menubar.prototype.hideMenu = function()
{
	this.editorUi.hideCurrentMenu();
};

/**
 * Adds a submenu to this menubar.
 */
Menubar.prototype.addMenu = function(label, funct, before)
{
	let elt = document.createElement('a');
	elt.className = 'geItem';
	write(elt, label);
	this.addMenuHandler(elt, funct);
	
    if (before != null)
    {
    	this.container.insertBefore(elt, before);
    }
    else
    {
    	this.container.appendChild(elt);
    }
	
	return elt;
};

/**
 * Adds a handler for showing a menu in the given element.
 */
Menubar.prototype.addMenuHandler = function(elt, funct)
{
	if (funct != null)
	{
		let show = true;
		
		let clickHandler = ((evt) =>
		{
			if (show && elt.enabled == null || elt.enabled)
			{
				this.editorUi.editor.graph.getPlugin('PopupMenuHandler').hideMenu();
				let menu = new mxPopupMenu(funct);
				menu.div.className += ' geMenubarMenu';
				menu.smartSeparators = true;
				menu.showDisabled = true;
				menu.autoExpand = true;
				
				// Disables autoexpand and destroys menu when hidden
				menu.hideMenu = (() =>
				{
					mxPopupMenu.prototype.hideMenu.apply(menu, arguments);
					this.editorUi.resetCurrentMenu();
					menu.destroy();
				});

				let offset = getOffset(elt);
				menu.popup(offset.x, offset.y + elt.offsetHeight, null, evt);
				this.editorUi.setCurrentMenu(menu, elt);
			}
			
			mxEvent.consume(evt);
		});
		
		// Shows menu automatically while in expanded state
		mxEvent.addListener(elt, 'mousemove', ((evt) =>
		{
			if (this.editorUi.currentMenu != null && this.editorUi.currentMenuElt != elt)
			{
				this.editorUi.hideCurrentMenu();
				clickHandler(evt);
			}
		}));
		
		// Hides menu if already showing and prevents focus
        mxEvent.addListener(elt, (Client.IS_POINTER) ? 'pointerdown' : 'mousedown',
        	((evt) =>
		{
			show = this.currentElt != elt;
			evt.preventDefault();
		}));

		mxEvent.addListener(elt, 'click', ((evt) =>
		{
			clickHandler(evt);
			show = true;
		}));
	}
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menubar.prototype.destroy = function()
{
	// do nothing
};

/**
 * Constructs a new action for the given parameters.
 */
function Menu(funct, enabled)
{
	EventSource.call(this);
	this.funct = funct;
	this.enabled = (enabled != null) ? enabled : true;
};

// Menu inherits from mxEventSource
extend(Menu, EventSource);

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Menu.prototype.isEnabled = function()
{
	return this.enabled;
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Menu.prototype.setEnabled = function(value)
{
	if (this.enabled != value)
	{
		this.enabled = value;
		this.fireEvent(new EventObject('stateChanged'));
	}
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Menu.prototype.execute = function(menu, parent)
{
	this.funct(menu, parent);
};

/**
 * "Installs" menus in EditorUi.
 */
EditorUi.prototype.createMenus = function()
{
	return new Menus(this);
};
