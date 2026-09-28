---
sidebar_position: 4
description: The broad directions for the next maxGraph versions.
---

# Roadmap

This page gives the broad directions for the next versions of maxGraph. It is not fixed: it evolves with the feedback of the users.

## Milestones

The work in progress and the work coming soon are visible in the [maxGraph GitHub Milestones](https://github.com/maxGraph/maxGraph/milestones). There are generally one or two open milestones at a given time.

The name of a milestone matches a maxGraph version, so the "Milestone" property of an issue tells in which version it is planned to be handled, or in which version it was handled once the issue is closed.

## Current Themes

The current effort focuses on:
- **Stabilization**: fix bugs and stabilize the API.
- **Tree shaking**: reduce the size of the applications that only use a part of maxGraph.
- **Documentation**: make maxGraph easier to learn and to use.

For more details, see the [Looking Ahead: maxGraph in 2025](/blog/2025/02/12/looking-ahead-maxgraph-in-2025) blog post.

## Later

The following directions are considered for later versions:
- New style features, inspired by those draw.io developed on top of mxGraph. For example: the sketch style, the flow animation of edges rendered with native CSS or SVG animations, and SVG filters for visual effects such as shadows, glow or blur.
- Navigation delegated to the browser: today, when panning or zooming, maxGraph recomputes the coordinates and dimensions of all cells and renders the graph again. This is slow and CPU consuming. In addition, with HTML labels, the rounding of the coordinates makes the text move slightly, which gives a weird effect. Using the CSS `transform` property of the HTML container instead lets the browser do this work. Other features, such as the positioning of overlays or the creation of new edge connections, may require adjustments to work with it, so this needs extra testing.
- Gesture improvements: pinch zoom is only implemented for Safari, and on other devices, zooming with two fingers is jumpy or does not work at all. See [issue #62](https://github.com/maxGraph/maxGraph/issues/62) and the draft [PR #149](https://github.com/maxGraph/maxGraph/pull/149) that proposed a fix, but was never finalized.
- Defining the public API: everything was public in mxGraph. Clearly separate what belongs to the public API, what is meant for extensions, and what is private, to limit breaking changes.

## Influence the Roadmap

To influence the content of a milestone, comment on the issues you want to see handled. Explain why they are important to you, and what they could bring to other users.
