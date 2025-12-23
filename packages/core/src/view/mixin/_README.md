# Graph mixins

This directory contains mixins that extend the functionality of the Graph class.

## Purpose

Historically, in the mxGraph library, the `mxGraph` class acts as a [God Object](https://en.wikipedia.org/wiki/God_object) that contains all the functionality of the library. In version 4.2.2, the related
source file includes [13,229 lines](https://github.com/jgraph/mxgraph/blob/v4.2.2/javascript/src/js/view/mxGraph.js#L13229).

`maxGraph` inherits from this design pattern, and various changes were introduced to the library to make it more modular and maintainable.
The introduction of mixins is one of these changes.

For more details about the introduction of mixins, see the following discussions:
  - https://github.com/maxGraph/maxGraph/discussions/18#discussioncomment-602917
  - https://github.com/maxGraph/maxGraph/discussions/51
  - https://github.com/maxGraph/maxGraph/discussions/151


## How-to for this directory

No mixins should be exported directly outside of this directory.

Instead, they should apply directly to the Graph class in the `./_graph-mixins-apply.ts` file.

For each mixin, a dedicated file should be created to define the mixin type as an [augmentation of the Graph module](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation).

All augmentations should be made public with the `./_graph-mixins-types.ts` file.
