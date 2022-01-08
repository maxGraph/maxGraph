/**
 * Copyright (c) 2006-2012, JGraph Ltd
 */
const { popup } = require('../../../../../packages/core/src/util/gui/MaxWindow');
const { clearSelection } = require('../../../../../packages/core/src/util/domUtils');
const { htmlEntities } = require('../../../../../packages/core/src/util/stringUtils');
const { getXml } = require('../../../../../packages/core/src/util/xmlUtils');
const { parseXml } = require('../../../../../packages/core/src/util/xmlUtils');
const { setOpacity } = require('../../../../../packages/core/src/util/utils');
const { hasScrollbars } = require('../../../../../packages/core/src/util/utils');
const { setPrefixedStyle } = require('../../../../../packages/core/src/util/utils');
const { convertPoint } = require('../../../../../packages/core/src/util/utils');
const { getValue } = require('../../../../../packages/core/src/util/utils');
const { setStyle } = require('../../../../../packages/core/src/util/utils');
const { getCurrentStyle } = require('../../../../../packages/core/src/util/utils');
const { getOffset } = require('../../../../../packages/core/src/util/utils');
const { clone } = require('../../../../../packages/core/src/util/cloneUtils');
/**
 * Constructs a new graph editor
 */
EditorUi = function(editor, container, lightbox)
{
	EventSource.call(this);
	
	this.destroyFunctions = [];
	this.editor = editor || new Editor();
	this.container = container || document.body;
	
	let graph = this.editor.graph;
	graph.lightbox = lightbox;
	this.initialDefaultVertexStyle = clone(graph.defaultVertexStyle);
	this.initialDefaultEdgeStyle = clone(graph.defaultEdgeStyle);

	// Faster scrollwheel zoom is possible with CSS transforms
	if (graph.useCssTransforms)
	{
		this.lazyZoomDelay = 0;
	}
	
	// Pre-fetches submenu image or replaces with embedded image if supported
	if (Client.IS_SVG)
	{
		mxPopupMenu.prototype.submenuImage = 'data:image/gif;base64,R0lGODlhCQAJAIAAAP///zMzMyH5BAEAAAAALAAAAAAJAAkAAAIPhI8WebHsHopSOVgb26AAADs=';
	}
	else
	{
		new Image().src = mxPopupMenu.prototype.submenuImage;
	}

	// Pre-fetches connect image
	if (!Client.IS_SVG && ConnectionHandler.prototype.connectImage != null)
	{
		new Image().src = ConnectionHandler.prototype.connectImage.src;
	}
	
	// Disables graph and forced panning in chromeless mode
	if (this.editor.chromeless && !this.editor.editable)
	{
		this.footerHeight = 0;
		graph.isEnabled = function() { return false; };
		graph.getPlugin('PanningHandler').isForcePanningEvent = function(me)
		{
			return !mxEvent.isPopupTrigger(me.getEvent());
		};
	}
	
    // Creates the user interface
	this.actions = new Actions(this);
	this.menus = this.createMenus();
	
	if (!graph.standalone)
	{
		this.createDivs();
		this.createUi();
		this.refresh();

		// Disables HTML and text selection
		let textEditing =  ((evt) =>
		{
			if (evt == null)
			{
				evt = window.event;
			}
			
			return graph.isEditing() || (evt != null && this.isSelectionAllowed(evt));
		});
	
		// Disables text selection while not editing and no dialog visible
		if (this.container == document.body)
		{
			this.menubarContainer.onselectstart = textEditing;
			this.menubarContainer.onmousedown = textEditing;
			this.toolbarContainer.onselectstart = textEditing;
			this.toolbarContainer.onmousedown = textEditing;
			this.diagramContainer.onselectstart = textEditing;
			this.diagramContainer.onmousedown = textEditing;
			this.sidebarContainer.onselectstart = textEditing;
			this.sidebarContainer.onmousedown = textEditing;
			this.formatContainer.onselectstart = textEditing;
			this.formatContainer.onmousedown = textEditing;
			this.footerContainer.onselectstart = textEditing;
			this.footerContainer.onmousedown = textEditing;
			
			if (this.tabContainer != null)
			{
				// Mouse down is needed for drag and drop
				this.tabContainer.onselectstart = textEditing;
			}
		}
		
		// And uses built-in context menu while editing
		if (!this.editor.chromeless || this.editor.editable)
		{
			// Allows context menu for links in hints
			let linkHandler = function(evt)
			{
				if (evt != null)
				{
					let source = mxEvent.getSource(evt);
					
					if (source.nodeName == 'A')
					{
						while (source != null)
						{
							if (source.className == 'geHint')
							{
								return true;
							}
							
							source = source.parentNode;
						}
					}
				}
				
				return textEditing(evt);
			};
			
			// Allows browser context menu outside of diagram and sidebar
			this.diagramContainer.oncontextmenu = linkHandler;
		}
		else
		{
			graph.getPlugin('PanningHandler').usePopupTrigger = false;
		}
	
		// Contains the main graph instance inside the given panel
		graph.init(this.diagramContainer);
	
	    // Improves line wrapping for in-place editor
	    if (Client.IS_SVG && graph.view.getDrawPane() != null)
	    {
	        let root = graph.view.getDrawPane().ownerSVGElement;
	        
	        if (root != null)
	        {
	            root.style.position = 'absolute';
	        }
	    }
	    
		// Creates hover icons
		this.hoverIcons = this.createHoverIcons();
		
		// Hides hover icons when cells are moved
		if (graph.getPlugin('SelectionHandler') != null)
		{
			let graphHandlerStart = graph.getPlugin('SelectionHandler').start;
			
			graph.getPlugin('SelectionHandler').start = function()
			{
				if (ui.hoverIcons != null)
				{
					ui.hoverIcons.reset();
				}
				
				graphHandlerStart.apply(this, arguments);
			};
		}
		
		// Adds tooltip when mouse is over scrollbars to show space-drag panning option
		mxEvent.addListener(this.diagramContainer, 'mousemove', ((evt) =>
		{
			let off = getOffset(this.diagramContainer);
			
			if (mxEvent.getClientX(evt) - off.x - this.diagramContainer.clientWidth > 0 ||
				mxEvent.getClientY(evt) - off.y - this.diagramContainer.clientHeight > 0)
			{
				this.diagramContainer.setAttribute('title', Translations.get('panTooltip'));
			}
			else
			{
				this.diagramContainer.removeAttribute('title');
			}
		}));
	
	   	// Escape key hides dialogs, adds space+drag panning
		let spaceKeyPressed = false;
		
		// Overrides hovericons to disable while space key is pressed
		let hoverIconsIsResetEvent = this.hoverIcons.isResetEvent;
		
		this.hoverIcons.isResetEvent = function(evt, allowShift)
		{
			return spaceKeyPressed || hoverIconsIsResetEvent.apply(this, arguments);
		};
		
		this.keydownHandler = ((evt) =>
		{
			if (evt.which == 32 /* Space */ && !graph.isEditing())
			{
				spaceKeyPressed = true;
				this.hoverIcons.reset();
				graph.container.style.cursor = 'move';
				
				// Disables scroll after space keystroke with scrollbars
				if (!graph.isEditing() && mxEvent.getSource(evt) == graph.container)
				{
					mxEvent.consume(evt);
				}
			}
			else if (!mxEvent.isConsumed(evt) && evt.keyCode == 27 /* Escape */)
			{
				this.hideDialog(null, true);
			}
		});
	   	
		mxEvent.addListener(document, 'keydown', this.keydownHandler);
		
		this.keyupHandler = ((evt) =>
		{
			graph.container.style.cursor = '';
			spaceKeyPressed = false;
		});
	
		mxEvent.addListener(document, 'keyup', this.keyupHandler);
	    
	    // Forces panning for middle and right mouse buttons
		let panningHandlerIsForcePanningEvent = graph.getPlugin('PanningHandler').isForcePanningEvent;
		graph.getPlugin('PanningHandler').isForcePanningEvent = function(me)
		{
			// Ctrl+left button is reported as right button in FF on Mac
			return panningHandlerIsForcePanningEvent.apply(this, arguments) ||
				spaceKeyPressed || (mxEvent.isMouseEvent(me.getEvent()) &&
				(this.usePopupTrigger || !mxEvent.isPopupTrigger(me.getEvent())) &&
				((!mxEvent.isControlDown(me.getEvent()) &&
				mxEvent.isRightMouseButton(me.getEvent())) ||
				mxEvent.isMiddleMouseButton(me.getEvent())));
		};
	
		// Ctrl/Cmd+Enter applies editing value except in Safari where Ctrl+Enter creates
		// a new line (while Enter creates a new paragraph and Shift+Enter stops)
		let cellEditorIsStopEditingEvent = graph.cellEditor.isStopEditingEvent;
		graph.cellEditor.isStopEditingEvent = function(evt)
		{
			return cellEditorIsStopEditingEvent.apply(this, arguments) ||
				(evt.keyCode == 13 && ((!Client.IS_SF && mxEvent.isControlDown(evt)) ||
				(Client.IS_MAC && mxEvent.isMetaDown(evt)) ||
				(Client.IS_SF && mxEvent.isShiftDown(evt))));
		};
				
		// Adds space+wheel for zoom
		let graphIsZoomWheelEvent = graph.isZoomWheelEvent;
		
		graph.isZoomWheelEvent = function()
		{
			return spaceKeyPressed || graphIsZoomWheelEvent.apply(this, arguments);
		};
		
		// Switches toolbar for text editing
		let textMode = false;
		let fontMenu = null;
		let sizeMenu = null;
		let nodes = null;
		
		let updateToolbar = (() =>
		{
			if (this.toolbar != null && textMode != graph.cellEditor.isContentEditing())
			{
				let node = this.toolbar.container.firstChild;
				let newNodes = [];
				
				while (node != null)
				{
					let tmp = node.nextSibling;
					
					if (this.toolbar.staticElements.indexOf(node) < 0)
					{
						node.parentNode.removeChild(node);
						newNodes.push(node);
					}
					
					node = tmp;
				}
				
				// Saves references to special items
				var tmp1 = this.toolbar.fontMenu;
				var tmp2 = this.toolbar.sizeMenu;
				
				if (nodes == null)
				{
					this.toolbar.createTextToolbar();
				}
				else
				{
					for (let i = 0; i < nodes.length; i++)
					{
						this.toolbar.container.appendChild(nodes[i]);
					}
					
					// Restores references to special items
					this.toolbar.fontMenu = fontMenu;
					this.toolbar.sizeMenu = sizeMenu;
				}
				
				textMode = graph.cellEditor.isContentEditing();
				fontMenu = tmp1;
				sizeMenu = tmp2;
				nodes = newNodes;
			}
		});
	
		let ui = this;
		
		// Overrides cell editor to update toolbar
		let cellEditorStartEditing = graph.cellEditor.startEditing;
		graph.cellEditor.startEditing = function()
		{
			cellEditorStartEditing.apply(this, arguments);
			updateToolbar();
			
			if (graph.cellEditor.isContentEditing())
			{
				let updating = false;
				
				let updateCssHandler = function()
				{
					if (!updating)
					{
						updating = true;
					
						window.setTimeout(function()
						{
							let node = graph.getSelectedEditingElement();

							if (node != null)
							{
								let css = getCurrentStyle(node);
		
								if (css != null && ui.toolbar != null)
								{
									ui.toolbar.setFontName(Graph.stripQuotes(css.fontFamily));
									ui.toolbar.setFontSize(parseInt(css.fontSize));
								}
							}
							
							updating = false;
						}, 0);
					}
				};
				
				mxEvent.addListener(graph.cellEditor.textarea, 'input', updateCssHandler)
				mxEvent.addListener(graph.cellEditor.textarea, 'touchend', updateCssHandler);
				mxEvent.addListener(graph.cellEditor.textarea, 'mouseup', updateCssHandler);
				mxEvent.addListener(graph.cellEditor.textarea, 'keyup', updateCssHandler);
				updateCssHandler();
			}
		};
		
		// Updates toolbar and handles possible errors
		let cellEditorStopEditing = graph.cellEditor.stopEditing;
		graph.cellEditor.stopEditing = function(cell, trigger)
		{
			try
			{
				cellEditorStopEditing.apply(this, arguments);
				updateToolbar();
			}
			catch (e)
			{
				ui.handleError(e);
			}
		};
		
	    // Enables scrollbars and sets cursor style for the container
		graph.container.setAttribute('tabindex', '0');
	   	graph.container.style.cursor = 'default';

		// Workaround for page scroll if embedded via iframe
		if (window.self === window.top && graph.container.parentNode != null)
		{
			try
			{
				graph.container.focus();
			}
			catch (e)
			{
				// ignores error in old versions of IE
			}
		}
	
	   	// Keeps graph container focused on mouse down
	   	let graphFireMouseEvent = graph.fireMouseEvent;
	   	graph.fireMouseEvent = function(evtName, me, sender)
	   	{
	   		if (evtName == mxEvent.MOUSE_DOWN)
	   		{
	   			this.container.focus();
	   		}
	   		
	   		graphFireMouseEvent.apply(this, arguments);
	   	};
	
	   	// Configures automatic expand on mouseover
		graph.getPlugin('PopupMenuHandler').autoExpand = true;
	
	    // Installs context menu
		if (this.menus != null)
		{
			graph.getPlugin('PopupMenuHandler').factoryMethod = ((menu, cell, evt) =>
			{
				this.menus.createPopupMenu(menu, cell, evt);
			});
		}
		
		// Hides context menu
		mxEvent.addGestureListeners(document, ((evt) =>
		{
			graph.getPlugin('PopupMenuHandler').hideMenu();
		}));
	
	    // Create handler for key events
		this.keyHandler = this.createKeyHandler(editor);
	    
		// Getter for key handler
		this.getKeyHandler = function()
		{
			return keyHandler;
		};
		
		// Stores the current style and assigns it to new cells
		let styles = ['rounded', 'shadow', 'glass', 'dashed', 'dashPattern', 'labelBackgroundColor',
			'comic', 'sketch', 'fillWeight', 'hachureGap', 'hachureAngle', 'jiggle',
			'disableMultiStroke', 'disableMultiStrokeFill', 'fillStyle', 'curveFitting',
			'simplification', 'sketchStyle'];
		let connectStyles = ['shape', 'edgeStyle', 'curved', 'rounded', 'elbow', 'jumpStyle', 'jumpSize',
			'comic', 'sketch', 'fillWeight', 'hachureGap', 'hachureAngle', 'jiggle',
			'disableMultiStroke', 'disableMultiStrokeFill', 'fillStyle', 'curveFitting',
			'simplification', 'sketchStyle'];
		
		// Note: Everything that is not in styles is ignored (styles is augmented below)
		this.setDefaultStyle = function(cell)
		{
			try
			{
				let state = graph.view.getState(cell);
				
				if (state != null)
				{
					// Ignores default styles
					let clone = cell.clone();
					clone.style = ''
					let defaultStyle = graph.getCellStyle(clone);
					let values = [];
					let keys = [];
		
					for (var key in state.style)
					{
						if (defaultStyle[key] != state.style[key])
						{
							values.push(state.style[key]);
							keys.push(key);
						}
					}
					
					// Handles special case for value "none"
					let cellStyle = state.cell ? state.cell.getStyle() : null;
					let tokens = (cellStyle != null) ? cellStyle.split(';') : [];
					
					for (let i = 0; i < tokens.length; i++)
					{
						let tmp = tokens[i];
				 		let pos = tmp.indexOf('=');
				 					 		
				 		if (pos >= 0)
				 		{
				 			let key = tmp.substring(0, pos);
				 			let value = tmp.substring(pos + 1);
				 			
				 			if (defaultStyle[key] != null && value == 'none')
				 			{
				 				values.push(value);
				 				keys.push(key);
				 			}
				 		}
					}
		
					// Resets current style
					if (state.cell.isEdge())
					{
						graph.currentEdgeStyle = {};
					}
					else
					{
						graph.currentVertexStyle = {}
					}
		
					this.fireEvent(new EventObject('styleChanged', 'keys', keys, 'values', values, 'cells', [state.cell]));
				}
			}
			catch (e)
			{
				this.handleError(e);
			}
		};
		
		this.clearDefaultStyle = function()
		{
			graph.currentEdgeStyle = clone(graph.defaultEdgeStyle);
			graph.currentVertexStyle = clone(graph.defaultVertexStyle);
			
			// Updates UI
			this.fireEvent(new EventObject('styleChanged', 'keys', [], 'values', [], 'cells', []));
		};
	
		// Keys that should be ignored if the cell has a value (known: new default for all cells is html=1 so
	    // for the html key this effecticely only works for edges inserted via the connection handler)
		let valueStyles = ['fontFamily', 'fontSource', 'fontSize', 'fontColor'];
		
		// Keys that always update the current edge style regardless of selection
		let alwaysEdgeStyles = ['edgeStyle', 'startArrow', 'startFill', 'startSize', 'endArrow',
			'endFill', 'endSize'];
		
		// Keys that are ignored together (if one appears all are ignored)
		let keyGroups = [['startArrow', 'startFill', 'startSize', 'sourcePerimeterSpacing',
						'endArrow', 'endFill', 'endSize', 'targetPerimeterSpacing'],
		                 ['strokeColor', 'strokeWidth'],
		                 ['fillColor', 'gradientColor'],
		                 valueStyles,
		                 ['opacity'],
		                 ['align'],
		                 ['html']];
		
		// Adds all keys used above to the styles array
		for (let i = 0; i < keyGroups.length; i++)
		{
			for (let j = 0; j < keyGroups[i].length; j++)
			{
				styles.push(keyGroups[i][j]);
			}
		}
		
		for (let i = 0; i < connectStyles.length; i++)
		{
			if (styles.indexOf(connectStyles[i]) < 0)
			{
				styles.push(connectStyles[i]);
			}
		}
	
		// Implements a global current style for edges and vertices that is applied to new cells
		let insertHandler = function(cells, asText, model)
		{
			model = (model != null) ? model : graph.getDataModel();
			
			model.beginUpdate();
			try
			{
				for (let i = 0; i < cells.length; i++)
				{
					let cell = cells[i];

					var appliedStyles;

					if (asText)
					{
						// Applies only basic text styles
						appliedStyles = ['fontSize', 'fontFamily', 'fontColor'];
					}
					else
					{
						// Removes styles defined in the cell style from the styles to be applied
						let cellStyle = cell.getStyle();
						let tokens = (cellStyle != null) ? cellStyle.split(';') : [];
						appliedStyles = styles.slice();
						
						for (let j = 0; j < tokens.length; j++)
						{
							let tmp = tokens[j];
					 		let pos = tmp.indexOf('=');
					 					 		
					 		if (pos >= 0)
					 		{
					 			let key = tmp.substring(0, pos);
					 			let index = indexOf(appliedStyles, key);
					 			
					 			if (index >= 0)
					 			{
					 				appliedStyles.splice(index, 1);
					 			}
					 			
					 			// Handles special cases where one defined style ignores other styles
					 			for (let k = 0; k < keyGroups.length; k++)
					 			{
					 				let group = keyGroups[k];
					 				
					 				if (group.indexOf(key) >= 0)
					 				{
					 					for (let l = 0; l < group.length; l++)
					 					{
								 			var index2 = appliedStyles.indexOf(group[l]);
								 			
								 			if (index2 >= 0)
								 			{
								 				appliedStyles.splice(index2, 1);
								 			}
					 					}
					 				}
					 			}
					 		}
						}
					}
					
					// Applies the current style to the cell
					let edge = cell.isEdge();
					let current = (edge) ? graph.currentEdgeStyle : graph.currentVertexStyle;
					let newStyle = cell.getStyle();
					
					for (let j = 0; j < appliedStyles.length; j++)
					{
						let key = appliedStyles[j];
						let styleValue = current[key];
	
						if (styleValue != null && (key != 'shape' || edge))
						{
							// Special case: Connect styles are not applied here but in the connection handler
							if (!edge || connectStyles.indexOf(key) < 0)
							{
								newStyle = setStyle(newStyle, key, styleValue);
							}
						}
					}
					
					model.setStyle(cell, newStyle);
				}
			}
			finally
			{
				model.endUpdate();
			}
		};
	
		graph.addListener('cellsInserted', function(sender, evt)
		{
			insertHandler(evt.getProperty('cells'));
		});
		
		graph.addListener('textInserted', function(sender, evt)
		{
			insertHandler(evt.getProperty('cells'), true);
		});
		
		this.insertHandler = insertHandler;
		
		graph.getPlugin('ConnectionHandler').addListener(mxEvent.CONNECT, function(sender, evt)
		{
			let cells = [evt.getProperty('cell')];
			
			if (evt.getProperty('terminalInserted'))
			{
				cells.push(evt.getProperty('terminal'));
			}
			
			insertHandler(cells);
		});
	
		this.addListener('styleChanged', ((sender, evt) =>
		{
			// Checks if edges and/or vertices were modified
			let cells = evt.getProperty('cells');
			let vertex = false;
			let edge = false;
			
			if (cells.length > 0)
			{
				for (let i = 0; i < cells.length; i++)
				{
					vertex = cells[i].isVertex() || vertex;
					edge = cells[i].isEdge() || edge;
					
					if (edge && vertex)
					{
						break;
					}
				}
			}
			else
			{
				vertex = true;
				edge = true;
			}
			
			let keys = evt.getProperty('keys');
			let values = evt.getProperty('values');
	
			for (let i = 0; i < keys.length; i++)
			{
				let common = valueStyles.indexOf(keys[i]) >= 0;
				
				// Ignores transparent stroke colors
				if (keys[i] != 'strokeColor' || (values[i] != null && values[i] != 'none'))
				{
					// Special case: Edge style and shape
					if (connectStyles.indexOf(keys[i]) >= 0)
					{
						if (edge || alwaysEdgeStyles.indexOf(keys[i]) >= 0)
						{
							if (values[i] == null)
							{
								delete graph.currentEdgeStyle[keys[i]];
							}
							else
							{
								graph.currentEdgeStyle[keys[i]] = values[i];
							}
						}
						// Uses style for vertex if defined in styles
						else if (vertex && styles.indexOf(keys[i]) >= 0)
						{
							if (values[i] == null)
							{
								delete graph.currentVertexStyle[keys[i]];
							}
							else
							{
								graph.currentVertexStyle[keys[i]] = values[i];
							}
						}
					}
					else if (styles.indexOf(keys[i]) >= 0)
					{
						if (vertex || common)
						{
							if (values[i] == null)
							{
								delete graph.currentVertexStyle[keys[i]];
							}
							else
							{
								graph.currentVertexStyle[keys[i]] = values[i];
							}
						}
						
						if (edge || common || alwaysEdgeStyles.indexOf(keys[i]) >= 0)
						{
							if (values[i] == null)
							{
								delete graph.currentEdgeStyle[keys[i]];
							}
							else
							{
								graph.currentEdgeStyle[keys[i]] = values[i];
							}
						}
					}
				}
			}
			
			if (this.toolbar != null)
			{
				this.toolbar.setFontName(graph.currentVertexStyle['fontFamily'] || Menus.prototype.defaultFont);
				this.toolbar.setFontSize(graph.currentVertexStyle['fontSize'] || Menus.prototype.defaultFontSize);
				
				if (this.toolbar.edgeStyleMenu != null)
				{
					// Updates toolbar icon for edge style
					let edgeStyleDiv = this.toolbar.edgeStyleMenu.getElementsByTagName('div')[0];
	
					if (graph.currentEdgeStyle['edgeStyle'] == 'orthogonalEdgeStyle' && graph.currentEdgeStyle['curved'] == '1')
					{
						edgeStyleDiv.className = 'geSprite geSprite-curved';
					}
					else if (graph.currentEdgeStyle['edgeStyle'] == 'straight' || graph.currentEdgeStyle['edgeStyle'] == 'none' ||
							graph.currentEdgeStyle['edgeStyle'] == null)
					{
						edgeStyleDiv.className = 'geSprite geSprite-straight';
					}
					else if (graph.currentEdgeStyle['edgeStyle'] == 'entityRelationEdgeStyle')
					{
						edgeStyleDiv.className = 'geSprite geSprite-entity';
					}
					else if (graph.currentEdgeStyle['edgeStyle'] == 'elbowEdgeStyle')
					{
						edgeStyleDiv.className = 'geSprite geSprite-' + ((graph.currentEdgeStyle['elbow'] == 'vertical') ?
							'verticalelbow' : 'horizontalelbow');
					}
					else if (graph.currentEdgeStyle['edgeStyle'] == 'isometricEdgeStyle')
					{
						edgeStyleDiv.className = 'geSprite geSprite-' + ((graph.currentEdgeStyle['elbow'] == 'vertical') ?
							'verticalisometric' : 'horizontalisometric');
					}
					else
					{
						edgeStyleDiv.className = 'geSprite geSprite-orthogonal';
					}
				}
				
				if (this.toolbar.edgeShapeMenu != null)
				{
					// Updates icon for edge shape
					let edgeShapeDiv = this.toolbar.edgeShapeMenu.getElementsByTagName('div')[0];
					
					if (graph.currentEdgeStyle['shape'] == 'link')
					{
						edgeShapeDiv.className = 'geSprite geSprite-linkedge';
					}
					else if (graph.currentEdgeStyle['shape'] == 'flexArrow')
					{
						edgeShapeDiv.className = 'geSprite geSprite-arrow';
					}
					else if (graph.currentEdgeStyle['shape'] == 'arrow')
					{
						edgeShapeDiv.className = 'geSprite geSprite-simplearrow';
					}
					else
					{
						edgeShapeDiv.className = 'geSprite geSprite-connection';
					}
				}
				
				// Updates icon for optinal line start shape
				if (this.toolbar.lineStartMenu != null)
				{
					let lineStartDiv = this.toolbar.lineStartMenu.getElementsByTagName('div')[0];
					
					lineStartDiv.className = this.getCssClassForMarker('start',
							graph.currentEdgeStyle['shape'], graph.currentEdgeStyle.startArrow,
							getValue(graph.currentEdgeStyle, 'startFill', '1'));
				}
	
				// Updates icon for optinal line end shape
				if (this.toolbar.lineEndMenu != null)
				{
					let lineEndDiv = this.toolbar.lineEndMenu.getElementsByTagName('div')[0];
					
					lineEndDiv.className = this.getCssClassForMarker('end',
							graph.currentEdgeStyle['shape'], graph.currentEdgeStyle.endArrow,
							getValue(graph.currentEdgeStyle, 'endFill', '1'));
				}
			}
		}));
		
		// Update font size and font family labels
		if (this.toolbar != null)
		{
			let update = (() =>
			{
				let ff = graph.currentVertexStyle['fontFamily'] || 'Helvetica';
				let fs = String(graph.currentVertexStyle['fontSize'] || '12');
			    	let state = graph.getView().getState(graph.getSelectionCell());
			    	
			    	if (state != null)
			    	{
			    		ff = state.style.fontFamily || ff;
			    		fs = state.style.fontSize || fs;
			    		
			    		if (ff.length > 10)
			    		{
			    			ff = ff.substring(0, 8) + '...';
			    		}
			    	}
			    	
			    	this.toolbar.setFontName(ff);
			    	this.toolbar.setFontSize(fs);
			});
			
		    graph.getSelectionModel().addListener(mxEvent.CHANGE, update);
		    graph.getDataModel().addListener(mxEvent.CHANGE, update);
		}
		
		// Makes sure the current layer is visible when cells are added
		graph.addListener(mxEvent.CELLS_ADDED, function(sender, evt)
		{
			let cells = evt.getProperty('cells');
			let parent = evt.getProperty('parent');
			
			if (graph.getDataModel().isLayer(parent) && !parent.isVisible() && cells != null && cells.length > 0)
			{
				graph.getDataModel().setVisible(parent, true);
			}
		});
		
		// Global handler to hide the current menu
		this.gestureHandler = ((evt) =>
		{
			if (this.currentMenu != null && mxEvent.getSource(evt) != this.currentMenu.div)
			{
				this.hideCurrentMenu();
			}
		});
		
		mxEvent.addGestureListeners(document, this.gestureHandler);
	
		// Updates the editor UI after the window has been resized or the orientation changes
		// Timeout is workaround for old IE versions which have a delay for DOM client sizes.
		// Should not use delay > 0 to avoid handle multiple repaints during window resize
		this.resizeHandler = (() =>
	   	{
	   		window.setTimeout((() =>
	   		{
	   			if (this.editor.graph != null)
	   			{
	   				this.refresh();
	   			}
	   		}), 0);
	   	});
		
	   	mxEvent.addListener(window, 'resize', this.resizeHandler);
	   	
	   	this.orientationChangeHandler = (() =>
	   	{
	   		this.refresh();
	   	});
	   	
	   	mxEvent.addListener(window, 'orientationchange', this.orientationChangeHandler);
	   	
		// Workaround for bug on iOS see
		// http://stackoverflow.com/questions/19012135/ios-7-ipad-safari-landscape-innerheight-outerheight-layout-issue
		if (Client.IS_IOS && !window.navigator.standalone)
		{
			this.scrollHandler = (() =>
		   	{
		   		window.scrollTo(0, 0);
		   	});
			
		   	mxEvent.addListener(window, 'scroll', this.scrollHandler);
		}
	
		/**
		 * Sets the initial scrollbar locations after a file was loaded.
		 */
		this.editor.addListener('resetGraphView', (() =>
		{
			this.resetScrollbars();
		}));
		
		/**
		 * Repaints the grid.
		 */
		this.addListener('gridEnabledChanged', (() =>
		{
			graph.view.validateBackground();
		}));
		
		this.addListener('backgroundColorChanged', (() =>
		{
			graph.view.validateBackground();
		}));
	
		/**
		 * Repaints the grid.
		 */
		graph.addListener('gridSizeChanged', (() =>
		{
			if (graph.isGridEnabled())
			{
				graph.view.validateBackground();
			}
		}));
		
	   	// Resets UI, updates action and menu states
	   	this.editor.resetGraph();
	}

	this.init();
	
	if (!graph.standalone)
	{
		this.open();
	}
};

// Extends mxEventSource
extend(EditorUi, EventSource);

/**
 * Global config that specifies if the compact UI elements should be used.
 */
EditorUi.compactUi = true;

/**
 * Specifies the size of the split bar.
 */
EditorUi.prototype.splitSize = (Client.IS_TOUCH || Client.IS_POINTER) ? 12 : 8;

/**
 * Specifies the height of the menubar. Default is 30.
 */
EditorUi.prototype.menubarHeight = 30;

/**
 * Specifies the width of the format panel should be enabled. Default is true.
 */
EditorUi.prototype.formatEnabled = true;

/**
 * Specifies the width of the format panel. Default is 240.
 */
EditorUi.prototype.formatWidth = 240;

/**
 * Specifies the height of the toolbar. Default is 38.
 */
EditorUi.prototype.toolbarHeight = 38;

/**
 * Specifies the height of the footer. Default is 28.
 */
EditorUi.prototype.footerHeight = 28;

/**
 * Specifies the height of the optional sidebarFooterContainer. Default is 34.
 */
EditorUi.prototype.sidebarFooterHeight = 34;

/**
 * Specifies the position of the horizontal split bar. Default is 240 or 118 for
 * screen widths <= 640px.
 */
EditorUi.prototype.hsplitPosition = (screen.width <= 640) ? 118 : ((urlParams['sidebar-entries'] != 'large') ? 212 : 240);

/**
 * Specifies if animations are allowed in <executeLayout>. Default is true.
 */
EditorUi.prototype.allowAnimation = true;

/**
 * Default is 2.
 */
EditorUi.prototype.lightboxMaxFitScale = 2;

/**
 * Default is 4.
 */
EditorUi.prototype.lightboxVerticalDivider = 4;

/**
 * Specifies if single click on horizontal split should collapse sidebar. Default is false.
 */
EditorUi.prototype.hsplitClickEnabled = false;

/**
 * Installs the listeners to update the action states.
 */
EditorUi.prototype.init = function()
{
	let graph = this.editor.graph;
	
	if (!graph.standalone)
	{
		if (urlParams['shape-picker'] != '0')
		{
			this.installShapePicker();
		}
		
		// Hides tooltips and connection points when scrolling
		mxEvent.addListener(graph.container, 'scroll', (() =>
		{
			graph.getPlugin('TooltipHandler').hide();
			
			if (graph.getPlugin('ConnectionHandler') != null && graph.getPlugin('ConnectionHandler').constraintHandler != null)
			{
				graph.getPlugin('ConnectionHandler').constraintHandler.reset();
			}
		}));
		
		// Hides tooltip on escape
		graph.addListener(mxEvent.ESCAPE, (() =>
		{
			graph.getPlugin('TooltipHandler').hide();
			let rb = graph.getRubberband();
			
			if (rb != null)
			{
				rb.cancel();
			}
		}));
		
		mxEvent.addListener(graph.container, 'keydown', ((evt) =>
		{
			this.onKeyDown(evt);
		}));
		
		mxEvent.addListener(graph.container, 'keypress', ((evt) =>
		{
			this.onKeyPress(evt);
		}));
	
		// Updates action states
		this.addUndoListener();
		this.addBeforeUnloadListener();
		
		graph.getSelectionModel().addListener(mxEvent.CHANGE, (() =>
		{
			this.updateActionStates();
		}));
		
		graph.getDataModel().addListener(mxEvent.CHANGE, (() =>
		{
			this.updateActionStates();
		}));
		
		// Changes action states after change of default parent
		let graphSetDefaultParent = graph.setDefaultParent;
		let ui = this;
		
		this.editor.graph.setDefaultParent = function()
		{
			graphSetDefaultParent.apply(this, arguments);
			ui.updateActionStates();
		};
		
		// Hack to make editLink available in vertex handler
		graph.editLink = ui.actions.get('editLink').funct;
		
		this.updateActionStates();
		this.initClipboard();
		this.initCanvas();
		
		if (this.format != null)
		{
			this.format.init();
		}
	}
};

/**
 * Returns true if the given event should start editing. This implementation returns true.
 */
EditorUi.prototype.installShapePicker = function()
{
	let graph = this.editor.graph;
	let ui = this;

	// Uses this event to process mouseDown to check the selection state before it is changed
	graph.addListener(mxEvent.FIRE_MOUSE_EVENT, ((sender, evt) =>
	{
		if (evt.getProperty('eventName') == 'mouseDown')
		{
			ui.hideShapePicker();
		}
	}));
	
	graph.addListener(mxEvent.ESCAPE, (() =>
	{
		ui.hideShapePicker(true);
	}));
	
	graph.getSelectionModel().addListener(mxEvent.CHANGE, (() =>
	{
		ui.hideShapePicker(true);
	}));
	
	graph.getDataModel().addListener(mxEvent.CHANGE, (() =>
	{
		ui.hideShapePicker(true);
	}));
	
	// Counts as popup menu
	let popupMenuHandlerIsMenuShowing = graph.getPlugin('PopupMenuHandler').isMenuShowing;
	 
	graph.getPlugin('PopupMenuHandler').isMenuShowing = function()
	{
		return popupMenuHandlerIsMenuShowing.apply(this, arguments) || ui.shapePicker != null;
	};
	
	// Adds dbl click dialog for inserting shapes
	let graphDblClick = graph.dblClick;
	
	graph.dblClick = function(evt, cell)
	{
		if (this.isEnabled())
		{
			if (cell == null && ui.sidebar != null && !mxEvent.isShiftDown(evt))
			{
				mxEvent.consume(evt);
				let pt = convertPoint(this.container, mxEvent.getClientX(evt), mxEvent.getClientY(evt));
				
				// Asynchronous to avoid direct insert after double tap
				window.setTimeout((() =>
				{
					ui.showShapePicker(pt.x, pt.y);
				}), 30);
			}
			else
			{
				graphDblClick.apply(this, arguments);
			}
		}
	};
	
	if (this.hoverIcons != null)
	{
		let hoverIconsDrag = this.hoverIcons.drag;
		
		this.hoverIcons.drag = function()
		{
			ui.hideShapePicker();
			hoverIconsDrag.apply(this, arguments);
		};
		
		let hoverIconsExecute = this.hoverIcons.execute;
		
		this.hoverIcons.execute = function(state, dir, me)
		{
			let evt = me.getEvent();
			
			if (!this.graph.isCloneEvent(evt) && !mxEvent.isShiftDown(evt))
			{
				this.graph.connectVertex(state.cell, dir, this.graph.defaultEdgeLength, evt, null, null, ((x, y, execute) =>
				{
					let temp = graph.getCompositeParent(state.cell);
					let geo = temp.getGeometry();
					me.consume();
					
					while (temp != null && temp.isVertex() && geo != null && geo.relative)
					{
						cell = temp;
						temp = cell.getParent()
						geo = temp.getGeometry();
					}
					
					// Asynchronous to avoid direct insert after double tap
					window.setTimeout((() =>
					{
						ui.showShapePicker(me.getGraphX(), me.getGraphY(), temp, ((cell) =>
						{
							execute(cell);
						}), dir);
					}), 30);
				}), ((result) =>
				{
					this.graph.selectCellsForConnectVertex(result, evt, this);
				}));
			}
			else
			{
				hoverIconsExecute.apply(this, arguments);
			}
		};
	}
};

/**
 * Creates a temporary graph instance for rendering off-screen content.
 */
EditorUi.prototype.showShapePicker = function(x, y, source, callback, direction)
{
	let cells = this.getCellsForShapePicker(source);
	
	if (cells != null && cells.length > 0)
	{
		let ui = this;
		let graph = this.editor.graph;
		let div = document.createElement('div');
		let sourceState = graph.view.getState(source);
		let style = (source != null && (sourceState == null ||
			!graph.isTransparentState(sourceState))) ?
			graph.copyStyle(source) : null;
		
		// Do not place entry under pointer for touch devices
		div.className = 'geToolbarContainer geSidebarContainer geSidebar';
		div.style.cssText = 'position:absolute;left:' + x + 'px;top:' + y +
			'px;width:140px;border-radius:10px;padding:4px;text-align:center;' +
			'box-shadow:0px 0px 3px 1px #d1d1d1;padding: 6px 0 8px 0;';
		setPrefixedStyle(div.style, 'transform', 'translate(-22px,-22px)');
		
		if (graph.background != null && graph.background != mxConstants.NONE)
		{
			div.style.backgroundColor = graph.background;
		}
		
		graph.container.appendChild(div);
		
		let addCell = ((cell) =>
		{
			// Wrapper needed to catch events
			let node = document.createElement('a');
			node.className = 'geItem';
			node.style.cssText = 'position:relative;display:inline-block;position:relative;' +
				'width:30px;height:30px;cursor:pointer;overflow:hidden;padding:3px 0 0 3px;';
			div.appendChild(node);
			
			if (style != null)
			{
				this.sidebar.graph.pasteStyle(style, [cell]);
			}
			else
			{
				ui.insertHandler([cell], cell.value != '', this.sidebar.graph.model);
			}
			
			this.sidebar.createThumb([cell], 25, 25, node, null, true, false, cell.geometry.width, cell.geometry.height);

			mxEvent.addListener(node, 'click', function()
			{
				let clone = graph.cloneCell(cell);
				
				if (callback != null)
				{
					callback(clone);
				}
				else
				{
					clone.geometry.x = graph.snap(Math.round(x / graph.view.scale) -
						graph.view.translate.x - cell.geometry.width / 2);
					clone.geometry.y = graph.snap(Math.round(y / graph.view.scale) -
						graph.view.translate.y - cell.geometry.height / 2);
					
					graph.model.beginUpdate();
					try
					{
						graph.addCell(clone);
					}
					finally
					{
						graph.model.endUpdate();
					}
					
					graph.setSelectionCell(clone);
					graph.scrollCellToVisible(clone);
					graph.startEditingAtCell(clone);
					
					if (ui.hoverIcons != null)
					{
						ui.hoverIcons.update(graph.view.getState(clone));
					}
				}
				
				ui.hideShapePicker();
			});
		});
		
		for (let i = 0; i < cells.length; i++)
		{
			addCell(cells[i]);
		}
		
		if (ui.hoverIcons != null)
		{
			ui.hoverIcons.reset();
		}
		
		graph.getPlugin('PopupMenuHandler').hideMenu();
		graph.getPlugin('TooltipHandler').hideTooltip();
		this.hideCurrentMenu();
		this.hideShapePicker();
		
		this.shapePickerCallback = callback;
		this.shapePicker = div;
	}
};

/**
 * Creates a temporary graph instance for rendering off-screen content.
 */
EditorUi.prototype.getCellsForShapePicker = function(cell)
{
	let createVertex = ((style, w, h, value) =>
	{
		return this.editor.graph.createVertex(null, null, value || '', 0, 0, w || 120, h || 60, style, false);
	});
	
	return [(cell != null) ? this.editor.graph.cloneCell(cell) :
			createVertex('text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;', 40, 20, 'Text'),
		createVertex('whiteSpace=wrap;html=1;'),
		createVertex('ellipse;whiteSpace=wrap;html=1;', 120, 80),
		createVertex('rhombus;whiteSpace=wrap;html=1;', 80, 80),
		createVertex('shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;'),
		createVertex('shape=trapezoid;perimeter=trapezoidPerimeter;whiteSpace=wrap;html=1;fixedSize=1;', 120, 60),
		createVertex('shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;', 120, 80),
		createVertex('shape=step;perimeter=stepPerimeter;whiteSpace=wrap;html=1;fixedSize=1;', 120, 80),
		createVertex('shape=process;whiteSpace=wrap;html=1;backgroundOutline=1;'),
		createVertex('shape=cube;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;darkOpacity=0.05;darkOpacity2=0.1;', 120, 80),
		createVertex('shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;darkOpacity=0.05;', 80, 100),
		createVertex('triangle;whiteSpace=wrap;html=1;', 60, 80),
		createVertex('shape=document;whiteSpace=wrap;html=1;boundedLbl=1;', 120, 80),
		createVertex('shape=tape;whiteSpace=wrap;html=1;', 120, 100),
		createVertex('ellipse;shape=cloud;whiteSpace=wrap;html=1;', 120, 80),
		createVertex('shape=cylinder;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;', 60, 80)];
};

/**
 * Creates a temporary graph instance for rendering off-screen content.
 */
EditorUi.prototype.hideShapePicker = function(cancel)
{
	if (this.shapePicker != null)
	{
		this.shapePicker.parentNode.removeChild(this.shapePicker);
		this.shapePicker = null;
				
		if (!cancel && this.shapePickerCallback != null)
		{
			this.shapePickerCallback();
		}
		
		this.shapePickerCallback = null;
	}
};

/**
 * Returns true if the given event should start editing. This implementation returns true.
 */
EditorUi.prototype.onKeyDown = function(evt)
{
	let graph = this.editor.graph;
	
	// Tab selects next cell
	if (evt.which == 9 && graph.isEnabled() && !mxEvent.isAltDown(evt) &&
		(!graph.isEditing() || !mxEvent.isShiftDown(evt)))
	{
		if (graph.isEditing())
		{
			graph.stopEditing(false);
		}
		else
		{
			graph.selectCell(!mxEvent.isShiftDown(evt));
		}
		
		mxEvent.consume(evt);
	}
};

/**
 * Returns true if the given event should start editing. This implementation returns true.
 */
EditorUi.prototype.onKeyPress = function(evt)
{
	let graph = this.editor.graph;
	
	// KNOWN: Focus does not work if label is empty in quirks mode
	if (this.isImmediateEditingEvent(evt) && !graph.isEditing() && !graph.isSelectionEmpty() && evt.which !== 0 &&
		evt.which !== 27 && !mxEvent.isAltDown(evt) && !mxEvent.isControlDown(evt) && !mxEvent.isMetaDown(evt))
	{
		graph.escape();
		graph.startEditing();

		// Workaround for FF where char is lost if cursor is placed before char
		if (Client.IS_FF)
		{
			let ce = graph.cellEditor;
			
			if (ce.textarea != null)
			{
				ce.textarea.innerHTML = String.fromCharCode(evt.which);
	
				// Moves cursor to end of textarea
				let range = document.createRange();
				range.selectNodeContents(ce.textarea);
				range.collapse(false);
				let sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
			}
		}
	}
};

/**
 * Returns true if the given event should start editing. This implementation returns true.
 */
EditorUi.prototype.isImmediateEditingEvent = function(evt)
{
	return true;
};

/**
 * Private helper method.
 */
EditorUi.prototype.getCssClassForMarker = function(prefix, shape, marker, fill)
{
	let result = '';

	if (shape == 'flexArrow')
	{
		result = (marker != null && marker != mxConstants.NONE) ?
			'geSprite geSprite-' + prefix + 'blocktrans' : 'geSprite geSprite-noarrow';
	}
	else
	{
		// SVG marker sprites
		if (marker == 'box' || marker == 'halfCircle')
		{
			result = 'geSprite geSvgSprite geSprite-' + marker + ((prefix == 'end') ? ' geFlipSprite' : '');
		}
		else if (marker == mxConstants.ARROW_CLASSIC)
		{
			result = (fill == '1') ? 'geSprite geSprite-' + prefix + 'classic' : 'geSprite geSprite-' + prefix + 'classictrans';
		}
		else if (marker == mxConstants.ARROW_CLASSIC_THIN)
		{
			result = (fill == '1') ? 'geSprite geSprite-' + prefix + 'classicthin' : 'geSprite geSprite-' + prefix + 'classicthintrans';
		}
		else if (marker == mxConstants.ARROW_OPEN)
		{
			result = 'geSprite geSprite-' + prefix + 'open';
		}
		else if (marker == mxConstants.ARROW_OPEN_THIN)
		{
			result = 'geSprite geSprite-' + prefix + 'openthin';
		}
		else if (marker == mxConstants.ARROW_BLOCK)
		{
			result = (fill == '1') ? 'geSprite geSprite-' + prefix + 'block' : 'geSprite geSprite-' + prefix + 'blocktrans';
		}
		else if (marker == mxConstants.ARROW_BLOCK_THIN)
		{
			result = (fill == '1') ? 'geSprite geSprite-' + prefix + 'blockthin' : 'geSprite geSprite-' + prefix + 'blockthintrans';
		}
		else if (marker == mxConstants.ARROW_OVAL)
		{
			result = (fill == '1') ? 'geSprite geSprite-' + prefix + 'oval' : 'geSprite geSprite-' + prefix + 'ovaltrans';
		}
		else if (marker == mxConstants.ARROW_DIAMOND)
		{
			result = (fill == '1') ? 'geSprite geSprite-' + prefix + 'diamond' : 'geSprite geSprite-' + prefix + 'diamondtrans';
		}
		else if (marker == mxConstants.ARROW_DIAMOND_THIN)
		{
			result = (fill == '1') ? 'geSprite geSprite-' + prefix + 'thindiamond' : 'geSprite geSprite-' + prefix + 'thindiamondtrans';
		}
		else if (marker == 'openAsync')
		{
			result = 'geSprite geSprite-' + prefix + 'openasync';
		}
		else if (marker == 'dash')
		{
			result = 'geSprite geSprite-' + prefix + 'dash';
		}
		else if (marker == 'cross')
		{
			result = 'geSprite geSprite-' + prefix + 'cross';
		}
		else if (marker == 'async')
		{
			result = (fill == '1') ? 'geSprite geSprite-' + prefix + 'async' : 'geSprite geSprite-' + prefix + 'asynctrans';
		}
		else if (marker == 'circle' || marker == 'circlePlus')
		{
			result = (fill == '1' || marker == 'circle') ? 'geSprite geSprite-' + prefix + 'circle' : 'geSprite geSprite-' + prefix + 'circleplus';
		}
		else if (marker == 'ERone')
		{
			result = 'geSprite geSprite-' + prefix + 'erone';
		}
		else if (marker == 'ERmandOne')
		{
			result = 'geSprite geSprite-' + prefix + 'eronetoone';
		}
		else if (marker == 'ERmany')
		{
			result = 'geSprite geSprite-' + prefix + 'ermany';
		}
		else if (marker == 'ERoneToMany')
		{
			result = 'geSprite geSprite-' + prefix + 'eronetomany';
		}
		else if (marker == 'ERzeroToOne')
		{
			result = 'geSprite geSprite-' + prefix + 'eroneopt';
		}
		else if (marker == 'ERzeroToMany')
		{
			result = 'geSprite geSprite-' + prefix + 'ermanyopt';
		}
		else
		{
			result = 'geSprite geSprite-noarrow';
		}
	}

	return result;
};

/**
 * Overridden in Menus.js
 */
EditorUi.prototype.createMenus = function()
{
	return null;
};

/**
 * Hook for allowing selection and context menu for certain events.
 */
EditorUi.prototype.updatePasteActionStates = function()
{
	let graph = this.editor.graph;
	let paste = this.actions.get('paste');
	let pasteHere = this.actions.get('pasteHere');
	
	paste.setEnabled(this.editor.graph.cellEditor.isContentEditing() || (!mxClipboard.isEmpty() &&
		graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())));
	pasteHere.setEnabled(paste.isEnabled());
};

/**
 * Hook for allowing selection and context menu for certain events.
 */
EditorUi.prototype.initClipboard = function()
{
	let ui = this;

	let mxClipboardCut = mxClipboard.cut;
	mxClipboard.cut = function(graph)
	{
		if (graph.cellEditor.isContentEditing())
		{
			document.execCommand('cut', false, null);
		}
		else
		{
			mxClipboardCut.apply(this, arguments);
		}
		
		ui.updatePasteActionStates();
	};
	
	let mxClipboardCopy = mxClipboard.copy;
	mxClipboard.copy = function(graph)
	{
		let result = null;
		
		if (graph.cellEditor.isContentEditing())
		{
			document.execCommand('copy', false, null);
		}
		else
		{
			result = result || graph.getSelectionCells();
			result = graph.getExportableCells(graph.model.getTopmostCells(result));
			
			let cloneMap = {};
			let lookup = graph.createCellLookup(result);
			let clones = graph.cloneCells(result, null, cloneMap);
			
			// Uses temporary model to force new IDs to be assigned
			// to avoid having to carry over the mapping from object
			// ID to cell ID to the paste operation
			let model = new GraphDataModel();
			let parent = model.getRoot().getChildAt(0);
			
			for (let i = 0; i < clones.length; i++)
			{
				model.add(parent, clones[i]);
				
				// Checks for orphaned relative children and makes absolute				
				let state = graph.view.getState(result[i]);
				
				if (state != null)
				{
					let geo = clones[i].getGeometry();
				
					if (geo != null && geo.relative && !result[i].isEdge() &&
						lookup[mxObjectIdentity.get(result[i].getParent())] == null)
					{
						geo.offset = null;
						geo.relative = false;
						geo.x = state.x / state.view.scale - state.view.translate.x;
						geo.y = state.y / state.view.scale - state.view.translate.y;
					}
				}
			}
			
			graph.updateCustomLinks(graph.createCellMapping(cloneMap, lookup), clones);

			mxClipboard.insertCount = 1;
			mxClipboard.setCells(clones);
		}
		
		ui.updatePasteActionStates();
		
		return result;
	};

	let mxClipboardPaste = mxClipboard.paste;
	mxClipboard.paste = function(graph)
	{
		let result = null;
		
		if (graph.cellEditor.isContentEditing())
		{
			document.execCommand('paste', false, null);
		}
		else
		{
			result = mxClipboardPaste.apply(this, arguments);
		}
		
		ui.updatePasteActionStates();
		
		return result;
	};

	// Overrides cell editor to update paste action state
	let cellEditorStartEditing = this.editor.graph.cellEditor.startEditing;
	
	this.editor.graph.cellEditor.startEditing = function()
	{
		cellEditorStartEditing.apply(this, arguments);
		ui.updatePasteActionStates();
	};
	
	let cellEditorStopEditing = this.editor.graph.cellEditor.stopEditing;
	
	this.editor.graph.cellEditor.stopEditing = function(cell, trigger)
	{
		cellEditorStopEditing.apply(this, arguments);
		ui.updatePasteActionStates();
	};
	
	this.updatePasteActionStates();
};

/**
 * Delay between zoom steps when not using preview.
 */
EditorUi.prototype.lazyZoomDelay = 20;

/**
 * Delay before update of DOM when using preview.
 */
EditorUi.prototype.wheelZoomDelay = 400;

/**
 * Delay before update of DOM when using preview.
 */
EditorUi.prototype.buttonZoomDelay = 600;

/**
 * Initializes the infinite canvas.
 */
EditorUi.prototype.initCanvas = function()
{
	// Initial page layout view, scrollBuffer and timer-based scrolling
	let graph = this.editor.graph;
	graph.timerAutoScroll = true;

	/**
	 * Returns the padding for pages in page view with scrollbars.
	 */
	graph.getPagePadding = function()
	{
		return new Point(Math.max(0, Math.round((graph.container.offsetWidth - 34) / graph.view.scale)),
				Math.max(0, Math.round((graph.container.offsetHeight - 34) / graph.view.scale)));
	};

	// Fits the number of background pages to the graph
	graph.view.getBackgroundPageBounds = function()
	{
		let layout = this.graph.getPageLayout();
		let page = this.graph.getPageSize();
		
		return new Rectangle(this.scale * (this.translate.x + layout.x * page.width),
				this.scale * (this.translate.y + layout.y * page.height),
				this.scale * layout.width * page.width,
				this.scale * layout.height * page.height);
	};

	graph.getPreferredPageSize = function(bounds, width, height)
	{
		let pages = this.getPageLayout();
		let size = this.getPageSize();
		
		return new Rectangle(0, 0, pages.width * size.width, pages.height * size.height);
	};
	
	// Scales pages/graph to fit available size
	let resize = null;
	let ui = this;
	
	if (this.editor.isChromelessView())
	{
        resize = ((autoscale, maxScale, cx, cy) =>
        {
            if (graph.container != null && !graph.isViewer())
            {
                cx = (cx != null) ? cx : 0;
                cy = (cy != null) ? cy : 0;
                
                let bds = (graph.pageVisible) ? graph.view.getBackgroundPageBounds() : graph.getGraphBounds();
                let scroll = hasScrollbars(graph.container);
                let tr = graph.view.translate;
                let s = graph.view.scale;
                
                // Normalizes the bounds
                let b = Rectangle.fromRectangle(bds);
                b.x = b.x / s - tr.x;
                b.y = b.y / s - tr.y;
                b.width /= s;
                b.height /= s;
                
                let st = graph.container.scrollTop;
                let sl = graph.container.scrollLeft;
                let sb = 14;

                let cw = graph.container.offsetWidth - sb;
                let ch = graph.container.offsetHeight - sb;
                
                let ns = (autoscale) ? Math.max(0.3, Math.min(maxScale || 1, cw / b.width)) : s;
                let dx = ((cw - ns * b.width) / 2) / ns;
                let dy = (this.lightboxVerticalDivider == 0) ? 0 : ((ch - ns * b.height) / this.lightboxVerticalDivider) / ns;
                
                if (scroll)
                {
                    dx = Math.max(dx, 0);
                    dy = Math.max(dy, 0);
                }

                if (scroll || bds.width < cw || bds.height < ch)
                {
                    graph.view.scaleAndTranslate(ns, Math.floor(dx - b.x), Math.floor(dy - b.y));
                    graph.container.scrollTop = st * ns / s;
                    graph.container.scrollLeft = sl * ns / s;
                }
                else if (cx != 0 || cy != 0)
                {
                    let t = graph.view.translate;
                    graph.view.setTranslate(Math.floor(t.x + cx / s), Math.floor(t.y + cy / s));
                }
            }
        });
		
		// Hack to make function available to subclassers
		this.chromelessResize = resize;

		// Hook for subclassers for override
		this.chromelessWindowResize = (() =>
	   	{
			this.chromelessResize(false);
	   	});

		// Removable resize listener
		let autoscaleResize = (() =>
	   	{
			this.chromelessWindowResize(false);
	   	});
		
	   	mxEvent.addListener(window, 'resize', autoscaleResize);
	   	
	   	this.destroyFunctions.push(function()
	   	{
	   		mxEvent.removeListener(window, 'resize', autoscaleResize);
	   	});
	   	
		this.editor.addListener('resetGraphView', (() =>
		{
			this.chromelessResize(true);
		}));

		this.actions.get('zoomIn').funct = ((evt) =>
		{
			graph.zoomIn();
			this.chromelessResize(false);
		});
		this.actions.get('zoomOut').funct = ((evt) =>
		{
			graph.zoomOut();
			this.chromelessResize(false);
		});
		
		// Creates toolbar for viewer - do not use CSS here
		// as this may be used in a viewer that has no CSS
		if (urlParams['toolbar'] != '0')
		{
			let toolbarConfig = JSON.parse(decodeURIComponent(urlParams['toolbar-config'] || '{}'));
			
			this.chromelessToolbar = document.createElement('div');
			this.chromelessToolbar.style.position = 'fixed';
			this.chromelessToolbar.style.overflow = 'hidden';
			this.chromelessToolbar.style.boxSizing = 'border-box';
			this.chromelessToolbar.style.whiteSpace = 'nowrap';
			this.chromelessToolbar.style.backgroundColor = '#000000';
			this.chromelessToolbar.style.padding = '10px 10px 8px 10px';
			this.chromelessToolbar.style.left = (graph.isViewer()) ? '0' : '50%';
			
			setPrefixedStyle(this.chromelessToolbar.style, 'borderRadius', '20px');
			setPrefixedStyle(this.chromelessToolbar.style, 'transition', 'opacity 600ms ease-in-out');

			let updateChromelessToolbarPosition = (() =>
			{
				let css = getCurrentStyle(graph.container);
				
				if (graph.isViewer())
				{
					this.chromelessToolbar.style.top = '0';
				}
				else
				{
				 	this.chromelessToolbar.style.bottom = ((css != null) ? parseInt(css['margin-bottom'] || 0) : 0) +
				 		((this.tabContainer != null) ? (20 + parseInt(this.tabContainer.style.height)) : 20) + 'px';
				} 
			});
			
			this.editor.addListener('resetGraphView', updateChromelessToolbarPosition);
			updateChromelessToolbarPosition();
			
			let btnCount = 0;
	
			let addButton = ((fn, imgSrc, tip) =>
			{
				btnCount++;
				
				let a = document.createElement('span');
				a.style.paddingLeft = '8px';
				a.style.paddingRight = '8px';
				a.style.cursor = 'pointer';
				mxEvent.addListener(a, 'click', fn);
				
				if (tip != null)
				{
					a.setAttribute('title', tip);
				}
				
				let img = document.createElement('img');
				img.setAttribute('border', '0');
				img.setAttribute('src', imgSrc);
				
				a.appendChild(img);
				this.chromelessToolbar.appendChild(a);
				
				return a;
			});
			
			if (toolbarConfig.backBtn != null)
			{
				addButton(((evt) =>
				{
					window.location.href = toolbarConfig.backBtn.url;
					mxEvent.consume(evt);
				}), Editor.backLargeImage, Translations.get('back', null, 'Back'));
			}
			
			if (this.isPagesEnabled())
			{
				let prevButton = addButton(((evt) =>
				{
					this.actions.get('previousPage').funct();
					mxEvent.consume(evt);
				}), Editor.previousLargeImage, Translations.get('previousPage'));
				
				let pageInfo = document.createElement('div');
				pageInfo.style.display = 'inline-block';
				pageInfo.style.verticalAlign = 'top';
				pageInfo.style.fontFamily = 'Helvetica,Arial';
				pageInfo.style.marginTop = '8px';
				pageInfo.style.fontSize = '14px';
				pageInfo.style.color = '#ffffff';
				this.chromelessToolbar.appendChild(pageInfo);
				
				let nextButton = addButton(((evt) =>
				{
					this.actions.get('nextPage').funct();
					mxEvent.consume(evt);
				}), Editor.nextLargeImage, Translations.get('nextPage'));
				
				let updatePageInfo = (() =>
				{
					if (this.pages != null && this.pages.length > 1 && this.currentPage != null)
					{
						pageInfo.innerHTML = '';
						write(pageInfo, (indexOf(this.pages, this.currentPage) + 1) + ' / ' + this.pages.length);
					}
				});
				
				prevButton.style.paddingLeft = '0px';
				prevButton.style.paddingRight = '4px';
				nextButton.style.paddingLeft = '4px';
				nextButton.style.paddingRight = '0px';
				
				let updatePageButtons = (() =>
				{
					if (this.pages != null && this.pages.length > 1 && this.currentPage != null)
					{
						nextButton.style.display = '';
						prevButton.style.display = '';
						pageInfo.style.display = 'inline-block';
					}
					else
					{
						nextButton.style.display = 'none';
						prevButton.style.display = 'none';
						pageInfo.style.display = 'none';
					}
					
					updatePageInfo();
				});
				
				this.editor.addListener('resetGraphView', updatePageButtons);
				this.editor.addListener('pageSelected', updatePageInfo);
			}
		
			addButton(((evt) =>
			{
				this.actions.get('zoomOut').funct();
				mxEvent.consume(evt);
			}), Editor.zoomOutLargeImage, Translations.get('zoomOut') + ' (Alt+Mousewheel)');
			
			addButton(((evt) =>
			{
				this.actions.get('zoomIn').funct();
				mxEvent.consume(evt);
			}), Editor.zoomInLargeImage, Translations.get('zoomIn') + ' (Alt+Mousewheel)');
			
			addButton(((evt) =>
			{
				if (graph.isLightboxView())
				{
					if (graph.view.scale == 1)
					{
						this.lightboxFit();
					}
					else
					{
						graph.zoomTo(1);
					}
					
					this.chromelessResize(false);
				}
				else
				{
					this.chromelessResize(true);
				}
				
				mxEvent.consume(evt);
			}), Editor.actualSizeLargeImage, Translations.get('fit'));
	
			// Changes toolbar opacity on hover
			let fadeThread = null;
			var fadeThread2 = null;
			
			let fadeOut = ((delay) =>
			{
				if (fadeThread != null)
				{
					window.clearTimeout(fadeThread);
					fadeThread = null;
				}
				
				if (fadeThread2 != null)
				{
					window.clearTimeout(fadeThread2);
					fadeThread2 = null;
				}
				
				fadeThread = window.setTimeout((() =>
				{
				 	setOpacity(this.chromelessToolbar, 0);
					fadeThread = null;
				 	
					fadeThread2 = window.setTimeout((() =>
					{
						this.chromelessToolbar.style.display = 'none';
						fadeThread2 = null;
					}), 600);
				}), delay || 200);
			});
			
			let fadeIn = ((opacity) =>
			{
				if (fadeThread != null)
				{
					window.clearTimeout(fadeThread);
					fadeThread = null;
				}
				
				if (fadeThread2 != null)
				{
					window.clearTimeout(fadeThread2);
					fadeThread2 = null;
				}
				
				this.chromelessToolbar.style.display = '';
				setOpacity(this.chromelessToolbar, opacity || 30);
			});
	
			if (urlParams['layers'] == '1')
			{
				this.layersDialog = null;
				
				let layersButton = addButton(((evt) =>
				{
					if (this.layersDialog != null)
					{
						this.layersDialog.parentNode.removeChild(this.layersDialog);
						this.layersDialog = null;
					}
					else
					{
						this.layersDialog = graph.createLayersDialog();
						
						mxEvent.addListener(this.layersDialog, 'mouseleave', (() =>
						{
							this.layersDialog.parentNode.removeChild(this.layersDialog);
							this.layersDialog = null;
						}));
						
						let r = layersButton.getBoundingClientRect();
						
						setPrefixedStyle(this.layersDialog.style, 'borderRadius', '5px');
						this.layersDialog.style.position = 'fixed';
						this.layersDialog.style.fontFamily = 'Helvetica,Arial';
						this.layersDialog.style.backgroundColor = '#000000';
						this.layersDialog.style.width = '160px';
						this.layersDialog.style.padding = '4px 2px 4px 2px';
						this.layersDialog.style.color = '#ffffff';
						setOpacity(this.layersDialog, 70);
						this.layersDialog.style.left = r.left + 'px';
						this.layersDialog.style.bottom = parseInt(this.chromelessToolbar.style.bottom) +
							this.chromelessToolbar.offsetHeight + 4 + 'px';
						
						// Puts the dialog on top of the container z-index
						let style = getCurrentStyle(this.editor.graph.container);
						this.layersDialog.style.zIndex = style.zIndex;
						
						document.body.appendChild(this.layersDialog);
					}
					
					mxEvent.consume(evt);
				}), Editor.layersLargeImage, Translations.get('layers'));
				
				// Shows/hides layers button depending on content
				let model = graph.getDataModel();
	
				model.addListener(mxEvent.CHANGE, function()
				{
					 layersButton.style.display = (model.root.getChildCount() > 1) ? '' : 'none';
				});
			}
	
			if (urlParams['openInSameWin'] != '1')
			{
				this.addChromelessToolbarItems(addButton);
			}
	
			if (this.editor.editButtonLink != null || this.editor.editButtonFunc != null)
			{
				addButton(((evt) =>
				{
					if (this.editor.editButtonFunc != null) 
					{
						this.editor.editButtonFunc();
					} 
					else if (this.editor.editButtonLink == '_blank')
					{
						this.editor.editAsNew(this.getEditBlankXml());
					}
					else
					{
						graph.openLink(this.editor.editButtonLink, 'editWindow');
					}
					
					mxEvent.consume(evt);
				}), Editor.editLargeImage, Translations.get('edit'));
			}
			
			if (this.lightboxToolbarActions != null)
			{
				for (let i = 0; i < this.lightboxToolbarActions.length; i++)
				{
					let lbAction = this.lightboxToolbarActions[i];
					addButton(lbAction.fn, lbAction.icon, lbAction.tooltip);
				}
			}

			if (toolbarConfig.refreshBtn != null)
			{
				addButton(((evt) =>
				{
					if (toolbarConfig.refreshBtn.url)
					{
						window.location.href = toolbarConfig.refreshBtn.url;
					}
					else
					{
						window.location.reload();
					}
					
					mxEvent.consume(evt);
				}), Editor.refreshLargeImage, Translations.get('refresh', null, 'Refresh'));
			}

			if (toolbarConfig.fullscreenBtn != null && window.self !== window.top)
			{
				addButton(((evt) =>
				{
					if (toolbarConfig.fullscreenBtn.url)
					{
						graph.openLink(toolbarConfig.fullscreenBtn.url);
					}
					else
					{
						graph.openLink(window.location.href);
					}
					
					mxEvent.consume(evt);
				}), Editor.fullscreenLargeImage, Translations.get('openInNewWindow', null, 'Open in New Window'));
			}
			
			if ((toolbarConfig.closeBtn && window.self === window.top) ||
				(graph.lightbox && (urlParams['close'] == '1' || this.container != document.body)))
			
			{
				addButton(((evt) =>
				{
					if (urlParams['close'] == '1' || toolbarConfig.closeBtn)
					{
						window.close();
					}
					else
					{
						this.destroy();
						mxEvent.consume(evt);
					}
				}), Editor.closeLargeImage, Translations.get('close') + ' (Escape)');
			}
	
			// Initial state invisible
			this.chromelessToolbar.style.display = 'none';
			
			if (!graph.isViewer())
			{
				setPrefixedStyle(this.chromelessToolbar.style, 'transform', 'translate(-50%,0)');
			}
			
			graph.container.appendChild(this.chromelessToolbar);
			
			mxEvent.addListener(graph.container, (Client.IS_POINTER) ? 'pointermove' : 'mousemove', ((evt) =>
			{
				if (!mxEvent.isTouchEvent(evt))
				{
					if (!mxEvent.isShiftDown(evt))
					{
						fadeIn(30);
					}
					
					fadeOut();
				}
			}));
			
			mxEvent.addListener(this.chromelessToolbar, (Client.IS_POINTER) ? 'pointermove' : 'mousemove', function(evt)
			{
				mxEvent.consume(evt);
			});
			
			mxEvent.addListener(this.chromelessToolbar, 'mouseenter', ((evt) =>
			{
				if (!mxEvent.isShiftDown(evt))
				{
					fadeIn(100);
				}
				else
				{
					fadeOut();
				}
			}));

			mxEvent.addListener(this.chromelessToolbar, 'mousemove',  bind(this, function(evt)
			{
				if (!mxEvent.isShiftDown(evt))
				{
					fadeIn(100);
				}
				else
				{
					fadeOut();
				}
				
				mxEvent.consume(evt);
			}));

			mxEvent.addListener(this.chromelessToolbar, 'mouseleave',  bind(this, function(evt)
			{
				if (!mxEvent.isTouchEvent(evt))
				{
					fadeIn(30);
				}
			}));

			// Shows/hides toolbar for touch devices
			let tol = graph.getTolerance();

			graph.addMouseListener(
			{
			    startX: 0,
			    startY: 0,
			    scrollLeft: 0,
			    scrollTop: 0,
			    mouseDown: function(sender, me)
			    {
			    	this.startX = me.getGraphX();
			    	this.startY = me.getGraphY();
				    this.scrollLeft = graph.container.scrollLeft;
				    this.scrollTop = graph.container.scrollTop;
			    },
			    mouseMove: function(sender, me) {},
			    mouseUp: function(sender, me)
			    {
			    	if (mxEvent.isTouchEvent(me.getEvent()))
			    	{
				    	if ((Math.abs(this.scrollLeft - graph.container.scrollLeft) < tol &&
				    		Math.abs(this.scrollTop - graph.container.scrollTop) < tol) &&
				    		(Math.abs(this.startX - me.getGraphX()) < tol &&
				    		Math.abs(this.startY - me.getGraphY()) < tol))
				    	{
				    		if (parseFloat(ui.chromelessToolbar.style.opacity || 0) > 0)
				    		{
				    			fadeOut();
				    		}
				    		else
				    		{
				    			fadeIn(30);
				    		}
						}
			    	}
			    }
			});
		} // end if toolbar

		// Installs handling of highlight and handling links to relative links and anchors
		if (!this.editor.editable)
		{
			this.addChromelessClickHandler();
		}
	}
	else if (this.editor.extendCanvas)
	{
		/**
		 * Guesses autoTranslate to avoid another repaint (see below).
		 * Works if only the scale of the graph changes or if pages
		 * are visible and the visible pages do not change.
		 */
		let graphViewValidate = graph.view.validate;
		graph.view.validate = function()
		{
			if (this.graph.container != null && hasScrollbars(this.graph.container))
			{
				let pad = this.graph.getPagePadding();
				let size = this.graph.getPageSize();
				
				// Updating scrollbars here causes flickering in quirks and is not needed
				// if zoom method is always used to set the current scale on the graph.
				let tx = this.translate.x;
				let ty = this.translate.y;
				this.translate.x = pad.x - (this.x0 || 0) * size.width;
				this.translate.y = pad.y - (this.y0 || 0) * size.height;
			}
			
			graphViewValidate.apply(this, arguments);
		};
		
		if (!graph.isViewer())
		{
			let graphSizeDidChange = graph.sizeDidChange;
			
			graph.sizeDidChange = function()
			{
				if (this.container != null && hasScrollbars(this.container))
				{
					let pages = this.getPageLayout();
					let pad = this.getPagePadding();
					let size = this.getPageSize();
					
					// Updates the minimum graph size
					let minw = Math.ceil(2 * pad.x + pages.width * size.width);
					let minh = Math.ceil(2 * pad.y + pages.height * size.height);
					
					let min = graph.minimumGraphSize;
					
					// LATER: Fix flicker of scrollbar size in IE quirks mode
					// after delayed call in window.resize event handler
					if (min == null || min.width != minw || min.height != minh)
					{
						graph.minimumGraphSize = new Rectangle(0, 0, minw, minh);
					}
					
					// Updates auto-translate to include padding and graph size
					let dx = pad.x - pages.x * size.width;
					let dy = pad.y - pages.y * size.height;
					
					if (!this.autoTranslate && (this.view.translate.x != dx || this.view.translate.y != dy))
					{
						this.autoTranslate = true;
						this.view.x0 = pages.x;
						this.view.y0 = pages.y;
	
						// NOTE: THIS INVOKES THIS METHOD AGAIN. UNFORTUNATELY THERE IS NO WAY AROUND THIS SINCE THE
						// BOUNDS ARE KNOWN AFTER THE VALIDATION AND SETTING THE TRANSLATE TRIGGERS A REVALIDATION.
						// SHOULD MOVE TRANSLATE/SCALE TO VIEW.
						let tx = graph.view.translate.x;
						let ty = graph.view.translate.y;
						graph.view.setTranslate(dx, dy);
						
						// LATER: Fix rounding errors for small zoom
						graph.container.scrollLeft += Math.round((dx - tx) * graph.view.scale);
						graph.container.scrollTop += Math.round((dy - ty) * graph.view.scale);
						
						this.autoTranslate = false;
						
						return;
					}
	
					graphSizeDidChange.apply(this, arguments);
				}
				else
				{
					// Fires event but does not invoke superclass
					this.fireEvent(new EventObject(mxEvent.SIZE, 'bounds', this.getGraphBounds()));
				}
			};
		}
	}
	
	// Accumulates the zoom factor while the rendering is taking place
	// so that not the complete sequence of zoom steps must be painted
	let bgGroup = graph.view.getBackgroundPane();
	let mainGroup = graph.view.getDrawPane();
	graph.cumulativeZoomFactor = 1;
	let updateZoomTimeout = null;
	let cursorPosition = null;
	let scrollPosition = null;
	let forcedZoom = null;
	let filter = null;
	
	let scheduleZoom = function(delay)
	{
		if (updateZoomTimeout != null)
		{
			window.clearTimeout(updateZoomTimeout);
		}

		window.setTimeout(function()
		{
			if (!graph.isMouseDown || forcedZoom)
			{
				updateZoomTimeout = window.setTimeout((() =>
		        {
		        	if (graph.isFastZoomEnabled())
		    		{
		            	// Transforms background page
		  				if (graph.view.backgroundPageShape != null && graph.view.backgroundPageShape.node != null)
		  				{
		  					setPrefixedStyle(graph.view.backgroundPageShape.node.style, 'transform-origin', null);
		  					setPrefixedStyle(graph.view.backgroundPageShape.node.style, 'transform', null);
		  				}
		  				
		  				// Transforms graph and background image
		  				mainGroup.style.transformOrigin = '';
		  				bgGroup.style.transformOrigin = '';

		  				// Workaround for no reset of transform in Safari
		  				if (Client.IS_SF)
		  				{
			  				mainGroup.style.transform = 'scale(1)';
			  				bgGroup.style.transform = 'scale(1)';
			  				
			  				window.setTimeout(function()
	  						{
			  					mainGroup.style.transform = '';
	  							bgGroup.style.transform = '';
	  						}, 0)
		  				}
		  				else
		  				{
			  				mainGroup.style.transform = '';
			  				bgGroup.style.transform = '';
		  				}
		  				
		            	// Shows interactive elements
		            	graph.view.getDecoratorPane().style.opacity = '';
		            	graph.view.getOverlayPane().style.opacity = '';
		    		}
		        	
		        	let sp = new Point(graph.container.scrollLeft, graph.container.scrollTop);
		            let offset = getOffset(graph.container);
		        	let prev = graph.view.scale;
		            let dx = 0;
		            let dy = 0;
		            
		            if (cursorPosition != null)
		            {
		                dx = graph.container.offsetWidth / 2 - cursorPosition.x + offset.x;
		                dy = graph.container.offsetHeight / 2 - cursorPosition.y + offset.y;
		            }
	
		            graph.zoom(graph.cumulativeZoomFactor);
		            let s = graph.view.scale;
		            
		            if (s != prev)
		            {
			            if (scrollPosition != null)
			            {
			            	dx += sp.x - scrollPosition.x;
			            	dy += sp.y - scrollPosition.y;
			            }
			            
		                if (resize != null)
		                {
		                	ui.chromelessResize(false, null, dx * (graph.cumulativeZoomFactor - 1),
		                		dy * (graph.cumulativeZoomFactor - 1));
		                }
		                
		                if (hasScrollbars(graph.container) && (dx != 0 || dy != 0))
		                {
		                    graph.container.scrollLeft -= dx * (graph.cumulativeZoomFactor - 1);
		                    graph.container.scrollTop -= dy * (graph.cumulativeZoomFactor - 1);
		                }
		            }
		            
					if (filter != null)
					{
						mainGroup.setAttribute('filter', filter);
					}
					
		            graph.cumulativeZoomFactor = 1;
		            updateZoomTimeout = null;
		            scrollPosition = null;
		            cursorPosition = null;
		            forcedZoom = null;
		            filter = null;
		        }), (delay != null) ? delay : ((graph.isFastZoomEnabled()) ? ui.wheelZoomDelay : ui.lazyZoomDelay));
			}
		}, 0);
	};

	graph.lazyZoom = function(zoomIn, ignoreCursorPosition, delay)
	{
		// TODO: Fix ignored cursor position if scrollbars are disabled
		ignoreCursorPosition = ignoreCursorPosition || !graph.scrollbars;
		
		if (ignoreCursorPosition)
		{
			cursorPosition = new Point(
				graph.container.offsetLeft + graph.container.clientWidth / 2,
				graph.container.offsetTop + graph.container.clientHeight / 2);
		}
		
		// Switches to 5% zoom steps below 15%
		if (zoomIn)
		{
			if (this.view.scale * this.cumulativeZoomFactor <= 0.15)
			{
				this.cumulativeZoomFactor *= (this.view.scale + 0.05) / this.view.scale;
			}
			else
			{
				// Uses to 5% zoom steps for better grid rendering in webkit
				// and to avoid rounding errors for zoom steps
				this.cumulativeZoomFactor *= this.zoomFactor;
				this.cumulativeZoomFactor = Math.round(this.view.scale * this.cumulativeZoomFactor * 20) / 20 / this.view.scale;
			}
		}
		else
		{
			if (this.view.scale * this.cumulativeZoomFactor <= 0.15)
			{
				this.cumulativeZoomFactor *= (this.view.scale - 0.05) / this.view.scale;
			}
			else
			{
				// Uses to 5% zoom steps for better grid rendering in webkit
				// and to avoid rounding errors for zoom steps
				this.cumulativeZoomFactor /= this.zoomFactor;
				this.cumulativeZoomFactor = Math.round(this.view.scale * this.cumulativeZoomFactor * 20) / 20 / this.view.scale;
			}
		}

		this.cumulativeZoomFactor = Math.max(0.05, Math.min(this.view.scale * this.cumulativeZoomFactor, 160)) / this.view.scale;

		if (graph.isFastZoomEnabled())
		{
			if (filter == null && mainGroup.getAttribute('filter') != '')
			{
				filter = mainGroup.getAttribute('filter');
				mainGroup.removeAttribute('filter');
			}

			scrollPosition = new Point(graph.container.scrollLeft, graph.container.scrollTop);
			
			let cx = (ignoreCursorPosition) ? graph.container.scrollLeft + graph.container.clientWidth / 2 :
				cursorPosition.x + graph.container.scrollLeft - graph.container.offsetLeft;
			let cy = (ignoreCursorPosition) ? graph.container.scrollTop + graph.container.clientHeight / 2 :
				cursorPosition.y + graph.container.scrollTop - graph.container.offsetTop;
			mainGroup.style.transformOrigin = cx + 'px ' + cy + 'px';
			mainGroup.style.transform = 'scale(' + this.cumulativeZoomFactor + ')';
			bgGroup.style.transformOrigin = cx + 'px ' + cy + 'px';
			bgGroup.style.transform = 'scale(' + this.cumulativeZoomFactor + ')';
			
			if (graph.view.backgroundPageShape != null && graph.view.backgroundPageShape.node != null)
			{
				let page = graph.view.backgroundPageShape.node;
				
				setPrefixedStyle(page.style, 'transform-origin',
					((ignoreCursorPosition) ? ((graph.container.clientWidth / 2 + graph.container.scrollLeft -
						page.offsetLeft) + 'px') : ((cursorPosition.x + graph.container.scrollLeft -
						page.offsetLeft - graph.container.offsetLeft) + 'px')) + ' ' +
					((ignoreCursorPosition) ? ((graph.container.clientHeight / 2 + graph.container.scrollTop -
						page.offsetTop) + 'px') : ((cursorPosition.y + graph.container.scrollTop -
						page.offsetTop - graph.container.offsetTop) + 'px')));
				setPrefixedStyle(page.style, 'transform',
					'scale(' + this.cumulativeZoomFactor + ')');
			}

			graph.view.getDecoratorPane().style.opacity = '0';
			graph.view.getOverlayPane().style.opacity = '0';
			
			if (ui.hoverIcons != null)
			{
				ui.hoverIcons.reset();
			}
		}
		
		scheduleZoom(delay);
	};
	
	// Holds back repaint until after mouse gestures
	mxEvent.addGestureListeners(graph.container, function(evt)
	{
		if (updateZoomTimeout != null)
		{
			window.clearTimeout(updateZoomTimeout);
		}
	}, null, function(evt)
	{
		if (graph.cumulativeZoomFactor != 1)
		{
			scheduleZoom(0);
		}
	});
	
	// Holds back repaint until scroll ends
	mxEvent.addListener(graph.container, 'scroll', function(evt)
	{
		if (updateZoomTimeout != null && !graph.isMouseDown && graph.cumulativeZoomFactor != 1)
		{
			scheduleZoom(0);
		}
	});
	
	mxEvent.addMouseWheelListener(((evt, up, force, cx, cy) =>
	{
		if (this.dialogs == null || this.dialogs.length == 0)
		{
			// Scrolls with scrollbars turned off
			if (!graph.scrollbars && !force && graph.isScrollWheelEvent(evt))
            {
                let t = graph.view.getTranslate();
                let step = 40 / graph.view.scale;
                
                if (!mxEvent.isShiftDown(evt))
                {
                    graph.view.setTranslate(t.x, t.y + ((up) ? step : -step));
                }
                else
                {
                    graph.view.setTranslate(t.x + ((up) ? -step : step), t.y);
                }
            }
			else if (force || graph.isZoomWheelEvent(evt))
			{
				let source = mxEvent.getSource(evt);
				
				while (source != null)
				{
					if (source == graph.container)
					{
						graph.getPlugin('TooltipHandler').hideTooltip();
						cursorPosition = (cx != null && cy!= null) ? new Point(cx, cy) :
							new Point(mxEvent.getClientX(evt), mxEvent.getClientY(evt));
						forcedZoom = force;
						graph.lazyZoom(up);
						mxEvent.consume(evt);
				
						return false;
					}
					
					source = source.parentNode;
				}
			}
		}
	}), graph.container);
	
	// Uses fast zoom for pinch gestures on iOS
	graph.getPlugin('PanningHandler').zoomGraph = function(evt)
	{
		graph.cumulativeZoomFactor = evt.scale;
		graph.lazyZoom(evt.scale > 0, true);
		mxEvent.consume(evt);
	};
};

/**
 * Creates a temporary graph instance for rendering off-screen content.
 */
EditorUi.prototype.addChromelessToolbarItems = function(addButton)
{
	addButton(((evt) =>
	{
		this.actions.get('print').funct();
		mxEvent.consume(evt);
	}), Editor.printLargeImage, Translations.get('print'));
};

/**
 * Creates a temporary graph instance for rendering off-screen content.
 */
EditorUi.prototype.isPagesEnabled = function()
{
	return this.editor.editable || urlParams['hide-pages'] != '1';
};

/**
 * Creates a temporary graph instance for rendering off-screen content.
 */
EditorUi.prototype.createTemporaryGraph = function(stylesheet)
{
	let graph = new Graph(document.createElement('div'));
	graph.stylesheet.styles = clone(stylesheet.styles);
	graph.resetViewOnRootChange = false;
	graph.setConnectable(false);
	graph.gridEnabled = false;
	graph.autoScroll = false;
	graph.setTooltips(false);
	graph.setEnabled(false);

	// Container must be in the DOM for correct HTML rendering
	graph.container.style.visibility = 'hidden';
	graph.container.style.position = 'absolute';
	graph.container.style.overflow = 'hidden';
	graph.container.style.height = '1px';
	graph.container.style.width = '1px';
	
	return graph;
};

/**
 * 
 */
EditorUi.prototype.addChromelessClickHandler = function()
{
	let hl = urlParams['highlight'];
	
	// Adds leading # for highlight color code
	if (hl != null && hl.length > 0)
	{
		hl = '#' + hl;
	}

	this.editor.graph.addClickHandler(hl);
};

/**
 * 
 */
EditorUi.prototype.toggleFormatPanel = function(visible)
{
	visible = (visible != null) ? visible : this.formatWidth == 0;
	
	if (this.format != null)
	{
		this.formatWidth = (visible) ? 240 : 0;
		this.formatContainer.style.display = (visible) ? '' : 'none';
		this.refresh();
		this.format.refresh();
		this.fireEvent(new EventObject('formatWidthChanged'));
	}
};

/**
 * Adds support for placeholders in labels.
 */
EditorUi.prototype.lightboxFit = function(maxHeight)
{
	if (this.isDiagramEmpty())
	{
		this.editor.graph.view.setScale(1);
	}
	else
	{
		let p = urlParams['border'];
		let border = 60;
		
		if (p != null)
		{
			border = parseInt(p);
		}
		
		// LATER: Use initial graph bounds to avoid rounding errors
		this.editor.graph.maxFitScale = this.lightboxMaxFitScale;
		this.editor.graph.fit(border, null, null, null, null, null, maxHeight);
		this.editor.graph.maxFitScale = null;
	}
};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.isDiagramEmpty = function()
{
	let model = this.editor.graph.getDataModel();
	
	return model.getChildCount(model.root) == 1 && model.root.getChildAt(0).getChildCount() == 0;
};

/**
 * Hook for allowing selection and context menu for certain events.
 */
EditorUi.prototype.isSelectionAllowed = function(evt)
{
	return mxEvent.getSource(evt).nodeName == 'SELECT' || (mxEvent.getSource(evt).nodeName == 'INPUT' &&
		isAncestorNode(this.formatContainer, mxEvent.getSource(evt)));
};

/**
 * Installs dialog if browser window is closed without saving
 * This must be disabled during save and image export.
 */
EditorUi.prototype.addBeforeUnloadListener = function()
{
	// Installs dialog if browser window is closed without saving
	// This must be disabled during save and image export
	window.onbeforeunload = (() =>
	{
		if (!this.editor.isChromelessView())
		{
			return this.onBeforeUnload();
		}
	});
};

/**
 * Sets the onbeforeunload for the application
 */
EditorUi.prototype.onBeforeUnload = function()
{
	if (this.editor.modified)
	{
		return Translations.get('allChangesLost');
	}
};

/**
 * Opens the current diagram via the window.opener if one exists.
 */
EditorUi.prototype.open = function()
{
	// Cross-domain window access is not allowed in FF, so if we
	// were opened from another domain then this will fail.
	try
	{
		if (window.opener != null && window.opener.openFile != null)
		{
			window.opener.openFile.setConsumer(((xml, filename) =>
			{
				try
				{
					let doc = parseXml(xml);
					this.editor.setGraphXml(doc.documentElement);
					this.editor.setModified(false);
					this.editor.undoManager.clear();
					
					if (filename != null)
					{
						this.editor.setFilename(filename);
						this.updateDocumentTitle();
					}
					
					return;
				}
				catch (e)
				{
					alert(Translations.get('invalidOrMissingFile') + ': ' + e.message);
				}
			}));
		}
	}
	catch(e)
	{
		// ignore
	}
	
	// Fires as the last step if no file was loaded
	this.editor.graph.view.validate();
	
	// Required only in special cases where an initial file is opened
	// and the minimumGraphSize changes and CSS must be updated.
	this.editor.graph.sizeDidChange();
	this.editor.fireEvent(new EventObject('resetGraphView'));
};

/**
 * Shows the given popup menu.
 */
EditorUi.prototype.showPopupMenu = function(fn, x, y, evt)
{
	this.editor.graph.getPlugin('PopupMenuHandler').hideMenu();
	
	let menu = new mxPopupMenu(fn);
	menu.div.className += ' geMenubarMenu';
	menu.smartSeparators = true;
	menu.showDisabled = true;
	menu.autoExpand = true;
	
	// Disables autoexpand and destroys menu when hidden
	menu.hideMenu = (() =>
	{
		mxPopupMenu.prototype.hideMenu.apply(menu, arguments);
		menu.destroy();
	});

	menu.popup(x, y, null, evt);
	
	// Allows hiding by clicking on document
	this.setCurrentMenu(menu);	
};

/**
 * Sets the current menu and element.
 */
EditorUi.prototype.setCurrentMenu = function(menu, elt)
{
	this.currentMenuElt = elt;
	this.currentMenu = menu;
};

/**
 * Resets the current menu and element.
 */
EditorUi.prototype.resetCurrentMenu = function()
{
	this.currentMenuElt = null;
	this.currentMenu = null;
};

/**
 * Hides and destroys the current menu.
 */
EditorUi.prototype.hideCurrentMenu = function()
{
	if (this.currentMenu != null)
	{
		this.currentMenu.hideMenu();
		this.resetCurrentMenu();
	}
};

/**
 * Updates the document title.
 */
EditorUi.prototype.updateDocumentTitle = function()
{
	let title = this.editor.getOrCreateFilename();
	
	if (this.editor.appName != null)
	{
		title += ' - ' + this.editor.appName;
	}
	
	document.title = title;
};

/**
 * Updates the document title.
 */
EditorUi.prototype.createHoverIcons = function()
{
	return new HoverIcons(this.editor.graph);
};

/**
 * Returns the URL for a copy of this editor with no state.
 */
EditorUi.prototype.redo = function()
{
	try
	{
		let graph = this.editor.graph;
		
		if (graph.isEditing())
		{
			document.execCommand('redo', false, null);
		}
		else
		{
			this.editor.undoManager.redo();
		}
	}
	catch (e)
	{
		// ignore all errors
	}
};

/**
 * Returns the URL for a copy of this editor with no state.
 */
EditorUi.prototype.undo = function()
{
	try
	{
		let graph = this.editor.graph;
	
		if (graph.isEditing())
		{
			// Stops editing and executes undo on graph if native undo
			// does not affect current editing value
			let value = graph.cellEditor.textarea.innerHTML;
			document.execCommand('undo', false, null);
	
			if (value == graph.cellEditor.textarea.innerHTML)
			{
				graph.stopEditing(true);
				this.editor.undoManager.undo();
			}
		}
		else
		{
			this.editor.undoManager.undo();
		}
	}
	catch (e)
	{
		// ignore all errors
	}
};

/**
 * Returns the URL for a copy of this editor with no state.
 */
EditorUi.prototype.canRedo = function()
{
	return this.editor.graph.isEditing() || this.editor.undoManager.canRedo();
};

/**
 * Returns the URL for a copy of this editor with no state.
 */
EditorUi.prototype.canUndo = function()
{
	return this.editor.graph.isEditing() || this.editor.undoManager.canUndo();
};

/**
 * 
 */
EditorUi.prototype.getEditBlankXml = function()
{
	return getXml(this.editor.getGraphXml());
};

/**
 * Returns the URL for a copy of this editor with no state.
 */
EditorUi.prototype.getUrl = function(pathname)
{
	let href = (pathname != null) ? pathname : window.location.pathname;
	let parms = (href.indexOf('?') > 0) ? 1 : 0;
	
	// Removes template URL parameter for new blank diagram
	for (var key in urlParams)
	{
		if (parms == 0)
		{
			href += '?';
		}
		else
		{
			href += '&';
		}
	
		href += key + '=' + urlParams[key];
		parms++;
	}
	
	return href;
};

/**
 * Specifies if the graph has scrollbars.
 */
EditorUi.prototype.setScrollbars = function(value)
{
	let graph = this.editor.graph;
	let prev = graph.container.style.overflow;
	graph.scrollbars = value;
	this.editor.updateGraphComponents();

	if (prev != graph.container.style.overflow)
	{
		graph.container.scrollTop = 0;
		graph.container.scrollLeft = 0;
		graph.view.scaleAndTranslate(1, 0, 0);
		this.resetScrollbars();
	}
	
	this.fireEvent(new EventObject('scrollbarsChanged'));
};

/**
 * Returns true if the graph has scrollbars.
 */
EditorUi.prototype.hasScrollbars = function()
{
	return this.editor.graph.scrollbars;
};

/**
 * Resets the state of the scrollbars.
 */
EditorUi.prototype.resetScrollbars = function()
{
	let graph = this.editor.graph;
	
	if (!this.editor.extendCanvas)
	{
		graph.container.scrollTop = 0;
		graph.container.scrollLeft = 0;
	
		if (!hasScrollbars(graph.container))
		{
			graph.view.setTranslate(0, 0);
		}
	}
	else if (!this.editor.isChromelessView())
	{
		if (hasScrollbars(graph.container))
		{
			if (graph.pageVisible)
			{
				let pad = graph.getPagePadding();
				graph.container.scrollTop = Math.floor(pad.y - this.editor.initialTopSpacing) - 1;
				graph.container.scrollLeft = Math.floor(Math.min(pad.x,
					(graph.container.scrollWidth - graph.container.clientWidth) / 2)) - 1;

				// Scrolls graph to visible area
				let bounds = graph.getGraphBounds();
				
				if (bounds.width > 0 && bounds.height > 0)
				{
					if (bounds.x > graph.container.scrollLeft + graph.container.clientWidth * 0.9)
					{
						graph.container.scrollLeft = Math.min(bounds.x + bounds.width - graph.container.clientWidth, bounds.x - 10);
					}
					
					if (bounds.y > graph.container.scrollTop + graph.container.clientHeight * 0.9)
					{
						graph.container.scrollTop = Math.min(bounds.y + bounds.height - graph.container.clientHeight, bounds.y - 10);
					}
				}
			}
			else
			{
				let bounds = graph.getGraphBounds();
				let width = Math.max(bounds.width, graph.scrollTileSize.width * graph.view.scale);
				let height = Math.max(bounds.height, graph.scrollTileSize.height * graph.view.scale);
				graph.container.scrollTop = Math.floor(Math.max(0, bounds.y - Math.max(20, (graph.container.clientHeight - height) / 4)));
				graph.container.scrollLeft = Math.floor(Math.max(0, bounds.x - Math.max(0, (graph.container.clientWidth - width) / 2)));
			}
		}
		else
		{
			let b = Rectangle.fromRectangle((graph.pageVisible) ? graph.view.getBackgroundPageBounds() : graph.getGraphBounds())
			let tr = graph.view.translate;
			let s = graph.view.scale;
            b.x = b.x / s - tr.x;
            b.y = b.y / s - tr.y;
            b.width /= s;
            b.height /= s;
            
            let dy = (graph.pageVisible) ? 0 : Math.max(0, (graph.container.clientHeight - b.height) / 4); 
            
			graph.view.setTranslate(Math.floor(Math.max(0,
				(graph.container.clientWidth - b.width) / 2) - b.x + 2),
				Math.floor(dy - b.y + 1));
		}
	}
};

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setPageVisible = function(value)
{
	let graph = this.editor.graph;
	let hasScrollbars = hasScrollbars(graph.container);
	let tx = 0;
	let ty = 0;
	
	if (hasScrollbars)
	{
		tx = graph.view.translate.x * graph.view.scale - graph.container.scrollLeft;
		ty = graph.view.translate.y * graph.view.scale - graph.container.scrollTop;
	}
	
	graph.pageVisible = value;
	graph.pageBreaksVisible = value; 
	graph.preferPageSize = value;
	graph.view.validateBackground();

	// Workaround for possible handle offset
	if (hasScrollbars)
	{
		let cells = graph.getSelectionCells();
		graph.clearSelection();
		graph.setSelectionCells(cells);
	}
	
	// Calls updatePageBreaks
	graph.sizeDidChange();
	
	if (hasScrollbars)
	{
		graph.container.scrollLeft = graph.view.translate.x * graph.view.scale - tx;
		graph.container.scrollTop = graph.view.translate.y * graph.view.scale - ty;
	}
	
	this.fireEvent(new EventObject('pageViewChanged'));
};

/**
 * Undoable change to grid color.
 */
function ChangeGridColor(ui, color)
{
	this.ui = ui;
	this.color = color;
};

/**
 * Executes selection of a new page.
 */
ChangeGridColor.prototype.execute = function()
{
	let temp = this.ui.editor.graph.view.gridColor;
	this.ui.setGridColor(this.color);
	this.color = temp;
};

// Registers codec for ChangePageSetup
(function()
{
	let codec = new ObjectCodec(new ChangeGridColor(), ['ui']);

	CodecRegistry.register(codec);
})();

/**
 * Change types
 */
function ChangePageSetup(ui, color, image, format, pageScale)
{
	this.ui = ui;
	this.color = color;
	this.previousColor = color;
	this.image = image;
	this.previousImage = image;
	this.format = format;
	this.previousFormat = format;
	this.pageScale = pageScale;
	this.previousPageScale = pageScale;
	
	// Needed since null are valid values for color and image
	this.ignoreColor = false;
	this.ignoreImage = false;
}

/**
 * Implementation of the undoable page rename.
 */
ChangePageSetup.prototype.execute = function()
{
	let graph = this.ui.editor.graph;
	
	if (!this.ignoreColor)
	{
		this.color = this.previousColor;
		let tmp = graph.background;
		this.ui.setBackgroundColor(this.previousColor);
		this.previousColor = tmp;
	}
	
	if (!this.ignoreImage)
	{
		this.image = this.previousImage;
		let tmp = graph.backgroundImage;
		this.ui.setBackgroundImage(this.previousImage);
		this.previousImage = tmp;
	}
	
	if (this.previousFormat != null)
	{
		this.format = this.previousFormat;
		let tmp = graph.pageFormat;
		
		if (this.previousFormat.width != tmp.width ||
			this.previousFormat.height != tmp.height)
		{
			this.ui.setPageFormat(this.previousFormat);
			this.previousFormat = tmp;
		}
	}

    if (this.foldingEnabled != null && this.foldingEnabled != this.ui.editor.graph.foldingEnabled)
    {
    	this.ui.setFoldingEnabled(this.foldingEnabled);
        this.foldingEnabled = !this.foldingEnabled;
    }

    if (this.previousPageScale != null)
    {
	    let currentPageScale = this.ui.editor.graph.pageScale;
	    
	    if (this.previousPageScale != currentPageScale)
	    {
	    	this.ui.setPageScale(this.previousPageScale);
	        this.previousPageScale = currentPageScale;
	    }
    }
};

// Registers codec for ChangePageSetup
(function()
{
	let codec = new ObjectCodec(new ChangePageSetup(),  ['ui', 'previousColor', 'previousImage', 'previousFormat', 'previousPageScale']);

	codec.afterDecode = function(dec, node, obj)
	{
		obj.previousColor = obj.color;
		obj.previousImage = obj.image;
		obj.previousFormat = obj.format;
		obj.previousPageScale = obj.pageScale;

        if (obj.foldingEnabled != null)
        {
        	obj.foldingEnabled = !obj.foldingEnabled;
        }
       
		return obj;
	};
	
	CodecRegistry.register(codec);
})();

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setBackgroundColor = function(value)
{
	this.editor.graph.background = value;
	this.editor.graph.view.validateBackground();

	this.fireEvent(new EventObject('backgroundColorChanged'));
};

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setFoldingEnabled = function(value)
{
	this.editor.graph.foldingEnabled = value;
	this.editor.graph.view.revalidate();
	
	this.fireEvent(new EventObject('foldingEnabledChanged'));
};

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setPageFormat = function(value)
{
	this.editor.graph.pageFormat = value;
	
	if (!this.editor.graph.pageVisible)
	{
		this.actions.get('pageView').funct();
	}
	else
	{
		this.editor.graph.view.validateBackground();
		this.editor.graph.sizeDidChange();
	}

	this.fireEvent(new EventObject('pageFormatChanged'));
};

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setPageScale = function(value)
{
	this.editor.graph.pageScale = value;
	
	if (!this.editor.graph.pageVisible)
	{
		this.actions.get('pageView').funct();
	}
	else
	{
		this.editor.graph.view.validateBackground();
		this.editor.graph.sizeDidChange();
	}

	this.fireEvent(new EventObject('pageScaleChanged'));
};

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setGridColor = function(value)
{
	this.editor.graph.view.gridColor = value;
	this.editor.graph.view.validateBackground();
	this.fireEvent(new EventObject('gridColorChanged'));
};

/**
 * Updates the states of the given undo/redo items.
 */
EditorUi.prototype.addUndoListener = function()
{
	let undo = this.actions.get('undo');
	let redo = this.actions.get('redo');
	
	let undoMgr = this.editor.undoManager;
	
    let undoListener = (() =>
    {
    	undo.setEnabled(this.canUndo());
    	redo.setEnabled(this.canRedo());
    });

    undoMgr.addListener(mxEvent.ADD, undoListener);
    undoMgr.addListener(mxEvent.UNDO, undoListener);
    undoMgr.addListener(mxEvent.REDO, undoListener);
    undoMgr.addListener(mxEvent.CLEAR, undoListener);
	
	// Overrides cell editor to update action states
	let cellEditorStartEditing = this.editor.graph.cellEditor.startEditing;
	
	this.editor.graph.cellEditor.startEditing = function()
	{
		cellEditorStartEditing.apply(this, arguments);
		undoListener();
	};
	
	let cellEditorStopEditing = this.editor.graph.cellEditor.stopEditing;
	
	this.editor.graph.cellEditor.stopEditing = function(cell, trigger)
	{
		cellEditorStopEditing.apply(this, arguments);
		undoListener();
	};
	
	// Updates the button states once
    undoListener();
};

/**
* Updates the states of the given toolbar items based on the selection.
*/
EditorUi.prototype.updateActionStates = function()
{
	let graph = this.editor.graph;
	let selected = !graph.isSelectionEmpty();
	let vertexSelected = false;
	let groupSelected = false;
	let edgeSelected = false;

	let cells = graph.getSelectionCells();
	
	if (cells != null)
	{
    	for (let i = 0; i < cells.length; i++)
    	{
    		let cell = cells[i];
    		
    		if (cell.isEdge())
    		{
    			edgeSelected = true;
    		}
    		
    		if (cell.isVertex())
    		{
    			vertexSelected = true;
    			
	    		if (cell.getChildCount() > 0 ||
	    			graph.isContainer(cell))
	    		{
	    			groupSelected = true;
	    		}
    		}
    		
    		if (edgeSelected && vertexSelected)
			{
				break;
			}
		}
	}
	
	// Updates action states
	let actions = ['cut', 'copy', 'bold', 'italic', 'underline', 'delete', 'duplicate',
	               'editStyle', 'editTooltip', 'editLink', 'backgroundColor', 'borderColor',
	               'edit', 'toFront', 'toBack', 'lockUnlock', 'solid', 'dashed', 'pasteSize',
	               'dotted', 'fillColor', 'gradientColor', 'shadow', 'fontColor',
	               'formattedText', 'rounded', 'toggleRounded', 'sharp', 'strokeColor'];
	
	for (let i = 0; i < actions.length; i++)
	{
		this.actions.get(actions[i]).setEnabled(selected);
	}
	
	this.actions.get('setAsDefaultStyle').setEnabled(graph.getSelectionCount() == 1);
	this.actions.get('clearWaypoints').setEnabled(!graph.isSelectionEmpty());
	this.actions.get('copySize').setEnabled(graph.getSelectionCount() == 1);
	this.actions.get('turn').setEnabled(!graph.isSelectionEmpty());
	this.actions.get('curved').setEnabled(edgeSelected);
	this.actions.get('rotation').setEnabled(vertexSelected);
	this.actions.get('wordWrap').setEnabled(vertexSelected);
	this.actions.get('autosize').setEnabled(vertexSelected);
   	let oneVertexSelected = vertexSelected && graph.getSelectionCount() == 1;
	this.actions.get('group').setEnabled(graph.getSelectionCount() > 1 ||
		(oneVertexSelected && !graph.isContainer(graph.getSelectionCell())));
	this.actions.get('ungroup').setEnabled(groupSelected);
   	this.actions.get('removeFromGroup').setEnabled(oneVertexSelected &&
		graph.getSelectionCell().getParent().isVertex());

	// Updates menu states
   	let state = graph.view.getState(graph.getSelectionCell());
    this.menus.get('navigation').setEnabled(selected || graph.view.currentRoot != null);
    this.actions.get('collapsible').setEnabled(vertexSelected &&
    	(graph.isContainer(graph.getSelectionCell()) || graph.getSelectionCell().getChildCount() > 0));
    this.actions.get('home').setEnabled(graph.view.currentRoot != null);
    this.actions.get('exitGroup').setEnabled(graph.view.currentRoot != null);
    this.actions.get('enterGroup').setEnabled(graph.getSelectionCount() == 1 && graph.isValidRoot(graph.getSelectionCell()));
    let foldable = graph.getSelectionCount() == 1 && graph.isCellFoldable(graph.getSelectionCell());
    this.actions.get('expand').setEnabled(foldable);
    this.actions.get('collapse').setEnabled(foldable);
    this.actions.get('editLink').setEnabled(graph.getSelectionCount() == 1);
    this.actions.get('openLink').setEnabled(graph.getSelectionCount() == 1 &&
    	graph.getLinkForCell(graph.getSelectionCell()) != null);
    this.actions.get('guides').setEnabled(graph.isEnabled());
    this.actions.get('grid').setEnabled(!this.editor.chromeless || this.editor.editable);

    let unlocked = graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent());
    this.menus.get('layout').setEnabled(unlocked);
    this.menus.get('insert').setEnabled(unlocked);
    this.menus.get('direction').setEnabled(unlocked && vertexSelected);
    this.menus.get('align').setEnabled(unlocked && vertexSelected && graph.getSelectionCount() > 1);
    this.menus.get('distribute').setEnabled(unlocked && vertexSelected && graph.getSelectionCount() > 1);
    this.actions.get('selectVertices').setEnabled(unlocked);
    this.actions.get('selectEdges').setEnabled(unlocked);
    this.actions.get('selectAll').setEnabled(unlocked);
    this.actions.get('selectNone').setEnabled(unlocked);
    
    this.updatePasteActionStates();
};

EditorUi.prototype.zeroOffset = new Point(0, 0);

EditorUi.prototype.getDiagramContainerOffset = function()
{
	return this.zeroOffset;
};

/**
 * Refreshes the viewport.
 */
EditorUi.prototype.refresh = function(sizeDidChange)
{
	sizeDidChange = (sizeDidChange != null) ? sizeDidChange : true;
	
	let quirks = false;
	let w = this.container.clientWidth;
	let h = this.container.clientHeight;

	if (this.container == document.body)
	{
		w = document.body.clientWidth || document.documentElement.clientWidth;
		h = (quirks) ? document.body.clientHeight || document.documentElement.clientHeight : document.documentElement.clientHeight;
	}
	
	// Workaround for bug on iOS see
	// http://stackoverflow.com/questions/19012135/ios-7-ipad-safari-landscape-innerheight-outerheight-layout-issue
	// FIXME: Fix if footer visible
	let off = 0;
	
	if (Client.IS_IOS && !window.navigator.standalone)
	{
		if (window.innerHeight != document.documentElement.clientHeight)
		{
			off = document.documentElement.clientHeight - window.innerHeight;
			window.scrollTo(0, 0);
		}
	}
	
	let effHsplitPosition = Math.max(0, Math.min(this.hsplitPosition, w - this.splitSize - 20));
	let tmp = 0;
	
	if (this.menubar != null)
	{
		this.menubarContainer.style.height = this.menubarHeight + 'px';
		tmp += this.menubarHeight;
	}
	
	if (this.toolbar != null)
	{
		this.toolbarContainer.style.top = this.menubarHeight + 'px';
		this.toolbarContainer.style.height = this.toolbarHeight + 'px';
		tmp += this.toolbarHeight;
	}
	
	if (tmp > 0)
	{
		tmp += 1;
	}
	
	let sidebarFooterHeight = 0;
	
	if (this.sidebarFooterContainer != null)
	{
		let bottom = this.footerHeight + off;
		sidebarFooterHeight = Math.max(0, Math.min(h - tmp - bottom, this.sidebarFooterHeight));
		this.sidebarFooterContainer.style.width = effHsplitPosition + 'px';
		this.sidebarFooterContainer.style.height = sidebarFooterHeight + 'px';
		this.sidebarFooterContainer.style.bottom = bottom + 'px';
	}
	
	let fw = (this.format != null) ? this.formatWidth : 0;
	this.sidebarContainer.style.top = tmp + 'px';
	this.sidebarContainer.style.width = effHsplitPosition + 'px';
	this.formatContainer.style.top = tmp + 'px';
	this.formatContainer.style.width = fw + 'px';
	this.formatContainer.style.display = (this.format != null) ? '' : 'none';
	
	let diagContOffset = this.getDiagramContainerOffset();
	let contLeft = (this.hsplit.parentNode != null) ? (effHsplitPosition + this.splitSize) : 0;
	this.diagramContainer.style.left =  (contLeft + diagContOffset.x) + 'px';
	this.diagramContainer.style.top = (tmp + diagContOffset.y) + 'px';
	this.footerContainer.style.height = this.footerHeight + 'px';
	this.hsplit.style.top = this.sidebarContainer.style.top;
	this.hsplit.style.bottom = (this.footerHeight + off) + 'px';
	this.hsplit.style.left = effHsplitPosition + 'px';
	this.footerContainer.style.display = (this.footerHeight == 0) ? 'none' : '';
	
	if (this.tabContainer != null)
	{
		this.tabContainer.style.left = contLeft + 'px';
	}
	
	if (quirks)
	{
		this.menubarContainer.style.width = w + 'px';
		this.toolbarContainer.style.width = this.menubarContainer.style.width;
		let sidebarHeight = Math.max(0, h - this.footerHeight - this.menubarHeight - this.toolbarHeight);
		this.sidebarContainer.style.height = (sidebarHeight - sidebarFooterHeight) + 'px';
		this.formatContainer.style.height = sidebarHeight + 'px';
		this.diagramContainer.style.width = (this.hsplit.parentNode != null) ? Math.max(0, w - effHsplitPosition - this.splitSize - fw) + 'px' : w + 'px';
		this.footerContainer.style.width = this.menubarContainer.style.width;
		let diagramHeight = Math.max(0, h - this.footerHeight - this.menubarHeight - this.toolbarHeight);
		
		if (this.tabContainer != null)
		{
			this.tabContainer.style.width = this.diagramContainer.style.width;
			this.tabContainer.style.bottom = (this.footerHeight + off) + 'px';
			diagramHeight -= this.tabContainer.clientHeight;
		}
		
		this.diagramContainer.style.height = diagramHeight + 'px';
		this.hsplit.style.height = diagramHeight + 'px';
	}
	else
	{
		if (this.footerHeight > 0)
		{
			this.footerContainer.style.bottom = off + 'px';
		}
		
		this.diagramContainer.style.right = fw + 'px';
		let th = 0;
		
		if (this.tabContainer != null)
		{
			this.tabContainer.style.bottom = (this.footerHeight + off) + 'px';
			this.tabContainer.style.right = this.diagramContainer.style.right;
			th = this.tabContainer.clientHeight;
		}
		
		this.sidebarContainer.style.bottom = (this.footerHeight + sidebarFooterHeight + off) + 'px';
		this.formatContainer.style.bottom = (this.footerHeight + off) + 'px';
		this.diagramContainer.style.bottom = (this.footerHeight + off + th) + 'px';
	}
	
	if (sizeDidChange)
	{
		this.editor.graph.sizeDidChange();
	}
};

/**
 * Creates the required containers.
 */
EditorUi.prototype.createTabContainer = function()
{
	return null;
};

/**
 * Creates the required containers.
 */
EditorUi.prototype.createDivs = function()
{
	this.menubarContainer = this.createDiv('geMenubarContainer');
	this.toolbarContainer = this.createDiv('geToolbarContainer');
	this.sidebarContainer = this.createDiv('geSidebarContainer');
	this.formatContainer = this.createDiv('geSidebarContainer geFormatContainer');
	this.diagramContainer = this.createDiv('geDiagramContainer');
	this.footerContainer = this.createDiv('geFooterContainer');
	this.hsplit = this.createDiv('geHsplit');
	this.hsplit.setAttribute('title', Translations.get('collapseExpand'));

	// Sets static style for containers
	this.menubarContainer.style.top = '0px';
	this.menubarContainer.style.left = '0px';
	this.menubarContainer.style.right = '0px';
	this.toolbarContainer.style.left = '0px';
	this.toolbarContainer.style.right = '0px';
	this.sidebarContainer.style.left = '0px';
	this.formatContainer.style.right = '0px';
	this.formatContainer.style.zIndex = '1';
	this.diagramContainer.style.right = ((this.format != null) ? this.formatWidth : 0) + 'px';
	this.footerContainer.style.left = '0px';
	this.footerContainer.style.right = '0px';
	this.footerContainer.style.bottom = '0px';
	this.footerContainer.style.zIndex = mxPopupMenu.prototype.zIndex - 2;
	this.hsplit.style.width = this.splitSize + 'px';
	this.sidebarFooterContainer = this.createSidebarFooterContainer();
	
	if (this.sidebarFooterContainer)
	{
		this.sidebarFooterContainer.style.left = '0px';
	}
	
	if (!this.editor.chromeless)
	{
		this.tabContainer = this.createTabContainer();
	}
	else
	{
		this.diagramContainer.style.border = 'none';
	}
};

/**
 * Hook for sidebar footer container. This implementation returns null.
 */
EditorUi.prototype.createSidebarFooterContainer = function()
{
	return null;
};

/**
 * Creates the required containers.
 */
EditorUi.prototype.createUi = function()
{
	// Creates menubar
	this.menubar = (this.editor.chromeless) ? null : this.menus.createMenubar(this.createDiv('geMenubar'));
	
	if (this.menubar != null)
	{
		this.menubarContainer.appendChild(this.menubar.container);
	}
	
	// Adds status bar in menubar
	if (this.menubar != null)
	{
		this.statusContainer = this.createStatusContainer();
	
		// Connects the status bar to the editor status
		this.editor.addListener('statusChanged', (() =>
		{
			this.setStatusText(this.editor.getStatus());
		}));
	
		this.setStatusText(this.editor.getStatus());
		this.menubar.container.appendChild(this.statusContainer);
		
		// Inserts into DOM
		this.container.appendChild(this.menubarContainer);
	}

	// Creates the sidebar
	this.sidebar = (this.editor.chromeless) ? null : this.createSidebar(this.sidebarContainer);
	
	if (this.sidebar != null)
	{
		this.container.appendChild(this.sidebarContainer);
	}
	
	// Creates the format sidebar
	this.format = (this.editor.chromeless || !this.formatEnabled) ? null : this.createFormat(this.formatContainer);
	
	if (this.format != null)
	{
		this.container.appendChild(this.formatContainer);
	}
	
	// Creates the footer
	let footer = (this.editor.chromeless) ? null : this.createFooter();
	
	if (footer != null)
	{
		this.footerContainer.appendChild(footer);
		this.container.appendChild(this.footerContainer);
	}

	if (this.sidebar != null && this.sidebarFooterContainer)
	{
		this.container.appendChild(this.sidebarFooterContainer);		
	}

	this.container.appendChild(this.diagramContainer);

	if (this.container != null && this.tabContainer != null)
	{
		this.container.appendChild(this.tabContainer);
	}

	// Creates toolbar
	this.toolbar = (this.editor.chromeless) ? null : this.createToolbar(this.createDiv('geToolbar'));
	
	if (this.toolbar != null)
	{
		this.toolbarContainer.appendChild(this.toolbar.container);
		this.container.appendChild(this.toolbarContainer);
	}

	// HSplit
	if (this.sidebar != null)
	{
		this.container.appendChild(this.hsplit);
		
		this.addSplitHandler(this.hsplit, true, 0, ((value) =>
		{
			this.hsplitPosition = value;
			this.refresh();
		}));
	}
};

/**
 * Creates a new toolbar for the given container.
 */
EditorUi.prototype.createStatusContainer = function()
{
	let container = document.createElement('a');
	container.className = 'geItem geStatus';

	return container;
};

/**
 * Creates a new toolbar for the given container.
 */
EditorUi.prototype.setStatusText = function(value)
{
	this.statusContainer.innerHTML = value;
};

/**
 * Creates a new toolbar for the given container.
 */
EditorUi.prototype.createToolbar = function(container)
{
	return new Toolbar(this, container);
};

/**
 * Creates a new sidebar for the given container.
 */
EditorUi.prototype.createSidebar = function(container)
{
	return new Sidebar(this, container);
};

/**
 * Creates a new sidebar for the given container.
 */
EditorUi.prototype.createFormat = function(container)
{
	return new Format(this, container);
};

/**
 * Creates and returns a new footer.
 */
EditorUi.prototype.createFooter = function()
{
	return this.createDiv('geFooter');
};

/**
 * Creates the actual toolbar for the toolbar container.
 */
EditorUi.prototype.createDiv = function(classname)
{
	let elt = document.createElement('div');
	elt.className = classname;
	
	return elt;
};

/**
 * Updates the states of the given undo/redo items.
 */
EditorUi.prototype.addSplitHandler = function(elt, horizontal, dx, onChange)
{
	let start = null;
	let initial = null;
	let ignoreClick = true;
	let last = null;

	// Disables built-in pan and zoom in IE10 and later
	if (Client.IS_POINTER)
	{
		elt.style.touchAction = 'none';
	}
	
	let getValue = (() =>
	{
		let result = parseInt(((horizontal) ? elt.style.left : elt.style.bottom));
	
		// Takes into account hidden footer
		if (!horizontal)
		{
			result = result + dx - this.footerHeight;
		}
		
		return result;
	});

	function moveHandler(evt)
	{
		if (start != null)
		{
			let pt = new Point(mxEvent.getClientX(evt), mxEvent.getClientY(evt));
			onChange(Math.max(0, initial + ((horizontal) ? (pt.x - start.x) : (start.y - pt.y)) - dx));
			mxEvent.consume(evt);
			
			if (initial != getValue())
			{
				ignoreClick = true;
				last = null;
			}
		}
	};
	
	function dropHandler(evt)
	{
		moveHandler(evt);
		initial = null;
		start = null;
	};
	
	mxEvent.addGestureListeners(elt, function(evt)
	{
		start = new Point(mxEvent.getClientX(evt), mxEvent.getClientY(evt));
		initial = getValue();
		ignoreClick = false;
		mxEvent.consume(evt);
	});
	
	mxEvent.addListener(elt, 'click', ((evt) =>
	{
		if (!ignoreClick && this.hsplitClickEnabled)
		{
			let next = (last != null) ? last - dx : 0;
			last = getValue();
			onChange(next);
			mxEvent.consume(evt);
		}
	}));

	mxEvent.addGestureListeners(document, null, moveHandler, dropHandler);
	
	this.destroyFunctions.push(function()
	{
		mxEvent.removeGestureListeners(document, null, moveHandler, dropHandler);
	});	
};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.handleError = function(resp, title, fn, invokeFnOnClose, notFoundMessage)
{
	let e = (resp != null && resp.error != null) ? resp.error : resp;

	if (e != null || title != null)
	{
		let msg = htmlEntities(Translations.get('unknownError'));
		let btn = Translations.get('ok');
		title = (title != null) ? title : Translations.get('error');
		
		if (e != null && e.message != null)
		{
			msg = htmlEntities(e.message);
		}

		this.showError(title, msg, btn, fn, null, null, null, null, null,
			null, null, null, (invokeFnOnClose) ? fn : null);
	}
	else if (fn != null)
	{
		fn();
	}
};

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
EditorUi.prototype.showError = function(title, msg, btn, fn, retry, btn2, fn2, btn3, fn3, w, h, hide, onClose)
{
	let dlg = new ErrorDialog(this, title, msg, btn || Translations.get('ok'),
		fn, retry, btn2, fn2, hide, btn3, fn3);
	let lines = Math.ceil((msg != null) ? msg.length / 50 : 1);
	this.showDialog(dlg.container, w || 340, h || (100 + lines * 20), true, false, onClose);
	dlg.init();
};

/**
 * Displays a print dialog.
 */
EditorUi.prototype.showDialog = function(elt, w, h, modal, closable, onClose, noScroll, transparent, onResize, ignoreBgClick)
{
	this.editor.graph.getPlugin('TooltipHandler').hideTooltip();
	
	if (this.dialogs == null)
	{
		this.dialogs = [];
	}
	
	this.dialog = new Dialog(this, elt, w, h, modal, closable, onClose, noScroll, transparent, onResize, ignoreBgClick);
	this.dialogs.push(this.dialog);
};

/**
 * Displays a print dialog.
 */
EditorUi.prototype.hideDialog = function(cancel, isEsc)
{
	if (this.dialogs != null && this.dialogs.length > 0)
	{
		let dlg = this.dialogs.pop();
		
		if (dlg.close(cancel, isEsc) == false) 
		{
			//add the dialog back if dialog closing is cancelled
			this.dialogs.push(dlg);
			return;
		}
		
		this.dialog = (this.dialogs.length > 0) ? this.dialogs[this.dialogs.length - 1] : null;
		this.editor.fireEvent(new EventObject('hideDialog'));
		
		if (this.dialog == null && this.editor.graph.container.style.visibility != 'hidden')
		{
			window.setTimeout((() =>
			{
				if (this.editor.graph.isEditing() && this.editor.graph.cellEditor.textarea != null)
				{
					this.editor.graph.cellEditor.textarea.focus();
				}
				else
				{
					clearSelection();
					this.editor.graph.container.focus();
				}
			}), 0);
		}
	}
};

/**
 * Handles ctrl+enter keystroke to clone cells.
 */
EditorUi.prototype.ctrlEnter = function()
{
	let graph = this.editor.graph;

	if (graph.isEnabled())
	{
		try
		{
			let cells = graph.getSelectionCells();
		    let lookup = new Dictionary();
		    let newCells = [];

		    for (let i = 0; i < cells.length; i++)
		    {
		    	// Clones table rows instead of cells
		    	let cell = (graph.isTableCell(cells[i])) ? cells[i].getParent() : cells[i];
		    	
		    	if (cell != null && !lookup.get(cell))
		    	{
		    		lookup.put(cell, true);
		            newCells.push(cell);
		        }
		    }
		    
			graph.setSelectionCells(graph.duplicateCells(newCells, false));
		}
		catch (e)
		{
			this.handleError(e);
		}
	}
};

/**
 * Display a color dialog.
 */
EditorUi.prototype.pickColor = function(color, apply)
{
	let graph = this.editor.graph;
	let selState = graph.cellEditor.saveSelection();
	let h = 226 + ((Math.ceil(ColorDialog.prototype.presetColors.length / 12) +
		Math.ceil(ColorDialog.prototype.defaultColors.length / 12)) * 17);
	
	let dlg = new ColorDialog(this, color || 'none', function(color)
	{
		graph.cellEditor.restoreSelection(selState);
		apply(color);
	}, function()
	{
		graph.cellEditor.restoreSelection(selState);
	});
	this.showDialog(dlg.container, 230, h, true, false);
	dlg.init();
};

/**
 * Adds the label menu items to the given menu and parent.
 */
EditorUi.prototype.openFile = function()
{
	// Closes dialog after open
	window.openFile = new OpenFile(((cancel) =>
	{
		this.hideDialog(cancel);
	}));

	// Removes openFile if dialog is closed
	this.showDialog(new OpenDialog(this).container, (Editor.useLocalStorage) ? 640 : 320,
			(Editor.useLocalStorage) ? 480 : 220, true, true, function()
	{
		window.openFile = null;
	});
};

/**
 * Extracs the graph model from the given HTML data from a data transfer event.
 */
EditorUi.prototype.extractGraphModelFromHtml = function(data)
{
	let result = null;
	
	try
	{
    	let idx = data.indexOf('&lt;Transactions ');
    	
    	if (idx >= 0)
    	{
    		var idx2 = data.lastIndexOf('&lt;/Transactions&gt;');
    		
    		if (idx2 > idx)
    		{
    			result = data.substring(idx, idx2 + 21).replace(/&gt;/g, '>').
    				replace(/&lt;/g, '<').replace(/\\&quot;/g, '"').replace(/\n/g, '');
    		}
    	}
	}
	catch (e)
	{
		// ignore
	}
	
	return result;
};

/**
 * Opens the given files in the editor.
 */
EditorUi.prototype.extractGraphModelFromEvent = function(evt)
{
	let result = null;
	let data = null;
	
	if (evt != null)
	{
		let provider = (evt.dataTransfer != null) ? evt.dataTransfer : evt.clipboardData;
		
		if (provider != null)
		{
			data = (provider.types.indexOf('text/html') >= 0) ? provider.getData('text/html') : null;

			if (provider.types.indexOf('text/plain') >= 0 && (data == null || data.length == 0)))
			{
				data = provider.getData('text/plain');
			}

			if (data != null)
			{
				data = Graph.zapGremlins(trim(data));
				
				// Tries parsing as HTML document with embedded XML
				let xml =  this.extractGraphModelFromHtml(data);
				
				if (xml != null)
				{
					data = xml;
				}
			}		
		}
	}
	
	if (data != null && this.isCompatibleString(data))
	{
		result = data;
	}
	
	return result;
};

/**
 * Hook for subclassers to return true if event data is a supported format.
 * This implementation always returns false.
 */
EditorUi.prototype.isCompatibleString = function(data)
{
	return false;
};

/**
 * Adds the label menu items to the given menu and parent.
 */
EditorUi.prototype.saveFile = function(forceDialog)
{
	if (!forceDialog && this.editor.filename != null)
	{
		this.save(this.editor.getOrCreateFilename());
	}
	else
	{
		let dlg = new FilenameDialog(this, this.editor.getOrCreateFilename(), Translations.get('save'), ((name) =>
		{
			this.save(name);
		}), null, ((name) =>
		{
			if (name != null && name.length > 0)
			{
				return true;
			}
			
			confirm(Translations.get('invalidName'));
			
			return false;
		}));
		this.showDialog(dlg.container, 300, 100, true, true);
		dlg.init();
	}
};

/**
 * Saves the current graph under the given filename.
 */
EditorUi.prototype.save = function(name)
{
	if (name != null)
	{
		if (this.editor.graph.isEditing())
		{
			this.editor.graph.stopEditing();
		}
		
		let xml = getXml(this.editor.getGraphXml());
		
		try
		{
			if (Editor.useLocalStorage)
			{
				if (localStorage.getItem(name) != null &&
					!confirm(Translations.get('replaceIt', [name])))
				{
					return;
				}

				localStorage.setItem(name, xml);
				this.editor.setStatus(htmlEntities(Translations.get('saved')) + ' ' + new Date());
			}
			else
			{
				if (xml.length < MAX_REQUEST_SIZE)
				{
					new MaxXmlRequest(SAVE_URL, 'filename=' + encodeURIComponent(name) +
						'&xml=' + encodeURIComponent(xml)).simulate(document, '_blank');
				}
				else
				{
					alert(Translations.get('drawingTooLarge'));
					popup(xml);
					
					return;
				}
			}

			this.editor.setModified(false);
			this.editor.setFilename(name);
			this.updateDocumentTitle();
		}
		catch (e)
		{
			this.editor.setStatus(htmlEntities(Translations.get('errorSavingFile')));
		}
	}
};

/**
 * Executes the given layout.
 */
EditorUi.prototype.executeLayout = function(exec, animate, post)
{
	let graph = this.editor.graph;

	if (graph.isEnabled())
	{
		graph.getDataModel().beginUpdate();
		try
		{
			exec();
		}
		catch (e)
		{
			throw e;
		}
		finally
		{
			// Animates the changes in the graph model except
			// for Camino, where animation is too slow
			if (this.allowAnimation && animate && (navigator.userAgent == null ||
				navigator.userAgent.indexOf('Camino') < 0))
			{
				// New API for animating graph layout results asynchronously
				let morph = new Morphing(graph);
				morph.addListener(mxEvent.DONE, (() =>
				{
					graph.getDataModel().endUpdate();
					
					if (post != null)
					{
						post();
					}
				}));
				
				morph.startAnimation();
			}
			else
			{
				graph.getDataModel().endUpdate();
				
				if (post != null)
				{
					post();
				}
			}
		}
	}
};

/**
 * Hides the current menu.
 */
EditorUi.prototype.showImageDialog = function(title, value, fn, ignoreExisting)
{
	let cellEditor = this.editor.graph.cellEditor;
	let selState = cellEditor.saveSelection();
	let newValue = prompt(title, value);
	cellEditor.restoreSelection(selState);
	
	if (newValue != null && newValue.length > 0)
	{
		let img = new Image();
		
		img.onload = function()
		{
			fn(newValue, img.width, img.height);
		};
		img.onerror = function()
		{
			fn(null);
			alert(Translations.get('fileNotFound'));
		};
		
		img.src = newValue;
	}
	else
	{
		fn(null);
	}
};

/**
 * Hides the current menu.
 */
EditorUi.prototype.showLinkDialog = function(value, btnLabel, fn)
{
	let dlg = new LinkDialog(this, value, btnLabel, fn);
	this.showDialog(dlg.container, 420, 90, true, true);
	dlg.init();
};

/**
 * Hides the current menu.
 */
EditorUi.prototype.showDataDialog = function(cell)
{
	if (cell != null)
	{
		let dlg = new EditDataDialog(this, cell);
		this.showDialog(dlg.container, 480, 420, true, false, null, false);
		dlg.init();
	}
};

/**
 * Hides the current menu.
 */
EditorUi.prototype.showBackgroundImageDialog = function(apply, img)
{
	apply = (apply != null) ? apply : ((image) =>
	{
		let change = new ChangePageSetup(this, null, image);
		change.ignoreColor = true;
		
		this.editor.graph.model.execute(change);
	});
	
	let newValue = prompt(Translations.get('backgroundImage'), (img != null) ? img.src : '');
	
	if (newValue != null && newValue.length > 0)
	{
		let img = new Image();
		
		img.onload = function()
		{
			apply(new Image(newValue, img.width, img.height), false);
		};
		img.onerror = function()
		{
			apply(null, true);
			alert(Translations.get('fileNotFound'));
		};
		
		img.src = newValue;
	}
	else
	{
		apply(null);
	}
};

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setBackgroundImage = function(image)
{
	this.editor.graph.setBackgroundImage(image);
	this.editor.graph.view.validateBackgroundImage();

	this.fireEvent(new EventObject('backgroundImageChanged'));
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
EditorUi.prototype.confirm = function(msg, okFn, cancelFn)
{
	if (confirm(msg))
	{
		if (okFn != null)
		{
			okFn();
		}
	}
	else if (cancelFn != null)
	{
		cancelFn();
	}
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
EditorUi.prototype.createOutline = function(wnd)
{
	let outline = new Outline(this.editor.graph);
	outline.border = 20;

	mxEvent.addListener(window, 'resize', function()
	{
		outline.update();
	});
	
	this.addListener('pageFormatChanged', function()
	{
		outline.update();
	});

	return outline;
};

// Alt+Shift+Keycode mapping to action
EditorUi.prototype.altShiftActions = {67: 'clearWaypoints', // Alt+Shift+C
  65: 'connectionArrows', // Alt+Shift+A
  76: 'editLink', // Alt+Shift+L
  80: 'connectionPoints', // Alt+Shift+P
  84: 'editTooltip', // Alt+Shift+T
  86: 'pasteSize', // Alt+Shift+V
  88: 'copySize' // Alt+Shift+X
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
EditorUi.prototype.createKeyHandler = function(editor)
{
	let editorUi = this;
	let graph = this.editor.graph;
	let keyHandler = new KeyHandler(graph);

	let isEventIgnored = keyHandler.isEventIgnored;
	keyHandler.isEventIgnored = function(evt)
	{
		// Handles undo/redo/ctrl+./,/u via action and allows ctrl+b/i
		// only if editing value is HTML (except for FF and Safari)
		return !(mxEvent.isShiftDown(evt) && evt.keyCode == 9) &&
			((!this.isControlDown(evt) || mxEvent.isShiftDown(evt) ||
			(evt.keyCode != 90 && evt.keyCode != 89 && evt.keyCode != 188 &&
			evt.keyCode != 190 && evt.keyCode != 85)) && ((evt.keyCode != 66 && evt.keyCode != 73) ||
			!this.isControlDown(evt) ||  (this.graph.cellEditor.isContentEditing() &&
			!Client.IS_FF && !Client.IS_SF)) && isEventIgnored.apply(this, arguments));
	};
	
	// Ignores graph enabled state but not chromeless state
	keyHandler.isEnabledForEvent = function(evt)
	{
		return (!mxEvent.isConsumed(evt) && this.isGraphEvent(evt) && this.isEnabled() &&
			(editorUi.dialogs == null || editorUi.dialogs.length == 0));
	};
	
	// Routes command-key to control-key on Mac
	keyHandler.isControlDown = function(evt)
	{
		return mxEvent.isControlDown(evt) || (Client.IS_MAC && evt.metaKey);
	};

	let queue = [];
	let thread = null;
	
	// Helper function to move cells with the cursor keys
	function nudge(keyCode, stepSize, resize)
	{
		queue.push(function()
		{
			if (!graph.isSelectionEmpty() && graph.isEnabled())
			{
				stepSize = (stepSize != null) ? stepSize : 1;
	
				if (resize)
				{
					// Resizes all selected vertices
					graph.getDataModel().beginUpdate();
					try
					{
						let cells = graph.getSelectionCells();
						
						for (let i = 0; i < cells.length; i++)
						{
							if (cells[i].isVertex() && graph.isCellResizable(cells[i]))
							{
								let geo = cells[i].getGeometry();
								
								if (geo != null)
								{
									geo = geo.clone();
									
									if (keyCode == 37)
									{
										geo.width = Math.max(0, geo.width - stepSize);
									}
									else if (keyCode == 38)
									{
										geo.height = Math.max(0, geo.height - stepSize);
									}
									else if (keyCode == 39)
									{
										geo.width += stepSize;
									}
									else if (keyCode == 40)
									{
										geo.height += stepSize;
									}
									
									graph.getDataModel().setGeometry(cells[i], geo);
								}
							}
						}
					}
					finally
					{
						graph.getDataModel().endUpdate();
					}
				}
				else
				{
					// Moves vertices up/down in a stack layout
					let cell = graph.getSelectionCell();
					let parent = cell.getParent();
					let layout = null;
	
					if (graph.getSelectionCount() == 1 && cell.isVertex() &&
						graph.layoutManager != null && !graph.isCellLocked(cell))
					{
						layout = graph.layoutManager.getLayout(parent);
					}
					
					if (layout != null && layout.constructor == StackLayout)
					{
						let index = parent.getIndex(cell);
						
						if (keyCode == 37 || keyCode == 38)
						{
							graph.model.add(parent, cell, Math.max(0, index - 1));
						}
						else if (keyCode == 39 ||keyCode == 40)
						{
							graph.model.add(parent, cell, Math.min(parent.getChildCount(), index + 1));
						}
					}
					else
					{
						let cells = graph.getMovableCells(graph.getSelectionCells());
						let realCells = [];
						
					    for (let i = 0; i < cells.length; i++)
					    {
					    	// TODO: Use getCompositeParent
							let style = graph.getCurrentCellStyle(cells[i]);
					    	
							if (getValue(style, 'part', '0') == '1')
							{
						        let parent = cells[i].getParent();
					
						        if (parent.isVertex() && cells.indexOf(parent) < 0)
						        {
						            realCells.push(parent);
						        }
							}
							else
							{
								realCells.push(cells[i]);
							}
					    }
					    
					    if (realCells.length > 0)
					    {
						    cells = realCells;
							let dx = 0;
							let dy = 0;
							
							if (keyCode == 37)
							{
								dx = -stepSize;
							}
							else if (keyCode == 38)
							{
								dy = -stepSize;
							}
							else if (keyCode == 39)
							{
								dx = stepSize;
							}
							else if (keyCode == 40)
							{
								dy = stepSize;
							}
							
							graph.moveCells(cells, dx, dy);
					    }
					}				
				}
			}
		});
		
		if (thread != null)
		{
			window.clearTimeout(thread);
		}
		
		thread = window.setTimeout(function()
		{
			if (queue.length > 0)
			{
				graph.getDataModel().beginUpdate();
				
				try
				{
					for (let i = 0; i < queue.length; i++)
					{
						queue[i]();
					}
					
					queue = [];
				}
				finally
				{
					graph.getDataModel().endUpdate();
				}
			}
		}, 200);
	};
	
	// Overridden to handle special alt+shift+cursor keyboard shortcuts
	let directions = {37: mxConstants.DIRECTION_WEST, 38: mxConstants.DIRECTION_NORTH,
			39: mxConstants.DIRECTION_EAST, 40: mxConstants.DIRECTION_SOUTH};
	
	let keyHandlerGetFunction = keyHandler.getFunction;

	KeyHandler.prototype.getFunction = function(evt)
	{
		if (graph.isEnabled())
		{
			// TODO: Add alt modified state in core API, here are some specific cases
			if (mxEvent.isShiftDown(evt) && mxEvent.isAltDown(evt))
			{
				let action = editorUi.actions.get(editorUi.altShiftActions[evt.keyCode]);

				if (action != null)
				{
					return action.funct;
				}
			}
			
			if (evt.keyCode == 9 && mxEvent.isAltDown(evt))
			{
				if (graph.cellEditor.isContentEditing())
			    {
					// Alt+Shift+Tab while editing
					return function()
					{
						document.execCommand('outdent', false, null);
					};
				}
				else if (mxEvent.isShiftDown(evt))
				{
					// Alt+Shift+Tab
					return function()
					{
						graph.selectParentCell();
					};
				}
				else
				{
					// Alt+Tab
					return function()
					{
						graph.selectChildCell();
					};
				}
			}
			else if (directions[evt.keyCode] != null && !graph.isSelectionEmpty())
			{
				// On macOS, Control+Cursor is used by Expose so allow for Alt+Control to resize
				if (!this.isControlDown(evt) && mxEvent.isShiftDown(evt) && mxEvent.isAltDown(evt))
				{
					if (graph.getSelectionCell() && graph.getSelectionCell().isVertex())
					{
						return function()
						{
							let cells = graph.connectVertex(graph.getSelectionCell(), directions[evt.keyCode],
								graph.defaultEdgeLength, evt, true);
			
							if (cells != null && cells.length > 0)
							{
								if (cells.length == 1 && cells[0].isEdge())
								{
									graph.setSelectionCell(cells[0].getTerminal(false));
								}
								else
								{
									graph.setSelectionCell(cells[cells.length - 1]);
								}

								graph.scrollCellToVisible(graph.getSelectionCell());
								
								if (editorUi.hoverIcons != null)
								{
									editorUi.hoverIcons.update(graph.view.getState(graph.getSelectionCell()));
								}
							}
						};
					}
				}
				else
				{
					// Avoids consuming event if no vertex is selected by returning null below
					// Cursor keys move and resize (ctrl) cells
					if (this.isControlDown(evt))
					{
						return function()
						{
							nudge(evt.keyCode, (mxEvent.isShiftDown(evt)) ? graph.gridSize : null, true);
						};
					}
					else
					{
						return function()
						{
							nudge(evt.keyCode, (mxEvent.isShiftDown(evt)) ? graph.gridSize : null);
						};
					}
				}
			}
		}

		return keyHandlerGetFunction.apply(this, arguments);
	};

	// Binds keystrokes to actions
	keyHandler.bindAction = ((code, control, key, shift) =>
	{
		let action = this.actions.get(key);
		
		if (action != null)
		{
			let f = function()
			{
				if (action.isEnabled())
				{
					action.funct();
				}
			};
    		
			if (control)
			{
				if (shift)
				{
					keyHandler.bindControlShiftKey(code, f);
				}
				else
				{
					keyHandler.bindControlKey(code, f);
				}
			}
			else
			{
				if (shift)
				{
					keyHandler.bindShiftKey(code, f);
				}
				else
				{
					keyHandler.bindKey(code, f);
				}
			}
		}
	});

	let ui = this;
	let keyHandlerEscape = keyHandler.escape;
	keyHandler.escape = function(evt)
	{
		keyHandlerEscape.apply(this, arguments);
	};

	// Ignores enter keystroke. Remove this line if you want the
	// enter keystroke to stop editing. N, W, T are reserved.
	keyHandler.enter = function() {};
	
	keyHandler.bindControlShiftKey(36, function() { graph.exitGroup(); }); // Ctrl+Shift+Home
	keyHandler.bindControlShiftKey(35, function() { graph.enterGroup(); }); // Ctrl+Shift+End
	keyHandler.bindShiftKey(36, function() { graph.home(); }); // Ctrl+Shift+Home
	keyHandler.bindKey(35, function() { graph.refresh(); }); // End
	keyHandler.bindAction(107, true, 'zoomIn'); // Ctrl+Plus
	keyHandler.bindAction(109, true, 'zoomOut'); // Ctrl+Minus
	keyHandler.bindAction(80, true, 'print'); // Ctrl+P
	keyHandler.bindAction(79, true, 'outline', true); // Ctrl+Shift+O

	if (!this.editor.chromeless || this.editor.editable)
	{
		keyHandler.bindControlKey(36, function() { if (graph.isEnabled()) { graph.foldCells(true); }}); // Ctrl+Home
		keyHandler.bindControlKey(35, function() { if (graph.isEnabled()) { graph.foldCells(false); }}); // Ctrl+End
		keyHandler.bindControlKey(13, function() { ui.ctrlEnter(); }); // Ctrl+Enter
		keyHandler.bindAction(8, false, 'delete'); // Backspace
		keyHandler.bindAction(8, true, 'deleteAll'); // Ctrl+Backspace
		keyHandler.bindAction(8, false, 'deleteLabels', true); // Shift+Backspace
		keyHandler.bindAction(46, false, 'delete'); // Delete
		keyHandler.bindAction(46, true, 'deleteAll'); // Ctrl+Delete
		keyHandler.bindAction(46, false, 'deleteLabels', true); // Shift+Delete
		keyHandler.bindAction(36, false, 'resetView'); // Home
		keyHandler.bindAction(72, true, 'fitWindow', true); // Ctrl+Shift+H
		keyHandler.bindAction(74, true, 'fitPage'); // Ctrl+J
		keyHandler.bindAction(74, true, 'fitTwoPages', true); // Ctrl+Shift+J
		keyHandler.bindAction(48, true, 'customZoom'); // Ctrl+0
		keyHandler.bindAction(82, true, 'turn'); // Ctrl+R
		keyHandler.bindAction(82, true, 'clearDefaultStyle', true); // Ctrl+Shift+R
		keyHandler.bindAction(83, true, 'save'); // Ctrl+S
		keyHandler.bindAction(83, true, 'saveAs', true); // Ctrl+Shift+S
		keyHandler.bindAction(65, true, 'selectAll'); // Ctrl+A
		keyHandler.bindAction(65, true, 'selectNone', true); // Ctrl+A
		keyHandler.bindAction(73, true, 'selectVertices', true); // Ctrl+Shift+I
		keyHandler.bindAction(69, true, 'selectEdges', true); // Ctrl+Shift+E
		keyHandler.bindAction(69, true, 'editStyle'); // Ctrl+E
		keyHandler.bindAction(66, true, 'bold'); // Ctrl+B
		keyHandler.bindAction(66, true, 'toBack', true); // Ctrl+Shift+B
		keyHandler.bindAction(70, true, 'toFront', true); // Ctrl+Shift+F
		keyHandler.bindAction(68, true, 'duplicate'); // Ctrl+D
		keyHandler.bindAction(68, true, 'setAsDefaultStyle', true); // Ctrl+Shift+D   
		keyHandler.bindAction(90, true, 'undo'); // Ctrl+Z
		keyHandler.bindAction(89, true, 'autosize', true); // Ctrl+Shift+Y
		keyHandler.bindAction(88, true, 'cut'); // Ctrl+X
		keyHandler.bindAction(67, true, 'copy'); // Ctrl+C
		keyHandler.bindAction(86, true, 'paste'); // Ctrl+V
		keyHandler.bindAction(71, true, 'group'); // Ctrl+G
		keyHandler.bindAction(77, true, 'editData'); // Ctrl+M
		keyHandler.bindAction(71, true, 'grid', true); // Ctrl+Shift+G
		keyHandler.bindAction(73, true, 'italic'); // Ctrl+I
		keyHandler.bindAction(76, true, 'lockUnlock'); // Ctrl+L
		keyHandler.bindAction(76, true, 'layers', true); // Ctrl+Shift+L
		keyHandler.bindAction(80, true, 'formatPanel', true); // Ctrl+Shift+P
		keyHandler.bindAction(85, true, 'underline'); // Ctrl+U
		keyHandler.bindAction(85, true, 'ungroup', true); // Ctrl+Shift+U
		keyHandler.bindAction(190, true, 'superscript'); // Ctrl+.
		keyHandler.bindAction(188, true, 'subscript'); // Ctrl+,
		keyHandler.bindAction(9, false, 'indent', true); // Shift+Tab,
		keyHandler.bindKey(13, function() { if (graph.isEnabled()) { graph.startEditingAtCell(); }}); // Enter
		keyHandler.bindKey(113, function() { if (graph.isEnabled()) { graph.startEditingAtCell(); }}); // F2
	}
	
	if (!Client.IS_WIN)
	{
		keyHandler.bindAction(90, true, 'redo', true); // Ctrl+Shift+Z
	}
	else
	{
		keyHandler.bindAction(89, true, 'redo'); // Ctrl+Y
	}
	
	return keyHandler;
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
EditorUi.prototype.destroy = function()
{
	if (this.editor != null)
	{
		this.editor.destroy();
		this.editor = null;
	}
	
	if (this.menubar != null)
	{
		this.menubar.destroy();
		this.menubar = null;
	}
	
	if (this.toolbar != null)
	{
		this.toolbar.destroy();
		this.toolbar = null;
	}
	
	if (this.sidebar != null)
	{
		this.sidebar.destroy();
		this.sidebar = null;
	}
	
	if (this.keyHandler != null)
	{
		this.keyHandler.destroy();
		this.keyHandler = null;
	}
	
	if (this.keydownHandler != null)
	{
		mxEvent.removeListener(document, 'keydown', this.keydownHandler);
		this.keydownHandler = null;
	}
		
	if (this.keyupHandler != null)
	{
		mxEvent.removeListener(document, 'keyup', this.keyupHandler);
		this.keyupHandler = null;
	}
	
	if (this.resizeHandler != null)
	{
		mxEvent.removeListener(window, 'resize', this.resizeHandler);
		this.resizeHandler = null;
	}
	
	if (this.gestureHandler != null)
	{
		mxEvent.removeGestureListeners(document, this.gestureHandler);
		this.gestureHandler = null;
	}
	
	if (this.orientationChangeHandler != null)
	{
		mxEvent.removeListener(window, 'orientationchange', this.orientationChangeHandler);
		this.orientationChangeHandler = null;
	}
	
	if (this.scrollHandler != null)
	{
		mxEvent.removeListener(window, 'scroll', this.scrollHandler);
		this.scrollHandler = null;
	}

	if (this.destroyFunctions != null)
	{
		for (let i = 0; i < this.destroyFunctions.length; i++)
		{
			this.destroyFunctions[i]();
		}
		
		this.destroyFunctions = null;
	}
	
	let c = [this.menubarContainer, this.toolbarContainer, this.sidebarContainer,
	         this.formatContainer, this.diagramContainer, this.footerContainer,
	         this.chromelessToolbar, this.hsplit, this.sidebarFooterContainer,
	         this.layersDialog];
	
	for (let i = 0; i < c.length; i++)
	{
		if (c[i] != null && c[i].parentNode != null)
		{
			c[i].parentNode.removeChild(c[i]);
		}
	}
};
