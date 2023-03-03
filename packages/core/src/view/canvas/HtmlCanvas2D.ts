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
import AbstractCanvas2D from "./AbstractCanvas2D";

class Canvas2D extends AbstractCanvas2D {
    constructor(root: SVGElement, styleEnabled: boolean) {
        super()

        const canvas = document.createElement("canvas"); // 创建Canvas元素
        root.appendChild(canvas); // 将Canvas元素添加到指定的DOM元素上
        canvas.width = 500; // 设置Canvas宽度
        canvas.height = 500; // 设置Canvas高度
        canvas.style.border = "1px solid black"; // 设置Canvas边框样式
        this.ctx = canvas.getContext("2d"); // 获取CanvasRenderingContext2D对象的引用
        if (this.ctx) {
            this.ctx.rect(5, 5, 10, 10); // 绘制一个矩形
            this.ctx.stroke(); // 描边矩形
        }
    }

    private ctx: CanvasRenderingContext2D;

    end(): void {
        this.ctx.rect(5, 5, 10, 10); // 绘制一个矩形
        this.ctx.stroke(); // 描边矩形   
    }
    stroke(): void {
        this.ctx.rect(5, 5, 10, 10); // 绘制一个矩形
        this.ctx.stroke(); // 描边矩形
    }
    fill(): void {
        this.ctx.rect(5, 5, 10, 10); // 绘制一个矩形
        this.ctx.stroke(); // 描边矩形
    }
    fillAndStroke(): void {
        this.ctx.rect(5, 5, 10, 10); // 绘制一个矩形
        this.ctx.stroke(); // 描边矩形
    }
    rect(x: number, y: number, w: number, h: number): void {
        this.ctx.rect(5, 5, 10, 10); // 绘制一个矩形
        this.ctx.stroke(); // 描边矩形
    }
    roundrect(x: number, y: number, w: number, h: number, r1: number, r2: number): void {
        this.ctx.rect(5, 5, 10, 10); // 绘制一个矩形
        this.ctx.stroke(); // 描边矩形
    }
    ellipse(x: number, y: number, w: number, h: number): void {
        this.ctx.rect(5, 5, 10, 10); // 绘制一个矩形
        this.ctx.stroke(); // 描边矩形
    }
    image(x: number, y: number, w: number, h: number, src: string, aspect: boolean, flipH: boolean, flipV: boolean): void {
        this.ctx.rect(5, 5, 10, 10); // 绘制一个矩形
        this.ctx.stroke(); // 描边矩形
    }
    text(x: number, y: number, w: number, h: number, str: string, align: AlignValue, valign: VAlignValue, wrap: boolean, format: string, overflow: OverflowValue, clip: boolean, rotation: number, dir: TextDirectionValue): void {
        this.ctx.rect(5, 5, 10, 10); // 绘制一个矩形
        this.ctx.stroke(); // 描边矩形
    }
    updateText(x: number, y: number, w: number, h: number, align: AlignValue, valign: VAlignValue, wrap: boolean, overflow: OverflowValue, clip: boolean, rotation: number, node: SVGElement): void {
        this.ctx.rect(5, 5, 10, 10); // 绘制一个矩形
        this.ctx.stroke(); // 描边矩形
    }

}

export default Canvas2D;
