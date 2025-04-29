---
sidebar_position: 10
description: How-to use use builtin EdgeStyles and create new EdgeStyles.
---

# EdgeStyles

:::info
The code examples provided on this page are written in `TypeScript`.
Don't forget to adapt them if you use `JavaScript`.
:::

## What is an EdgeStyle?

An `EdgeStyle` is a function that calculates the precise points along an edge, ensuring it follows a specific layout pattern - such as maintaining orthogonal segments or forming an "elbow" shape.
It can also implement sophisticated routing algorithms like the `ManhattanConnector`, which finds the shortest path between vertices while avoiding obstacles, using manhattan distance as its metric.

An `EdgeStyle` is configured within the style properties of the Cell that relates to the Edge.  
By default, an edge `EdgeStyle` is unset.

:::note
All EdgeStyles provided by `maxGraph` are automatically registered in the `StyleRegistry` when a `Graph` instance is created. For more details, see the [Global Configuration](global-configuration.md#styles) documentation.  
To check the list of registered EdgeStyles, refer to the `registerDefaultStyleElements` function.
:::


## How to Use a Specific EdgeStyle

:::info
For more details about the usage of EdgeStyles, see the documentation of `CellStateStyle.edgeStyle`.
:::

`maxGraph` provides various edgeStyle functions under the `EdgeStyle` namespace to be used in the `style` property of an Edge as the value of `CellStateStyle.edgeStyle`.

The following example sets the edge style to `ElbowConnector` which is registered by default under the `elbowEdgeStyle` key in the `StyleRegistry`:

```javascript
style.edgeStyle = 'elbowEdgeStyle';
```

:::tip

The `CellStateStyle.edgeStyle` type guides you on how to set the EdgeStyle value when configuring the value with a string.

:::

It is possible to configure the default EdgeStyle for all edges in the `Graph`, for example to use `SegmentConnector` (registered by default under the `elbowEdgeStyle` key in the `StyleRegistry`), as follows:

```javascript
const style = stylesheet.getDefaultEdgeStyle();
style.edgeStyle = 'segmentEdgeStyle';
```


## Custom EdgeStyle

### Creating a Custom EdgeStyle

A perimeter is a function matching the `EdgeStyleFunction` type. To write a custom edge style, create a function as follows.

In the example below, a right angle is created using a point on the horizontal center of the target vertex and the vertical center of the source vertex.
The code checks if that point intersects the source vertex and makes the edge straight if it does.
The point is then added into the result array, which acts as the return value of the function.

```typescript
const MyStyle: EdgeStyleFunction = (state, source, target, points, result) => {
  if (source && target) {
    const pt = new Point(target.getCenterX(), source.getCenterY());

    if (mathUtils.contains(source, pt.x, pt.y)) {
      pt.y = source.y + source.height;
    }

    result.push(pt);
  }
};
```

The new edge style can then be registered in the `StyleRegistry` as follows:
```javascript
StyleRegistry.putValue('myEdgeStyle', MyStyle);
```


### Using a Custom EdgeStyle

The custom edge style above can now be used in a specific edge as follows:
```javascript
style.edgeStyle = 'myEdgeStyle';
```

The key of the `StyleRegistry` entry for the function should be used in the `CellState.edgeStyle` values, unless `GraphView.allowEval` is `true`.
In this case, you can also use the `'MyStyle'` string for the value in the cell style above.

The custom EdgeStyle can be used for all edges in the graph as follows:

```javascript
const style = graph.getStylesheet().getDefaultEdgeStyle();
style.edgeStyle = 'myEdgeStyle';
```

It can also be used directly when setting the value of the `edgeStyle` key in a style of a specific edge as follows:
```javascript
style.edgeStyle = 'myEdgeStyle';
```
