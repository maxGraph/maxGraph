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
    const viewMock = jest.spyOn(graph.view, 'scaleAndTranslate');

    const scale = graph.getPlugin<FitPlugin>('fit').fitCenter();
    expect(scale).toBe(1);
    expect(viewMock).toHaveBeenCalledWith(1, 0, 0);
    expect(viewMock).toHaveBeenCalledTimes(1);
  });

  test('decreased scale', () => {
    const container = createContainer({
      clientWidth: 20,
      clientHeight: 20,
    });

    const graph = new BaseGraph({ container, plugins: [FitPlugin] });
    graph.view.setGraphBounds(new Rectangle(30, 20, 1000, 1000));
    const viewMock = jest.spyOn(graph.view, 'scaleAndTranslate');

    const scale = graph.getPlugin<FitPlugin>('fit').fitCenter();
    expect(scale).toBe(0.02);
    expect(viewMock).toHaveBeenCalledWith(0.02, 95, 105);
    expect(viewMock).toHaveBeenCalledTimes(1);
  });

  test('increased scale', () => {
    const container = createContainer({
      clientWidth: 470,
      clientHeight: 532,
    });

    const graph = new BaseGraph({ container, plugins: [FitPlugin] });
    graph.view.setGraphBounds(new Rectangle(-172, 67, 100, 200));
    const viewMock = jest.spyOn(graph.view, 'scaleAndTranslate');

    const scale = graph.getPlugin<FitPlugin>('fit').fitCenter({ margin: 20 });
    expect(scale).toBe(2.46);
    expect(viewMock).toHaveBeenCalledWith(2.46, 217, -59);
    expect(viewMock).toHaveBeenCalledTimes(1);
  });

  test('increased scale, limited to maxFitScale', () => {
    const container = createContainer({
      clientWidth: 2000,
      clientHeight: 3000,
    });

    const graph = new BaseGraph({ container, plugins: [FitPlugin] });
    graph.view.setGraphBounds(new Rectangle(70, -30, 100, 100));
    const viewMock = jest.spyOn(graph.view, 'scaleAndTranslate');

    const plugin = graph.getPlugin<FitPlugin>('fit');
    plugin.maxFitScale = 7;
    const scale = plugin.fitCenter();
    expect(scale).toBe(7);
    expect(viewMock).toHaveBeenCalledWith(7, 22, 194);
    expect(viewMock).toHaveBeenCalledTimes(1);
  });
});

describe('fit', () => {
  test('container and graph have dimensions set to zero', () => {
    const graph = new BaseGraph({ plugins: [FitPlugin] });
    const viewMock = jest.spyOn(graph.view, 'scaleAndTranslate');

    const scale = graph.getPlugin<FitPlugin>('fit').fit();
    expect(scale).toBe(1);
    expect(viewMock).not.toHaveBeenCalled();
  });

  test('no ignored dimensions, decreased scale', () => {
    const container = createContainer({
      offsetWidth: 20,
      offsetHeight: 20,
    });

    const graph = new BaseGraph({ container, plugins: [FitPlugin] });
    graph.view.setGraphBounds(new Rectangle(30, 20, 100, 100));
    const viewMock = jest.spyOn(graph.view, 'scaleAndTranslate');

    const scale = graph.getPlugin<FitPlugin>('fit').fit();
    expect(scale).toBe(0.18);
    expect(viewMock).toHaveBeenCalledWith(0.18, -30, -20);
    expect(viewMock).toHaveBeenCalledTimes(1);
  });

  test('no ignored dimensions, decreased scale, limited to minFitScale', () => {
    const container = createContainer({
      offsetWidth: 0,
      offsetHeight: 0,
    });

    const graph = new BaseGraph({ container, plugins: [FitPlugin] });
    graph.view.setGraphBounds(new Rectangle(30, 20, 100, 100));
    const viewMock = jest.spyOn(graph.view, 'scaleAndTranslate');

    const plugin = graph.getPlugin<FitPlugin>('fit');
    plugin.minFitScale = 0.5;
    const scale = plugin.fit();
    expect(scale).toBe(0.5);
    expect(viewMock).toHaveBeenCalledWith(0.5, -30, -20);
    expect(viewMock).toHaveBeenCalledTimes(1);
  });

  test('no ignored dimensions, increased scale', () => {
    const container = createContainer({
      offsetWidth: 480,
      offsetHeight: 820,
    });

    const graph = new BaseGraph({ container, plugins: [FitPlugin] });
    graph.view.setGraphBounds(new Rectangle(70, -60, 100, 100));
    const viewMock = jest.spyOn(graph.view, 'scaleAndTranslate');

    const scale = graph.getPlugin<FitPlugin>('fit').fit();
    expect(scale).toBe(4.78);
    expect(viewMock).toHaveBeenCalledWith(4.78, -70, 60);
    expect(viewMock).toHaveBeenCalledTimes(1);
  });

  test('no ignored dimensions, increased scale, limited to maxFitScale', () => {
    const container = createContainer({
      offsetWidth: 480,
      offsetHeight: 820,
    });

    const graph = new BaseGraph({ container, plugins: [FitPlugin] });
    graph.view.setGraphBounds(new Rectangle(70, -60, 100, 100));
    const viewMock = jest.spyOn(graph.view, 'scaleAndTranslate');

    const plugin = graph.getPlugin<FitPlugin>('fit');
    plugin.maxFitScale = 3;
    const scale = plugin.fit();
    expect(scale).toBe(3);
    expect(viewMock).toHaveBeenCalledWith(3, -70, 60);
    expect(viewMock).toHaveBeenCalledTimes(1);
  });
});
