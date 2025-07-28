/*
Copyright 2025-present The maxGraph project Contributors

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

import { expect, test } from '@jest/globals';
import { BaseGraph, FitPlugin, Rectangle } from '../../../src';

const createContainer = (dimensions: {
  offsetWidth?: number;
  offsetHeight?: number;
  clientWidth?: number;
  clientHeight?: number;
}) => {
  const container = document.createElement('div');
  dimensions.clientWidth &&
    Object.defineProperty(container, 'clientWidth', {
      value: dimensions.clientWidth,
      configurable: true,
    });
  dimensions.clientHeight &&
    Object.defineProperty(container, 'clientHeight', {
      value: dimensions.clientHeight,
      configurable: true,
    });
  dimensions.offsetWidth &&
    Object.defineProperty(container, 'offsetWidth', {
      value: dimensions.offsetWidth,
      configurable: true,
    });
  dimensions.offsetHeight &&
    Object.defineProperty(container, 'offsetHeight', {
      value: dimensions.offsetHeight,
      configurable: true,
    });

  return container;
};

describe('fitCenter', () => {
  test('graph has dimensions set to zero', () => {
    const graph = new BaseGraph({ plugins: [FitPlugin] });
    const originalScale = 0.65;
    graph.view.scale = originalScale; // Set an initial scale to test it is returned and not changed
    const scaleAndTranslateSpy = jest.spyOn(graph.view, 'scaleAndTranslate');

    const scale = graph.getPlugin<FitPlugin>('fit')!.fitCenter();
    expect(scale).toBe(originalScale);
    expect(scaleAndTranslateSpy).toHaveBeenCalledWith(originalScale, 0, 0);
    expect(scaleAndTranslateSpy).toHaveBeenCalledTimes(1);
  });

  test('decreased scale', () => {
    const container = createContainer({
      clientWidth: 20,
      clientHeight: 20,
    });

    const graph = new BaseGraph({ container, plugins: [FitPlugin] });
    graph.view.setGraphBounds(new Rectangle(30, 20, 1000, 1000));
    const scaleAndTranslateSpy = jest.spyOn(graph.view, 'scaleAndTranslate');

    const scale = graph.getPlugin<FitPlugin>('fit')!.fitCenter();
    const expectedNewScale = 0.02;
    expect(scale).toBe(expectedNewScale);
    expect(scaleAndTranslateSpy).toHaveBeenCalledWith(expectedNewScale, 95, 105);
    expect(scaleAndTranslateSpy).toHaveBeenCalledTimes(1);
  });

  test('increased scale', () => {
    const container = createContainer({
      clientWidth: 470,
      clientHeight: 532,
    });

    const graph = new BaseGraph({ container, plugins: [FitPlugin] });
    graph.view.setGraphBounds(new Rectangle(-172, 67, 100, 200));
    const scaleAndTranslateSpy = jest.spyOn(graph.view, 'scaleAndTranslate');

    const scale = graph.getPlugin<FitPlugin>('fit')!.fitCenter({ margin: 20 });
    expect(scale).toBe(2.46);
    expect(scaleAndTranslateSpy).toHaveBeenCalledWith(2.46, 217, -59);
    expect(scaleAndTranslateSpy).toHaveBeenCalledTimes(1);
  });

  test('increased scale, limited to maxFitScale', () => {
    const container = createContainer({
      clientWidth: 2000,
      clientHeight: 3000,
    });

    const graph = new BaseGraph({ container, plugins: [FitPlugin] });
    graph.view.setGraphBounds(new Rectangle(70, -30, 100, 100));
    const scaleAndTranslateSpy = jest.spyOn(graph.view, 'scaleAndTranslate');

    const plugin = graph.getPlugin<FitPlugin>('fit')!;
    plugin.maxFitScale = 7;
    const scale = plugin.fitCenter();
    expect(scale).toBe(7);
    expect(scaleAndTranslateSpy).toHaveBeenCalledWith(7, 22, 194);
    expect(scaleAndTranslateSpy).toHaveBeenCalledTimes(1);
  });
});

describe('fit', () => {
  describe('no ignored dimensions', () => {
    test('container and graph have dimensions set to zero', () => {
      const graph = new BaseGraph({ plugins: [FitPlugin] });
      const scaleAndTranslateSpy = jest.spyOn(graph.view, 'scaleAndTranslate');

      const scale = graph.getPlugin<FitPlugin>('fit')!.fit();
      expect(scale).toBe(1);
      expect(scaleAndTranslateSpy).not.toHaveBeenCalled();
    });

    test('decreased scale', () => {
      const container = createContainer({
        offsetWidth: 20,
        offsetHeight: 20,
      });

      const graph = new BaseGraph({ container, plugins: [FitPlugin] });
      graph.view.setGraphBounds(new Rectangle(30, 20, 100, 100));
      const scaleAndTranslateSpy = jest.spyOn(graph.view, 'scaleAndTranslate');

      const scale = graph.getPlugin<FitPlugin>('fit')!.fit();
      const expectedNewScale = 0.18;
      expect(scale).toBe(expectedNewScale);
      expect(scaleAndTranslateSpy).toHaveBeenCalledWith(expectedNewScale, -30, -20);
      expect(scaleAndTranslateSpy).toHaveBeenCalledTimes(1);
    });

    test('decreased scale, limited to minFitScale', () => {
      const container = createContainer({
        offsetWidth: 0,
        offsetHeight: 0,
      });

      const graph = new BaseGraph({ container, plugins: [FitPlugin] });
      graph.view.setGraphBounds(new Rectangle(30, 20, 100, 100));
      const scaleAndTranslateSpy = jest.spyOn(graph.view, 'scaleAndTranslate');

      const plugin = graph.getPlugin<FitPlugin>('fit')!;
      const expectedNewScale = 0.5;
      plugin.minFitScale = expectedNewScale;
      const scale = plugin.fit();
      expect(scale).toBe(expectedNewScale);
      expect(scaleAndTranslateSpy).toHaveBeenCalledWith(expectedNewScale, -30, -20);
      expect(scaleAndTranslateSpy).toHaveBeenCalledTimes(1);
    });

    test('increased scale', () => {
      const container = createContainer({
        offsetWidth: 480,
        offsetHeight: 820,
      });

      const graph = new BaseGraph({ container, plugins: [FitPlugin] });
      graph.view.setGraphBounds(new Rectangle(70, -60, 100, 100));
      const scaleAndTranslateSpy = jest.spyOn(graph.view, 'scaleAndTranslate');

      const scale = graph.getPlugin<FitPlugin>('fit')!.fit();
      const expectedNewScale = 4.78;
      expect(scale).toBe(expectedNewScale);
      expect(scaleAndTranslateSpy).toHaveBeenCalledWith(expectedNewScale, -70, 60);
      expect(scaleAndTranslateSpy).toHaveBeenCalledTimes(1);
    });

    test('increased scale, limited to maxFitScale', () => {
      const container = createContainer({
        offsetWidth: 480,
        offsetHeight: 820,
      });

      const graph = new BaseGraph({ container, plugins: [FitPlugin] });
      graph.view.setGraphBounds(new Rectangle(70, -60, 100, 100));
      const scaleAndTranslateSpy = jest.spyOn(graph.view, 'scaleAndTranslate');

      const plugin = graph.getPlugin<FitPlugin>('fit')!;
      plugin.maxFitScale = 3;
      const scale = plugin.fit();
      expect(scale).toBe(3);
      expect(scaleAndTranslateSpy).toHaveBeenCalledWith(3, -70, 60);
      expect(scaleAndTranslateSpy).toHaveBeenCalledTimes(1);
    });

    test('border', () => {
      const container = createContainer({
        offsetWidth: 200,
        offsetHeight: 200,
      });

      const graph = new BaseGraph({ container, plugins: [FitPlugin] });
      graph.view.setGraphBounds(new Rectangle(0, 0, 100, 100));
      const scaleAndTranslateSpy = jest.spyOn(graph.view, 'scaleAndTranslate');

      const scale = graph.getPlugin<FitPlugin>('fit')!.fit({ border: 60 });
      expect(scale).toBe(0.78);
      expect(scaleAndTranslateSpy).toHaveBeenCalledWith(0.78, 76, 76);
      expect(scaleAndTranslateSpy).toHaveBeenCalledTimes(1);
    });

    test('keep origin', () => {
      const container = createContainer({
        offsetWidth: 200,
        offsetHeight: 200,
      });

      const graph = new BaseGraph({ container, plugins: [FitPlugin] });
      graph.view.setGraphBounds(new Rectangle(0, 0, 100, 100));
      const scaleAndTranslateSpy = jest.spyOn(graph.view, 'scaleAndTranslate');
      const setScaleSpy = jest.spyOn(graph.view, 'setScale');

      const scale = graph.getPlugin<FitPlugin>('fit')!.fit({ keepOrigin: true });
      const expectedNewScale = 1.98;
      expect(scale).toBe(expectedNewScale);
      expect(setScaleSpy).toHaveBeenCalledWith(expectedNewScale);
      expect(setScaleSpy).toHaveBeenCalledTimes(1);
      expect(scaleAndTranslateSpy).not.toHaveBeenCalled();
    });

    test('margin', () => {
      const container = createContainer({
        offsetWidth: 200,
        offsetHeight: 200,
      });

      const graph = new BaseGraph({ container, plugins: [FitPlugin] });
      graph.view.setGraphBounds(new Rectangle(0, 0, 100, 100));
      const scaleAndTranslateSpy = jest.spyOn(graph.view, 'scaleAndTranslate');

      const scale = graph.getPlugin<FitPlugin>('fit')!.fit({ margin: 30 });
      expect(scale).toBe(1.68);
      expect(scaleAndTranslateSpy).toHaveBeenCalledWith(1.68, 15, 15);
      expect(scaleAndTranslateSpy).toHaveBeenCalledTimes(1);
    });
  });

  test('ignore width', () => {
    const container = createContainer({
      offsetHeight: 860,
    });

    const graph = new BaseGraph({ container, plugins: [FitPlugin] });
    graph.view.setGraphBounds(new Rectangle(70, -60, 1000, 100));
    const scaleAndTranslateSpy = jest.spyOn(graph.view, 'scaleAndTranslate');

    const scale = graph.getPlugin<FitPlugin>('fit')!.fit({ ignoreWidth: true });
    const expectedNewScale = 8;
    expect(scale).toBe(expectedNewScale);
    expect(scaleAndTranslateSpy).toHaveBeenCalledWith(expectedNewScale, -70, 60);
    expect(scaleAndTranslateSpy).toHaveBeenCalledTimes(1);
  });

  test('ignore height', () => {
    const container = createContainer({
      offsetWidth: 860,
    });

    const graph = new BaseGraph({ container, plugins: [FitPlugin] });
    graph.view.setGraphBounds(new Rectangle(70, -60, 150, 300));
    const scaleAndTranslateSpy = jest.spyOn(graph.view, 'scaleAndTranslate');

    const scale = graph.getPlugin<FitPlugin>('fit')!.fit({ ignoreHeight: true });
    const expectedNewScale = 5.72;
    expect(scale).toBe(expectedNewScale);
    expect(scaleAndTranslateSpy).toHaveBeenCalledWith(expectedNewScale, -70, 60);
    expect(scaleAndTranslateSpy).toHaveBeenCalledTimes(1);
  });

  describe('special cases', () => {
    test('no container', () => {
      const graph = new BaseGraph({ plugins: [FitPlugin] });
      graph.container = undefined!; // hack because currently, when passing no container to the constructor, a new div is created and used as the container. See https://github.com/maxGraph/maxGraph/issues/367
      graph.view.setGraphBounds(new Rectangle(70, -60, 150, 300));
      const originalScale = 0.7;
      graph.view.scale = originalScale; // Set an initial scale to test it is returned and not changed
      const scaleAndTranslateSpy = jest.spyOn(graph.view, 'scaleAndTranslate');
      const setScaleSpy = jest.spyOn(graph.view, 'setScale');

      const scale = graph.getPlugin<FitPlugin>('fit')!.fit();
      expect(scale).toBe(originalScale);
      expect(scaleAndTranslateSpy).not.toHaveBeenCalled();
      expect(setScaleSpy).not.toHaveBeenCalled();
    });

    test.each(['width', 'height'])(
      'graph bounds without positive %s',
      (dimension: string) => {
        const container = createContainer({});
        const graph = new BaseGraph({ container, plugins: [FitPlugin] });
        graph.view.setGraphBounds(
          new Rectangle(
            70,
            -60,
            dimension == 'width' ? -10 : 100,
            dimension == 'height' ? -40 : 300
          )
        );
        const originalScale = 1.3;
        graph.view.scale = originalScale; // Set an initial scale to test it is returned and not changed
        const scaleAndTranslateSpy = jest.spyOn(graph.view, 'scaleAndTranslate');
        const setScaleSpy = jest.spyOn(graph.view, 'setScale');

        const scale = graph.getPlugin<FitPlugin>('fit')!.fit();
        expect(scale).toBe(originalScale);
        expect(scaleAndTranslateSpy).not.toHaveBeenCalled();
        expect(setScaleSpy).not.toHaveBeenCalled();
      }
    );
  });
});
