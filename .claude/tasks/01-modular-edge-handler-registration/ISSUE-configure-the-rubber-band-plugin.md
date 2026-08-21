# Configure the rubber band plugin at graph construction time

<!-- Content for a GitHub issue, following the sections of .github/ISSUE_TEMPLATE/02-feature-request.md. Not created on GitHub yet.
     When creating it: issue type "Enhancement", and no label. There is no "Feature" issue type in this repository, the
     available ones are Task, Bug, Enhancement and Documentation. The template applies "enhancement" and "triage" by
     default, remove them. -->

> [!NOTE]
> This description applies to version 0.24.0, the release available when this issue was created, and depends on #1149, which introduces the mechanism configuring a plugin from the graph options.

### Is your feature request related to a problem? Please describe.

`RubberBandHandler` is configured by mutating the instance after the graph is built, and two of its behaviors cannot be configured at all.

```ts
const graph = new BaseGraph({ container, plugins: [RubberBandHandler] });
const rubberBand = graph.getPlugin<RubberBandHandler>('RubberBandHandler')!;
rubberBand.fadeOut = true;
rubberBand.defaultOpacity = 40;
```

This is the general problem described in #1149, and the rubber band is a good first consumer of the mechanism it introduces: the plugin is opt-in, it is not part of the default plugins, and an application that adds it almost always wants to adjust it, so the configuration and the registration belong in the same place.

Two behaviors have no property at all today:

- **the fade out duration is hardcoded twice** in `reset()`, as `'all 0.2s linear'` in the transition style and as `200` in the `setTimeout` that removes the element. The two values cannot drift today because both are literals, and they will be able to as soon as one is touched.
- **the trigger cannot be moved off the plain left press.** `mouseDown` starts a selection on any press on the background, and `isForceRubberbandEvent` adds the alt key as an unconditional override. This makes the plugin mutually exclusive with panning on the left button, which the sources already acknowledge: `PanningHandler.useLeftButtonForPanning` carries the comment _"Setting this to true may conflict with `RubberBandHandler`"_. Both plugins claim a plain left press on the background, both from their `mouseDown`, both guarded by `!me.isConsumed()`, so the winner is whichever plugin comes first in the `plugins` option, and one of the two features becomes unusable.

### Describe the solution you'd like

A group of options mapping onto `RubberBandHandler`, passed at construction through the mechanism of #1149. Each option is named after the property it drives, one to one, so `defaultOpacity` and not `opacity`. Renaming the property itself is a separate question, see below.

The two new options are also two new **public properties of the plugin**, like `fadeOut` and `defaultOpacity` already are. The option only sets the property while the graph is being built, so everything stays configurable after construction, and an application that does not use the graph options gains the two behaviors all the same.

| Option | State of the class | Note |
|---|---|---|
| `fadeOut` | `fadeOut`, default `false` | maps as is |
| `defaultOpacity` | `defaultOpacity`, default `20`, from 0 to 100 | maps as is. `default` names the value the div gets when it is created, which the fade out then drives to `0`, not a value a stylesheet could override: `createShape()` writes it as an inline style through `setOpacity`, and the `div.mxRubberband` rule of `css/common.css` sets no opacity at all |
| `fadeOutDuration` | does not exist | new property, default taken from the current hardcoded value, 200 ms |
| `triggerModifierKey` | does not exist, `isForceRubberbandEvent()` hardcodes the alt key | new property, `'alt' \| 'control' \| 'meta' \| 'shift' \| null`, default `null`, meaning no modifier is required, which is the current behavior |

**To consider, renaming `defaultOpacity` to `opacity`.** Now that what `default` means is established, the value the div is created with, before the fade out drives it to `0`, the prefix carries little for a reader: nothing else sets the opacity, and no CSS can. `opacity` would say the same thing in one word and match the style property it writes. It is a **breaking change** on a public property of the plugin, so it needs the `BREAKING CHANGE` footer and a `CHANGELOG.md` entry, and it drags the option name with it. Worth deciding here rather than later, since the option is published at the same time and would otherwise be renamed twice.

**`fadeOutDuration`** replaces both hardcoded values, the transition string being built from it, so the animation and the removal timeout can no longer disagree.

**`triggerModifierKey`** is what makes the rubber band and left button panning coexist. Setting it to `'shift'` splits the gesture instead of ordering the plugins: a plain left drag on the background pans, a shift left drag rubber band selects, which is what diagram editors usually offer.

**The four modifier keys are supported**, each value mapping one to one onto the existing `isAltDown`, `isControlDown`, `isMetaDown` and `isShiftDown` helpers of `EventUtils`, so the implementation is a lookup rather than a branch per key. `'shift'` is the value the panning conflict calls for, the others cost nothing once the mechanism is there and let an application match the conventions of its own editor.

One open point, which the wider union opens: whether the alt override of `isForceRubberbandEvent` survives as an unconditional second trigger, or whether `triggerModifierKey` replaces it with `'alt'` as its default. Replacing it is the smaller API and keeps a single answer to "what starts a rubber band", at the price of making `null` mean something the current class cannot express.

Whether "no modifier" is spelled `null` or `undefined` is left to the implementation. `null` states the absence explicitly, which suits a property a user reads and writes, while `undefined` is what an omitted option carries anyway and avoids the plugin having to accept both. The two forms are interchangeable for every call site here, since the nullish checks of the package cover both.

JSDoc, to be refined when implemented: _the modifier key that must be held down for a mouse press to start a rubber band selection. When `null`, no modifier is required and any press on the background starts one, which conflicts with `PanningHandler.useLeftButtonForPanning`. Set it to free the plain left press for another plugin._

#### Implementation constraints, to review before implementing

The three points below were checked against the code of 0.24.0 and they shape the implementation rather than decorate it. **They have to be reviewed and confirmed before any code is written**: they rest on the current interaction between `RubberBandHandler`, `PanningHandler` and the mouse event dispatch, and a change in any of the three invalidates them.

- **gating `mouseDown` is not enough.** `PanningHandler.isPanningTrigger()` matches on the left button alone, so a shift left press is also a panning trigger and the plugin registered first still wins. The modifier press has to be handled in the `FIRE_MOUSE_EVENT` path, the one `isForceRubberbandEvent` already uses, because `fireMouseEvent` fires that event before dispatching to the mouse listeners. The rubber band then consumes the press before `PanningHandler.mouseDown` sees it, whatever the plugin order.
- **that path must keep the "no cell under the pointer" check** that `mouseDown` has and `isForceRubberbandEvent` deliberately does not. Shift is already `AbstractGraph.isConstrainedEvent`, used by `SelectionHandler` for constrained moves, so starting a rubber band on a shift press **over a cell** would break constrained dragging. Only presses on the background may trigger it.
- **when the option is set, the plain press must stop starting a selection**, otherwise nothing is freed. The option moves the trigger, it does not add one.

Naming: `startModifierKey` was considered and rejected, because `start()` is the method both trigger paths call, so the name would suggest it gates the alt override too. `triggerModifierKey` names the trigger, which is what the option selects.

### Describe alternatives you've considered

- **Keep mutating the instance after construction.** Works for the two existing properties, and is the status quo. It does not help the two missing behaviors, and it separates the registration of the plugin from its configuration.
- **Subclass `RubberBandHandler` and override `isForceRubberbandEvent`.** Possible today and needs no library change, but it requires a subclass per application for what is a one-line preference, and it does not stop `mouseDown` from consuming the plain left press, which is what actually blocks panning.
- **Make panning ignore the modifier instead**, by giving `PanningHandler` an option to exclude shift from its triggers. It solves the same conflict from the other side, but it leaves the rubber band grabbing every plain press on the background, so the conflict returns with any other plugin interested in that gesture.
- **A boolean, `requireShiftToStart`, instead of a key union.** Shorter for the case that motivates the option, but a second modifier would need a second boolean, and two booleans can contradict each other. The union keeps a single source of truth and grows by extension.

### Tasks

- [ ] Add the `fadeOutDuration` property, default 200, and derive both the transition string and the removal timeout of `reset()` from it.
- [ ] Add the `triggerModifierKey` property and move the trigger to the `FIRE_MOUSE_EVENT` path when it is set, keeping the "background only" check.
- [ ] Review the implementation constraints above before writing any code, and confirm they still hold.
- [ ] Decide what happens to the alt override of `isForceRubberbandEvent`, and document the outcome in the JSDoc of the plugin.
- [ ] Decide whether to rename `defaultOpacity` to `opacity`. If so, document the break and add the `CHANGELOG.md` entry, which the project reserves for breaking changes.
- [ ] Expose the four options through the plugin configuration mechanism of #1149.
- [ ] Tests: the fade out timeout follows the option, a press without the required modifier starts nothing, a press with it starts a selection, a press with it over a cell starts nothing, and panning on the left button keeps working while the modifier trigger is set.
- [ ] Document the options in `packages/website/docs/usage/plugins.md`, where `RubberBandHandler` is listed, including the combination with `PanningHandler.useLeftButtonForPanning`.

### Additional context

- Depends on #1149. The two new properties are useful on their own and could land before it, but the option group cannot.
- `RubberBandHandler` is not part of the default plugins and requires the CSS shipped with the package, see `packages/website/docs/usage/plugins.md` and `css-and-images.md`.
- Worth documenting while touching these options: the opacity is written as an inline style, so no CSS rule can change it whatever its selector or specificity, `!important` excepted. And an `!important` rule pins the div at that value, so the fade out, which also sets the opacity inline, stops fading. The stylesheet shipped with the package styles the border and the background only, which nothing writes inline.
