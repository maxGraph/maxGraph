/**
 * Copyright (c) 2006-2015, JGraph Ltd
 */

import {
	getNumber,
	getPerimeterPoint, getRotatedPoint,
	getValue,
	mod, ptLineDist,
	ptSegDistSq,
	toRadians,
} from '../../../../../packages/core/src/util/Utils';
import { clone } from '../../../../../packages/core/src/util/cloneUtils';

/**
 * Registers shapes.
 */
(function()
{
	// LATER: Use this to implement striping
	function paintTableBackground(state, c, x, y, w, h, r)
	{
		if (state != null)
		{
			let graph = state.view.graph;
			let start = graph.getActualStartSize(state.cell);
			let rows = graph.model.getChildCells(state.cell, true);
			
			if (rows.length > 0)
			{
				let events = false;
				
				if (this.style != null)
				{
					events = getValue(this.style, 'pointerEvents', '1') == '1';
				}
				
				if (!events)
				{
					c.pointerEvents = false;
				}
				
				let evenRowColor = getValue(state.style,
					'evenRowColor', mxConstants.NONE);
				let oddRowColor = getValue(state.style,
					'oddRowColor', mxConstants.NONE);
				let evenColColor = getValue(state.style,
					'evenColumnColor', mxConstants.NONE);
				let oddColColor = getValue(state.style,
					'oddColumnColor', mxConstants.NONE);
				let cols = graph.model.getChildCells(rows[0], true);
				
				// Paints column backgrounds
				for (let i = 0; i < cols.length; i++)
				{
					let clr = (mod(i, 2) == 1) ? evenColColor : oddColColor;
					let geo = cols[i].getGeometry();
					
					if (geo != null && clr != mxConstants.NONE)
					{
						c.setFillColor(clr);
						c.begin();
						c.moveTo(x + geo.x, y + start.y);
						
						if (r > 0 && i == cols.length - 1)
						{
							c.lineTo(x + geo.x + geo.width - r, y);
							c.quadTo(x + geo.x + geo.width, y, x + geo.x + geo.width, y + r);
							c.lineTo(x + geo.x + geo.width, y + h - r);
							c.quadTo(x + geo.x + geo.width, y + h, x + geo.x + geo.width - r, y + h);
						}
						else
						{
							c.lineTo(x + geo.x + geo.width, y + start.y);
							c.lineTo(x + geo.x + geo.width, y + h - start.height);
						}
						
						c.lineTo(x + geo.x, y + h);
						c.close();
						c.fill();
					}
				}
				
				// Paints row backgrounds
				for (let i = 0; i < rows.length; i++)
				{
					let clr = (mod(i, 2) == 1) ? evenRowColor : oddRowColor;
					let geo = rows[i].getGeometry();
	
					if (geo != null && clr != mxConstants.NONE)
					{
						let b = (i == rows.length - 1) ? y + h : y + geo.y + geo.height;
						c.setFillColor(clr);
						
						c.begin();
						c.moveTo(x + start.x, y + geo.y);
						c.lineTo(x + w - start.width, y + geo.y);
						
						if (r > 0 && i == rows.length - 1)
						{
							c.lineTo(x + w, b - r);
							c.quadTo(x + w, b, x + w - r, b);
							c.lineTo(x + r, b);
							c.quadTo(x, b, x, b - r);
						}
						else
						{
							c.lineTo(x + w - start.width, b);
							c.lineTo(x + start.x, b);
						}
						
						c.close();
						c.fill();
					}
				}
			}
		}
	};

	// Table Shape
	function TableShape()
	{
		SwimlaneShape.call(this);
	};
	
	extend(TableShape, SwimlaneShape);

	TableShape.prototype.getLabelBounds = function(rect)
	{
		let start = this.getTitleSize();
		
		if (start == 0)
		{
			return Shape.prototype.getLabelBounds.apply(this, arguments);
		}
		else
		{
			return SwimlaneShape.prototype.getLabelBounds.apply(this, arguments);
		}
	};
	
	TableShape.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		// LATER: Split background to add striping
		//paintTableBackground(this.state, c, x, y, w, h);
		
		let start = this.getTitleSize();
		
		if (start == 0)
		{
			RectangleShape.prototype.paintBackground.apply(this, arguments);
		}
		else
		{
			SwimlaneShape.prototype.paintVertexShape.apply(this, arguments);
			c.translate(-x, -y);
		}
		
		this.paintForeground(c, x, y, w, h);
	};

	TableShape.prototype.paintForeground = function(c, x, y, w, h)
	{
		if (this.state != null)
		{
			let flipH = this.flipH;
			let flipV = this.flipV;
			
			if (this.direction == mxConstants.DIRECTION_NORTH || this.direction == mxConstants.DIRECTION_SOUTH)
			{
				let tmp = flipH;
				flipH = flipV;
				flipV = tmp;
			}
			
			// Negative transform to avoid save/restore
			c.rotate(-this.getShapeRotation(), flipH, flipV, x + w / 2, y + h / 2);
			
			s = this.scale;
			x = this.bounds.x / s;
			y = this.bounds.y / s;
			w = this.bounds.width / s;
			h = this.bounds.height / s;
			this.paintTableForeground(c, x, y, w, h);
		}
	};
	
	TableShape.prototype.paintTableForeground = function(c, x, y, w, h)
	{
		let graph = this.state.view.graph;
		let start = graph.getActualStartSize(this.state.cell);
		let rows = graph.model.getChildCells(this.state.cell, true);
		
		if (rows.length > 0)
		{
			let rowLines = getValue(this.state.style,
				'rowLines', '1') != '0';
			let columnLines = getValue(this.state.style,
				'columnLines', '1') != '0';
			
			// Paints row lines
			if (rowLines)
			{
				for (let i = 1; i < rows.length; i++)
				{
					let geo = rows[i].getGeometry();
					
					if (geo != null)
					{
						c.begin();
						c.moveTo(x + start.x, y + geo.y);
						c.lineTo(x + w - start.width, y + geo.y);
						c.end();
						c.stroke();
					}
				}
			}
			
			if (columnLines)
			{
				let cols = graph.model.getChildCells(rows[0], true);
				
				// Paints column lines
				for (let i = 1; i < cols.length; i++)
				{
					let geo = cols[i].getGeometry();
					
					if (geo != null)
					{
						c.begin();
						c.moveTo(x + geo.x + start.x, y + start.y);
						c.lineTo(x + geo.x + start.x, y + h - start.height);
						c.end();
						c.stroke();
					}
				}
			}
		}
	};
	
	mxCellRenderer.registerShape('table', TableShape);
	
	// Cube Shape, supports size style
	function CubeShape()
	{
		mxCylinder.call(this);
	};
	extend(CubeShape, mxCylinder);
	CubeShape.prototype.size = 20;
	CubeShape.prototype.darkOpacity = 0;
	CubeShape.prototype.darkOpacity2 = 0;
	
	CubeShape.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		let s = Math.max(0, Math.min(w, Math.min(h, parseFloat(getValue(this.style, 'size', this.size)))));
		let op = Math.max(-1, Math.min(1, parseFloat(getValue(this.style, 'darkOpacity', this.darkOpacity))));
		var op2 = Math.max(-1, Math.min(1, parseFloat(getValue(this.style, 'darkOpacity2', this.darkOpacity2))));
		c.translate(x, y);
		
		c.begin();
		c.moveTo(0, 0);
		c.lineTo(w - s, 0);
		c.lineTo(w, s);
		c.lineTo(w, h);
		c.lineTo(s, h);
		c.lineTo(0, h - s);
		c.lineTo(0, 0);
		c.close();
		c.end();
		c.fillAndStroke();
		
		if (!this.outline)
		{
			c.setShadow(false);
	
			if (op != 0)
			{
				c.setFillAlpha(Math.abs(op));
				c.setFillColor((op < 0) ? '#FFFFFF' : '#000000');
				c.begin();
				c.moveTo(0, 0);
				c.lineTo(w - s, 0);
				c.lineTo(w, s);
				c.lineTo(s, s);
				c.close();
				c.fill();
			}

			if (op2 != 0)
			{
				c.setFillAlpha(Math.abs(op2));
				c.setFillColor((op2 < 0) ? '#FFFFFF' : '#000000');
				c.begin();
				c.moveTo(0, 0);
				c.lineTo(s, s);
				c.lineTo(s, h);
				c.lineTo(0, h - s);
				c.close();
				c.fill();
			}
			
			c.begin();
			c.moveTo(s, h);
			c.lineTo(s, s);
			c.lineTo(0, 0);
			c.moveTo(s, s);
			c.lineTo(w, s);
			c.end();
			c.stroke();
		}
	};
	CubeShape.prototype.getLabelMargins = function(rect)
	{
		if (getValue(this.style, 'boundedLbl', false))
		{
			let s = parseFloat(getValue(this.style, 'size', this.size)) * this.scale;
			
			return new Rectangle(s, s, 0, 0);
		}
		
		return null;
	};
	
	mxCellRenderer.registerShape('cube', CubeShape);
	
	var tan30 = Math.tan(toRadians(30));
	var tan30Dx = (0.5 - tan30) / 2;
	
	// Cube Shape, supports size style
	function IsoRectangleShape()
	{
		Actor.call(this);
	};
	extend(IsoRectangleShape, Actor);
	IsoRectangleShape.prototype.size = 20;
	IsoRectangleShape.prototype.redrawPath = function(path, x, y, w, h)
	{
		let m = Math.min(w, h / tan30);

		path.translate((w - m) / 2, (h - m) / 2 + m / 4);
		path.moveTo(0, 0.25 * m);
		path.lineTo(0.5 * m, m * tan30Dx);
		path.lineTo(m, 0.25 * m);
		path.lineTo(0.5 * m, (0.5 - tan30Dx) * m);
		path.lineTo(0, 0.25 * m);
		path.close();
		path.end();
	};

	mxCellRenderer.registerShape('isoRectangle', IsoRectangleShape);

	// Cube Shape, supports size style
	function IsoCubeShape()
	{
		mxCylinder.call(this);
	};
	extend(IsoCubeShape, mxCylinder);
	IsoCubeShape.prototype.size = 20;
	IsoCubeShape.prototype.redrawPath = function(path, x, y, w, h, isForeground)
	{
		let m = Math.min(w, h / (0.5 + tan30));

		if (isForeground)
		{
			path.moveTo(0, 0.25 * m);
			path.lineTo(0.5 * m, (0.5 - tan30Dx) * m);
			path.lineTo(m, 0.25 * m);
			path.moveTo(0.5 * m, (0.5 - tan30Dx) * m);
			path.lineTo(0.5 * m, (1 - tan30Dx) * m);
			path.end();
		}
		else
		{
			path.translate((w - m) / 2, (h - m) / 2);
			path.moveTo(0, 0.25 * m);
			path.lineTo(0.5 * m, m * tan30Dx);
			path.lineTo(m, 0.25 * m);
			path.lineTo(m, 0.75 * m);
			path.lineTo(0.5 * m, (1 - tan30Dx) * m);
			path.lineTo(0, 0.75 * m);
			path.close();
			path.end();
		}
	};

	mxCellRenderer.registerShape('isoCube', IsoCubeShape);

	
	// DataStore Shape, supports size style
	function DataStoreShape()
	{
		mxCylinder.call(this);
	};
	extend(DataStoreShape, mxCylinder);

	DataStoreShape.prototype.redrawPath = function(c, x, y, w, h, isForeground)
	{
		let dy = Math.min(h / 2, Math.round(h / 8) + this.strokewidth - 1);
		
		if ((isForeground && this.fill != null) || (!isForeground && this.fill == null))
		{
			c.moveTo(0, dy);
			c.curveTo(0, 2 * dy, w, 2 * dy, w, dy);
			
			// Needs separate shapes for correct hit-detection
			if (!isForeground)
			{
				c.stroke();
				c.begin();
			}
			
			c.translate(0, dy / 2);
			c.moveTo(0, dy);
			c.curveTo(0, 2 * dy, w, 2 * dy, w, dy);
			
			// Needs separate shapes for correct hit-detection
			if (!isForeground)
			{
				c.stroke();
				c.begin();
			}
			
			c.translate(0, dy / 2);
			c.moveTo(0, dy);
			c.curveTo(0, 2 * dy, w, 2 * dy, w, dy);
			
			// Needs separate shapes for correct hit-detection
			if (!isForeground)
			{
				c.stroke();
				c.begin();
			}
			
			c.translate(0, -dy);
		}
		
		if (!isForeground)
		{
			c.moveTo(0, dy);
			c.curveTo(0, -dy / 3, w, -dy / 3, w, dy);
			c.lineTo(w, h - dy);
			c.curveTo(w, h + dy / 3, 0, h + dy / 3, 0, h - dy);
			c.close();
		}
	};
	DataStoreShape.prototype.getLabelMargins = function(rect)
	{
		return new Rectangle(0, 2.5 * Math.min(rect.height / 2,
			Math.round(rect.height / 8) + this.strokewidth - 1), 0, 0);
	}

	mxCellRenderer.registerShape('datastore', DataStoreShape);

	// Note Shape, supports size style
	function NoteShape()
	{
		mxCylinder.call(this);
	};
	extend(NoteShape, mxCylinder);
	NoteShape.prototype.size = 30;
	NoteShape.prototype.darkOpacity = 0;
	
	NoteShape.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		let s = Math.max(0, Math.min(w, Math.min(h, parseFloat(getValue(this.style, 'size', this.size)))));
		let op = Math.max(-1, Math.min(1, parseFloat(getValue(this.style, 'darkOpacity', this.darkOpacity))));
		c.translate(x, y);
		
		c.begin();
		c.moveTo(0, 0);
		c.lineTo(w - s, 0);
		c.lineTo(w, s);
		c.lineTo(w, h);
		c.lineTo(0, h);
		c.lineTo(0, 0);
		c.close();
		c.end();
		c.fillAndStroke();
		
		if (!this.outline)
		{
			c.setShadow(false);
	
			if (op != 0)
			{
				c.setFillAlpha(Math.abs(op));
				c.setFillColor((op < 0) ? '#FFFFFF' : '#000000');
				c.begin();
				c.moveTo(w - s, 0);
				c.lineTo(w - s, s);
				c.lineTo(w, s);
				c.close();
				c.fill();
			}
			
			c.begin();
			c.moveTo(w - s, 0);
			c.lineTo(w - s, s);
			c.lineTo(w, s);
			c.end();
			c.stroke();
		}
	};

	mxCellRenderer.registerShape('note', NoteShape);

	// Note Shape, supports size style
	function NoteShape2()
	{
		NoteShape.call(this);
	};
	extend(NoteShape2, NoteShape);
	
	mxCellRenderer.registerShape('note2', NoteShape2);

	// Flexible cube Shape
	function IsoCubeShape2()
	{
		Shape.call(this);
	};
	extend(IsoCubeShape2, Shape);
	IsoCubeShape2.prototype.isoAngle = 15;
	
	IsoCubeShape2.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		let isoAngle = Math.max(0.01, Math.min(94, parseFloat(getValue(this.style, 'isoAngle', this.isoAngle)))) * Math.PI / 200 ;
		let isoH = Math.min(w * Math.tan(isoAngle), h * 0.5);

		c.translate(x,y);
		
		c.begin();
		c.moveTo(w * 0.5, 0);
		c.lineTo(w, isoH);
		c.lineTo(w, h - isoH);
		c.lineTo(w * 0.5, h);
		c.lineTo(0, h - isoH);
		c.lineTo(0, isoH);
		c.close();
		c.fillAndStroke();
		
		c.setShadow(false);
		
		c.begin();
		c.moveTo(0, isoH);
		c.lineTo(w * 0.5, 2 * isoH);
		c.lineTo(w, isoH);
		c.moveTo(w * 0.5, 2 * isoH);
		c.lineTo(w * 0.5, h);
		c.stroke();
	};
	
	mxCellRenderer.registerShape('isoCube2', IsoCubeShape2);
	
	// (LEGACY) Flexible cylinder Shape
	function CylinderShape()
	{
		Shape.call(this);
	};
	
	extend(CylinderShape, Shape);
	
	CylinderShape.prototype.size = 15;
	
	CylinderShape.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		let size = Math.max(0, Math.min(h * 0.5, parseFloat(getValue(this.style, 'size', this.size))));

		c.translate(x,y);

		if (size == 0)
		{
			c.rect(0, 0, w, h);
			c.fillAndStroke();
		}
		else
		{
			c.begin();
			c.moveTo(0, size);
			c.arcTo(w * 0.5, size, 0, 0, 1, w * 0.5, 0);
			c.arcTo(w * 0.5, size, 0, 0, 1, w, size);
			c.lineTo(w, h - size);
			c.arcTo(w * 0.5, size, 0, 0, 1, w * 0.5, h);
			c.arcTo(w * 0.5, size, 0, 0, 1, 0, h - size);
			c.close();
			c.fillAndStroke();
			
			c.setShadow(false);
			
			c.begin();
			c.moveTo(w, size);
			c.arcTo(w * 0.5, size, 0, 0, 1, w * 0.5, 2 * size);
			c.arcTo(w * 0.5, size, 0, 0, 1, 0, size);
			c.stroke();
		}
	};
	
	mxCellRenderer.registerShape('cylinder2', CylinderShape);
	
	// Flexible cylinder3 Shape with offset label
	function CylinderShape3(bounds, fill, stroke, strokewidth)
	{
		Shape.call(this);
		this.bounds = bounds;
		this.fill = fill;
		this.stroke = stroke;
		this.strokewidth = (strokewidth != null) ? strokewidth : 1;
	};
	
	extend(CylinderShape3, mxCylinder);

	CylinderShape3.prototype.size = 15;
	
	CylinderShape3.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		let size = Math.max(0, Math.min(h * 0.5, parseFloat(getValue(this.style, 'size', this.size))));
		let lid = getValue(this.style, 'lid', true);

		c.translate(x,y);

		if (size == 0)
		{
			c.rect(0, 0, w, h);
			c.fillAndStroke();
		}
		else
		{
			c.begin();
			
			if (lid)
			{
				c.moveTo(0, size);
				c.arcTo(w * 0.5, size, 0, 0, 1, w * 0.5, 0);
				c.arcTo(w * 0.5, size, 0, 0, 1, w, size);
			}
			else
			{
				c.moveTo(0, 0);
				c.arcTo(w * 0.5, size, 0, 0, 0, w * 0.5, size);
				c.arcTo(w * 0.5, size, 0, 0, 0, w, 0);
			}

			c.lineTo(w, h - size);
			c.arcTo(w * 0.5, size, 0, 0, 1, w * 0.5, h);
			c.arcTo(w * 0.5, size, 0, 0, 1, 0, h - size);
			c.close();
			c.fillAndStroke();
			
			c.setShadow(false);
			
			if (lid)
			{
				c.begin();
				c.moveTo(w, size);
				c.arcTo(w * 0.5, size, 0, 0, 1, w * 0.5, 2 * size);
				c.arcTo(w * 0.5, size, 0, 0, 1, 0, size);
				c.stroke();
			}
		}
	};

	mxCellRenderer.registerShape('cylinder3', CylinderShape3);
	
	// Switch Shape, supports size style
	function SwitchShape()
	{
		Actor.call(this);
	};
	extend(SwitchShape, Actor);
	SwitchShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		let curve = 0.5;
		c.moveTo(0, 0);
		c.quadTo(w / 2, h * curve,  w, 0);
		c.quadTo(w * (1 - curve), h / 2, w, h);
		c.quadTo(w / 2, h * (1 - curve), 0, h);
		c.quadTo(w * curve, h / 2, 0, 0);
		c.end();
	};

	mxCellRenderer.registerShape('switch', SwitchShape);

	// Folder Shape, supports tabWidth, tabHeight styles
	function FolderShape()
	{
		mxCylinder.call(this);
	};
	extend(FolderShape, mxCylinder);
	FolderShape.prototype.tabWidth = 60;
	FolderShape.prototype.tabHeight = 20;
	FolderShape.prototype.tabPosition = 'right';
	FolderShape.prototype.arcSize = 0.1;
	
	FolderShape.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		c.translate(x, y);
		
		let dx = Math.max(0, Math.min(w, parseFloat(getValue(this.style, 'tabWidth', this.tabWidth))));
		let dy = Math.max(0, Math.min(h, parseFloat(getValue(this.style, 'tabHeight', this.tabHeight))));
		let tp = getValue(this.style, 'tabPosition', this.tabPosition);
		let rounded = getValue(this.style, 'rounded', false);
		let absArcSize = getValue(this.style, 'absoluteArcSize', false);
		let arcSize = parseFloat(getValue(this.style, 'arcSize', this.arcSize));
		
		if (!absArcSize)
		{
			arcSize = Math.min(w, h) * arcSize;
		}
		
		arcSize = Math.min(arcSize, w * 0.5, (h - dy) * 0.5);
		
		dx = Math.max(dx, arcSize);
		dx = Math.min(w - arcSize, dx);
			
		if (!rounded)
		{
			arcSize = 0;
		}
		
		c.begin();
		
		if (tp == 'left')
		{
			c.moveTo(Math.max(arcSize, 0), dy);
			c.lineTo(Math.max(arcSize, 0), 0);
			c.lineTo(dx, 0);
			c.lineTo(dx, dy);
		}
		// Right is default
		else
		{
			c.moveTo(w - dx, dy);
			c.lineTo(w - dx, 0);
			c.lineTo(w - Math.max(arcSize, 0), 0);
			c.lineTo(w - Math.max(arcSize, 0), dy);
		}
		
		if (rounded)
		{
			c.moveTo(0, arcSize + dy);
			c.arcTo(arcSize, arcSize, 0, 0, 1, arcSize, dy);
			c.lineTo(w - arcSize, dy);
			c.arcTo(arcSize, arcSize, 0, 0, 1, w, arcSize + dy);
			c.lineTo(w, h - arcSize);
			c.arcTo(arcSize, arcSize, 0, 0, 1, w - arcSize, h);
			c.lineTo(arcSize, h);
			c.arcTo(arcSize, arcSize, 0, 0, 1, 0, h - arcSize);
		}
		else
		{
			c.moveTo(0, dy);
			c.lineTo(w, dy);
			c.lineTo(w, h);
			c.lineTo(0, h);
		}
		
		c.close();
		c.fillAndStroke();
		
		c.setShadow(false);

		let sym = getValue(this.style, 'folderSymbol', null);
		
		if (sym == 'triangle')
		{
			c.begin();
			c.moveTo(w - 30, dy + 20);
			c.lineTo(w - 20, dy + 10);
			c.lineTo(w - 10, dy + 20);
			c.close();
			c.stroke();
		}
	};

	mxCellRenderer.registerShape('folder', FolderShape);
	
	// Folder Shape, supports tabWidth, tabHeight styles
	function UMLStateShape()
	{
		mxCylinder.call(this);
	};
	extend(UMLStateShape, mxCylinder);
	UMLStateShape.prototype.arcSize = 0.1;
	
	UMLStateShape.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		c.translate(x, y);
		
//		let dx = Math.max(0, Math.min(w, parseFloat(mxUtils.getValue(this.style, 'tabWidth', this.tabWidth))));
//		let dy = Math.max(0, Math.min(h, parseFloat(mxUtils.getValue(this.style, 'tabHeight', this.tabHeight))));
//		let tp = mxUtils.getValue(this.style, 'tabPosition', this.tabPosition);
		let rounded = getValue(this.style, 'rounded', false);
		let absArcSize = getValue(this.style, 'absoluteArcSize', false);
		let arcSize = parseFloat(getValue(this.style, 'arcSize', this.arcSize));
		let connPoint = getValue(this.style, 'umlStateConnection', null);
		
		
		if (!absArcSize)
		{
			arcSize = Math.min(w, h) * arcSize;
		}
		
		arcSize = Math.min(arcSize, w * 0.5, h * 0.5);
		
		if (!rounded)
		{
			arcSize = 0;
		}
		
		let dx = 0;
		
		if (connPoint != null)
		{
			dx = 10;
		}
		
		c.begin();
		c.moveTo(dx, arcSize);
		c.arcTo(arcSize, arcSize, 0, 0, 1, dx + arcSize, 0);
		c.lineTo(w - arcSize, 0);
		c.arcTo(arcSize, arcSize, 0, 0, 1, w, arcSize);
		c.lineTo(w, h - arcSize);
		c.arcTo(arcSize, arcSize, 0, 0, 1, w - arcSize, h);
		c.lineTo(dx + arcSize, h);
		c.arcTo(arcSize, arcSize, 0, 0, 1, dx, h - arcSize);
		c.close();
		c.fillAndStroke();
		
		c.setShadow(false);

		let sym = getValue(this.style, 'umlStateSymbol', null);
		
		if (sym == 'collapseState')
		{
			c.roundrect(w - 40, h - 20, 10, 10, 3, 3);
			c.stroke();
			c.roundrect(w - 20, h - 20, 10, 10, 3, 3);
			c.stroke();
			c.begin();
			c.moveTo(w - 30, h - 15);
			c.lineTo(w - 20, h - 15);
			c.stroke();
		}

		if (connPoint == 'connPointRefEntry')
		{
			c.ellipse(0, h * 0.5 - 10, 20, 20);
			c.fillAndStroke();
		}
		else if (connPoint == 'connPointRefExit')
		{
			c.ellipse(0, h * 0.5 - 10, 20, 20);
			c.fillAndStroke();
			
			c.begin();
			c.moveTo(5, h * 0.5 - 5);
			c.lineTo(15, h * 0.5 + 5);
			c.moveTo(15, h * 0.5 - 5);
			c.lineTo(5, h * 0.5 + 5);
			c.stroke();
		}
};

	mxCellRenderer.registerShape('umlState', UMLStateShape);

	// Card shape
	function CardShape()
	{
		Actor.call(this);
	};
	extend(CardShape, Actor);
	CardShape.prototype.size = 30;
	CardShape.prototype.isRoundable = function()
	{
		return true;
	};
	CardShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		let s = Math.max(0, Math.min(w, Math.min(h, parseFloat(getValue(this.style, 'size', this.size)))));
		let arcSize = getValue(this.style, 'arcSize', mxConstants.LINE_ARCSIZE) / 2;
		this.addPoints(c, [new Point(s, 0), new Point(w, 0), new Point(w, h), new Point(0, h), new Point(0, s)],
				this.isRounded, arcSize, true);
		c.end();
	};

	mxCellRenderer.registerShape('card', CardShape);

	// Tape shape
	function TapeShape()
	{
		Actor.call(this);
	};
	extend(TapeShape, Actor);
	TapeShape.prototype.size = 0.4;
	TapeShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		let dy = h * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'size', this.size))));
		let fy = 1.4;
		
		c.moveTo(0, dy / 2);
		c.quadTo(w / 4, dy * fy, w / 2, dy / 2);
		c.quadTo(w * 3 / 4, dy * (1 - fy), w, dy / 2);
		c.lineTo(w, h - dy / 2);
		c.quadTo(w * 3 / 4, h - dy * fy, w / 2, h - dy / 2);
		c.quadTo(w / 4, h - dy * (1 - fy), 0, h - dy / 2);
		c.lineTo(0, dy / 2);
		c.close();
		c.end();
	};
	
	TapeShape.prototype.getLabelBounds = function(rect)
	{
		if (getValue(this.style, 'boundedLbl', false))
		{
			let size = getValue(this.style, 'size', this.size);
			let w = rect.width;
			let h = rect.height;
			
			if (this.direction == null ||
					this.direction == mxConstants.DIRECTION_EAST ||
					this.direction == mxConstants.DIRECTION_WEST)
			{
				let dy = h * size;
				
				return new Rectangle(rect.x, rect.y + dy, w, h - 2 * dy);
			}
			else
			{
				let dx = w * size;
				
				return new Rectangle(rect.x + dx, rect.y, w - 2 * dx, h);
			}
		}
		
		return rect;
	};
	
	mxCellRenderer.registerShape('tape', TapeShape);

	// Document shape
	function DocumentShape()
	{
		Actor.call(this);
	};
	extend(DocumentShape, Actor);
	DocumentShape.prototype.size = 0.3;
	DocumentShape.prototype.getLabelMargins = function(rect)
	{
		if (getValue(this.style, 'boundedLbl', false))
		{
			return new Rectangle(0, 0, 0, parseFloat(getValue(
				this.style, 'size', this.size)) * rect.height);
		}
		
		return null;
	};
	DocumentShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		let dy = h * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'size', this.size))));
		let fy = 1.4;
		
		c.moveTo(0, 0);
		c.lineTo(w, 0);
		c.lineTo(w, h - dy / 2);
		c.quadTo(w * 3 / 4, h - dy * fy, w / 2, h - dy / 2);
		c.quadTo(w / 4, h - dy * (1 - fy), 0, h - dy / 2);
		c.lineTo(0, dy / 2);
		c.close();
		c.end();
	};

	mxCellRenderer.registerShape('document', DocumentShape);

	let cylinderGetCylinderSize = mxCylinder.prototype.getCylinderSize;
	
	mxCylinder.prototype.getCylinderSize = function(x, y, w, h)
	{
		let size = getValue(this.style, 'size');
		
		if (size != null)
		{
			return h * Math.max(0, Math.min(1, size));
		}
		else
		{
			return cylinderGetCylinderSize.apply(this, arguments);
		}
	};
	
	mxCylinder.prototype.getLabelMargins = function(rect)
	{
		if (getValue(this.style, 'boundedLbl', false))
		{
			let size = getValue(this.style, 'size', 0.15) * 2;
			
			return new Rectangle(0, Math.min(this.maxHeight * this.scale, rect.height * size), 0, 0);
		}
		
		return null;
	};

	CylinderShape3.prototype.getLabelMargins = function(rect)
	{
		if (getValue(this.style, 'boundedLbl', false))
		{
			let size = getValue(this.style, 'size', 15);
			
			if (!getValue(this.style, 'lid', true))
			{
				size /= 2;
			}
			
			return new Rectangle(0, Math.min(rect.height * this.scale, size * 2 * this.scale), 0, Math.max(0, size * 0.3 * this.scale));
		}
		
		return null;
	};

	FolderShape.prototype.getLabelMargins = function(rect)
	{
		if (getValue(this.style, 'boundedLbl', false))
		{
			let sizeY = getValue(this.style, 'tabHeight', 15) * this.scale;

			if (getValue(this.style, 'labelInHeader', false))
			{
				let sizeX = getValue(this.style, 'tabWidth', 15) * this.scale;
				let sizeY = getValue(this.style, 'tabHeight', 15) * this.scale;
				let rounded = getValue(this.style, 'rounded', false);
				let absArcSize = getValue(this.style, 'absoluteArcSize', false);
				let arcSize = parseFloat(getValue(this.style, 'arcSize', this.arcSize));
				
				if (!absArcSize)
				{
					arcSize = Math.min(rect.width, rect.height) * arcSize;
				}
				
				arcSize = Math.min(arcSize, rect.width * 0.5, (rect.height - sizeY) * 0.5);
					
				if (!rounded)
				{
					arcSize = 0;
				}
	
				if (getValue(this.style, 'tabPosition', this.tabPosition) == 'left')
				{
					return new Rectangle(arcSize, 0, Math.min(rect.width, rect.width - sizeX), Math.min(rect.height, rect.height - sizeY));
				}
				else
				{
					return new Rectangle(Math.min(rect.width, rect.width - sizeX), 0, arcSize, Math.min(rect.height, rect.height - sizeY));
				}
			}
			else
			{
				return new Rectangle(0, Math.min(rect.height, sizeY), 0, 0);
			}
		}
		
		return null;
	};

	UMLStateShape.prototype.getLabelMargins = function(rect)
	{
		if (getValue(this.style, 'boundedLbl', false))
		{
			let connPoint = getValue(this.style, 'umlStateConnection', null);
			
			if (connPoint != null)
			{
				return new Rectangle(10 * this.scale, 0, 0, 0);
			}
		}
		
		return null;
	};

	NoteShape2.prototype.getLabelMargins = function(rect)
	{
		if (getValue(this.style, 'boundedLbl', false))
		{
			let size = getValue(this.style, 'size', 15);
			
			return new Rectangle(0, Math.min(rect.height * this.scale, size * this.scale), 0, Math.max(0, size * this.scale));
		}
		
		return null;
	};

	// Parallelogram shape
	function ParallelogramShape()
	{
		Actor.call(this);
	};
	extend(ParallelogramShape, Actor);
	ParallelogramShape.prototype.size = 0.2;
	ParallelogramShape.prototype.fixedSize = 20;
	ParallelogramShape.prototype.isRoundable = function()
	{
		return true;
	};
	ParallelogramShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		let fixed = getValue(this.style, 'fixedSize', '0') != '0';

		let dx = (fixed) ? Math.max(0, Math.min(w, parseFloat(getValue(this.style, 'size', this.fixedSize)))) : w * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'size', this.size))));
		let arcSize = getValue(this.style, 'arcSize', mxConstants.LINE_ARCSIZE) / 2;
		this.addPoints(c, [new Point(0, h), new Point(dx, 0), new Point(w, 0), new Point(w - dx, h)],
				this.isRounded, arcSize, true);
		c.end();
	};

	mxCellRenderer.registerShape('parallelogram', ParallelogramShape);

	// Trapezoid shape
	function TrapezoidShape()
	{
		Actor.call(this);
	};
	extend(TrapezoidShape, Actor);
	TrapezoidShape.prototype.size = 0.2;
	TrapezoidShape.prototype.fixedSize = 20;
	TrapezoidShape.prototype.isRoundable = function()
	{
		return true;
	};
	TrapezoidShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		
		let fixed = getValue(this.style, 'fixedSize', '0') != '0';

		let dx = (fixed) ? Math.max(0, Math.min(w * 0.5, parseFloat(getValue(this.style, 'size', this.fixedSize)))) : w * Math.max(0, Math.min(0.5, parseFloat(getValue(this.style, 'size', this.size))));
		let arcSize = getValue(this.style, 'arcSize', mxConstants.LINE_ARCSIZE) / 2;
		this.addPoints(c, [new Point(0, h), new Point(dx, 0), new Point(w - dx, 0), new Point(w, h)],
				this.isRounded, arcSize, true);
	};

	mxCellRenderer.registerShape('trapezoid', TrapezoidShape);

	// Curly Bracket shape
	function CurlyBracketShape()
	{
		Actor.call(this);
	};
	extend(CurlyBracketShape, Actor);
	CurlyBracketShape.prototype.size = 0.5;
	CurlyBracketShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		c.setFillColor(null);
		let s = w * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'size', this.size))));
		let arcSize = getValue(this.style, 'arcSize', mxConstants.LINE_ARCSIZE) / 2;
		this.addPoints(c, [new Point(w, 0), new Point(s, 0), new Point(s, h / 2),
		                   new Point(0, h / 2), new Point(s, h / 2), new Point(s, h),
		                   new Point(w, h)], this.isRounded, arcSize, false);
		c.end();
	};

	mxCellRenderer.registerShape('curlyBracket', CurlyBracketShape);

	// Parallel marker shape
	function ParallelMarkerShape()
	{
		Actor.call(this);
	};
	extend(ParallelMarkerShape, Actor);
	ParallelMarkerShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		c.setStrokeWidth(1);
		c.setFillColor(this.stroke);
		var w2 = w / 5;
		c.rect(0, 0, w2, h);
		c.fillAndStroke();
		c.rect(2 * w2, 0, w2, h);
		c.fillAndStroke();
		c.rect(4 * w2, 0, w2, h);
		c.fillAndStroke();
	};

	mxCellRenderer.registerShape('parallelMarker', ParallelMarkerShape);

	/**
	 * Adds handJiggle style (jiggle=n sets jiggle)
	 */
	function HandJiggle(canvas, defaultVariation)
	{
		this.canvas = canvas;
		
		// Avoids "spikes" in the output
		this.canvas.setLineJoin('round');
		this.canvas.setLineCap('round');
		
		this.defaultVariation = defaultVariation;
		
		this.originalLineTo = this.canvas.lineTo;
		this.canvas.lineTo = this.bind(HandJiggle.prototype.lineTo);
		
		this.originalMoveTo = this.canvas.moveTo;
		this.canvas.moveTo = this.bind(HandJiggle.prototype.moveTo);
		
		this.originalClose = this.canvas.close;
		this.canvas.close = this.bind(HandJiggle.prototype.close);
		
		this.originalQuadTo = this.canvas.quadTo;
		this.canvas.quadTo = this.bind(HandJiggle.prototype.quadTo);
		
		this.originalCurveTo = this.canvas.curveTo;
		this.canvas.curveTo = this.bind(HandJiggle.prototype.curveTo);
		
		this.originalArcTo = this.canvas.arcTo;
		this.canvas.arcTo = this.bind(HandJiggle.prototype.arcTo);
	};
	
	HandJiggle.prototype.moveTo = function(endX, endY)
	{
		this.originalMoveTo.apply(this.canvas, arguments);
		this.lastX = endX;
		this.lastY = endY;
		this.firstX = endX;
		this.firstY = endY;
	};
	
	HandJiggle.prototype.close = function()
	{
		if (this.firstX != null && this.firstY != null)
		{
			this.lineTo(this.firstX, this.firstY);
			this.originalClose.apply(this.canvas, arguments);
		}
		
		this.originalClose.apply(this.canvas, arguments);
	};
	
	HandJiggle.prototype.quadTo = function(x1, y1, x2, y2)
	{
		this.originalQuadTo.apply(this.canvas, arguments);
		this.lastX = x2;
		this.lastY = y2;
	};
	
	HandJiggle.prototype.curveTo = function(x1, y1, x2, y2, x3, y3)
	{
		this.originalCurveTo.apply(this.canvas, arguments);
		this.lastX = x3;
		this.lastY = y3;
	};
	
	HandJiggle.prototype.arcTo = function(rx, ry, angle, largeArcFlag, sweepFlag, x, y)
	{
		this.originalArcTo.apply(this.canvas, arguments);
		this.lastX = x;
		this.lastY = y;
	};

	HandJiggle.prototype.lineTo = function(endX, endY)
	{
		// LATER: Check why this.canvas.lastX cannot be used
		if (this.lastX != null && this.lastY != null)
		{
			let dx = Math.abs(endX - this.lastX);
			let dy = Math.abs(endY - this.lastY);
			let dist = Math.sqrt(dx * dx + dy * dy);
			
			if (dist < 2)
			{
				this.originalLineTo.apply(this.canvas, arguments);
				this.lastX = endX;
				this.lastY = endY;
				
				return;
			}
	
			let segs = Math.round(dist / 10);
			let variation = this.defaultVariation;
			
			if (segs < 5)
			{
				segs = 5;
				variation /= 3;
			}
			
			function sign(x)
			{
			    return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
			}
	
			let stepX = sign(endX - this.lastX) * dx / segs;
			let stepY = sign(endY - this.lastY) * dy / segs;
	
			let fx = dx / dist;
			let fy = dy / dist;
	
			for (let s = 0; s < segs; s++)
			{
				let x = stepX * s + this.lastX;
				let y = stepY * s + this.lastY;
	
				let offset = (Math.random() - 0.5) * variation;
				this.originalLineTo.call(this.canvas, x - offset * fy, y - offset * fx);
			}
			
			this.originalLineTo.call(this.canvas, endX, endY);
			this.lastX = endX;
			this.lastY = endY;
		}
		else
		{
			this.originalLineTo.apply(this.canvas, arguments);
			this.lastX = endX;
			this.lastY = endY;
		}
	};
	
	HandJiggle.prototype.destroy = function()
	{
		 this.canvas.lineTo = this.originalLineTo;
		 this.canvas.moveTo = this.originalMoveTo;
		 this.canvas.close = this.originalClose;
		 this.canvas.quadTo = this.originalQuadTo;
		 this.canvas.curveTo = this.originalCurveTo;
		 this.canvas.arcTo = this.originalArcTo;
	};
	
	// Installs hand jiggle for comic and sketch style
	Shape.prototype.defaultJiggle = 1.5;

	let shapeBeforePaint = Shape.prototype.beforePaint;
	Shape.prototype.beforePaint = function(c)
	{
		shapeBeforePaint.apply(this, arguments);
		
		if (c.handJiggle == null)
		{
			c.handJiggle = this.createHandJiggle(c);
		}
	};
	
	let shapeAfterPaint = Shape.prototype.afterPaint;
	Shape.prototype.afterPaint = function(c)
	{
		shapeAfterPaint.apply(this, arguments);
		
		if (c.handJiggle != null)
		{
			c.handJiggle.destroy();
			delete c.handJiggle;
		}
	};
		
	// Returns a new HandJiggle canvas
	Shape.prototype.createComicCanvas = function(c)
	{
		return new HandJiggle(c, getValue(this.style, 'jiggle', this.defaultJiggle));
	};
	
	// Overrides to avoid call to rect
	Shape.prototype.createHandJiggle = function(c)
	{
		if (!this.outline && this.style != null && getValue(this.style, 'comic', '0') != '0')
		{
			return this.createComicCanvas(c);
		}
		
		return null;
	};
	
	// Sets default jiggle for diamond
	RhombusShape.prototype.defaultJiggle = 2;

	// Overrides to avoid call to rect
	var mxRectangleShapeIsHtmlAllowed0 = RectangleShape.prototype.isHtmlAllowed;
	RectangleShape.prototype.isHtmlAllowed = function()
	{
		return !this.outline && (this.style == null || (getValue(this.style, 'comic', '0') == '0' &&
			getValue(this.style, 'sketch', (urlParams['rough'] == '1') ? '1' : '0') == '0')) &&
			mxRectangleShapeIsHtmlAllowed0.apply(this, arguments);
	};
	
	var mxRectangleShapePaintBackground0 = RectangleShape.prototype.paintBackground;
	RectangleShape.prototype.paintBackground = function(c, x, y, w, h)
	{
		if (c.handJiggle == null || c.handJiggle.constructor != HandJiggle)
		{
			mxRectangleShapePaintBackground0.apply(this, arguments);
		}
		else
		{
			let events = true;
			
			if (this.style != null)
			{
				events = getValue(this.style, 'pointerEvents', '1') == '1';
			}
			
			if (events || (this.fill != null && this.fill != mxConstants.NONE) ||
				(this.stroke != null && this.stroke != mxConstants.NONE))
			{
				if (!events && (this.fill == null || this.fill == mxConstants.NONE))
				{
					c.pointerEvents = false;
				}
				
				c.begin();
				
				if (this.isRounded)
				{
					let r = 0;
					
					if (getValue(this.style, 'absoluteArcSize', 0) == '1')
					{
						r = Math.min(w / 2, Math.min(h / 2, getValue(this.style,
							'arcSize', mxConstants.LINE_ARCSIZE) / 2));
					}
					else
					{
						let f = getValue(this.style, 'arcSize',
							mxConstants.RECTANGLE_ROUNDING_FACTOR * 100) / 100;
						r = Math.min(w * f, h * f);
					}
					
					c.moveTo(x + r, y);
					c.lineTo(x + w - r, y);
					c.quadTo(x + w, y, x + w, y + r);
					c.lineTo(x + w, y + h - r);
					c.quadTo(x + w, y + h, x + w - r, y + h);
					c.lineTo(x + r, y + h);
					c.quadTo(x, y + h, x, y + h - r);
					c.lineTo(x, y + r);
					c.quadTo(x, y, x + r, y);
				}
				else
				{
					c.moveTo(x, y);
					c.lineTo(x + w, y);
					c.lineTo(x + w, y + h);
					c.lineTo(x, y + h);
					c.lineTo(x, y);
				}
				
				// LATER: Check if close is needed here
				c.close();
				c.end();
				
				c.fillAndStroke();
			}			
		}
	};

	/**
	 * Disables glass effect with hand jiggle.
	 */
	var mxRectangleShapePaintForeground0 = RectangleShape.prototype.paintForeground;
	RectangleShape.prototype.paintForeground = function(c, x, y, w, h)
	{
		if (c.handJiggle == null)
		{
			mxRectangleShapePaintForeground0.apply(this, arguments);
		}
	};

	// End of hand jiggle integration
	
	// Process Shape
	function ProcessShape()
	{
		RectangleShape.call(this);
	};
	extend(ProcessShape, RectangleShape);
	ProcessShape.prototype.size = 0.1;
	ProcessShape.prototype.fixedSize = false;
	
	ProcessShape.prototype.isHtmlAllowed = function()
	{
		return false;
	};
	ProcessShape.prototype.getLabelBounds = function(rect)
	{
		if (getValue(this.state.style, 'horizontal', true) ==
			(this.direction == null ||
			this.direction == mxConstants.DIRECTION_EAST ||
			this.direction == mxConstants.DIRECTION_WEST))
		{
			let w = rect.width;
			let h = rect.height;
			let r = new Rectangle(rect.x, rect.y, w, h);
	
			let inset = w * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'size', this.size))));
	
			if (this.isRounded)
			{
				let f = getValue(this.style, 'arcSize',
					mxConstants.RECTANGLE_ROUNDING_FACTOR * 100) / 100;
				inset = Math.max(inset, Math.min(w * f, h * f));
			}
			
			r.x += Math.round(inset);
			r.width -= Math.round(2 * inset);
			
			return r;
		}
		
		return rect;
	};
	ProcessShape.prototype.paintForeground = function(c, x, y, w, h)
	{
		let isFixedSize = getValue(this.style, 'fixedSize', this.fixedSize);
		let inset = parseFloat(getValue(this.style, 'size', this.size));
		
		if (isFixedSize)
		{
			inset = Math.max(0, Math.min(w, inset));
		}
		else
		{
			inset = w * Math.max(0, Math.min(1, inset));
		}
		

		if (this.isRounded)
		{
			let f = getValue(this.style, 'arcSize',
				mxConstants.RECTANGLE_ROUNDING_FACTOR * 100) / 100;
			inset = Math.max(inset, Math.min(w * f, h * f));
		}
		
		// Crisp rendering of inner lines
		inset = Math.round(inset);
		
		c.begin();
		c.moveTo(x + inset, y);
		c.lineTo(x + inset, y + h);
		c.moveTo(x + w - inset, y);
		c.lineTo(x + w - inset, y + h);
		c.end();
		c.stroke();
		RectangleShape.prototype.paintForeground.apply(this, arguments);
	};

	mxCellRenderer.registerShape('process', ProcessShape);
	
	// Transparent Shape
	function TransparentShape()
	{
		RectangleShape.call(this);
	};
	extend(TransparentShape, RectangleShape);
	TransparentShape.prototype.paintBackground = function(c, x, y, w, h)
	{
		c.setFillColor(mxConstants.NONE);
		c.rect(x, y, w, h);
		c.fill();
	};
	TransparentShape.prototype.paintForeground = function(c, x, y, w, h) 	{ };

	mxCellRenderer.registerShape('transparent', TransparentShape);

	// Callout shape
	function CalloutShape()
	{
		Actor.call(this);
	};
	extend(CalloutShape, HexagonShape);
	CalloutShape.prototype.size = 30;
	CalloutShape.prototype.position = 0.5;
	CalloutShape.prototype.position2 = 0.5;
	CalloutShape.prototype.base = 20;
	CalloutShape.prototype.getLabelMargins = function()
	{
		return new Rectangle(0, 0, 0, parseFloat(getValue(
			this.style, 'size', this.size)) * this.scale);
	};
	CalloutShape.prototype.isRoundable = function()
	{
		return true;
	};
	CalloutShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		let arcSize = getValue(this.style, 'arcSize', mxConstants.LINE_ARCSIZE) / 2;
		let s = Math.max(0, Math.min(h, parseFloat(getValue(this.style, 'size', this.size))));
		let dx = w * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'position', this.position))));
		var dx2 = w * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'position2', this.position2))));
		let base = Math.max(0, Math.min(w, parseFloat(getValue(this.style, 'base', this.base))));
		
		this.addPoints(c, [new Point(0, 0), new Point(w, 0), new Point(w, h - s),
			new Point(Math.min(w, dx + base), h - s), new Point(dx2, h),
			new Point(Math.max(0, dx), h - s), new Point(0, h - s)],
			this.isRounded, arcSize, true, [4]);
	};

	mxCellRenderer.registerShape('callout', CalloutShape);

	// Step shape
	function StepShape()
	{
		Actor.call(this);
	};
	extend(StepShape, Actor);
	StepShape.prototype.size = 0.2;
	StepShape.prototype.fixedSize = 20;
	StepShape.prototype.isRoundable = function()
	{
		return true;
	};
	StepShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		let fixed = getValue(this.style, 'fixedSize', '0') != '0';
		let s = (fixed) ? Math.max(0, Math.min(w, parseFloat(getValue(this.style, 'size', this.fixedSize)))) :
			w * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'size', this.size))));
		let arcSize = getValue(this.style, 'arcSize', mxConstants.LINE_ARCSIZE) / 2;
		this.addPoints(c, [new Point(0, 0), new Point(w - s, 0), new Point(w, h / 2), new Point(w - s, h),
		                   new Point(0, h), new Point(s, h / 2)], this.isRounded, arcSize, true);
		c.end();
	};

	mxCellRenderer.registerShape('step', StepShape);

	// Hexagon shape
	function HexagonShape()
	{
		Actor.call(this);
	};
	extend(HexagonShape, HexagonShape);
	HexagonShape.prototype.size = 0.25;
	HexagonShape.prototype.fixedSize = 20;
	HexagonShape.prototype.isRoundable = function()
	{
		return true;
	};
	HexagonShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		let fixed = getValue(this.style, 'fixedSize', '0') != '0';
		let s = (fixed) ? Math.max(0, Math.min(w * 0.5, parseFloat(getValue(this.style, 'size', this.fixedSize)))) :
			w * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'size', this.size))));
		let arcSize = getValue(this.style, 'arcSize', mxConstants.LINE_ARCSIZE) / 2;
		this.addPoints(c, [new Point(s, 0), new Point(w - s, 0), new Point(w, 0.5 * h), new Point(w - s, h),
		                   new Point(s, h), new Point(0, 0.5 * h)], this.isRounded, arcSize, true);
	};

	mxCellRenderer.registerShape('hexagon', HexagonShape);

	// Plus Shape
	function PlusShape()
	{
		RectangleShape.call(this);
	};
	extend(PlusShape, RectangleShape);
	PlusShape.prototype.isHtmlAllowed = function()
	{
		return false;
	};
	PlusShape.prototype.paintForeground = function(c, x, y, w, h)
	{
		let border = Math.min(w / 5, h / 5) + 1;
		
		c.begin();
		c.moveTo(x + w / 2, y + border);
		c.lineTo(x + w / 2, y + h - border);
		c.moveTo(x + border, y + h / 2);
		c.lineTo(x + w - border, y + h / 2);
		c.end();
		c.stroke();
		RectangleShape.prototype.paintForeground.apply(this, arguments);
	};

	mxCellRenderer.registerShape('plus', PlusShape);
	
	// Overrides painting of rhombus shape to allow for double style
	let mxRhombusPaintVertexShape = RhombusShape.prototype.paintVertexShape;
	RhombusShape.prototype.getLabelBounds = function(rect)
	{
		if (this.style.double == 1)
		{
			let margin = (Math.max(2, this.strokewidth + 1) * 2 + parseFloat(
				this.style['margin'] || 0)) * this.scale;
		
			return new Rectangle(rect.x + margin, rect.y + margin,
				rect.width - 2 * margin, rect.height - 2 * margin);
		}
		
		return rect;
	};
	RhombusShape.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		mxRhombusPaintVertexShape.apply(this, arguments);

		if (!this.outline && this.style.double == 1)
		{
			let margin = Math.max(2, this.strokewidth + 1) * 2 +
				parseFloat(this.style['margin'] || 0);
			x += margin;
			y += margin;
			w -= 2 * margin;
			h -= 2 * margin;
			
			if (w > 0 && h > 0)
			{
				c.setShadow(false);
				
				// Workaround for closure compiler bug where the lines with x and y above
				// are removed if arguments is used as second argument in call below.
				mxRhombusPaintVertexShape.apply(this, [c, x, y, w, h]);
			}
		}
	};

	// CompositeShape
	function ExtendedShape()
	{
		RectangleShape.call(this);
	};
	extend(ExtendedShape, RectangleShape);
	ExtendedShape.prototype.isHtmlAllowed = function()
	{
		return false;
	};
	ExtendedShape.prototype.getLabelBounds = function(rect)
	{
		if (this.style.double == 1)
		{
			let margin = (Math.max(2, this.strokewidth + 1) + parseFloat(
				this.style['margin'] || 0)) * this.scale;
		
			return new Rectangle(rect.x + margin, rect.y + margin,
				rect.width - 2 * margin, rect.height - 2 * margin);
		}
		
		return rect;
	};
	
	ExtendedShape.prototype.paintForeground = function(c, x, y, w, h)
	{
		if (this.style != null)
		{
			if (!this.outline && this.style.double == 1)
			{
				let margin = Math.max(2, this.strokewidth + 1) + parseFloat(this.style['margin'] || 0);
				x += margin;
				y += margin;
				w -= 2 * margin;
				h -= 2 * margin;
				
				if (w > 0 && h > 0)
				{
					RectangleShape.prototype.paintBackground.apply(this, arguments);
				}
			}
			
			c.setDashed(false);
			
			// Draws the symbols defined in the style. The symbols are
			// numbered from 1...n. Possible postfixes are align,
			// verticalAlign, spacing, arcSpacing, width, height
			let counter = 0;
			let shape = null;
			
			do
			{
				shape = mxCellRenderer.defaultShapes[this.style['symbol' + counter]];
				
				if (shape != null)
				{
					let align = this.style['symbol' + counter + 'Align'];
					let valign = this.style['symbol' + counter + 'VerticalAlign'];
					let width = this.style['symbol' + counter + 'Width'];
					let height = this.style['symbol' + counter + 'Height'];
					let spacing = this.style['symbol' + counter + 'Spacing'] || 0;
					let vspacing = this.style['symbol' + counter + 'VSpacing'] || spacing;
					let arcspacing = this.style['symbol' + counter + 'ArcSpacing'];
					
					if (arcspacing != null)
					{
						let arcSize = this.getArcSize(w + this.strokewidth, h + this.strokewidth) * arcspacing;
						spacing += arcSize;
						vspacing += arcSize;
					}
					
					var x2 = x;
					var y2 = y;
					
					if (align == mxConstants.ALIGN_CENTER)
					{
						x2 += (w - width) / 2;
					}
					else if (align == mxConstants.ALIGN_RIGHT)
					{
						x2 += w - width - spacing;
					}
					else
					{
						x2 += spacing;
					}
					
					if (valign == mxConstants.ALIGN_MIDDLE)
					{
						y2 += (h - height) / 2;
					}
					else if (valign == mxConstants.ALIGN_BOTTOM)
					{
						y2 += h - height - vspacing;
					}
					else
					{
						y2 += vspacing;
					}
					
					c.save();
					
					// Small hack to pass style along into subshape
					let tmp = new shape();
					// TODO: Clone style and override settings (eg. strokewidth)
					tmp.style = this.style;
					shape.prototype.paintVertexShape.call(tmp, c, x2, y2, width, height);
					c.restore();
				}
				
				counter++;
			}
			while (shape != null);
		}
		
		// Paints glass effect
		RectangleShape.prototype.paintForeground.apply(this, arguments);
	};

	mxCellRenderer.registerShape('ext', ExtendedShape);
	
	// Tape Shape, supports size style
	function MessageShape()
	{
		mxCylinder.call(this);
	};
	extend(MessageShape, mxCylinder);
	MessageShape.prototype.redrawPath = function(path, x, y, w, h, isForeground)
	{
		if (isForeground)
		{
			path.moveTo(0, 0);
			path.lineTo(w / 2, h / 2);
			path.lineTo(w, 0);
			path.end();
		}
		else
		{
			path.moveTo(0, 0);
			path.lineTo(w, 0);
			path.lineTo(w, h);
			path.lineTo(0, h);
			path.close();
		}
	};

	mxCellRenderer.registerShape('message', MessageShape);
	
	// UML Actor Shape
	function UmlActorShape()
	{
		Shape.call(this);
	};
	extend(UmlActorShape, Shape);
	UmlActorShape.prototype.paintBackground = function(c, x, y, w, h)
	{
		c.translate(x, y);

		// Head
		c.ellipse(w / 4, 0, w / 2, h / 4);
		c.fillAndStroke();

		c.begin();
		c.moveTo(w / 2, h / 4);
		c.lineTo(w / 2, 2 * h / 3);
		
		// Arms
		c.moveTo(w / 2, h / 3);
		c.lineTo(0, h / 3);
		c.moveTo(w / 2, h / 3);
		c.lineTo(w, h / 3);
		
		// Legs
		c.moveTo(w / 2, 2 * h / 3);
		c.lineTo(0, h);
		c.moveTo(w / 2, 2 * h / 3);
		c.lineTo(w, h);
		c.end();
		
		c.stroke();
	};

	// Replaces existing actor shape
	mxCellRenderer.registerShape('umlActor', UmlActorShape);
	
	// UML Boundary Shape
	function UmlBoundaryShape()
	{
		Shape.call(this);
	};
	extend(UmlBoundaryShape, Shape);
	UmlBoundaryShape.prototype.getLabelMargins = function(rect)
	{
		return new Rectangle(rect.width / 6, 0, 0, 0);
	};
	UmlBoundaryShape.prototype.paintBackground = function(c, x, y, w, h)
	{
		c.translate(x, y);
		
		// Base line
		c.begin();
		c.moveTo(0, h / 4);
		c.lineTo(0, h * 3 / 4);
		c.end();
		c.stroke();
		
		// Horizontal line
		c.begin();
		c.moveTo(0, h / 2);
		c.lineTo(w / 6, h / 2);
		c.end();
		c.stroke();
		
		// Circle
		c.ellipse(w / 6, 0, w * 5 / 6, h);
		c.fillAndStroke();
	};

	// Replaces existing actor shape
	mxCellRenderer.registerShape('umlBoundary', UmlBoundaryShape);

	// UML Entity Shape
	function UmlEntityShape()
	{
		EllipseShape.call(this);
	};
	extend(UmlEntityShape, EllipseShape);
	UmlEntityShape.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		EllipseShape.prototype.paintVertexShape.apply(this, arguments);
		
		c.begin();
		c.moveTo(x + w / 8, y + h);
		c.lineTo(x + w * 7 / 8, y + h);
		c.end();
		c.stroke();
	};

	mxCellRenderer.registerShape('umlEntity', UmlEntityShape);

	// UML Destroy Shape
	function UmlDestroyShape()
	{
		Shape.call(this);
	};
	extend(UmlDestroyShape, Shape);
	UmlDestroyShape.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		c.translate(x, y);

		c.begin();
		c.moveTo(w, 0);
		c.lineTo(0, h);
		c.moveTo(0, 0);
		c.lineTo(w, h);
		c.end();
		c.stroke();
	};

	mxCellRenderer.registerShape('umlDestroy', UmlDestroyShape);
	
	// UML Control Shape
	function UmlControlShape()
	{
		Shape.call(this);
	};
	extend(UmlControlShape, Shape);
	UmlControlShape.prototype.getLabelBounds = function(rect)
	{
		return new Rectangle(rect.x, rect.y + rect.height / 8, rect.width, rect.height * 7 / 8);
	};
	UmlControlShape.prototype.paintBackground = function(c, x, y, w, h)
	{
		c.translate(x, y);

		// Upper line
		c.begin();
		c.moveTo(w * 3 / 8, h / 8 * 1.1);
		c.lineTo(w * 5 / 8, 0);
		c.end();
		c.stroke();
		
		// Circle
		c.ellipse(0, h / 8, w, h * 7 / 8);
		c.fillAndStroke();
	};
	UmlControlShape.prototype.paintForeground = function(c, x, y, w, h)
	{
		// Lower line
		c.begin();
		c.moveTo(w * 3 / 8, h / 8 * 1.1);
		c.lineTo(w * 5 / 8, h / 4);
		c.end();
		c.stroke();
	};

	// Replaces existing actor shape
	mxCellRenderer.registerShape('umlControl', UmlControlShape);

	// UML Lifeline Shape
	function UmlLifeline()
	{
		RectangleShape.call(this);
	};
	extend(UmlLifeline, RectangleShape);
	UmlLifeline.prototype.size = 40;
	UmlLifeline.prototype.isHtmlAllowed = function()
	{
		return false;
	};
	UmlLifeline.prototype.getLabelBounds = function(rect)
	{
		let size = Math.max(0, Math.min(rect.height, parseFloat(
			getValue(this.style, 'size', this.size)) * this.scale));
		
		return new Rectangle(rect.x, rect.y, rect.width, size);
	};
	UmlLifeline.prototype.paintBackground = function(c, x, y, w, h)
	{
		let size = Math.max(0, Math.min(h, parseFloat(getValue(this.style, 'size', this.size))));
		let participant = getValue(this.style, 'participant');
		
		if (participant == null || this.state == null)
		{
			RectangleShape.prototype.paintBackground.call(this, c, x, y, w, size);
		}
		else
		{
			let ctor = this.state.view.graph.cellRenderer.getShape(participant);
			
			if (ctor != null && ctor != UmlLifeline)
			{
				let shape = new ctor();
				shape.apply(this.state);
				c.save();
				shape.paintVertexShape(c, x, y, w, size);
				c.restore();
			}
		}
		
		if (size < h)
		{
			c.setDashed(true);
			c.begin();
			c.moveTo(x + w / 2, y + size);
			c.lineTo(x + w / 2, y + h);
			c.end();
			c.stroke();
		}
	};
	UmlLifeline.prototype.paintForeground = function(c, x, y, w, h)
	{
		let size = Math.max(0, Math.min(h, parseFloat(getValue(this.style, 'size', this.size))));
		RectangleShape.prototype.paintForeground.call(this, c, x, y, w, Math.min(h, size));
	};

	mxCellRenderer.registerShape('umlLifeline', UmlLifeline);
	
	// UML Frame Shape
	function UmlFrame()
	{
		Shape.call(this);
	};
	extend(UmlFrame, Shape);
	UmlFrame.prototype.width = 60;
	UmlFrame.prototype.height = 30;
	UmlFrame.prototype.corner = 10;
	UmlFrame.prototype.getLabelMargins = function(rect)
	{
		return new Rectangle(0, 0,
			rect.width - (parseFloat(getValue(this.style, 'width', this.width) * this.scale)),
			rect.height - (parseFloat(getValue(this.style, 'height', this.height) * this.scale)));
	};
	UmlFrame.prototype.paintBackground = function(c, x, y, w, h)
	{
		let co = this.corner;
		var w0 = Math.min(w, Math.max(co, parseFloat(getValue(this.style, 'width', this.width))));
		var h0 = Math.min(h, Math.max(co * 1.5, parseFloat(getValue(this.style, 'height', this.height))));
		let bg = getValue(this.style, 'swimlaneFillColor', mxConstants.NONE);
		
		if (bg != mxConstants.NONE)
		{
			c.setFillColor(bg);
			c.rect(x, y, w, h);
			c.fill();
		}
		
		if (this.fill != null && this.fill != mxConstants.NONE && this.gradient && this.gradient != mxConstants.NONE)
		{
			let b = this.getGradientBounds(c, x, y, w, h);
			c.setGradient(this.fill, this.gradient, x, y, w, h, this.gradientDirection);
		}
		else
		{
			c.setFillColor(this.fill);
		}

		c.begin();
		c.moveTo(x, y);
		c.lineTo(x + w0, y);
		c.lineTo(x + w0, y + Math.max(0, h0 - co * 1.5));
		c.lineTo(x + Math.max(0, w0 - co), y + h0);
		c.lineTo(x, y + h0);
		c.close();
		c.fillAndStroke();
		
		c.begin();
		c.moveTo(x + w0, y);
		c.lineTo(x + w, y);
		c.lineTo(x + w, y + h);
		c.lineTo(x, y + h);
		c.lineTo(x, y + h0);
		c.stroke();
	};

	mxCellRenderer.registerShape('umlFrame', UmlFrame);
	
	Perimeter.LifelinePerimeter = (bounds, vertex, next, orthogonal) =>
	{
		let size = UmlLifeline.prototype.size;
		
		if (vertex != null)
		{
			size = getValue(vertex.style, 'size', size) * vertex.view.scale;
		}
		
		let sw = (parseFloat(vertex.style.strokeWidth || 1) * vertex.view.scale / 2) - 1;

		if (next.x < bounds.getCenterX())
		{
			sw += 1;
			sw *= -1;
		}
		
		return new Point(bounds.getCenterX() + sw, Math.min(bounds.y + bounds.height,
				Math.max(bounds.y + size, next.y)));
	};
	
	StyleRegistry.putValue('lifelinePerimeter', Perimeter.LifelinePerimeter);
	
	Perimeter.OrthogonalPerimeter = (bounds, vertex, next, orthogonal) =>
	{
		orthogonal = true;
		
		return Perimeter.RectanglePerimeter.apply(this, arguments);
	};
	
	StyleRegistry.putValue('orthogonalPerimeter', Perimeter.OrthogonalPerimeter);

	Perimeter.BackbonePerimeter = (bounds, vertex, next, orthogonal) =>
	{
		let sw = (parseFloat(vertex.style.strokeWidth || 1) * vertex.view.scale / 2) - 1;
		
		if (vertex.style.backboneSize != null)
		{
			sw += (parseFloat(vertex.style.backboneSize) * vertex.view.scale / 2) - 1;
		}
		
		if (vertex.style.direction == 'south' ||
			vertex.style.direction == 'north')
		{
			if (next.x < bounds.getCenterX())
			{
				sw += 1;
				sw *= -1;
			}
			
			return new Point(bounds.getCenterX() + sw, Math.min(bounds.y + bounds.height,
					Math.max(bounds.y, next.y)));
		}
		else
		{
			if (next.y < bounds.getCenterY())
			{
				sw += 1;
				sw *= -1;
			}
			
			return new Point(Math.min(bounds.x + bounds.width, Math.max(bounds.x, next.x)),
				bounds.getCenterY() + sw);
		}
	};
	
	StyleRegistry.putValue('backbonePerimeter', Perimeter.BackbonePerimeter);

	// Callout Perimeter
	Perimeter.CalloutPerimeter = (bounds, vertex, next, orthogonal) =>
	{
		return Perimeter.RectanglePerimeter(getDirectedBounds(bounds, new Rectangle(0, 0, 0,
			Math.max(0, Math.min(bounds.height, parseFloat(getValue(vertex.style, 'size',
			CalloutShape.prototype.size)) * vertex.view.scale))),
			vertex.style), vertex, next, orthogonal);
	};
	
	StyleRegistry.putValue('calloutPerimeter', Perimeter.CalloutPerimeter);
	
	// Parallelogram Perimeter
	Perimeter.ParallelogramPerimeter = (bounds, vertex, next, orthogonal) =>
	{
		let fixed = getValue(vertex.style, 'fixedSize', '0') != '0';
		let size = (fixed) ? ParallelogramShape.prototype.fixedSize : ParallelogramShape.prototype.size;
		
		if (vertex != null)
		{
			size = getValue(vertex.style, 'size', size);
		}
		
		if (fixed)
		{
			size *= vertex.view.scale;
		}
		
		let x = bounds.x;
		let y = bounds.y;
		let w = bounds.width;
		let h = bounds.height;

		let direction = (vertex != null) ? getValue(
			vertex.style, 'direction',
			mxConstants.DIRECTION_EAST) : mxConstants.DIRECTION_EAST;
		let vertical = direction == mxConstants.DIRECTION_NORTH ||
			direction == mxConstants.DIRECTION_SOUTH;
		var points;
		
		if (vertical)
		{
			let dy = (fixed) ? Math.max(0, Math.min(h, size)) : h * Math.max(0, Math.min(1, size));
			points = [new Point(x, y), new Point(x + w, y + dy),
						new Point(x + w, y + h), new Point(x, y + h - dy), new Point(x, y)];
		}
		else
		{
			let dx = (fixed) ? Math.max(0, Math.min(w * 0.5, size)) : w * Math.max(0, Math.min(1, size));
			points = [new Point(x + dx, y), new Point(x + w, y),
							new Point(x + w - dx, y + h), new Point(x, y + h), new Point(x + dx, y)];
		}	
		
		let cx = bounds.getCenterX();
		let cy = bounds.getCenterY();
		
		var p1 = new Point(cx, cy);
		
		if (orthogonal)
		{
			if (next.x < x || next.x > x + w)
			{
				p1.y = next.y;
			}
			else
			{
				p1.x = next.x;
			}
		}
		
		return getPerimeterPoint(points, p1, next);
	};
	
	StyleRegistry.putValue('parallelogramPerimeter', Perimeter.ParallelogramPerimeter);
	
	// Trapezoid Perimeter
	Perimeter.TrapezoidPerimeter = (bounds, vertex, next, orthogonal) =>
	{
		let fixed = getValue(vertex.style, 'fixedSize', '0') != '0';
		let size = (fixed) ? TrapezoidShape.prototype.fixedSize : TrapezoidShape.prototype.size;
		
		if (vertex != null)
		{
			size = getValue(vertex.style, 'size', size);
		}
		
		if (fixed)
		{
			size *= vertex.view.scale;
		}
		
		let x = bounds.x;
		let y = bounds.y;
		let w = bounds.width;
		let h = bounds.height;

		let direction = (vertex != null) ? getValue(
				vertex.style, 'direction',
				mxConstants.DIRECTION_EAST) : mxConstants.DIRECTION_EAST;
		let points = [];
		
		if (direction == mxConstants.DIRECTION_EAST)
		{
			let dx = (fixed) ? Math.max(0, Math.min(w * 0.5, size)) : w * Math.max(0, Math.min(1, size));
			points = [new Point(x + dx, y), new Point(x + w - dx, y),
						new Point(x + w, y + h), new Point(x, y + h), new Point(x + dx, y)];
		}
		else if (direction == mxConstants.DIRECTION_WEST)
		{
			let dx = (fixed) ? Math.max(0, Math.min(w, size)) : w * Math.max(0, Math.min(1, size));
			points = [new Point(x, y), new Point(x + w, y),
						new Point(x + w - dx, y + h), new Point(x + dx, y + h), new Point(x, y)];
		}
		else if (direction == mxConstants.DIRECTION_NORTH)
		{
			let dy = (fixed) ? Math.max(0, Math.min(h, size)) : h * Math.max(0, Math.min(1, size));
			points = [new Point(x, y + dy), new Point(x + w, y),
						new Point(x + w, y + h), new Point(x, y + h - dy), new Point(x, y + dy)];
		}
		else
		{
			let dy = (fixed) ? Math.max(0, Math.min(h, size)) : h * Math.max(0, Math.min(1, size));
			points = [new Point(x, y), new Point(x + w, y + dy),
						new Point(x + w, y + h - dy), new Point(x, y + h), new Point(x, y)];
		}		

		let cx = bounds.getCenterX();
		let cy = bounds.getCenterY();
		
		var p1 = new Point(cx, cy);
		
		if (orthogonal)
		{
			if (next.x < x || next.x > x + w)
			{
				p1.y = next.y;
			}
			else
			{
				p1.x = next.x;
			}
		}

		return getPerimeterPoint(points, p1, next);
	};
	
	StyleRegistry.putValue('trapezoidPerimeter', Perimeter.TrapezoidPerimeter);
	
	// Step Perimeter
	Perimeter.StepPerimeter = (bounds, vertex, next, orthogonal) =>
	{
		let fixed = getValue(vertex.style, 'fixedSize', '0') != '0';
		let size = (fixed) ? StepShape.prototype.fixedSize : StepShape.prototype.size;
		
		if (vertex != null)
		{
			size = getValue(vertex.style, 'size', size);
		}
		
		if (fixed)
		{
			size *= vertex.view.scale;
		}
		
		let x = bounds.x;
		let y = bounds.y;
		let w = bounds.width;
		let h = bounds.height;

		let cx = bounds.getCenterX();
		let cy = bounds.getCenterY();
		
		let direction = (vertex != null) ? getValue(
				vertex.style, 'direction',
				mxConstants.DIRECTION_EAST) : mxConstants.DIRECTION_EAST;
		var points;
		
		if (direction == mxConstants.DIRECTION_EAST)
		{
			let dx = (fixed) ? Math.max(0, Math.min(w, size)) : w * Math.max(0, Math.min(1, size));
			points = [new Point(x, y), new Point(x + w - dx, y), new Point(x + w, cy),
							new Point(x + w - dx, y + h), new Point(x, y + h),
							new Point(x + dx, cy), new Point(x, y)];
		}
		else if (direction == mxConstants.DIRECTION_WEST)
		{
			let dx = (fixed) ? Math.max(0, Math.min(w, size)) : w * Math.max(0, Math.min(1, size));
			points = [new Point(x + dx, y), new Point(x + w, y), new Point(x + w - dx, cy),
							new Point(x + w, y + h), new Point(x + dx, y + h),
							new Point(x, cy), new Point(x + dx, y)];
		}
		else if (direction == mxConstants.DIRECTION_NORTH)
		{
			let dy = (fixed) ? Math.max(0, Math.min(h, size)) : h * Math.max(0, Math.min(1, size));
			points = [new Point(x, y + dy), new Point(cx, y), new Point(x + w, y + dy),
							new Point(x + w, y + h), new Point(cx, y + h - dy),
							new Point(x, y + h), new Point(x, y + dy)];
		}
		else
		{
			let dy = (fixed) ? Math.max(0, Math.min(h, size)) : h * Math.max(0, Math.min(1, size));
			points = [new Point(x, y), new Point(cx, y + dy), new Point(x + w, y),
							new Point(x + w, y + h - dy), new Point(cx, y + h),
							new Point(x, y + h - dy), new Point(x, y)];
		}		
		
		var p1 = new Point(cx, cy);
		
		if (orthogonal)
		{
			if (next.x < x || next.x > x + w)
			{
				p1.y = next.y;
			}
			else
			{
				p1.x = next.x;
			}
		}
		
		return getPerimeterPoint(points, p1, next);
	};
	
	StyleRegistry.putValue('stepPerimeter', Perimeter.StepPerimeter);
	
	// Hexagon Perimeter 2 (keep existing one)
	Perimeter.HexagonPerimeter2 = (bounds, vertex, next, orthogonal) =>
	{
		let fixed = getValue(vertex.style, 'fixedSize', '0') != '0';
		let size = (fixed) ? HexagonShape.prototype.fixedSize : HexagonShape.prototype.size;
		
		if (vertex != null)
		{
			size = getValue(vertex.style, 'size', size);
		}
		
		if (fixed)
		{
			size *= vertex.view.scale;
		}
		
		let x = bounds.x;
		let y = bounds.y;
		let w = bounds.width;
		let h = bounds.height;

		let cx = bounds.getCenterX();
		let cy = bounds.getCenterY();
		
		let direction = (vertex != null) ? getValue(
			vertex.style, 'direction',
			mxConstants.DIRECTION_EAST) : mxConstants.DIRECTION_EAST;
		let vertical = direction == mxConstants.DIRECTION_NORTH ||
			direction == mxConstants.DIRECTION_SOUTH;
		var points;
		
		if (vertical)
		{
			let dy = (fixed) ? Math.max(0, Math.min(h, size)) : h * Math.max(0, Math.min(1, size));
			points = [new Point(cx, y), new Point(x + w, y + dy), new Point(x + w, y + h - dy),
							new Point(cx, y + h), new Point(x, y + h - dy),
							new Point(x, y + dy), new Point(cx, y)];
		}
		else
		{
			let dx = (fixed) ? Math.max(0, Math.min(w, size)) : w * Math.max(0, Math.min(1, size));
			points = [new Point(x + dx, y), new Point(x + w - dx, y), new Point(x + w, cy),
						new Point(x + w - dx, y + h), new Point(x + dx, y + h),
						new Point(x, cy), new Point(x + dx, y)];
		}		

		var p1 = new Point(cx, cy);
		
		if (orthogonal)
		{
			if (next.x < x || next.x > x + w)
			{
				p1.y = next.y;
			}
			else
			{
				p1.x = next.x;
			}
		}
		
		return getPerimeterPoint(points, p1, next);
	};
	
	StyleRegistry.putValue('hexagonPerimeter2', Perimeter.HexagonPerimeter2);
	
	// Provided Interface Shape (aka Lollipop)
	function LollipopShape()
	{
		Shape.call(this);
	};
	extend(LollipopShape, Shape);
	LollipopShape.prototype.size = 10;
	LollipopShape.prototype.paintBackground = function(c, x, y, w, h)
	{
		let sz = parseFloat(getValue(this.style, 'size', this.size));
		c.translate(x, y);
		
		c.ellipse((w - sz) / 2, 0, sz, sz);
		c.fillAndStroke();

		c.begin();
		c.moveTo(w / 2, sz);
		c.lineTo(w / 2, h);
		c.end();
		c.stroke();
	};

	mxCellRenderer.registerShape('lollipop', LollipopShape);

	// Required Interface Shape
	function RequiresShape()
	{
		Shape.call(this);
	};
	extend(RequiresShape, Shape);
	RequiresShape.prototype.size = 10;
	RequiresShape.prototype.inset = 2;
	RequiresShape.prototype.paintBackground = function(c, x, y, w, h)
	{
		let sz = parseFloat(getValue(this.style, 'size', this.size));
		let inset = parseFloat(getValue(this.style, 'inset', this.inset)) + this.strokewidth;
		c.translate(x, y);

		c.begin();
		c.moveTo(w / 2, sz + inset);
		c.lineTo(w / 2, h);
		c.end();
		c.stroke();
		
		c.begin();
		c.moveTo((w - sz) / 2 - inset, sz / 2);
		c.quadTo((w - sz) / 2 - inset, sz + inset, w / 2, sz + inset);
		c.quadTo((w + sz) / 2 + inset, sz + inset, (w + sz) / 2 + inset, sz / 2);
		c.end();
		c.stroke();
	};

	mxCellRenderer.registerShape('requires', RequiresShape);

	// Required Interface Shape
	function RequiredInterfaceShape()
	{
		Shape.call(this);
	};
	extend(RequiredInterfaceShape, Shape);
	
	RequiredInterfaceShape.prototype.paintBackground = function(c, x, y, w, h)
	{
		c.translate(x, y);

		c.begin();
		c.moveTo(0, 0);
		c.quadTo(w, 0, w, h / 2);
		c.quadTo(w, h, 0, h);
		c.end();
		c.stroke();
	};

	mxCellRenderer.registerShape('requiredInterface', RequiredInterfaceShape);

	// Provided and Required Interface Shape
	function ProvidedRequiredInterfaceShape()
	{
		Shape.call(this);
	};
	extend(ProvidedRequiredInterfaceShape, Shape);
	ProvidedRequiredInterfaceShape.prototype.inset = 2;
	ProvidedRequiredInterfaceShape.prototype.paintBackground = function(c, x, y, w, h)
	{
		let inset = parseFloat(getValue(this.style, 'inset', this.inset)) + this.strokewidth;
		c.translate(x, y);

		c.ellipse(0, inset, w - 2 * inset, h - 2 * inset);
		c.fillAndStroke();
		
		c.begin();
		c.moveTo(w / 2, 0);
		c.quadTo(w, 0, w, h / 2);
		c.quadTo(w, h, w / 2, h);
		c.end();
		c.stroke();
	};

	mxCellRenderer.registerShape('providedRequiredInterface', ProvidedRequiredInterfaceShape);
		
	// Module shape
	function ModuleShape()
	{
		mxCylinder.call(this);
	};
	extend(ModuleShape, mxCylinder);
	ModuleShape.prototype.jettyWidth = 20;
	ModuleShape.prototype.jettyHeight = 10;
	ModuleShape.prototype.redrawPath = function(path, x, y, w, h, isForeground)
	{
		let dx = parseFloat(getValue(this.style, 'jettyWidth', this.jettyWidth));
		let dy = parseFloat(getValue(this.style, 'jettyHeight', this.jettyHeight));
		var x0 = dx / 2;
		var x1 = x0 + dx / 2;
		var y0 = Math.min(dy, h - dy);
		var y1 = Math.min(y0 + 2 * dy, h - dy);

		if (isForeground)
		{
			path.moveTo(x0, y0);
			path.lineTo(x1, y0);
			path.lineTo(x1, y0 + dy);
			path.lineTo(x0, y0 + dy);
			path.moveTo(x0, y1);
			path.lineTo(x1, y1);
			path.lineTo(x1, y1 + dy);
			path.lineTo(x0, y1 + dy);
			path.end();
		}
		else
		{
			path.moveTo(x0, 0);
			path.lineTo(w, 0);
			path.lineTo(w, h);
			path.lineTo(x0, h);
			path.lineTo(x0, y1 + dy);
			path.lineTo(0, y1 + dy);
			path.lineTo(0, y1);
			path.lineTo(x0, y1);
			path.lineTo(x0, y0 + dy);
			path.lineTo(0, y0 + dy);
			path.lineTo(0, y0);
			path.lineTo(x0, y0);
			path.close();
			path.end();
		}
	};

	mxCellRenderer.registerShape('module', ModuleShape);
	
	// Component shape
	function ComponentShape()
	{
		mxCylinder.call(this);
	};
	extend(ComponentShape, mxCylinder);
	ComponentShape.prototype.jettyWidth = 32;
	ComponentShape.prototype.jettyHeight = 12;
	ComponentShape.prototype.redrawPath = function(path, x, y, w, h, isForeground)
	{
		let dx = parseFloat(getValue(this.style, 'jettyWidth', this.jettyWidth));
		let dy = parseFloat(getValue(this.style, 'jettyHeight', this.jettyHeight));
		var x0 = dx / 2;
		var x1 = x0 + dx / 2;
		var y0 = 0.3 * h - dy / 2;
		var y1 = 0.7 * h - dy / 2;

		if (isForeground)
		{
			path.moveTo(x0, y0);
			path.lineTo(x1, y0);
			path.lineTo(x1, y0 + dy);
			path.lineTo(x0, y0 + dy);
			path.moveTo(x0, y1);
			path.lineTo(x1, y1);
			path.lineTo(x1, y1 + dy);
			path.lineTo(x0, y1 + dy);
			path.end();
		}
		else
		{
			path.moveTo(x0, 0);
			path.lineTo(w, 0);
			path.lineTo(w, h);
			path.lineTo(x0, h);
			path.lineTo(x0, y1 + dy);
			path.lineTo(0, y1 + dy);
			path.lineTo(0, y1);
			path.lineTo(x0, y1);
			path.lineTo(x0, y0 + dy);
			path.lineTo(0, y0 + dy);
			path.lineTo(0, y0);
			path.lineTo(x0, y0);
			path.close();
			path.end();
		}
	};

	mxCellRenderer.registerShape('component', ComponentShape);
	
	// Associative entity derived from rectangle shape
	function AssociativeEntity()
	{
		RectangleShape.call(this);
	};
	extend(AssociativeEntity, RectangleShape);
	AssociativeEntity.prototype.paintForeground = function(c, x, y, w, h)
	{
		let hw = w / 2;
		let hh = h / 2;
		
		let arcSize = getValue(this.style, 'arcSize', mxConstants.LINE_ARCSIZE) / 2;
		c.begin();
		this.addPoints(c, [new Point(x + hw, y), new Point(x + w, y + hh), new Point(x + hw, y + h),
		     new Point(x, y + hh)], this.isRounded, arcSize, true);
		c.stroke();

		RectangleShape.prototype.paintForeground.apply(this, arguments);
	};

	mxCellRenderer.registerShape('associativeEntity', AssociativeEntity);

	// State Shapes derives from double ellipse
	function StateShape()
	{
		DoubleEllipseShape.call(this);
	};
	extend(StateShape, DoubleEllipseShape);
	StateShape.prototype.outerStroke = true;
	StateShape.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		let inset = Math.min(4, Math.min(w / 5, h / 5));
		
		if (w > 0 && h > 0)
		{
			c.ellipse(x + inset, y + inset, w - 2 * inset, h - 2 * inset);
			c.fillAndStroke();
		}
		
		c.setShadow(false);

		if (this.outerStroke)
		{
			c.ellipse(x, y, w, h);
			c.stroke();			
		}
	};

	mxCellRenderer.registerShape('endState', StateShape);

	function StartStateShape()
	{
		StateShape.call(this);
	};
	extend(StartStateShape, StateShape);
	StartStateShape.prototype.outerStroke = false;
	
	mxCellRenderer.registerShape('startState', StartStateShape);

	// Link shape
	function LinkShape()
	{
		ArrowConnector.call(this);
		this.spacing = 0;
	};
	extend(LinkShape, ArrowConnector);
	LinkShape.prototype.defaultWidth = 4;
	
	LinkShape.prototype.isOpenEnded = function()
	{
		return true;
	};

	LinkShape.prototype.getEdgeWidth = function()
	{
		return getNumber(this.style, 'width', this.defaultWidth) + Math.max(0, this.strokewidth - 1);
	};
	
	LinkShape.prototype.isArrowRounded = function()
	{
		return this.isRounded;
	};

	// Registers the link shape
	mxCellRenderer.registerShape('link', LinkShape);

	// Generic arrow
	function FlexArrowShape()
	{
		ArrowConnector.call(this);
		this.spacing = 0;
	};
	extend(FlexArrowShape, ArrowConnector);
	FlexArrowShape.prototype.defaultWidth = 10;
	FlexArrowShape.prototype.defaultArrowWidth = 20;

	FlexArrowShape.prototype.getStartArrowWidth = function()
	{
		return this.getEdgeWidth() + getNumber(this.style, 'startWidth', this.defaultArrowWidth);
	};

	FlexArrowShape.prototype.getEndArrowWidth = function()
	{
		return this.getEdgeWidth() + getNumber(this.style, 'endWidth', this.defaultArrowWidth);;
	};

	FlexArrowShape.prototype.getEdgeWidth = function()
	{
		return getNumber(this.style, 'width', this.defaultWidth) + Math.max(0, this.strokewidth - 1);
	};
	
	// Registers the link shape
	mxCellRenderer.registerShape('flexArrow', FlexArrowShape);
	
	// Manual Input shape
	function ManualInputShape()
	{
		Actor.call(this);
	};
	extend(ManualInputShape, Actor);
	ManualInputShape.prototype.size = 30;
	ManualInputShape.prototype.isRoundable = function()
	{
		return true;
	};
	ManualInputShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		let s = Math.min(h, parseFloat(getValue(this.style, 'size', this.size)));
		let arcSize = getValue(this.style, 'arcSize', mxConstants.LINE_ARCSIZE) / 2;
		this.addPoints(c, [new Point(0, h), new Point(0, s), new Point(w, 0), new Point(w, h)],
				this.isRounded, arcSize, true);
		c.end();
	};

	mxCellRenderer.registerShape('manualInput', ManualInputShape);

	// Internal storage
	function InternalStorageShape()
	{
		RectangleShape.call(this);
	};
	extend(InternalStorageShape, RectangleShape);
	InternalStorageShape.prototype.dx = 20;
	InternalStorageShape.prototype.dy = 20;
	InternalStorageShape.prototype.isHtmlAllowed = function()
	{
		return false;
	};
	InternalStorageShape.prototype.paintForeground = function(c, x, y, w, h)
	{
		RectangleShape.prototype.paintForeground.apply(this, arguments);
		let inset = 0;
		
		if (this.isRounded)
		{
			let f = getValue(this.style, 'arcSize',
				mxConstants.RECTANGLE_ROUNDING_FACTOR * 100) / 100;
			inset = Math.max(inset, Math.min(w * f, h * f));
		}
		
		let dx = Math.max(inset, Math.min(w, parseFloat(getValue(this.style, 'dx', this.dx))));
		let dy = Math.max(inset, Math.min(h, parseFloat(getValue(this.style, 'dy', this.dy))));
		
		c.begin();
		c.moveTo(x, y + dy);
		c.lineTo(x + w, y + dy);
		c.end();
		c.stroke();
		
		c.begin();
		c.moveTo(x + dx, y);
		c.lineTo(x + dx, y + h);
		c.end();
		c.stroke();
	};

	mxCellRenderer.registerShape('internalStorage', InternalStorageShape);

	// Internal storage
	function CornerShape()
	{
		Actor.call(this);
	};
	extend(CornerShape, Actor);
	CornerShape.prototype.dx = 20;
	CornerShape.prototype.dy = 20;
	
	// Corner
	CornerShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		let dx = Math.max(0, Math.min(w, parseFloat(getValue(this.style, 'dx', this.dx))));
		let dy = Math.max(0, Math.min(h, parseFloat(getValue(this.style, 'dy', this.dy))));
		
		let s = Math.min(w / 2, Math.min(h, parseFloat(getValue(this.style, 'size', this.size))));
		let arcSize = getValue(this.style, 'arcSize', mxConstants.LINE_ARCSIZE) / 2;
		this.addPoints(c, [new Point(0, 0), new Point(w, 0), new Point(w, dy), new Point(dx, dy),
		                   new Point(dx, h), new Point(0, h)], this.isRounded, arcSize, true);
		c.end();
	};

	mxCellRenderer.registerShape('corner', CornerShape);

	// Crossbar shape
	function CrossbarShape()
	{
		Actor.call(this);
	};
	extend(CrossbarShape, Actor);
	
	CrossbarShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		c.moveTo(0, 0);
		c.lineTo(0, h);
		c.end();
		
		c.moveTo(w, 0);
		c.lineTo(w, h);
		c.end();
		
		c.moveTo(0, h / 2);
		c.lineTo(w, h / 2);
		c.end();
	};

	mxCellRenderer.registerShape('crossbar', CrossbarShape);

	// Internal storage
	function TeeShape()
	{
		Actor.call(this);
	};
	extend(TeeShape, Actor);
	TeeShape.prototype.dx = 20;
	TeeShape.prototype.dy = 20;
	
	// Corner
	TeeShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		let dx = Math.max(0, Math.min(w, parseFloat(getValue(this.style, 'dx', this.dx))));
		let dy = Math.max(0, Math.min(h, parseFloat(getValue(this.style, 'dy', this.dy))));
		var w2 = Math.abs(w - dx) / 2;
		
		let s = Math.min(w / 2, Math.min(h, parseFloat(getValue(this.style, 'size', this.size))));
		let arcSize = getValue(this.style, 'arcSize', mxConstants.LINE_ARCSIZE) / 2;
		this.addPoints(c, [new Point(0, 0), new Point(w, 0), new Point(w, dy), new Point((w + dx) / 2, dy),
		                   new Point((w + dx) / 2, h), new Point((w - dx) / 2, h), new Point((w - dx) / 2, dy),
		                   new Point(0, dy)], this.isRounded, arcSize, true);
		c.end();
	};

	mxCellRenderer.registerShape('tee', TeeShape);

	// Arrow
	function SingleArrowShape()
	{
		Actor.call(this);
	};
	extend(SingleArrowShape, Actor);
	SingleArrowShape.prototype.arrowWidth = 0.3;
	SingleArrowShape.prototype.arrowSize = 0.2;
	SingleArrowShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		let aw = h * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'arrowWidth', this.arrowWidth))));
		let as = w * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'arrowSize', this.arrowSize))));
		let at = (h - aw) / 2;
		let ab = at + aw;
		
		let arcSize = getValue(this.style, 'arcSize', mxConstants.LINE_ARCSIZE) / 2;
		this.addPoints(c, [new Point(0, at), new Point(w - as, at), new Point(w - as, 0), new Point(w, h / 2),
		                   new Point(w - as, h), new Point(w - as, ab), new Point(0, ab)],
		                   this.isRounded, arcSize, true);
		c.end();
	};

	mxCellRenderer.registerShape('singleArrow', SingleArrowShape);

	// Arrow
	function DoubleArrowShape()
	{
		Actor.call(this);
	};
	extend(DoubleArrowShape, Actor);
	DoubleArrowShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		let aw = h * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'arrowWidth', SingleArrowShape.prototype.arrowWidth))));
		let as = w * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'arrowSize', SingleArrowShape.prototype.arrowSize))));
		let at = (h - aw) / 2;
		let ab = at + aw;
		
		let arcSize = getValue(this.style, 'arcSize', mxConstants.LINE_ARCSIZE) / 2;
		this.addPoints(c, [new Point(0, h / 2), new Point(as, 0), new Point(as, at), new Point(w - as, at),
		                   new Point(w - as, 0), new Point(w, h / 2), new Point(w - as, h),
		                   new Point(w - as, ab), new Point(as, ab), new Point(as, h)],
		                   this.isRounded, arcSize, true);
		c.end();
	};

	mxCellRenderer.registerShape('doubleArrow', DoubleArrowShape);

	// Data storage
	function DataStorageShape()
	{
		Actor.call(this);
	};
	extend(DataStorageShape, Actor);
	DataStorageShape.prototype.size = 0.1;
	DataStorageShape.prototype.fixedSize = 20;
	DataStorageShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		let fixed = getValue(this.style, 'fixedSize', '0') != '0';
		let s = (fixed) ? Math.max(0, Math.min(w, parseFloat(getValue(this.style, 'size', this.fixedSize)))) :
			w * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'size', this.size))));
		
		c.moveTo(s, 0);
		c.lineTo(w, 0);
		c.quadTo(w - s * 2, h / 2, w, h);
		c.lineTo(s, h);
		c.quadTo(s - s * 2, h / 2, s, 0);
		c.close();
		c.end();
	};

	mxCellRenderer.registerShape('dataStorage', DataStorageShape);

	// Or
	function OrShape()
	{
		Actor.call(this);
	};
	extend(OrShape, Actor);
	OrShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		c.moveTo(0, 0);
		c.quadTo(w, 0, w, h / 2);
		c.quadTo(w, h, 0, h);
		c.close();
		c.end();
	};

	mxCellRenderer.registerShape('or', OrShape);

	// Xor
	function XorShape()
	{
		Actor.call(this);
	};
	extend(XorShape, Actor);
	XorShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		c.moveTo(0, 0);
		c.quadTo(w, 0, w, h / 2);
		c.quadTo(w, h, 0, h);
		c.quadTo(w / 2, h / 2, 0, 0);
		c.close();
		c.end();
	};

	mxCellRenderer.registerShape('xor', XorShape);

	// Loop limit
	function LoopLimitShape()
	{
		Actor.call(this);
	};
	extend(LoopLimitShape, Actor);
	LoopLimitShape.prototype.size = 20;
	LoopLimitShape.prototype.isRoundable = function()
	{
		return true;
	};
	LoopLimitShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		let s = Math.min(w / 2, Math.min(h, parseFloat(getValue(this.style, 'size', this.size))));
		let arcSize = getValue(this.style, 'arcSize', mxConstants.LINE_ARCSIZE) / 2;
		this.addPoints(c, [new Point(s, 0), new Point(w - s, 0), new Point(w, s * 0.8), new Point(w, h),
		                   new Point(0, h), new Point(0, s * 0.8)], this.isRounded, arcSize, true);
		c.end();
	};

	mxCellRenderer.registerShape('loopLimit', LoopLimitShape);

	// Off page connector
	function OffPageConnectorShape()
	{
		Actor.call(this);
	};
	extend(OffPageConnectorShape, Actor);
	OffPageConnectorShape.prototype.size = 3 / 8;
	OffPageConnectorShape.prototype.isRoundable = function()
	{
		return true;
	};
	OffPageConnectorShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		let s = h * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'size', this.size))));
		let arcSize = getValue(this.style, 'arcSize', mxConstants.LINE_ARCSIZE) / 2;
		this.addPoints(c, [new Point(0, 0), new Point(w, 0), new Point(w, h - s), new Point(w / 2, h),
		                   new Point(0, h - s)], this.isRounded, arcSize, true);
		c.end();
	};

	mxCellRenderer.registerShape('offPageConnector', OffPageConnectorShape);

	// Internal storage
	function TapeDataShape()
	{
		EllipseShape.call(this);
	};
	extend(TapeDataShape, EllipseShape);
	TapeDataShape.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		EllipseShape.prototype.paintVertexShape.apply(this, arguments);
		
		c.begin();
		c.moveTo(x + w / 2, y + h);
		c.lineTo(x + w, y + h);
		c.end();
		c.stroke();
	};

	mxCellRenderer.registerShape('tapeData', TapeDataShape);

	// OrEllipseShape
	function OrEllipseShape()
	{
		EllipseShape.call(this);
	};
	extend(OrEllipseShape, EllipseShape);
	OrEllipseShape.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		EllipseShape.prototype.paintVertexShape.apply(this, arguments);
		
		c.setShadow(false);
		c.begin();
		c.moveTo(x, y + h / 2);
		c.lineTo(x + w, y + h / 2);
		c.end();
		c.stroke();
		
		c.begin();
		c.moveTo(x + w / 2, y);
		c.lineTo(x + w / 2, y + h);
		c.end();
		c.stroke();
	};

	mxCellRenderer.registerShape('orEllipse', OrEllipseShape);

	// SumEllipseShape
	function SumEllipseShape()
	{
		EllipseShape.call(this);
	};
	extend(SumEllipseShape, EllipseShape);
	SumEllipseShape.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		EllipseShape.prototype.paintVertexShape.apply(this, arguments);
		var s2 = 0.145;
		
		c.setShadow(false);
		c.begin();
		c.moveTo(x + w * s2, y + h * s2);
		c.lineTo(x + w * (1 - s2), y + h * (1 - s2));
		c.end();
		c.stroke();
		
		c.begin();
		c.moveTo(x + w * (1 - s2), y + h * s2);
		c.lineTo(x + w * s2, y + h * (1 - s2));
		c.end();
		c.stroke();
	};

	mxCellRenderer.registerShape('sumEllipse', SumEllipseShape);

	// SortShape
	function SortShape()
	{
		RhombusShape.call(this);
	};
	extend(SortShape, RhombusShape);
	SortShape.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		RhombusShape.prototype.paintVertexShape.apply(this, arguments);
		
		c.setShadow(false);
		c.begin();
		c.moveTo(x, y + h / 2);
		c.lineTo(x + w, y + h / 2);
		c.end();
		c.stroke();
	};

	mxCellRenderer.registerShape('sortShape', SortShape);

	// CollateShape
	function CollateShape()
	{
		EllipseShape.call(this);
	};
	extend(CollateShape, EllipseShape);
	CollateShape.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		c.begin();
		c.moveTo(x, y);
		c.lineTo(x + w, y);
		c.lineTo(x + w / 2, y + h / 2);
		c.close();
		c.fillAndStroke();
		
		c.begin();
		c.moveTo(x, y + h);
		c.lineTo(x + w, y + h);
		c.lineTo(x + w / 2, y + h / 2);
		c.close();
		c.fillAndStroke();
	};

	mxCellRenderer.registerShape('collate', CollateShape);

	// DimensionShape
	function DimensionShape()
	{
		EllipseShape.call(this);
	};
	extend(DimensionShape, EllipseShape);
	DimensionShape.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		// Arrow size
		let al = 10;
		let cy = y + h - al / 2;
		
		c.begin();
		c.moveTo(x, y);
		c.lineTo(x, y + h);
		c.moveTo(x, cy);
		c.lineTo(x + al, cy - al / 2);
		c.moveTo(x, cy);
		c.lineTo(x + al, cy + al / 2);
		c.moveTo(x, cy);
		c.lineTo(x + w, cy);

		// Opposite side
		c.moveTo(x + w, y);
		c.lineTo(x + w, y + h);
		c.moveTo(x + w, cy);
		c.lineTo(x + w - al, cy - al / 2);
		c.moveTo(x + w, cy);
		c.lineTo(x + w - al, cy + al / 2);
		c.end();
		c.stroke();
	};

	mxCellRenderer.registerShape('dimension', DimensionShape);

	// PartialRectangleShape
	function PartialRectangleShape()
	{
		EllipseShape.call(this);
	};
	extend(PartialRectangleShape, EllipseShape);
	PartialRectangleShape.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		if (!this.outline)
		{
			c.setStrokeColor(null);
		}

		if (this.style != null)
		{
			let pointerEvents = c.pointerEvents;
			let events = getValue(this.style, 'pointerEvents', '1') == '1';
			
			if (!events && (this.fill == null || this.fill == mxConstants.NONE))
			{
				c.pointerEvents = false;
			}

			c.rect(x, y, w, h);
			c.fill();

			c.pointerEvents = pointerEvents;
			c.setStrokeColor(this.stroke);
			c.begin();
			c.moveTo(x, y);
			
			if (this.outline || getValue(this.style, 'top', '1') == '1')
			{
				c.lineTo(x + w, y);
			}
			else
			{
				c.moveTo(x + w, y);
			}
			
			if (this.outline || getValue(this.style, 'right', '1') == '1')
			{
				c.lineTo(x + w, y + h);
			}
			else
			{
				c.moveTo(x + w, y + h);
			}
			
			if (this.outline || getValue(this.style, 'bottom', '1') == '1')
			{
				c.lineTo(x, y + h);
			}
			else
			{
				c.moveTo(x, y + h);
			}
			
			if (this.outline || getValue(this.style, 'left', '1') == '1')
			{
				c.lineTo(x, y);
			}
						
			c.end();
			c.stroke();
		}
	};

	mxCellRenderer.registerShape('partialRectangle', PartialRectangleShape);

	// LineEllipseShape
	function LineEllipseShape()
	{
		EllipseShape.call(this);
	};
	extend(LineEllipseShape, EllipseShape);
	LineEllipseShape.prototype.paintVertexShape = function(c, x, y, w, h)
	{
		EllipseShape.prototype.paintVertexShape.apply(this, arguments);
		
		c.setShadow(false);
		c.begin();
		
		if (getValue(this.style, 'line') == 'vertical')
		{
			c.moveTo(x + w / 2, y);
			c.lineTo(x + w / 2, y + h);
		}
		else
		{
			c.moveTo(x, y + h / 2);
			c.lineTo(x + w, y + h / 2);
		}

		c.end();			
		c.stroke();
	};

	mxCellRenderer.registerShape('lineEllipse', LineEllipseShape);

	// Delay
	function DelayShape()
	{
		Actor.call(this);
	};
	extend(DelayShape, Actor);
	DelayShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		let dx = Math.min(w, h / 2);
		c.moveTo(0, 0);
		c.lineTo(w - dx, 0);
		c.quadTo(w, 0, w, h / 2);
		c.quadTo(w, h, w - dx, h);
		c.lineTo(0, h);
		c.close();
		c.end();
	};

	mxCellRenderer.registerShape('delay', DelayShape);

	// Cross Shape
	function CrossShape()
	{
		Actor.call(this);
	};
	extend(CrossShape, Actor);
	CrossShape.prototype.size = 0.2;
	CrossShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		let m = Math.min(h, w);
		let size = Math.max(0, Math.min(m, m * parseFloat(getValue(this.style, 'size', this.size))));
		let t = (h - size) / 2;
		let b = t + size;
		let l = (w - size) / 2;
		let r = l + size;
		
		c.moveTo(0, t);
		c.lineTo(l, t);
		c.lineTo(l, 0);
		c.lineTo(r, 0);
		c.lineTo(r, t);
		c.lineTo(w, t);
		c.lineTo(w, b);
		c.lineTo(r, b);
		c.lineTo(r, h);
		c.lineTo(l, h);
		c.lineTo(l, b);
		c.lineTo(0, b);
		c.close();
		c.end();
	};

	mxCellRenderer.registerShape('cross', CrossShape);

	// Display
	function DisplayShape()
	{
		Actor.call(this);
	};
	extend(DisplayShape, Actor);
	DisplayShape.prototype.size = 0.25;
	DisplayShape.prototype.redrawPath = function(c, x, y, w, h)
	{
		let dx = Math.min(w, h / 2);
		let s = Math.min(w - dx, Math.max(0, parseFloat(getValue(this.style, 'size', this.size))) * w);
		
		c.moveTo(0, h / 2);
		c.lineTo(s, 0);
		c.lineTo(w - dx, 0);
		c.quadTo(w, 0, w, h / 2);
		c.quadTo(w, h, w - dx, h);
		c.lineTo(s, h);
		c.close();
		c.end();
	};

	mxCellRenderer.registerShape('display', DisplayShape);
	
	// FilledEdge shape
	function FilledEdge()
	{
		Connector.call(this);
	};
	extend(FilledEdge, Connector);
	
	FilledEdge.prototype.origPaintEdgeShape = FilledEdge.prototype.paintEdgeShape;
	FilledEdge.prototype.paintEdgeShape = function(c, pts, rounded)
	{
		// Markers modify incoming points array
		let temp = [];
		
		for (let i = 0; i < pts.length; i++)
		{
			temp.push(clone(pts[i]));
		}
		
		// paintEdgeShape resets dashed to false
		let dashed = c.state.dashed;
		let fixDash = c.state.fixDash;
		FilledEdge.prototype.origPaintEdgeShape.apply(this, [c, temp, rounded]);

		if (c.state.strokeWidth >= 3)
		{
			let fillClr = getValue(this.style, 'fillColor', null);
			
			if (fillClr != null)
			{
				c.setStrokeColor(fillClr);
				c.setStrokeWidth(c.state.strokeWidth - 2);
				c.setDashed(dashed, fixDash);
				
				FilledEdge.prototype.origPaintEdgeShape.apply(this, [c, pts, rounded]);
			}
		}
	};

	// Registers the link shape
	mxCellRenderer.registerShape('filledEdge', FilledEdge);

	// Implements custom colors for shapes
	if (typeof StyleFormatPanel !== 'undefined')
	{
		(function()
		{
			let styleFormatPanelGetCustomColors = StyleFormatPanel.prototype.getCustomColors;
			
			StyleFormatPanel.prototype.getCustomColors = function()
			{
				let ss = this.format.getSelectionState();
				let result = styleFormatPanelGetCustomColors.apply(this, arguments);
				
				if (ss.style.shape == 'umlFrame')
				{
					result.push({title: Resources.get('laneColor'), key: 'swimlaneFillColor', defaultValue: '#ffffff'});
				}
				
				return result;
			};
		})();
	}
	
	// Registers and defines the custom marker
	Marker.addMarker('dash', function(c, shape, type, pe, unitX, unitY, size, source, sw, filled)
	{
		let nx = unitX * (size + sw + 1);
		let ny = unitY * (size + sw + 1);

		return function()
		{
			c.begin();
			c.moveTo(pe.x - nx / 2 - ny / 2, pe.y - ny / 2 + nx / 2);
			c.lineTo(pe.x + ny / 2 - 3 * nx / 2, pe.y - 3 * ny / 2 - nx / 2);
			c.stroke();
		};
	});

	// Registers and defines the custom marker
	Marker.addMarker('box', function(c, shape, type, pe, unitX, unitY, size, source, sw, filled)
	{
		let nx = unitX * (size + sw + 1);
		let ny = unitY * (size + sw + 1);
		let px = pe.x + nx / 2;
		let py = pe.y + ny / 2;
		
		pe.x -= nx;
		pe.y -= ny;

		return function()
		{
			c.begin();
			c.moveTo(px - nx / 2 - ny / 2, py - ny / 2 + nx / 2);
			c.lineTo(px - nx / 2 + ny / 2, py - ny / 2 - nx / 2);
			c.lineTo(px + ny / 2 - 3 * nx / 2, py - 3 * ny / 2 - nx / 2);
			c.lineTo(px - ny / 2 - 3 * nx / 2, py - 3 * ny / 2 + nx / 2);
			c.close();
			
			if (filled)
			{
				c.fillAndStroke();
			}
			else
			{
				c.stroke();
			}
		};
	});
	
	// Registers and defines the custom marker
	Marker.addMarker('cross', function(c, shape, type, pe, unitX, unitY, size, source, sw, filled)
	{
		let nx = unitX * (size + sw + 1);
		let ny = unitY * (size + sw + 1);

		return function()
		{
			c.begin();
			c.moveTo(pe.x - nx / 2 - ny / 2, pe.y - ny / 2 + nx / 2);
			c.lineTo(pe.x + ny / 2 - 3 * nx / 2, pe.y - 3 * ny / 2 - nx / 2);
			c.moveTo(pe.x - nx / 2 + ny / 2, pe.y - ny / 2 - nx / 2);
			c.lineTo(pe.x - ny / 2 - 3 * nx / 2, pe.y - 3 * ny / 2 + nx / 2);
			c.stroke();
		};
	});
	
	function circleMarker(c, shape, type, pe, unitX, unitY, size, source, sw, filled)
	{
		let a = size / 2;
		let size = size + sw;

		let pt = pe.clone();
		
		pe.x -= unitX * (2 * size + sw);
		pe.y -= unitY * (2 * size + sw);
		
		unitX = unitX * (size + sw);
		unitY = unitY * (size + sw);

		return function()
		{
			c.ellipse(pt.x - unitX - size, pt.y - unitY - size, 2 * size, 2 * size);
			
			if (filled)
			{
				c.fillAndStroke();
			}
			else
			{
				c.stroke();
			}
		};
	};
	
	Marker.addMarker('circle', circleMarker);
	Marker.addMarker('circlePlus', function(c, shape, type, pe, unitX, unitY, size, source, sw, filled)
	{
		let pt = pe.clone();
		let fn = circleMarker.apply(this, arguments);
		let nx = unitX * (size + 2 * sw); // (size + sw + 1);
		let ny = unitY * (size + 2 * sw); //(size + sw + 1);

		return function()
		{
			fn.apply(this, arguments);

			c.begin();
			c.moveTo(pt.x - unitX * (sw), pt.y - unitY * (sw));
			c.lineTo(pt.x - 2 * nx + unitX * (sw), pt.y - 2 * ny + unitY * (sw));
			c.moveTo(pt.x - nx - ny + unitY * sw, pt.y - ny + nx - unitX * sw);
			c.lineTo(pt.x + ny - nx - unitY * sw, pt.y - ny - nx + unitX * sw);
			c.stroke();
		};
	});
	
	// Registers and defines the custom marker
	Marker.addMarker('halfCircle', function(c, shape, type, pe, unitX, unitY, size, source, sw, filled)
	{
		let nx = unitX * (size + sw + 1);
		let ny = unitY * (size + sw + 1);
		let pt = pe.clone();
		
		pe.x -= nx;
		pe.y -= ny;

		return function()
		{
			c.begin();
			c.moveTo(pt.x - ny, pt.y + nx);
			c.quadTo(pe.x - ny, pe.y + nx, pe.x, pe.y);
			c.quadTo(pe.x + ny, pe.y - nx, pt.x + ny, pt.y - nx);
			c.stroke();
		};
	});

	Marker.addMarker('async', function(c, shape, type, pe, unitX, unitY, size, source, sw, filled)
	{
		// The angle of the forward facing arrow sides against the x axis is
		// 26.565 degrees, 1/sin(26.565) = 2.236 / 2 = 1.118 ( / 2 allows for
		// only half the strokewidth is processed ).
		let endOffsetX = unitX * sw * 1.118;
		let endOffsetY = unitY * sw * 1.118;
		
		unitX = unitX * (size + sw);
		unitY = unitY * (size + sw);

		let pt = pe.clone();
		pt.x -= endOffsetX;
		pt.y -= endOffsetY;
		
		let f = 1;
		pe.x += -unitX * f - endOffsetX;
		pe.y += -unitY * f - endOffsetY;
		
		return function()
		{
			c.begin();
			c.moveTo(pt.x, pt.y);
			
			if (source)
			{
				c.lineTo(pt.x - unitX - unitY / 2, pt.y - unitY + unitX / 2);
			}
			else
			{
				c.lineTo(pt.x + unitY / 2 - unitX, pt.y - unitY - unitX / 2);
			}
			
			c.lineTo(pt.x - unitX, pt.y - unitY);
			c.close();

			if (filled)
			{
				c.fillAndStroke();
			}
			else
			{
				c.stroke();
			}
		};
	});
	
	function createOpenAsyncArrow(widthFactor)
	{
		widthFactor = (widthFactor != null) ? widthFactor : 2;
		
		return function(c, shape, type, pe, unitX, unitY, size, source, sw, filled)
		{
			unitX = unitX * (size + sw);
			unitY = unitY * (size + sw);
			
			let pt = pe.clone();

			return function()
			{
				c.begin();
				c.moveTo(pt.x, pt.y);
				
				if (source)
				{
					c.lineTo(pt.x - unitX - unitY / widthFactor, pt.y - unitY + unitX / widthFactor);
				}
				else
				{
					c.lineTo(pt.x + unitY / widthFactor - unitX, pt.y - unitY - unitX / widthFactor);
				}
				
				c.stroke();
			};
		}
	};
	
	Marker.addMarker('openAsync', createOpenAsyncArrow(2));
	
	function arrow(canvas, shape, type, pe, unitX, unitY, size, source, sw, filled)
	{
		// The angle of the forward facing arrow sides against the x axis is
		// 26.565 degrees, 1/sin(26.565) = 2.236 / 2 = 1.118 ( / 2 allows for
		// only half the strokewidth is processed ).
		let endOffsetX = unitX * sw * 1.118;
		let endOffsetY = unitY * sw * 1.118;
		
		unitX = unitX * (size + sw);
		unitY = unitY * (size + sw);

		let pt = pe.clone();
		pt.x -= endOffsetX;
		pt.y -= endOffsetY;
		
		let f = (type != mxConstants.ARROW_CLASSIC && type != mxConstants.ARROW_CLASSIC_THIN) ? 1 : 3 / 4;
		pe.x += -unitX * f - endOffsetX;
		pe.y += -unitY * f - endOffsetY;
		
		return function()
		{
			canvas.begin();
			canvas.moveTo(pt.x, pt.y);
			canvas.lineTo(pt.x - unitX - unitY / widthFactor, pt.y - unitY + unitX / widthFactor);
		
			if (type == mxConstants.ARROW_CLASSIC || type == mxConstants.ARROW_CLASSIC_THIN)
			{
				canvas.lineTo(pt.x - unitX * 3 / 4, pt.y - unitY * 3 / 4);
			}
		
			canvas.lineTo(pt.x + unitY / widthFactor - unitX, pt.y - unitY - unitX / widthFactor);
			canvas.close();

			if (filled)
			{
				canvas.fillAndStroke();
			}
			else
			{
				canvas.stroke();
			}
		};
	}
	
	// Handlers are only added if mxVertexHandler is defined (ie. not in embedded graph)
	if (typeof VertexHandler !== 'undefined')
	{
		function createHandle(state, keys, getPositionFn, setPositionFn, ignoreGrid, redrawEdges, executeFn)
		{
			let handle = new VertexHandle(state, null, VertexHandler.prototype.secondaryHandleImage);
			
			handle.execute = function(me)
			{
				for (let i = 0; i < keys.length; i++)
				{	
					this.copyStyle(keys[i]);
				}
				
				if (executeFn)
				{
					executeFn(me);
				}
			};
			
			handle.getPosition = getPositionFn;
			handle.setPosition = setPositionFn;
			handle.ignoreGrid = (ignoreGrid != null) ? ignoreGrid : true;
			
			// Overridden to update connected edges
			if (redrawEdges)
			{
				let positionChanged = handle.positionChanged;
				
				handle.positionChanged = function()
				{
					positionChanged.apply(this, arguments);
					
					// Redraws connected edges TODO: Include child edges
					state.view.invalidate(this.state.cell);
					state.view.validate();
				};
			}
			
			return handle;
		};
		
		function createArcHandle(state, yOffset)
		{
			return createHandle(state, ['arcSize'], function(bounds)
			{
				let tmp = (yOffset != null) ? yOffset : bounds.height / 8;
				
				if (getValue(state.style, 'absoluteArcSize', 0) == '1')
				{
					let arcSize = getValue(state.style, 'arcSize', mxConstants.LINE_ARCSIZE) / 2;
					
					return new Point(bounds.x + bounds.width - Math.min(bounds.width / 2, arcSize), bounds.y + tmp);
				}
				else
				{
					let arcSize = Math.max(0, parseFloat(getValue(state.style,
						'arcSize', mxConstants.RECTANGLE_ROUNDING_FACTOR * 100))) / 100;
					
					return new Point(bounds.x + bounds.width - Math.min(Math.max(bounds.width / 2, bounds.height / 2),
						Math.min(bounds.width, bounds.height) * arcSize), bounds.y + tmp);
				}
			}, function(bounds, pt, me)
			{
				if (getValue(state.style, 'absoluteArcSize', 0) == '1')
				{
					this.state.style.arcSize = Math.round(Math.max(0, Math.min(bounds.width,
						(bounds.x + bounds.width - pt.x) * 2)));
				}
				else
				{
					let f = Math.min(50, Math.max(0, (bounds.width - pt.x + bounds.x) * 100 /
						Math.min(bounds.width, bounds.height)));
					this.state.style.arcSize = Math.round(f);
				}
			});
		}

		function createArcHandleFunction()
		{
			return function(state)
			{
				let handles = [];
				
				if (getValue(state.style, 'rounded', false))
				{
					handles.push(createArcHandle(state));
				}
				
				return handles;
			};
		};
		
		function createTrapezoidHandleFunction(max, defaultValue, fixedDefaultValue)
		{
			max = (max != null) ? max : 0.5;
			
			return function(state)
			{
				let handles = [createHandle(state, ['size'], function(bounds)
				{
					let fixed = (fixedDefaultValue != null) ? getValue(this.state.style, 'fixedSize', '0') != '0' : null;
					let size = Math.max(0, parseFloat(getValue(this.state.style, 'size', (fixed) ? fixedDefaultValue : defaultValue)));
					
					return new Point(bounds.x + Math.min(bounds.width * 0.75 * max, size * ((fixed) ? 0.75 : bounds.width * 0.75)), bounds.y + bounds.height / 4);
				}, function(bounds, pt)
				{
					let fixed = (fixedDefaultValue != null) ? getValue(this.state.style, 'fixedSize', '0') != '0' : null;
					let size = (fixed) ? (pt.x - bounds.x) : Math.max(0, Math.min(max, (pt.x - bounds.x) / bounds.width * 0.75));
					
					this.state.style.size = size;
				}, false, true)];
				
				if (getValue(state.style, 'rounded', false))
				{
					handles.push(createArcHandle(state));
				}
				
				return handles;
			};
		};
		
		function createDisplayHandleFunction(defaultValue, allowArcHandle, max, redrawEdges, fixedDefaultValue)
		{
			max = (max != null) ? max : 0.5;
			
			return function(state)
			{
				let handles = [createHandle(state, ['size'], function(bounds)
				{
					let fixed = (fixedDefaultValue != null) ? getValue(this.state.style, 'fixedSize', '0') != '0' : null;
					let size = parseFloat(getValue(this.state.style, 'size', (fixed) ? fixedDefaultValue : defaultValue));
	
					return new Point(bounds.x + Math.max(0, Math.min(bounds.width * 0.5, size * ((fixed) ? 1 : bounds.width))), bounds.getCenterY());
				}, function(bounds, pt, me)
				{
					let fixed = (fixedDefaultValue != null) ? getValue(this.state.style, 'fixedSize', '0') != '0' : null;
					let size = (fixed) ? (pt.x - bounds.x) : Math.max(0, Math.min(max, (pt.x - bounds.x) / bounds.width));
					
					this.state.style.size = size;
				}, false, redrawEdges)];
				
				if (allowArcHandle && getValue(state.style, 'rounded', false))
				{
					handles.push(createArcHandle(state));
				}
				
				return handles;
			};
		};
		
		function createCubeHandleFunction(factor, defaultValue, allowArcHandle)
		{
			return function(state)
			{
				let handles = [createHandle(state, ['size'], function(bounds)
				{
					let size = Math.max(0, Math.min(bounds.width, Math.min(bounds.height, parseFloat(
						getValue(this.state.style, 'size', defaultValue))))) * factor;
					
					return new Point(bounds.x + size, bounds.y + size);
				}, function(bounds, pt)
				{
					this.state.style.size = Math.round(Math.max(0, Math.min(Math.min(bounds.width, pt.x - bounds.x),
							Math.min(bounds.height, pt.y - bounds.y))) / factor);
				}, false)];
				
				if (allowArcHandle && getValue(state.style, 'rounded', false))
				{
					handles.push(createArcHandle(state));
				}
				
				return handles;
			};
		};
		
		function createCylinderHandleFunction(defaultValue)
		{
			return function(state)
			{
				return [createHandle(state, ['size'], function(bounds)
						{
							let size = Math.max(0, Math.min(bounds.height * 0.5, parseFloat(getValue(this.state.style, 'size', defaultValue))));
	
							return new Point(bounds.x, bounds.y + size);
						}, function(bounds, pt)
						{
							this.state.style.size = Math.max(0, pt.y - bounds.y);
						}, true)];
			}
		};
		
		function createArrowHandleFunction(maxSize)
		{
			return function(state)
			{
				return [createHandle(state, ['arrowWidth', 'arrowSize'], function(bounds)
				{
					let aw = Math.max(0, Math.min(1, getValue(this.state.style, 'arrowWidth', SingleArrowShape.prototype.arrowWidth)));
					let as = Math.max(0, Math.min(maxSize, getValue(this.state.style, 'arrowSize', SingleArrowShape.prototype.arrowSize)));
					
					return new Point(bounds.x + (1 - as) * bounds.width, bounds.y + (1 - aw) * bounds.height / 2);
				}, function(bounds, pt)
				{
					this.state.style.arrowWidth = Math.max(0, Math.min(1, Math.abs(bounds.y + bounds.height / 2 - pt.y) / bounds.height * 2));
					this.state.style.arrowSize = Math.max(0, Math.min(maxSize, (bounds.x + bounds.width - pt.x) / (bounds.width)));
				})];
			};
		};
		
		function createEdgeHandle(state, keys, start, getPosition, setPosition)
		{
			return createHandle(state, keys, function(bounds)
			{
				let pts = state.absolutePoints;
				let n = pts.length - 1;
				
				let tr = state.view.translate;
				let s = state.view.scale;
				
				var p0 = (start) ? pts[0] : pts[n];
				var p1 = (start) ? pts[1] : pts[n - 1];
				let dx = (start) ? p1.x - p0.x : p1.x - p0.x;
				let dy = (start) ? p1.y - p0.y : p1.y - p0.y;

				let dist = Math.sqrt(dx * dx + dy * dy);
				
				let pt = getPosition.call(this, dist, dx / dist, dy / dist, p0, p1);
				
				return new Point(pt.x / s - tr.x, pt.y / s - tr.y);
			}, function(bounds, pt, me)
			{
				let pts = state.absolutePoints;
				let n = pts.length - 1;
				
				let tr = state.view.translate;
				let s = state.view.scale;
				
				var p0 = (start) ? pts[0] : pts[n];
				var p1 = (start) ? pts[1] : pts[n - 1];
				let dx = (start) ? p1.x - p0.x : p1.x - p0.x;
				let dy = (start) ? p1.y - p0.y : p1.y - p0.y;

				let dist = Math.sqrt(dx * dx + dy * dy);
				pt.x = (pt.x + tr.x) * s;
				pt.y = (pt.y + tr.y) * s;

				setPosition.call(this, dist, dx / dist, dy / dist, p0, p1, pt, me);
			});
		};
		
		function createEdgeWidthHandle(state, start, spacing)
		{
			return createEdgeHandle(state, ['width'], start, function(dist, nx, ny, p0, p1)
			{
				let w = state.shape.getEdgeWidth() * state.view.scale + spacing;

				return new Point(p0.x + nx * dist / 4 + ny * w / 2, p0.y + ny * dist / 4 - nx * w / 2);
			}, function(dist, nx, ny, p0, p1, pt)
			{
				let w = Math.sqrt(ptSegDistSq(p0.x, p0.y, p1.x, p1.y, pt.x, pt.y));
				state.style.width = Math.round(w * 2) / state.view.scale - spacing;
			});
		};
		
		function ptLineDistance(x1, y1, x2, y2, x0, y0)
		{
			return Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1) / Math.sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1));
		}

		let handleFactory = {
			'link': function(state)
			{
				let spacing = 10;

				return [createEdgeWidthHandle(state, true, spacing), createEdgeWidthHandle(state, false, spacing)];
			},
			'flexArrow': function(state)
			{
				// Do not use state.shape.startSize/endSize since it is cached
				let tol = state.view.graph.gridSize / state.view.scale;
				let handles = [];
				
				if (getValue(state.style, 'startArrow', mxConstants.NONE) != mxConstants.NONE)
				{
					handles.push(createEdgeHandle(state, ['width', 'startSize', 'endSize'], true, function(dist, nx, ny, p0, p1)
					{
						let w = (state.shape.getEdgeWidth() - state.shape.strokewidth) * state.view.scale;
						let l = getNumber(state.style, 'startSize', mxConstants.ARROW_SIZE / 5) * 3 * state.view.scale;
						
						return new Point(p0.x + nx * (l + state.shape.strokewidth * state.view.scale) + ny * w / 2,
							p0.y + ny * (l + state.shape.strokewidth * state.view.scale) - nx * w / 2);
					}, function(dist, nx, ny, p0, p1, pt, me)
					{
						let w = Math.sqrt(ptSegDistSq(p0.x, p0.y, p1.x, p1.y, pt.x, pt.y));
						let l = ptLineDist(p0.x, p0.y, p0.x + ny, p0.y - nx, pt.x, pt.y);
						
						state.style.startSize = Math.round((l - state.shape.strokewidth) * 100 / 3) / 100 / state.view.scale;
						state.style.width = Math.round(w * 2) / state.view.scale;
						
						// Applies to opposite side
						if (mxEvent.isControlDown(me.getEvent()))
						{
							state.style.endSize = state.style.startSize;
						}

						// Snaps to end geometry
						if (!mxEvent.isAltDown(me.getEvent()))
						{
							if (Math.abs(parseFloat(state.style.startSize) - parseFloat(state.style.endSize)) < tol / 6)
							{
								state.style.startSize = state.style.endSize;
							}
						}
					}));
					
					handles.push(createEdgeHandle(state, ['startWidth', 'endWidth', 'startSize', 'endSize'], true, function(dist, nx, ny, p0, p1)
					{
						let w = (state.shape.getStartArrowWidth() - state.shape.strokewidth) * state.view.scale;
						let l = getNumber(state.style, 'startSize', mxConstants.ARROW_SIZE / 5) * 3 * state.view.scale;
						
						return new Point(p0.x + nx * (l + state.shape.strokewidth * state.view.scale) + ny * w / 2,
							p0.y + ny * (l + state.shape.strokewidth * state.view.scale) - nx * w / 2);
					}, function(dist, nx, ny, p0, p1, pt, me)
					{
						let w = Math.sqrt(ptSegDistSq(p0.x, p0.y, p1.x, p1.y, pt.x, pt.y));
						let l = ptLineDist(p0.x, p0.y, p0.x + ny, p0.y - nx, pt.x, pt.y);
						
						state.style.startSize = Math.round((l - state.shape.strokewidth) * 100 / 3) / 100 / state.view.scale;
						state.style.startWidth = Math.max(0, Math.round(w * 2) - state.shape.getEdgeWidth()) / state.view.scale;
						
						// Applies to opposite side
						if (mxEvent.isControlDown(me.getEvent()))
						{
							state.style.endSize = state.style.startSize;
							state.style.endWidth = state.style.startWidth;
						}
						
						// Snaps to endWidth
						if (!mxEvent.isAltDown(me.getEvent()))
						{
							if (Math.abs(parseFloat(state.style.startSize) - parseFloat(state.style.endSize)) < tol / 6)
							{
								state.style.startSize = state.style.endSize;
							}
							
							if (Math.abs(parseFloat(state.style.startWidth) - parseFloat(state.style.endWidth)) < tol)
							{
								state.style.startWidth = state.style.endWidth;
							}
						}
					}));
				}
				
				if (getValue(state.style, 'endArrow', mxConstants.NONE) != mxConstants.NONE)
				{
					handles.push(createEdgeHandle(state, ['width', 'startSize', 'endSize'], false, function(dist, nx, ny, p0, p1)
					{
						let w = (state.shape.getEdgeWidth() - state.shape.strokewidth) * state.view.scale;
						let l = getNumber(state.style, 'endSize', mxConstants.ARROW_SIZE / 5) * 3 * state.view.scale;
						
						return new Point(p0.x + nx * (l + state.shape.strokewidth * state.view.scale) - ny * w / 2,
							p0.y + ny * (l + state.shape.strokewidth * state.view.scale) + nx * w / 2);
					}, function(dist, nx, ny, p0, p1, pt, me)
					{
						let w = Math.sqrt(ptSegDistSq(p0.x, p0.y, p1.x, p1.y, pt.x, pt.y));
						let l = ptLineDist(p0.x, p0.y, p0.x + ny, p0.y - nx, pt.x, pt.y);
						
						state.style.endSize = Math.round((l - state.shape.strokewidth) * 100 / 3) / 100 / state.view.scale;
						state.style.width = Math.round(w * 2) / state.view.scale;
						
						// Applies to opposite side
						if (mxEvent.isControlDown(me.getEvent()))
						{
							state.style.startSize = state.style.endSize;
						}
					
						// Snaps to start geometry
						if (!mxEvent.isAltDown(me.getEvent()))
						{
							if (Math.abs(parseFloat(state.style.endSize) - parseFloat(state.style.startSize)) < tol / 6)
							{
								state.style.endSize = state.style.startSize;
							}
						}
					}));
					
					handles.push(createEdgeHandle(state, ['startWidth', 'endWidth', 'startSize', 'endSize'], false, function(dist, nx, ny, p0, p1)
					{
						let w = (state.shape.getEndArrowWidth() - state.shape.strokewidth) * state.view.scale;
						let l = getNumber(state.style, 'endSize', mxConstants.ARROW_SIZE / 5) * 3 * state.view.scale;
						
						return new Point(p0.x + nx * (l + state.shape.strokewidth * state.view.scale) - ny * w / 2,
							p0.y + ny * (l + state.shape.strokewidth * state.view.scale) + nx * w / 2);
					}, function(dist, nx, ny, p0, p1, pt, me)
					{
						let w = Math.sqrt(ptSegDistSq(p0.x, p0.y, p1.x, p1.y, pt.x, pt.y));
						let l = ptLineDist(p0.x, p0.y, p0.x + ny, p0.y - nx, pt.x, pt.y);
						
						state.style.endSize = Math.round((l - state.shape.strokewidth) * 100 / 3) / 100 / state.view.scale;
						state.style.endWidth = Math.max(0, Math.round(w * 2) - state.shape.getEdgeWidth()) / state.view.scale;
						
						// Applies to opposite side
						if (mxEvent.isControlDown(me.getEvent()))
						{
							state.style.startSize = state.style.endSize;
							state.style.startWidth = state.style.endWidth;
						}
					
						// Snaps to start geometry
						if (!mxEvent.isAltDown(me.getEvent()))
						{
							if (Math.abs(parseFloat(state.style.endSize) - parseFloat(state.style.startSize)) < tol / 6)
							{
								state.style.endSize = state.style.startSize;
							}
							
							if (Math.abs(parseFloat(state.style.endWidth) - parseFloat(state.style.startWidth)) < tol)
							{
								state.style.endWidth = state.style.startWidth;
							}
						}
					}));
				}
				
				return handles;
			},
			'swimlane': function(state)
			{
				let handles = [];
				
				if (getValue(state.style, 'rounded'))
				{
					let size = parseFloat(getValue(state.style, 'startSize', mxConstants.DEFAULT_STARTSIZE));
					handles.push(createArcHandle(state, size / 2));
				}
				
				// Start size handle must be last item in handles for hover to work in tables (see mouse event handler in Graph)
				handles.push(createHandle(state, .startSize, function(bounds)
				{
					let size = parseFloat(getValue(state.style, 'startSize', mxConstants.DEFAULT_STARTSIZE));
					
					if (getValue(state.style, 'horizontal', 1) == 1)
					{
						return new Point(bounds.getCenterX(), bounds.y + Math.max(0, Math.min(bounds.height, size)));
					}
					else
					{
						return new Point(bounds.x + Math.max(0, Math.min(bounds.width, size)), bounds.getCenterY());
					}
				}, function(bounds, pt)
				{	
					state.style.startSize =
						(getValue(this.state.style, 'horizontal', 1) == 1) ?
							Math.round(Math.max(0, Math.min(bounds.height, pt.y - bounds.y))) :
							Math.round(Math.max(0, Math.min(bounds.width, pt.x - bounds.x)));
				}, false, null, function(me)
				{
					if (mxEvent.isControlDown(me.getEvent()))
					{
						let graph = state.view.graph;
						
						if (graph.isTableRow(state.cell) || graph.isTableCell(state.cell))
						{
							let dir = graph.getSwimlaneDirection(state.style);
							let parent = state.cell.getParent();
							let cells = graph.model.getChildCells(parent, true);
							let temp = []; 
							
							for (let i = 0; i < cells.length; i++)
							{
								// Finds siblings with the same direction and to set start size
								if (cells[i] != state.cell && graph.isSwimlane(cells[i]) &&
									graph.getSwimlaneDirection(graph.getCurrentCellStyle(
									cells[i])) == dir)
								{
									temp.push(cells[i]);
								}
							}
							
							graph.setCellStyles('startSize',
								state.style.startSize, temp);
						}
					}					
				}));
				
				return handles;
			},
			'label': createArcHandleFunction(),
			'ext': createArcHandleFunction(),
			'rectangle': createArcHandleFunction(),
			'triangle': createArcHandleFunction(),
			'rhombus': createArcHandleFunction(),
			'umlLifeline': function(state)
			{
				return [createHandle(state, ['size'], function(bounds)
				{
					let size = Math.max(0, Math.min(bounds.height, parseFloat(getValue(this.state.style, 'size', UmlLifeline.prototype.size))));
					
					return new Point(bounds.getCenterX(), bounds.y + size);
				}, function(bounds, pt)
				{	
					this.state.style.size = Math.round(Math.max(0, Math.min(bounds.height, pt.y - bounds.y)));
				}, false)];
			},
			'umlFrame': function(state)
			{
				let handles = [createHandle(state, ['width', 'height'], function(bounds)
				{
					var w0 = Math.max(UmlFrame.prototype.corner, Math.min(bounds.width, getValue(this.state.style, 'width', UmlFrame.prototype.width)));
					var h0 = Math.max(UmlFrame.prototype.corner * 1.5, Math.min(bounds.height, getValue(this.state.style, 'height', UmlFrame.prototype.height)));

					return new Point(bounds.x + w0, bounds.y + h0);
				}, function(bounds, pt)
				{
					this.state.style.width = Math.round(Math.max(UmlFrame.prototype.corner, Math.min(bounds.width, pt.x - bounds.x)));
					this.state.style.height = Math.round(Math.max(UmlFrame.prototype.corner * 1.5, Math.min(bounds.height, pt.y - bounds.y)));
				}, false)];
				
				return handles;
			},
			'process': function(state)
			{
				let handles = [createHandle(state, ['size'], function(bounds)
				{
					
					let fixed = getValue(this.state.style, 'fixedSize', '0') != '0';
					let size = parseFloat(getValue(this.state.style, 'size', ProcessShape.prototype.size));
					
					return (fixed) ? new Point(bounds.x + size, bounds.y + bounds.height / 4) : new Point(bounds.x + bounds.width * size, bounds.y + bounds.height / 4);
				}, function(bounds, pt)
				{
					let fixed = getValue(this.state.style, 'fixedSize', '0') != '0';
					let size = (fixed) ? Math.max(0, Math.min(bounds.width * 0.5, (pt.x - bounds.x))) : Math.max(0, Math.min(0.5, (pt.x - bounds.x) / bounds.width));
					this.state.style.size = size;
				}, false)];
				
				if (getValue(state.style, 'rounded', false))
				{
					handles.push(createArcHandle(state));
				}
				
				return handles;
			},
			'cross': function(state)
			{
				return [createHandle(state, ['size'], function(bounds)
				{
					let m = Math.min(bounds.width, bounds.height);
					let size = Math.max(0, Math.min(1, getValue(this.state.style, 'size', CrossShape.prototype.size))) * m / 2;

					return new Point(bounds.getCenterX() - size, bounds.getCenterY() - size);
				}, function(bounds, pt)
				{
					let m = Math.min(bounds.width, bounds.height);
					this.state.style.size = Math.max(0, Math.min(1, Math.min((Math.max(0, bounds.getCenterY() - pt.y) / m) * 2,
							(Math.max(0, bounds.getCenterX() - pt.x) / m) * 2)));
				})];
			},
			'note': function(state)
			{
				return [createHandle(state, ['size'], function(bounds)
				{
					let size = Math.max(0, Math.min(bounds.width, Math.min(bounds.height, parseFloat(
						getValue(this.state.style, 'size', NoteShape.prototype.size)))));
					
					return new Point(bounds.x + bounds.width - size, bounds.y + size);
				}, function(bounds, pt)
				{
					this.state.style.size = Math.round(Math.max(0, Math.min(Math.min(bounds.width, bounds.x + bounds.width - pt.x),
							Math.min(bounds.height, pt.y - bounds.y))));
				})];
			},
			'note2': function(state)
			{
				return [createHandle(state, ['size'], function(bounds)
				{
					let size = Math.max(0, Math.min(bounds.width, Math.min(bounds.height, parseFloat(
						getValue(this.state.style, 'size', NoteShape2.prototype.size)))));
					
					return new Point(bounds.x + bounds.width - size, bounds.y + size);
				}, function(bounds, pt)
				{
					this.state.style.size = Math.round(Math.max(0, Math.min(Math.min(bounds.width, bounds.x + bounds.width - pt.x),
							Math.min(bounds.height, pt.y - bounds.y))));
				})];
			},
			'manualInput': function(state)
			{
				let handles = [createHandle(state, ['size'], function(bounds)
				{
					let size = Math.max(0, Math.min(bounds.height, getValue(this.state.style, 'size', ManualInputShape.prototype.size)));
					
					return new Point(bounds.x + bounds.width / 4, bounds.y + size * 3 / 4);
				}, function(bounds, pt)
				{
					this.state.style.size = Math.round(Math.max(0, Math.min(bounds.height, (pt.y - bounds.y) * 4 / 3)));
				}, false)];
				
				if (getValue(state.style, 'rounded', false))
				{
					handles.push(createArcHandle(state));
				}
				
				return handles;
			},
			'dataStorage': function(state)
			{
				return [createHandle(state, ['size'], function(bounds)
				{
					let fixed = getValue(this.state.style, 'fixedSize', '0') != '0';
					let size = parseFloat(getValue(this.state.style, 'size', (fixed) ? DataStorageShape.prototype.fixedSize : DataStorageShape.prototype.size));

					return new Point(bounds.x + bounds.width - size * ((fixed) ? 1 : bounds.width), bounds.getCenterY());
				}, function(bounds, pt)
				{
					let fixed = getValue(this.state.style, 'fixedSize', '0') != '0';
					let size = (fixed) ? Math.max(0, Math.min(bounds.width, (bounds.x + bounds.width - pt.x))) : Math.max(0, Math.min(1, (bounds.x + bounds.width - pt.x) / bounds.width));
					
					this.state.style.size = size;
				}, false)];
			},
			'callout': function(state)
			{
				let handles = [createHandle(state, ['size', 'position'], function(bounds)
				{
					let size = Math.max(0, Math.min(bounds.height, getValue(this.state.style, 'size', CalloutShape.prototype.size)));
					let position = Math.max(0, Math.min(1, getValue(this.state.style, 'position', CalloutShape.prototype.position)));
					let base = Math.max(0, Math.min(bounds.width, getValue(this.state.style, 'base', CalloutShape.prototype.base)));
					
					return new Point(bounds.x + position * bounds.width, bounds.y + bounds.height - size);
				}, function(bounds, pt)
				{
					let base = Math.max(0, Math.min(bounds.width, getValue(this.state.style, 'base', CalloutShape.prototype.base)));
					this.state.style.size = Math.round(Math.max(0, Math.min(bounds.height, bounds.y + bounds.height - pt.y)));
					this.state.style.position = Math.round(Math.max(0, Math.min(1, (pt.x - bounds.x) / bounds.width)) * 100) / 100;
				}, false), createHandle(state, ['position2'], function(bounds)
				{
					var position2 = Math.max(0, Math.min(1, getValue(this.state.style, 'position2', CalloutShape.prototype.position2)));

					return new Point(bounds.x + position2 * bounds.width, bounds.y + bounds.height);
				}, function(bounds, pt)
				{
					this.state.style['position2'] = Math.round(Math.max(0, Math.min(1, (pt.x - bounds.x) / bounds.width)) * 100) / 100;
				}, false), createHandle(state, ['base'], function(bounds)
				{
					let size = Math.max(0, Math.min(bounds.height, getValue(this.state.style, 'size', CalloutShape.prototype.size)));
					let position = Math.max(0, Math.min(1, getValue(this.state.style, 'position', CalloutShape.prototype.position)));
					let base = Math.max(0, Math.min(bounds.width, getValue(this.state.style, 'base', CalloutShape.prototype.base)));
					
					return new Point(bounds.x + Math.min(bounds.width, position * bounds.width + base), bounds.y + bounds.height - size);
				}, function(bounds, pt)
				{
					let position = Math.max(0, Math.min(1, getValue(this.state.style, 'position', CalloutShape.prototype.position)));

					this.state.style.base = Math.round(Math.max(0, Math.min(bounds.width, pt.x - bounds.x - position * bounds.width)));
				}, false)];
				
				if (getValue(state.style, 'rounded', false))
				{
					handles.push(createArcHandle(state));
				}
				
				return handles;
			},
			'internalStorage': function(state)
			{
				let handles = [createHandle(state, ['dx', 'dy'], function(bounds)
				{
					let dx = Math.max(0, Math.min(bounds.width, getValue(this.state.style, 'dx', InternalStorageShape.prototype.dx)));
					let dy = Math.max(0, Math.min(bounds.height, getValue(this.state.style, 'dy', InternalStorageShape.prototype.dy)));

					return new Point(bounds.x + dx, bounds.y + dy);
				}, function(bounds, pt)
				{
					this.state.style.dx = Math.round(Math.max(0, Math.min(bounds.width, pt.x - bounds.x)));
					this.state.style.dy = Math.round(Math.max(0, Math.min(bounds.height, pt.y - bounds.y)));
				}, false)];
				
				if (getValue(state.style, 'rounded', false))
				{
					handles.push(createArcHandle(state));
				}
				
				return handles;
			},
			'module': function(state)
			{
				let handles = [createHandle(state, ['jettyWidth', 'jettyHeight'], function(bounds)
				{
					let dx = Math.max(0, Math.min(bounds.width, getValue(this.state.style, 'jettyWidth', ModuleShape.prototype.jettyWidth)));
					let dy = Math.max(0, Math.min(bounds.height, getValue(this.state.style, 'jettyHeight', ModuleShape.prototype.jettyHeight)));

					return new Point(bounds.x + dx / 2, bounds.y + dy * 2);
				}, function(bounds, pt)
				{
					this.state.style.jettyWidth = Math.round(Math.max(0, Math.min(bounds.width, pt.x - bounds.x)) * 2);
					this.state.style.jettyHeight = Math.round(Math.max(0, Math.min(bounds.height, pt.y - bounds.y)) / 2);
				})];
				
				return handles;
			},
			'corner': function(state)
			{
				return [createHandle(state, ['dx', 'dy'], function(bounds)
				{
					let dx = Math.max(0, Math.min(bounds.width, getValue(this.state.style, 'dx', CornerShape.prototype.dx)));
					let dy = Math.max(0, Math.min(bounds.height, getValue(this.state.style, 'dy', CornerShape.prototype.dy)));

					return new Point(bounds.x + dx, bounds.y + dy);
				}, function(bounds, pt)
				{
					this.state.style.dx = Math.round(Math.max(0, Math.min(bounds.width, pt.x - bounds.x)));
					this.state.style.dy = Math.round(Math.max(0, Math.min(bounds.height, pt.y - bounds.y)));
				}, false)];
			},
			'tee': function(state)
			{
				return [createHandle(state, ['dx', 'dy'], function(bounds)
				{
					let dx = Math.max(0, Math.min(bounds.width, getValue(this.state.style, 'dx', TeeShape.prototype.dx)));
					let dy = Math.max(0, Math.min(bounds.height, getValue(this.state.style, 'dy', TeeShape.prototype.dy)));

					return new Point(bounds.x + (bounds.width + dx) / 2, bounds.y + dy);
				}, function(bounds, pt)
				{
					this.state.style.dx = Math.round(Math.max(0, Math.min(bounds.width / 2, (pt.x - bounds.x - bounds.width / 2)) * 2));
					this.state.style.dy = Math.round(Math.max(0, Math.min(bounds.height, pt.y - bounds.y)));
				}, false)];
			},
			'singleArrow': createArrowHandleFunction(1),
			'doubleArrow': createArrowHandleFunction(0.5),			
			'folder': function(state)
			{
				return [createHandle(state, ['tabWidth', 'tabHeight'], function(bounds)
				{
					let tw = Math.max(0, Math.min(bounds.width, getValue(this.state.style, 'tabWidth', FolderShape.prototype.tabWidth)));
					let th = Math.max(0, Math.min(bounds.height, getValue(this.state.style, 'tabHeight', FolderShape.prototype.tabHeight)));
					
					if (getValue(this.state.style, 'tabPosition', FolderShape.prototype.tabPosition) == mxConstants.ALIGN_RIGHT)
					{
						tw = bounds.width - tw;
					}
					
					return new Point(bounds.x + tw, bounds.y + th);
				}, function(bounds, pt)
				{
					let tw = Math.max(0, Math.min(bounds.width, pt.x - bounds.x));
					
					if (getValue(this.state.style, 'tabPosition', FolderShape.prototype.tabPosition) == mxConstants.ALIGN_RIGHT)
					{
						tw = bounds.width - tw;
					}
					
					this.state.style.tabWidth = Math.round(tw);
					this.state.style.tabHeight = Math.round(Math.max(0, Math.min(bounds.height, pt.y - bounds.y)));
				}, false)];
			},
			'document': function(state)
			{
				return [createHandle(state, ['size'], function(bounds)
				{
					let size = Math.max(0, Math.min(1, parseFloat(getValue(this.state.style, 'size', DocumentShape.prototype.size))));

					return new Point(bounds.x + 3 * bounds.width / 4, bounds.y + (1 - size) * bounds.height);
				}, function(bounds, pt)
				{
					this.state.style.size = Math.max(0, Math.min(1, (bounds.y + bounds.height - pt.y) / bounds.height));
				}, false)];
			},
			'tape': function(state)
			{
				return [createHandle(state, ['size'], function(bounds)
				{
					let size = Math.max(0, Math.min(1, parseFloat(getValue(this.state.style, 'size', TapeShape.prototype.size))));

					return new Point(bounds.getCenterX(), bounds.y + size * bounds.height / 2);
				}, function(bounds, pt)
				{
					this.state.style.size = Math.max(0, Math.min(1, ((pt.y - bounds.y) / bounds.height) * 2));
				}, false)];
			},
			'isoCube2' : function(state)
			{
				return [createHandle(state, ['isoAngle'], function(bounds)
				{
					let isoAngle = Math.max(0.01, Math.min(94, parseFloat(getValue(this.state.style, 'isoAngle', IsoCubeShape2.isoAngle)))) * Math.PI / 200 ;
					let isoH = Math.min(bounds.width * Math.tan(isoAngle), bounds.height * 0.5);

					return new Point(bounds.x, bounds.y + isoH);
				}, function(bounds, pt)
				{
					this.state.style.isoAngle = Math.max(0, (pt.y - bounds.y) * 50 / bounds.height);
				}, true)];
			},
			'cylinder2' : createCylinderHandleFunction(CylinderShape.prototype.size),
			'cylinder3' : createCylinderHandleFunction(CylinderShape3.prototype.size),
			'offPageConnector': function(state)
			{
				return [createHandle(state, ['size'], function(bounds)
				{
					let size = Math.max(0, Math.min(1, parseFloat(getValue(this.state.style, 'size', OffPageConnectorShape.prototype.size))));

					return new Point(bounds.getCenterX(), bounds.y + (1 - size) * bounds.height);
				}, function(bounds, pt)
				{
					this.state.style.size = Math.max(0, Math.min(1, (bounds.y + bounds.height - pt.y) / bounds.height));
				}, false)];
			},
			'step': createDisplayHandleFunction(StepShape.prototype.size, true, null, true, StepShape.prototype.fixedSize),
			'hexagon': createDisplayHandleFunction(HexagonShape.prototype.size, true, 0.5, true, HexagonShape.prototype.fixedSize),
			'curlyBracket': createDisplayHandleFunction(CurlyBracketShape.prototype.size, false),
			'display': createDisplayHandleFunction(DisplayShape.prototype.size, false),
			'cube': createCubeHandleFunction(1, CubeShape.prototype.size, false),
			'card': createCubeHandleFunction(0.5, CardShape.prototype.size, true),
			'loopLimit': createCubeHandleFunction(0.5, LoopLimitShape.prototype.size, true),
			'trapezoid': createTrapezoidHandleFunction(0.5, TrapezoidShape.prototype.size, TrapezoidShape.prototype.fixedSize),
			'parallelogram': createTrapezoidHandleFunction(1, ParallelogramShape.prototype.size, ParallelogramShape.prototype.fixedSize)
		};
		
		// Exposes custom handles
		Graph.createHandle = createHandle;
		Graph.handleFactory = handleFactory;
		
		let vertexHandlerCreateCustomHandles = VertexHandler.prototype.createCustomHandles;

		VertexHandler.prototype.createCustomHandles = function()
		{
			let handles = vertexHandlerCreateCustomHandles.apply(this, arguments);
			
			if (this.graph.isCellRotatable(this.state.cell))
			// LATER: Make locked state independent of rotatable flag, fix toggle if default is false
			//if (this.graph.isCellResizable(this.state.cell) || this.graph.isCellMovable(this.state.cell))
			{
				let name = this.state.style.shape;

				if (mxCellRenderer.defaultShapes[name] == null &&
					StencilShapeRegistry.getStencil(name) == null)
				{
					name = mxConstants.SHAPE_RECTANGLE;
				}
				else if (this.state.view.graph.isSwimlane(this.state.cell))
				{
					name = mxConstants.SHAPE_SWIMLANE;
				}
				
				let fn = handleFactory[name];
				
				if (fn == null && this.state.shape != null && this.state.shape.isRoundable())
				{
					fn = handleFactory[mxConstants.SHAPE_RECTANGLE];
				}
			
				if (fn != null)
				{
					let temp = fn(this.state);
					
					if (temp != null)
					{
						if (handles == null)
						{
							handles = temp;
						}
						else
						{
							handles = handles.concat(temp);
						}
					}
				}
			}
			
			return handles;
		};

		mxEdgeHandler.prototype.createCustomHandles = function()
		{
			let name = this.state.style.shape;
			
			if (mxCellRenderer.defaultShapes[name] == null &&
				StencilShapeRegistry.getStencil(name) == null)
			{
				name = mxConstants.SHAPE_CONNECTOR;
			}
			
			let fn = handleFactory[name];
			
			if (fn != null)
			{
				return fn(this.state);
			}
			
			return null;
		}
	}
	else
	{
		// Dummy entries to avoid NPE in embed mode
		Graph.createHandle = function() {};
		Graph.handleFactory = {};
	}
	 
	 let isoHVector = new Point(1, 0);
	 let isoVVector = new Point(1, 0);
		
	 var alpha1 = toRadians(-30);
		
	 var cos1 = Math.cos(alpha1);
	 var sin1 = Math.sin(alpha1);

	 isoHVector = getRotatedPoint(isoHVector, cos1, sin1);

	 var alpha2 = toRadians(-150);
	 
	 var cos2 = Math.cos(alpha2);
	 var sin2 = Math.sin(alpha2);

	 isoVVector = getRotatedPoint(isoVVector, cos2, sin2);
	
	 mxEdgeStyle.IsometricConnector = (state, source, target, points, result) =>
	 {
		let view = state.view;
		let pt = (points != null && points.length > 0) ? points[0] : null;
		let pts = state.absolutePoints;
		var p0 = pts[0];
		let pe = pts[pts.length-1];
		
		if (pt != null)
		{
			pt = view.transformControlPoint(state, pt);
		}
		
		if (p0 == null)
		{
			if (source != null)
			{
				p0 = new Point(source.getCenterX(), source.getCenterY());
			}
		}
		
		if (pe == null)
		{
			if (target != null)
			{
				pe = new Point(target.getCenterX(), target.getCenterY());
			}
		}		
		
		var a1 = isoHVector.x;
		var a2 = isoHVector.y;
		
		var b1 = isoVVector.x;
		var b2 = isoVVector.y;
		
		let elbow = getValue(state.style, 'elbow', 'horizontal') == 'horizontal';
		
		if (pe != null && p0 != null)
		{
			let last = p0;
			
			function isoLineTo(x, y, ignoreFirst)
			{
				var c1 = x - last.x;
				var c2 = y - last.y;

				// Solves for isometric base vectors
				let h = (b2 * c1 - b1 * c2) / (a1 * b2 - a2 * b1);
				let v = (a2 * c1 - a1 * c2) / (a2 * b1 - a1 * b2);
				
				if (elbow)
				{
					if (ignoreFirst)
					{
						last = new Point(last.x + a1 * h, last.y + a2 * h);
						result.push(last);
					}
	
					last = new Point(last.x + b1 * v, last.y + b2 * v);
					result.push(last);
				}
				else
				{
					if (ignoreFirst)
					{
						last = new Point(last.x + b1 * v, last.y + b2 * v);
						result.push(last);
					}

					last = new Point(last.x + a1 * h, last.y + a2 * h);
					result.push(last);
				}
			};

			if (pt == null)
			{
				pt = new Point(p0.x + (pe.x - p0.x) / 2, p0.y + (pe.y - p0.y) / 2);
			}
			
			isoLineTo(pt.x, pt.y, true);
			isoLineTo(pe.x, pe.y, false);
		}
	 };

	 StyleRegistry.putValue('isometricEdgeStyle', mxEdgeStyle.IsometricConnector);
	
	 let graphCreateEdgeHandler = Graph.prototype.createEdgeHandler;
	 Graph.prototype.createEdgeHandler = function(state, edgeStyle)
	 {
	 	if (edgeStyle == mxEdgeStyle.IsometricConnector)
	 	{
	 		let handler = new ElbowEdgeHandler(state);
	 		handler.snapToTerminals = false;
	 		
	 		return handler;
	 	}
	 	
	 	return graphCreateEdgeHandler.apply(this, arguments);
	 };

	// Defines connection points for all shapes
	IsoRectangleShape.prototype.constraints = [];
	
	IsoCubeShape.prototype.getConstraints = function(style, w, h)
	{
		let constr = [];
		var tan30 = Math.tan(toRadians(30));
		var tan30Dx = (0.5 - tan30) / 2;
		let m = Math.min(w, h / (0.5 + tan30));
		let dx = (w - m) / 2;
		let dy = (h - m) / 2;

		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, dx, dy + 0.25 * m));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, dx + 0.5 * m, dy + m * tan30Dx));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, dx + m, dy + 0.25 * m));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, dx + m, dy + 0.75 * m));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, dx + 0.5 * m, dy + (1 - tan30Dx) * m));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, dx, dy + 0.75 * m));

		return (constr);
	};

	IsoCubeShape2.prototype.getConstraints = function(style, w, h)
	{
		let constr = [];
		let isoAngle = Math.max(0.01, Math.min(94, parseFloat(getValue(this.style, 'isoAngle', this.isoAngle)))) * Math.PI / 200 ;
		let isoH = Math.min(w * Math.tan(isoAngle), h * 0.5);
		
		constr.push(new ConnectionConstraint(new Point(0.5, 0), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w, isoH));
		constr.push(new ConnectionConstraint(new Point(1, 0.5), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w, h - isoH));
		constr.push(new ConnectionConstraint(new Point(0.5, 1), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, h - isoH));
		constr.push(new ConnectionConstraint(new Point(0, 0.5), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, isoH));

		return (constr);
	}
	
	CalloutShape.prototype.getConstraints = function(style, w, h)
	{
		let constr = [];
		let arcSize = getValue(this.style, 'arcSize', mxConstants.LINE_ARCSIZE) / 2;
		let s = Math.max(0, Math.min(h, parseFloat(getValue(this.style, 'size', this.size))));
		let dx = w * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'position', this.position))));
		var dx2 = w * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'position2', this.position2))));
		let base = Math.max(0, Math.min(w, parseFloat(getValue(this.style, 'base', this.base))));
		
		constr.push(new ConnectionConstraint(new Point(0, 0), false));
		constr.push(new ConnectionConstraint(new Point(0.25, 0), false));
		constr.push(new ConnectionConstraint(new Point(0.5, 0), false));
		constr.push(new ConnectionConstraint(new Point(0.75, 0), false));
		constr.push(new ConnectionConstraint(new Point(1, 0), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w, (h - s) * 0.5));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w, h - s));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, dx2, h));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, h - s));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, (h - s) * 0.5));
		
		if (w >= s * 2)
		{
			constr.push(new ConnectionConstraint(new Point(0.5, 0), false));
		}

		return (constr);
	};
	
	RectangleShape.prototype.constraints = [new ConnectionConstraint(new Point(0, 0), true),
											  new ConnectionConstraint(new Point(0.25, 0), true),
	                                          new ConnectionConstraint(new Point(0.5, 0), true),
	                                          new ConnectionConstraint(new Point(0.75, 0), true),
	                                          new ConnectionConstraint(new Point(1, 0), true),
	        	              		 new ConnectionConstraint(new Point(0, 0.25), true),
	        	              		 new ConnectionConstraint(new Point(0, 0.5), true),
	        	              		 new ConnectionConstraint(new Point(0, 0.75), true),
	        	            		 new ConnectionConstraint(new Point(1, 0.25), true),
	        	            		 new ConnectionConstraint(new Point(1, 0.5), true),
	        	            		 new ConnectionConstraint(new Point(1, 0.75), true),
	        	            		 new ConnectionConstraint(new Point(0, 1), true),
	        	            		 new ConnectionConstraint(new Point(0.25, 1), true),
	        	            		 new ConnectionConstraint(new Point(0.5, 1), true),
	        	            		 new ConnectionConstraint(new Point(0.75, 1), true),
	        	            		 new ConnectionConstraint(new Point(1, 1), true)];
	EllipseShape.prototype.constraints = [new ConnectionConstraint(new Point(0, 0), true), new ConnectionConstraint(new Point(1, 0), true),
	                                   new ConnectionConstraint(new Point(0, 1), true), new ConnectionConstraint(new Point(1, 1), true),
	                                   new ConnectionConstraint(new Point(0.5, 0), true), new ConnectionConstraint(new Point(0.5, 1), true),
	          	              		   new ConnectionConstraint(new Point(0, 0.5), true), new ConnectionConstraint(new Point(1, 0.5))];
	PartialRectangleShape.prototype.constraints = RectangleShape.prototype.constraints;
	ImageShape.prototype.constraints = RectangleShape.prototype.constraints;
	SwimlaneShape.prototype.constraints = RectangleShape.prototype.constraints;
	PlusShape.prototype.constraints = RectangleShape.prototype.constraints;
	Label.prototype.constraints = RectangleShape.prototype.constraints;
	
	NoteShape.prototype.getConstraints = function(style, w, h)
	{
		let constr = [];
		let s = Math.max(0, Math.min(w, Math.min(h, parseFloat(getValue(this.style, 'size', this.size)))));
		
		constr.push(new ConnectionConstraint(new Point(0, 0), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, (w - s) * 0.5, 0));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w - s, 0));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w - s * 0.5, s * 0.5));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w, s));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w, (h + s) * 0.5 ));
		constr.push(new ConnectionConstraint(new Point(1, 1), false));
		constr.push(new ConnectionConstraint(new Point(0.5, 1), false));
		constr.push(new ConnectionConstraint(new Point(0, 1), false));
		constr.push(new ConnectionConstraint(new Point(0, 0.5), false));
		
		if (w >= s * 2)
		{
			constr.push(new ConnectionConstraint(new Point(0.5, 0), false));
		}

		return (constr);
	};
	
	CardShape.prototype.getConstraints = function(style, w, h)
	{
		let constr = [];
		let s = Math.max(0, Math.min(w, Math.min(h, parseFloat(getValue(this.style, 'size', this.size)))));
		
		constr.push(new ConnectionConstraint(new Point(1, 0), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, (w + s) * 0.5, 0));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, s, 0));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, s * 0.5, s * 0.5));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, s));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, (h + s) * 0.5 ));
		constr.push(new ConnectionConstraint(new Point(0, 1), false));
		constr.push(new ConnectionConstraint(new Point(0.5, 1), false));
		constr.push(new ConnectionConstraint(new Point(1, 1), false));
		constr.push(new ConnectionConstraint(new Point(1, 0.5), false));
		
		if (w >= s * 2)
		{
			constr.push(new ConnectionConstraint(new Point(0.5, 0), false));
		}

		return (constr);
	};
	
	CubeShape.prototype.getConstraints = function(style, w, h)
	{
		let constr = [];
		let s = Math.max(0, Math.min(w, Math.min(h, parseFloat(getValue(this.style, 'size', this.size)))));
		
		constr.push(new ConnectionConstraint(new Point(0, 0), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, (w - s) * 0.5, 0));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w - s, 0));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w - s * 0.5, s * 0.5));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w, s));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w, (h + s) * 0.5));
		constr.push(new ConnectionConstraint(new Point(1, 1), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, (w + s) * 0.5, h));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, s, h));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, s * 0.5, h - s * 0.5));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, h - s));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, (h - s) * 0.5));
		
		return (constr);
	};
	
	CylinderShape3.prototype.getConstraints = function(style, w, h)
	{
		let constr = [];
		let s = Math.max(0, Math.min(h, parseFloat(getValue(this.style, 'size', this.size))));
		
		constr.push(new ConnectionConstraint(new Point(0.5, 0), false));
		constr.push(new ConnectionConstraint(new Point(0, 0.5), false));
		constr.push(new ConnectionConstraint(new Point(0.5, 1), false));
		constr.push(new ConnectionConstraint(new Point(1, 0.5), false));
		
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, s));
		constr.push(new ConnectionConstraint(new Point(1, 0), false, null, 0, s));
		constr.push(new ConnectionConstraint(new Point(1, 1), false, null, 0, -s));
		constr.push(new ConnectionConstraint(new Point(0, 1), false, null, 0, -s));
		
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, s + (h * 0.5 - s) * 0.5));
		constr.push(new ConnectionConstraint(new Point(1, 0), false, null, 0, s + (h * 0.5 - s) * 0.5));
		constr.push(new ConnectionConstraint(new Point(1, 0), false, null, 0, h - s - (h * 0.5 - s) * 0.5));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, h - s - (h * 0.5 - s) * 0.5));

		constr.push(new ConnectionConstraint(new Point(0.145, 0), false, null, 0, s * 0.29));
		constr.push(new ConnectionConstraint(new Point(0.855, 0), false, null, 0, s * 0.29));
		constr.push(new ConnectionConstraint(new Point(0.855, 1), false, null, 0, -s * 0.29));
		constr.push(new ConnectionConstraint(new Point(0.145, 1), false, null, 0, -s * 0.29));
		
		return (constr);
	};
	
	FolderShape.prototype.getConstraints = function(style, w, h)
	{
		let constr = [];
		let dx = Math.max(0, Math.min(w, parseFloat(getValue(this.style, 'tabWidth', this.tabWidth))));
		let dy = Math.max(0, Math.min(h, parseFloat(getValue(this.style, 'tabHeight', this.tabHeight))));
		let tp = getValue(this.style, 'tabPosition', this.tabPosition);

		if (tp == 'left')
		{
			constr.push(new ConnectionConstraint(new Point(0, 0), false));
			constr.push(new ConnectionConstraint(new Point(0, 0), false, null, dx * 0.5, 0));
			constr.push(new ConnectionConstraint(new Point(0, 0), false, null, dx, 0));
			constr.push(new ConnectionConstraint(new Point(0, 0), false, null, dx, dy));
			constr.push(new ConnectionConstraint(new Point(0, 0), false, null, (w + dx) * 0.5, dy));
		}
		else
		{
			constr.push(new ConnectionConstraint(new Point(1, 0), false));
			constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w - dx * 0.5, 0));
			constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w - dx, 0));
			constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w - dx, dy));
			constr.push(new ConnectionConstraint(new Point(0, 0), false, null, (w - dx) * 0.5, dy));
		}
		
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w, dy));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w, (h - dy) * 0.25 + dy));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w, (h - dy) * 0.5 + dy));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w, (h - dy) * 0.75 + dy));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w, h));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, dy));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, (h - dy) * 0.25 + dy));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, (h - dy) * 0.5 + dy));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, (h - dy) * 0.75 + dy));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, h));
		constr.push(new ConnectionConstraint(new Point(0.25, 1), false));
		constr.push(new ConnectionConstraint(new Point(0.5, 1), false));
		constr.push(new ConnectionConstraint(new Point(0.75, 1), false));

		return (constr);
	}

	InternalStorageShape.prototype.constraints = RectangleShape.prototype.constraints;
	DataStorageShape.prototype.constraints = RectangleShape.prototype.constraints;
	TapeDataShape.prototype.constraints = EllipseShape.prototype.constraints;
	OrEllipseShape.prototype.constraints = EllipseShape.prototype.constraints;
	SumEllipseShape.prototype.constraints = EllipseShape.prototype.constraints;
	LineEllipseShape.prototype.constraints = EllipseShape.prototype.constraints;
	ManualInputShape.prototype.constraints = RectangleShape.prototype.constraints;
	DelayShape.prototype.constraints = RectangleShape.prototype.constraints;

	DisplayShape.prototype.getConstraints = function(style, w, h)
	{
		let constr = [];
		let dx = Math.min(w, h / 2);
		let s = Math.min(w - dx, Math.max(0, parseFloat(getValue(this.style, 'size', this.size))) * w);
		
		constr.push(new ConnectionConstraint(new Point(0, 0.5), false, null));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, s, 0));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, (s + w - dx) * 0.5, 0));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w - dx, 0));
		constr.push(new ConnectionConstraint(new Point(1, 0.5), false, null));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w - dx, h));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, (s + w - dx) * 0.5, h));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, s, h));
		
		return (constr);
	};
	
	ModuleShape.prototype.getConstraints = function(style, w, h)
	{
		var x0 = parseFloat(getValue(style, 'jettyWidth', ModuleShape.prototype.jettyWidth)) / 2;
		let dy = parseFloat(getValue(style, 'jettyHeight', ModuleShape.prototype.jettyHeight));
		let constr = [new ConnectionConstraint(new Point(0, 0), false, null, x0),
			new ConnectionConstraint(new Point(0.25, 0), true),
			new ConnectionConstraint(new Point(0.5, 0), true),
			new ConnectionConstraint(new Point(0.75, 0), true),
			new ConnectionConstraint(new Point(1, 0), true),
			new ConnectionConstraint(new Point(1, 0.25), true),
			new ConnectionConstraint(new Point(1, 0.5), true),
			new ConnectionConstraint(new Point(1, 0.75), true),
			new ConnectionConstraint(new Point(0, 1), false, null, x0),
			new ConnectionConstraint(new Point(0.25, 1), true),
			new ConnectionConstraint(new Point(0.5, 1), true),
			new ConnectionConstraint(new Point(0.75, 1), true),
			new ConnectionConstraint(new Point(1, 1), true),
			new ConnectionConstraint(new Point(0, 0), false, null, 0, Math.min(h - 0.5 * dy, 1.5 * dy)),
			new ConnectionConstraint(new Point(0, 0), false, null, 0, Math.min(h - 0.5 * dy, 3.5 * dy))];
		
		if (h > 5 * dy)
		{
			constr.push(new ConnectionConstraint(new Point(0, 0.75), false, null, x0));
		}
		
		if (h > 8 * dy)
		{
			constr.push(new ConnectionConstraint(new Point(0, 0.5), false, null, x0));
		}
		
		if (h > 15 * dy)
		{
			constr.push(new ConnectionConstraint(new Point(0, 0.25), false, null, x0));
		}
		
		return constr;
	};
	
	LoopLimitShape.prototype.constraints = RectangleShape.prototype.constraints;
	OffPageConnectorShape.prototype.constraints = RectangleShape.prototype.constraints;
	mxCylinder.prototype.constraints = [new ConnectionConstraint(new Point(0.15, 0.05), false),
                                        new ConnectionConstraint(new Point(0.5, 0), true),
                                        new ConnectionConstraint(new Point(0.85, 0.05), false),
      	              		 new ConnectionConstraint(new Point(0, 0.3), true),
      	              		 new ConnectionConstraint(new Point(0, 0.5), true),
      	              		 new ConnectionConstraint(new Point(0, 0.7), true),
      	            		 new ConnectionConstraint(new Point(1, 0.3), true),
      	            		 new ConnectionConstraint(new Point(1, 0.5), true),
      	            		 new ConnectionConstraint(new Point(1, 0.7), true),
      	            		 new ConnectionConstraint(new Point(0.15, 0.95), false),
      	            		 new ConnectionConstraint(new Point(0.5, 1), true),
      	            		 new ConnectionConstraint(new Point(0.85, 0.95), false)];
	UmlActorShape.prototype.constraints = [new ConnectionConstraint(new Point(0.25, 0.1), false),
	                                          new ConnectionConstraint(new Point(0.5, 0), false),
	                                          new ConnectionConstraint(new Point(0.75, 0.1), false),
	        	              		 new ConnectionConstraint(new Point(0, 1/3), false),
	        	              		 new ConnectionConstraint(new Point(0, 1), false),
	        	            		 new ConnectionConstraint(new Point(1, 1/3), false),
	        	            		 new ConnectionConstraint(new Point(1, 1), false),
	        	            		 new ConnectionConstraint(new Point(0.5, 0.5), false)];
	ComponentShape.prototype.constraints = [new ConnectionConstraint(new Point(0.25, 0), true),
	                                          new ConnectionConstraint(new Point(0.5, 0), true),
	                                          new ConnectionConstraint(new Point(0.75, 0), true),
	        	              		 new ConnectionConstraint(new Point(0, 0.3), true),
	        	              		 new ConnectionConstraint(new Point(0, 0.7), true),
	        	            		 new ConnectionConstraint(new Point(1, 0.25), true),
	        	            		 new ConnectionConstraint(new Point(1, 0.5), true),
	        	            		 new ConnectionConstraint(new Point(1, 0.75), true),
	        	            		 new ConnectionConstraint(new Point(0.25, 1), true),
	        	            		 new ConnectionConstraint(new Point(0.5, 1), true),
	        	            		 new ConnectionConstraint(new Point(0.75, 1), true)];
	Actor.prototype.constraints = [new ConnectionConstraint(new Point(0.5, 0), true),
   	              		 new ConnectionConstraint(new Point(0.25, 0.2), false),
   	              		 new ConnectionConstraint(new Point(0.1, 0.5), false),
   	              		 new ConnectionConstraint(new Point(0, 0.75), true),
   	            		 new ConnectionConstraint(new Point(0.75, 0.25), false),
   	            		 new ConnectionConstraint(new Point(0.9, 0.5), false),
   	            		 new ConnectionConstraint(new Point(1, 0.75), true),
   	            		 new ConnectionConstraint(new Point(0.25, 1), true),
   	            		 new ConnectionConstraint(new Point(0.5, 1), true),
   	            		 new ConnectionConstraint(new Point(0.75, 1), true)];
	SwitchShape.prototype.constraints = [new ConnectionConstraint(new Point(0, 0), false),
                                         new ConnectionConstraint(new Point(0.5, 0.25), false),
                                         new ConnectionConstraint(new Point(1, 0), false),
			       	              		 new ConnectionConstraint(new Point(0.25, 0.5), false),
			       	              		 new ConnectionConstraint(new Point(0.75, 0.5), false),
			       	              		 new ConnectionConstraint(new Point(0, 1), false),
			       	            		 new ConnectionConstraint(new Point(0.5, 0.75), false),
			       	            		 new ConnectionConstraint(new Point(1, 1), false)];
	TapeShape.prototype.constraints = [new ConnectionConstraint(new Point(0, 0.35), false),
	                                   new ConnectionConstraint(new Point(0, 0.5), false),
	                                   new ConnectionConstraint(new Point(0, 0.65), false),
	                                   new ConnectionConstraint(new Point(1, 0.35), false),
		                                new ConnectionConstraint(new Point(1, 0.5), false),
		                                new ConnectionConstraint(new Point(1, 0.65), false),
										new ConnectionConstraint(new Point(0.25, 1), false),
										new ConnectionConstraint(new Point(0.75, 0), false)];
	StepShape.prototype.constraints = [new ConnectionConstraint(new Point(0.25, 0), true),
									new ConnectionConstraint(new Point(0.5, 0), true),
									new ConnectionConstraint(new Point(0.75, 0), true),
									new ConnectionConstraint(new Point(0.25, 1), true),
									new ConnectionConstraint(new Point(0.5, 1), true),
									new ConnectionConstraint(new Point(0.75, 1), true),
									new ConnectionConstraint(new Point(0, 0.25), true),
									new ConnectionConstraint(new Point(0, 0.5), true),
									new ConnectionConstraint(new Point(0, 0.75), true),
									new ConnectionConstraint(new Point(1, 0.25), true),
									new ConnectionConstraint(new Point(1, 0.5), true),
									new ConnectionConstraint(new Point(1, 0.75), true)];
	Line.prototype.constraints = [new ConnectionConstraint(new Point(0, 0.5), false),
	                                new ConnectionConstraint(new Point(0.25, 0.5), false),
	                                new ConnectionConstraint(new Point(0.75, 0.5), false),
									new ConnectionConstraint(new Point(1, 0.5), false)];
	LollipopShape.prototype.constraints = [new ConnectionConstraint(new Point(0.5, 0), false),
										new ConnectionConstraint(new Point(0.5, 1), false)];
	DoubleEllipseShape.prototype.constraints = EllipseShape.prototype.constraints;
	RhombusShape.prototype.constraints = EllipseShape.prototype.constraints;
	TriangleShape.prototype.constraints = [new ConnectionConstraint(new Point(0, 0.25), true),
	                                    new ConnectionConstraint(new Point(0, 0.5), true),
	                                   new ConnectionConstraint(new Point(0, 0.75), true),
	                                   new ConnectionConstraint(new Point(0.5, 0), true),
	                                   new ConnectionConstraint(new Point(0.5, 1), true),
	                                   new ConnectionConstraint(new Point(1, 0.5), true)];
	HexagonShape.prototype.constraints = [new ConnectionConstraint(new Point(0.375, 0), true),
	                                    new ConnectionConstraint(new Point(0.5, 0), true),
	                                   new ConnectionConstraint(new Point(0.625, 0), true),
	                                   new ConnectionConstraint(new Point(0, 0.25), true),
	                                   new ConnectionConstraint(new Point(0, 0.5), true),
	                                   new ConnectionConstraint(new Point(0, 0.75), true),
	                                   new ConnectionConstraint(new Point(1, 0.25), true),
	                                   new ConnectionConstraint(new Point(1, 0.5), true),
	                                   new ConnectionConstraint(new Point(1, 0.75), true),
	                                   new ConnectionConstraint(new Point(0.375, 1), true),
	                                    new ConnectionConstraint(new Point(0.5, 1), true),
	                                   new ConnectionConstraint(new Point(0.625, 1), true)];
	CloudShape.prototype.constraints = [new ConnectionConstraint(new Point(0.25, 0.25), false),
	                                 new ConnectionConstraint(new Point(0.4, 0.1), false),
	                                 new ConnectionConstraint(new Point(0.16, 0.55), false),
	                                 new ConnectionConstraint(new Point(0.07, 0.4), false),
	                                 new ConnectionConstraint(new Point(0.31, 0.8), false),
	                                 new ConnectionConstraint(new Point(0.13, 0.77), false),
	                                 new ConnectionConstraint(new Point(0.8, 0.8), false),
	                                 new ConnectionConstraint(new Point(0.55, 0.95), false),
	                                 new ConnectionConstraint(new Point(0.875, 0.5), false),
	                                 new ConnectionConstraint(new Point(0.96, 0.7), false),
	                                 new ConnectionConstraint(new Point(0.625, 0.2), false),
	                                 new ConnectionConstraint(new Point(0.88, 0.25), false)];
	ParallelogramShape.prototype.constraints = RectangleShape.prototype.constraints;
	TrapezoidShape.prototype.constraints = RectangleShape.prototype.constraints;
	DocumentShape.prototype.constraints = [new ConnectionConstraint(new Point(0.25, 0), true),
	                                          new ConnectionConstraint(new Point(0.5, 0), true),
	                                          new ConnectionConstraint(new Point(0.75, 0), true),
	        	              		 new ConnectionConstraint(new Point(0, 0.25), true),
	        	              		 new ConnectionConstraint(new Point(0, 0.5), true),
	        	              		 new ConnectionConstraint(new Point(0, 0.75), true),
	        	            		 new ConnectionConstraint(new Point(1, 0.25), true),
	        	            		 new ConnectionConstraint(new Point(1, 0.5), true),
	        	            		 new ConnectionConstraint(new Point(1, 0.75), true)];
	Arrow.prototype.constraints = null;

	TeeShape.prototype.getConstraints = function(style, w, h)
	{
		let constr = [];
		let dx = Math.max(0, Math.min(w, parseFloat(getValue(this.style, 'dx', this.dx))));
		let dy = Math.max(0, Math.min(h, parseFloat(getValue(this.style, 'dy', this.dy))));
		var w2 = Math.abs(w - dx) / 2;
		
		constr.push(new ConnectionConstraint(new Point(0, 0), false));
		constr.push(new ConnectionConstraint(new Point(0.5, 0), false));
		constr.push(new ConnectionConstraint(new Point(1, 0), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w, dy * 0.5));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w, dy));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w * 0.75 + dx * 0.25, dy));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, (w + dx) * 0.5, dy));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, (w + dx) * 0.5, (h + dy) * 0.5));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, (w + dx) * 0.5, h));
		constr.push(new ConnectionConstraint(new Point(0.5, 1), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, (w - dx) * 0.5, h));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, (w - dx) * 0.5, (h + dy) * 0.5));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, (w - dx) * 0.5, dy));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w * 0.25 - dx * 0.25, dy));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, dy));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, dy * 0.5));
		
		return (constr);
	};

	CornerShape.prototype.getConstraints = function(style, w, h)
	{
		let constr = [];
		let dx = Math.max(0, Math.min(w, parseFloat(getValue(this.style, 'dx', this.dx))));
		let dy = Math.max(0, Math.min(h, parseFloat(getValue(this.style, 'dy', this.dy))));
		
		constr.push(new ConnectionConstraint(new Point(0, 0), false));
		constr.push(new ConnectionConstraint(new Point(0.5, 0), false));
		constr.push(new ConnectionConstraint(new Point(1, 0), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w, dy * 0.5));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w, dy));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, (w + dx) * 0.5, dy));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, dx, dy));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, dx, (h + dy) * 0.5));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, dx, h));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, dx * 0.5, h));
		constr.push(new ConnectionConstraint(new Point(0, 0.5), false));
		constr.push(new ConnectionConstraint(new Point(0, 1), false));
		
		return (constr);
	};

	CrossbarShape.prototype.constraints = [new ConnectionConstraint(new Point(0, 0), false),
        new ConnectionConstraint(new Point(0, 0.5), false),
        new ConnectionConstraint(new Point(0, 1), false),
        new ConnectionConstraint(new Point(0.25, 0.5), false),
        new ConnectionConstraint(new Point(0.5, 0.5), false),
        new ConnectionConstraint(new Point(0.75, 0.5), false),
        new ConnectionConstraint(new Point(1, 0), false),
        new ConnectionConstraint(new Point(1, 0.5), false),
        new ConnectionConstraint(new Point(1, 1), false)];

	SingleArrowShape.prototype.getConstraints = function(style, w, h)
	{
		let constr = [];
		let aw = h * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'arrowWidth', this.arrowWidth))));
		let as = w * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'arrowSize', this.arrowSize))));
		let at = (h - aw) / 2;
		let ab = at + aw;
		
		constr.push(new ConnectionConstraint(new Point(0, 0.5), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, at));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, (w - as) * 0.5, at));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w - as, 0));
		constr.push(new ConnectionConstraint(new Point(1, 0.5), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w - as, h));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, (w - as) * 0.5, h - at));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, h - at));
		
		return (constr);
	};
	
	DoubleArrowShape.prototype.getConstraints = function(style, w, h)
	{
		let constr = [];
		let aw = h * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'arrowWidth', SingleArrowShape.prototype.arrowWidth))));
		let as = w * Math.max(0, Math.min(1, parseFloat(getValue(this.style, 'arrowSize', SingleArrowShape.prototype.arrowSize))));
		let at = (h - aw) / 2;
		let ab = at + aw;
		
		constr.push(new ConnectionConstraint(new Point(0, 0.5), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, as, 0));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w * 0.5, at));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w - as, 0));
		constr.push(new ConnectionConstraint(new Point(1, 0.5), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w - as, h));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w * 0.5, h - at));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, as, h));
		
		return (constr);
	};
	
	CrossShape.prototype.getConstraints = function(style, w, h)
	{
		let constr = [];
		let m = Math.min(h, w);
		let size = Math.max(0, Math.min(m, m * parseFloat(getValue(this.style, 'size', this.size))));
		let t = (h - size) / 2;
		let b = t + size;
		let l = (w - size) / 2;
		let r = l + size;
		
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, l, t * 0.5));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, l, 0));
		constr.push(new ConnectionConstraint(new Point(0.5, 0), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, r, 0));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, r, t * 0.5));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, r, t));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, l, h - t * 0.5));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, l, h));
		constr.push(new ConnectionConstraint(new Point(0.5, 1), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, r, h));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, r, h - t * 0.5));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, r, b));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, (w + r) * 0.5, t));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w, t));
		constr.push(new ConnectionConstraint(new Point(1, 0.5), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, w, b));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, (w + r) * 0.5, b));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, l, b));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, l * 0.5, t));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, t));
		constr.push(new ConnectionConstraint(new Point(0, 0.5), false));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, 0, b));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, l * 0.5, b));
		constr.push(new ConnectionConstraint(new Point(0, 0), false, null, l, t));

		return (constr);
	};
	
	UmlLifeline.prototype.constraints = null;
	OrShape.prototype.constraints = [new ConnectionConstraint(new Point(0, 0.25), false),
	  	                             new ConnectionConstraint(new Point(0, 0.5), false),
	  	                             new ConnectionConstraint(new Point(0, 0.75), false),
	  	                             new ConnectionConstraint(new Point(1, 0.5), false),
	  	                             new ConnectionConstraint(new Point(0.7, 0.1), false),
	  	                             new ConnectionConstraint(new Point(0.7, 0.9), false)];
	XorShape.prototype.constraints = [new ConnectionConstraint(new Point(0.175, 0.25), false),
	  	                             new ConnectionConstraint(new Point(0.25, 0.5), false),
	  	                             new ConnectionConstraint(new Point(0.175, 0.75), false),
	  	                             new ConnectionConstraint(new Point(1, 0.5), false),
	  	                             new ConnectionConstraint(new Point(0.7, 0.1), false),
	  	                             new ConnectionConstraint(new Point(0.7, 0.9), false)];
	RequiredInterfaceShape.prototype.constraints = [new ConnectionConstraint(new Point(0, 0.5), false),
          new ConnectionConstraint(new Point(1, 0.5), false)];
	ProvidedRequiredInterfaceShape.prototype.constraints = [new ConnectionConstraint(new Point(0, 0.5), false),
        new ConnectionConstraint(new Point(1, 0.5), false)];
})();
