/*
Copyright 2026-present The maxGraph project Contributors

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

import { describe, expect, test } from '@jest/globals';
import { BaseGraph, ImageBundle, ImageBundlePlugin } from '../../../src';

const createGraphWithPlugin = (): {
  graph: BaseGraph;
  plugin: ImageBundlePlugin;
} => {
  const graph = new BaseGraph({ plugins: [ImageBundlePlugin] });
  const plugin = graph.getPlugin<ImageBundlePlugin>('image-bundle')!;
  return { graph, plugin };
};

const bundleWith = (entries: Array<[string, string]>): ImageBundle => {
  const bundle = new ImageBundle();
  for (const [key, value] of entries) {
    bundle.putImage(key, value, `${key}-fallback`);
  }
  return bundle;
};

describe('ImageBundlePlugin', () => {
  test('pluginId is "image-bundle"', () => {
    expect(ImageBundlePlugin.pluginId).toBe('image-bundle');
  });

  test('each plugin instance owns a fresh imageBundles array (per-graph isolation)', () => {
    const { plugin: plugin1 } = createGraphWithPlugin();
    const { plugin: plugin2 } = createGraphWithPlugin();

    plugin1.addImageBundle(bundleWith([['key', 'value']]));

    expect(plugin2.imageBundles).toStrictEqual([]);
    expect(plugin1.imageBundles).not.toBe(plugin2.imageBundles);
  });

  describe('addImageBundle', () => {
    test('appends the bundle to imageBundles', () => {
      const { plugin } = createGraphWithPlugin();
      const bundle = bundleWith([['key', 'value']]);

      plugin.addImageBundle(bundle);

      expect(plugin.imageBundles).toHaveLength(1);
      expect(plugin.imageBundles[0]).toBe(bundle);
    });

    test('preserves insertion order across multiple calls', () => {
      const { plugin } = createGraphWithPlugin();
      const first = bundleWith([]);
      const second = bundleWith([]);

      plugin.addImageBundle(first);
      plugin.addImageBundle(second);

      expect(plugin.imageBundles).toEqual([first, second]);
    });
  });

  describe('removeImageBundle', () => {
    test('removes the matching bundle by reference and leaves others intact', () => {
      const { plugin } = createGraphWithPlugin();
      const first = bundleWith([]);
      const target = bundleWith([]);
      const last = bundleWith([]);
      plugin.addImageBundle(first);
      plugin.addImageBundle(target);
      plugin.addImageBundle(last);

      plugin.removeImageBundle(target);

      expect(plugin.imageBundles).toEqual([first, last]);
    });

    test('removes all occurrences of the same bundle (matching the pre-refactor behavior)', () => {
      const { plugin } = createGraphWithPlugin();
      const duplicated = bundleWith([]);
      plugin.addImageBundle(duplicated);
      plugin.addImageBundle(duplicated);
      plugin.addImageBundle(bundleWith([]));

      plugin.removeImageBundle(duplicated);

      expect(plugin.imageBundles).toHaveLength(1);
      expect(plugin.imageBundles).not.toContain(duplicated);
    });

    test('is a no-op when the bundle is not registered', () => {
      const { plugin } = createGraphWithPlugin();
      const registered = bundleWith([]);
      plugin.addImageBundle(registered);

      plugin.removeImageBundle(bundleWith([]));

      expect(plugin.imageBundles).toEqual([registered]);
    });
  });

  describe('getImageFromBundles', () => {
    test('returns the value from the first matching bundle', () => {
      const { plugin } = createGraphWithPlugin();
      plugin.addImageBundle(bundleWith([['hit', 'http://first.example/a.png']]));
      plugin.addImageBundle(bundleWith([['hit', 'http://second.example/a.png']]));

      expect(plugin.getImageFromBundles('hit')).toBe('http://first.example/a.png');
    });

    test('returns null when no bundle contains the key', () => {
      const { plugin } = createGraphWithPlugin();
      plugin.addImageBundle(bundleWith([['other', 'http://example.com/x.png']]));

      expect(plugin.getImageFromBundles('missing')).toBeNull();
    });

    test('returns null when no bundles are registered', () => {
      const { plugin } = createGraphWithPlugin();

      expect(plugin.getImageFromBundles('any')).toBeNull();
    });

    test('returns null when the key is an empty string', () => {
      const { plugin } = createGraphWithPlugin();
      plugin.addImageBundle(bundleWith([['hit', 'http://example.com/x.png']]));

      expect(plugin.getImageFromBundles('')).toBeNull();
    });
  });

  test('onDestroy clears registered bundles', () => {
    const { plugin } = createGraphWithPlugin();
    plugin.addImageBundle(bundleWith([['key', 'value']]));
    plugin.addImageBundle(bundleWith([]));

    plugin.onDestroy();

    expect(plugin.imageBundles).toStrictEqual([]);
  });
});
