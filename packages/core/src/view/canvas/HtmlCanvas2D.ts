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

import { AlignValue, VAlignValue, OverflowValue, TextDirectionValue } from "../../types";
import { NONE, DIRECTION, DEFAULT_FONTSIZE, DEFAULT_FONTFAMILY, SHADOWCOLOR, SHADOW_OPACITY, SHADOW_OFFSET_X, SHADOW_OFFSET_Y } from "../../util/Constants";
import AbstractCanvas2D from "./AbstractCanvas2D";

class HtmlCanvas2D extends AbstractCanvas2D {
    constructor(root: HTMLElement) {
        super()

        const canvas = document.createElement("canvas");
        root.appendChild(canvas);
        canvas.width = 800;
        canvas.height = 600;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        this.ctx = canvas.getContext("2d");
    }

    private ctx: CanvasRenderingContext2D | null;

    end(): void {
        return;
    }

    stroke(): void {
        if (!this.ctx) return;
        this.ctx.stroke();
    }
    fill(): void {
        if (!this.ctx) return;
        this.ctx.fill();
    }
    fillAndStroke(): void {
        if (!this.ctx) return;
        // this.ctx.fill();
        this.ctx.stroke();
    }
    rect(x: number, y: number, w: number, h: number): void {
        if (!this.ctx) return;
        this.ctx.lineWidth = this.state.strokeWidth;
        this.ctx.fillStyle = this.state.fillColor;
        this.ctx.rect(x, y, w, h);
    }
    roundrect(x: number, y: number, w: number, h: number, r1: number, r2: number): void {
        if (!this.ctx) return;
        this.ctx.lineWidth = this.state.strokeWidth;
        this.ctx.fillStyle = this.state.fillColor;
        this.ctx.roundRect(x, y, w, h, r1);
    }
    ellipse(x: number, y: number, w: number, h: number): void {
        if (!this.ctx) return;
        this.ctx.lineWidth = this.state.strokeWidth;
        this.ctx.fillStyle = this.state.fillColor;
        this.ctx.ellipse(x, y, w, h, 0, 0, 0); // paras?
    }
    image(x: number, y: number, w: number, h: number, src: string, aspect: boolean, flipH: boolean, flipV: boolean): void {
        if (!this.ctx) return;
        const image = new Image();
        image.src = src;
        this.ctx.drawImage(image, x, y, w, h);
    }
    text(x: number, y: number, w: number, h: number, str: string, align: AlignValue, valign: VAlignValue, wrap: boolean, format: string, overflow: OverflowValue, clip: boolean, rotation: number, dir: TextDirectionValue): void {
        if (!this.ctx) return;
        this.ctx.lineWidth = this.state.strokeWidth;
        this.ctx.fillStyle = this.state.fillColor;
        this.ctx.strokeText(str, x, y, w); // paras?
    }
    updateText(x: number, y: number, w: number, h: number, align: AlignValue, valign: VAlignValue, wrap: boolean, overflow: OverflowValue, clip: boolean, rotation: number, node: SVGElement): void {
        if (!this.ctx) return;
    }
    /**
      * Creates the state of the this canvas.
      */
    createState() {
        const state = super.createState();
        // console.log(state);

        // state.fillColor = "rgba(255,255,255,0.5)"
        return state;
    }

    /**
     * Starts a new path.
     */
    begin() {
        if (!this.ctx) return;
        this.ctx.beginPath();
    }

    /**
     *  Moves the current path the given coordinates.
     */
    moveTo(x: number, y: number) {
        if (!this.ctx) return;
        this.ctx.moveTo(x, y);
    }

    /**
     * Draws a line to the given coordinates. Uses moveTo with the op argument.
     */
    lineTo(x: number, y: number) {
        if (!this.ctx) return;
        this.ctx.lineTo(x, y);
    }
}

export default HtmlCanvas2D;
