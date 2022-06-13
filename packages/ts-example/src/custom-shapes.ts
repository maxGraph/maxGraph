import {AbstractCanvas2D, CellRenderer, type ColorValue, EllipseShape, Rectangle, RectangleShape} from '@maxgraph/core';

export function registerCustomShapes(): void {
    console.info('Registering custom shapes...');
    // @ts-ignore TODO fix CellRenderer. Calls to this function are also marked as 'ts-ignore' in CellRenderer
    CellRenderer.registerShape('customRectangle', CustomRectangleShape);
    // @ts-ignore
    CellRenderer.registerShape('customEllipse', CustomEllipseShape);
    console.info('Custom shapes registered');
}

class CustomRectangleShape extends RectangleShape {

    constructor(bounds: Rectangle, fill: ColorValue, stroke: ColorValue) {
        super(bounds, fill, stroke, 3);
        // TODO if set, the shape is not painted
        // this.isRounded = true; // force rounded shape
    }

    paintBackground(c: AbstractCanvas2D, x: number, y: number, w: number, h: number): void {
        c.setFillColor('Chartreuse');
        super.paintBackground(c, x, y, w, h);
    }

    paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
        c.setStrokeColor('Black');
        super.paintVertexShape(c, x, y, w, h);
    }

}

class CustomEllipseShape extends EllipseShape {
    constructor(bounds: Rectangle, fill: string, stroke: string) {
        super(bounds, fill, stroke, 5);
    }

    paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
        c.setFillColor('Yellow');
        c.setStrokeColor('Red');
        super.paintVertexShape(c, x, y, w, h);
    }
}
