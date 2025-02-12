---
title: "Looking Ahead: maxGraph in 2025"
description: See what's next for maxGraph in 2025, from streamlined documentation to tree-shaking enhancements and API stabilization
authors: tbouffard
tags: [Roadmap]
---

2024 has been an exciting year for maxGraph! Strides have been made in improving the library, focusing on **documentation**, **tree-shaking**, and **bug fixes**, setting the stage for future enhancements. As 2025 approaches, here is a vision for the year ahead along with a recap of key milestones. 🚀✨

Let's dive into what's been accomplished and what to expect next! 🎯


<!-- truncate -->


## Documentation and Examples: Making maxGraph Easier to Use

The first major focus in 2024 has been on improving the documentation. With the release of [v0.15.0](https://github.com/maxGraph/maxGraph/releases/tag/v0.15.0), a significant milestone was achieved: the entire mxGraph manuals and tutorials have been integrated and adapted for maxGraph! 📚

This integration ensures comprehensive, structured documentation that benefits from the maturity and experience of mxGraph. Additionally, more examples and demos have been added based on community feedback, making it easier to find relevant code snippets directly from most pages. 💡

### What’s Next?

The documentation journey will continue in 2025, focusing on the following areas:

- Better organization of manuals and tutorials.
- Creating a clear learning path for newcomers.
- Ensuring consistency with existing usage documentation.

This is a large topic that will be gradually implemented throughout 2025.

☞ **Interested in contributing to the documentation?** Join the discussion about the documentation roadmap here: [#595](https://github.com/maxGraph/maxGraph/discussions/595)


## Tree-Shaking: Shrinking the Library Size

While documentation improvements have enhanced usability, optimizing tree-shaking has been equally important. 

maxGraph, as a fork of mxGraph, inherited some limitations—one being inefficient tree-shaking. Regardless of which parts of mxGraph were used, it contributed about 811KB (minified) to application sizes.

From the start, one of maxGraph’s goals has been to provide better tree-shaking support. Here’s how improvements have been made so far:

In the initial release, Internet Explorer support was removed and custom code was replaced with modern ECMAScript APIs. This reduced the size of the library and prepared the ground for new improvements. 🔧

Subsequent notable releases brought further tree-shaking improvements, reducing the size of applications that don't use related features:

- [v0.6.0](https://github.com/maxGraph/maxGraph/releases/tag/v0.6.0): Codecs are no longer registered by default.
- [v0.11.0](https://github.com/maxGraph/maxGraph/releases/tag/v0.11.0): `MaxLog` and `MaxWindow` are no longer called directly, avoiding transitive inclusion.
- [v0.12.0](https://github.com/maxGraph/maxGraph/releases/tag/v0.12.0): The npm package is declared without side effects.

### What’s Next?

Despite these efforts, the contribution of maxGraph to application sizes remains significant (around 450 kB at minimum). Finding ways to reduce this footprint even further is a key goal. 📉

Ongoing discussions and opportunities are described in [Issue #665: Strategies for Further Tree-Shaking Improvements](https://github.com/maxGraph/maxGraph/issues/665), outlining potential enhancements for 2025.

To achieve more efficient tree-shaking, new methods of graph instantiation will be explored while maintaining the current mechanism for those who prefer the default setup, even if it results in a larger bundle size. This balance is necessary to ensure the library remains accessible for newcomers. ✨

While there may be breaking changes, efforts will be made to minimize their impact. These changes will primarily target extension points rather than core functionalities, which will be preserved. The approach will be progressive and incremental across releases—no big bangs here!


## Other Topics for 2025

With documentation and tree-shaking optimizations underway, other important areas are also being addressed in 2025.

### Stabilization and Bug Fixes

Maintaining library stability is always a top priority. Issues will continue to be addressed and performance improvements will be made. 🛠️

### Defining the Public API

In mxGraph, everything was public, leading to frequent breaking changes with each improvement. 🔄 The goal is to clearly define what belongs in the public API and what is meant for extensions. This will help limit breaking changes and provide a more stable experience for users.


## Wrapping Up

These plans are **not set in stone** but reflect goals and aspirations for **2025**. Exciting developments lie ahead, and the journey continues with the support of the **community**. 🌟✨

👋 **See you next year** to review the progress made together! 🎉🚀

*P.S. We're looking for contributors and maintainers to keep the project alive and kicking. Check out ****[Issue #354](https://github.com/maxGraph/maxGraph/issues/354)**** if you’re interested! 😄*

