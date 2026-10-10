---
sidebar_position: 10
description: Align the cells being moved to the other cells of the graph with alignment guides.
---

# Alignment Guide

:::info
The examples in this page use `TypeScript`; adapt them if you write `JavaScript`.
:::


## What is an Alignment Guide?

While cells are moved with the mouse, an alignment guide snaps them to the other vertices of the graph and draws a dashed line showing the alignment.

The `Guide` class implements it. It compares the bounds of the cells being moved with the bounds of a set of reference cells, and when the distance falls below a tolerance, it adjusts the move so that the edges or the centers line up:

- the **x coordinates** (left side, center, right side) are aligned and drawn as a vertical line;
- the **y coordinates** (top side, middle, bottom side) are aligned and drawn as a horizontal line.

Guides are used by two components:

- the `SelectionHandler` plugin, when moving cells that are already in the graph;
- `DragSource`, when dropping an element from outside the graph, see [Drag and Drop from Outside the Graph](#drag-and-drop-from-outside-the-graph).


## Enabling the Guides

Guides are **disabled by default**. They are enabled with the `guidesEnabled` property of the `SelectionHandler` plugin.

### With `Graph`

`SelectionHandler` is part of the default plugins, so it only has to be enabled:

```typescript
const graph = new Graph(container);

const selectionHandler = graph.getPlugin<SelectionHandler>('SelectionHandler');
if (selectionHandler) {
  selectionHandler.guidesEnabled = true;
}
```

### With `BaseGraph`

`BaseGraph` registers no plugin by default, so `SelectionHandler` has to be registered first, then enabled as above:

```typescript
const graph = new BaseGraph({
  container,
  plugins: [SelectionCellsHandler, SelectionHandler],
});

const selectionHandler = graph.getPlugin<SelectionHandler>('SelectionHandler');
if (selectionHandler) {
  selectionHandler.guidesEnabled = true;
}
```

See [Plugins](./plugins.md) for more details about the registration of plugins.


## How the Guides Behave

### Reference cells

`SelectionHandler.getGuideStates` returns the candidate reference cells: every vertex under the default parent that has a state in the view and a non-relative geometry.

When a move starts, `SelectionHandler` narrows that list down. The cells being moved are ignored, unless they are being cloned, and the alignment is computed against the cells sharing the container of the moved cell (or of the drop target), the container itself, and the cells connected to the moved cell by an edge.

### Tolerance

The tolerance is the maximum distance, in pixels, at which a cell snaps to a reference cell. It is scaled with the view.

- When the grid is enabled, it is half of the grid size.
- Otherwise, it is `Guide.tolerance`, 2 by default.

### Disabling the guides for one move

Holding **Shift** constrains the move to one axis, and the guides are not used during a constrained move. This comes from `SelectionHandler.useGuidesForEvent`, which also asks `Guide.isEnabledForEvent`, so a custom guide can add its own condition, see [Customizing the Guide](#customizing-the-guide).


## Customizing the Guide

The `Guide` instance is created by `SelectionHandler.createGuide` at the beginning of every move. Customizing the guide therefore means two things: subclassing `Guide`, then overriding `createGuide` to return the subclass.

### Subclassing `Guide`

These members are meant to be changed:

| Member | Purpose |
|---|---|
| `horizontal` | Aligns the x coordinates. `true` by default. |
| `vertical` | Aligns the y coordinates. `true` by default. |
| `tolerance` | Tolerance in pixels when the grid is disabled. `2` by default. |
| `rounded` | Rounds the resulting coordinates to whole pixels. `false` by default. |
| `isEnabledForEvent(evt)` | Whether the guide is used for the given mouse event. Returns `true` by default. |
| `getGuideColor(state, horizontal)` | Color of the line drawn for the given reference cell. |
| `createGuideShape(horizontal)` | Shape used to draw a line. A dashed `PolylineShape` by default. |

The default color and stroke width come from the `GUIDE_COLOR` (`#FF0000`) and `GUIDE_STROKEWIDTH` (`1`) constants. They cannot be reassigned, so override `getGuideColor` or `createGuideShape` to change them.

```typescript
class CustomGuide extends Guide {
  // Only align the x coordinates
  override vertical = false;

  override isEnabledForEvent(evt: MouseEvent): boolean {
    // Holding Alt disables the guides, the same modifier key that disables the grid snapping
    return !eventUtils.isAltDown(evt);
  }

  override getGuideColor(_state: CellState, _horizontal: boolean): string {
    return '#0000FF';
  }
}
```

Using Alt in `isEnabledForEvent` matches the default of `isGridEnabledEvent` on the graph, which disables the grid snapping while Alt is held. The user then has a single key to move a cell freely, without the grid nor the guides.

### Providing the custom guide

Override `createGuide`, either in a subclass of `SelectionHandler` registered in place of the default one, or by patching the plugin instance. [Choosing between a subclass and an instance patch](../guides/extend-maxgraph.md#choosing-between-a-subclass-and-an-instance-patch) explains how to choose.

Patching the instance is enough here, since `createGuide` is called at the beginning of every move:

```typescript
const selectionHandler = graph.getPlugin<SelectionHandler>('SelectionHandler');
if (selectionHandler) {
  selectionHandler.guidesEnabled = true;
  selectionHandler.createGuide = function (): Guide {
    return new CustomGuide(this.graph, this.getGuideStates());
  };
}
```


## Drag and Drop from Outside the Graph

`DragSource`, returned by `gestureUtils.makeDraggable`, aligns the dropped element with a guide of its own:

- it is controlled by `DragSource.guidesEnabled`, which is **`true` by default**, independently of `SelectionHandler.guidesEnabled`;
- it is only used when a preview element is displayed during the drag;
- its reference cells come from `SelectionHandler.getGuideStates`, or are empty when the plugin is not registered;
- it always creates a plain `Guide`, so overriding `SelectionHandler.createGuide` does not affect it.

To follow the setting of `SelectionHandler`, override `isGuidesEnabled`:

```typescript
dragSource.isGuidesEnabled = (): boolean =>
  graph.getPlugin<SelectionHandler>('SelectionHandler')?.guidesEnabled ?? false;
```


## Bundle Size

`SelectionHandler` and `DragSource` both import `Guide` statically. An application registering `SelectionHandler`, or using `gestureUtils.makeDraggable`, therefore bundles `Guide` even when the guides are never enabled. Making the guide optional is tracked in [issue #1247](https://github.com/maxGraph/maxGraph/issues/1247).


## Live Demos

### Guides

The guides enabled on a `Graph` by setting `guidesEnabled` on the `SelectionHandler` plugin instance, with a grid displayed. `useGuidesForEvent` is patched on the instance so that holding Alt disables the guides. Move the vertices to see them snap to each other.

- **Live demo**: [Guides](https://maxgraph.github.io/maxGraph/demo/?path=/story/misc-guides--default)
- **Source code**: [Guides.stories.ts](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/Guides.stories.ts)

### DragSource

The subclass approach: a `Guide` subclass disables the guides when Alt is held, and a `SelectionHandler` subclass enables the guides and returns that `Guide` from `createGuide`. It is registered in place of the default `SelectionHandler`. The story also shows a `DragSource` whose `isGuidesEnabled` follows the setting of `SelectionHandler`: drag the icon at the bottom of the page onto a graph, and the dropped vertex is aligned with the existing ones.

- **Live demo**: [DragSource](https://maxgraph.github.io/maxGraph/demo/?path=/story/dnd-copypaste-dragsource--default)
- **Source code**: [DragSource.stories.ts](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/DragSource.stories.ts)
