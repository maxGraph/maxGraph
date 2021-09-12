# mxGraph

## Getting started

### Setting up local development environment

In the project root directory, execute

```sh
$ npm install
```

To watch the core package, execute

```sh
$ npm run dev
```

and select `@mxgraph/core`.

To run the html(vanilla-js) version of storybook, execute

```sh
$ npm run dev
```

and select `@mxgraph/html`.

Since both commands are in watch mode, so it's recommended to open two terminals and run them separately. When a file is saved from the core package, the html storybook will be automatically updated.

===

# Looking for maintainers

12 Nov 2020.

If you are interested in becoming a maintainer of mxGraph please comment on issue #1 https://github.com/jsGraph/mxgraph/issues/1

Initial objectives:

- The first priority is to maintain a working version of mxGraph and its **npm package**
- The ambitious stretch goal is to refactor the codebase to create a modern modular, tree shakable, version of mxGraph to reduce the whole package size.

-- Colin Claverie

Note that the original default branch was `master`, and this has now been renamed `main`. If you had a checkout with the old branch name then follow these instructions to get the new branch name:

```
git branch -m master main
git fetch origin
git branch -u origin/main main
git remote set-head origin -a
```

# Original Readme below

_NOTE 09.11.2020_ : Development on mxGraph has now stopped, this repo is effectively end of life.


Known forks:

https://github.com/jsGraph/mxgraph

https://github.com/process-analytics/mxgraph

# mxGraph

mxGraph is a fully client side JavaScript diagramming library that uses SVG and HTML for rendering.

The PHP model was deprecated after release 4.0.3 and the archive can be found [here](https://github.com/jgraph/mxgraph-php).

The unmaintained npm build is [here](https://www.npmjs.com/package/mxgraph)

We don't support Typescript, but there is a [project to implement this](https://github.com/process-analytics/mxgraph-road-to-DefinitelyTyped), with [this repo](https://github.com/hungtcs/mxgraph-type-definitions) currently used as the lead repo.

The mxGraph library uses no third-party software, it requires no plugins and can be integrated in virtually any framework (it's vanilla JS).

# Getting Started

In the root folder there is an index.html file that contains links to all resources. You can view the documentation online on the [Github pages branch](https://jgraph.github.io/mxgraph/). The key resources are the JavaScript user manual, the JavaScript examples and the JavaScript API specificiation.

# Support

There is a [mxgraph tag on Stack Overflow](http://stackoverflow.com/questions/tagged/mxgraph). Please ensure your questions adhere to the [SO guidelines](http://stackoverflow.com/help/on-topic), otherwise it is likely to be closed.

If you are looking for active support, your better route is one of the commercial diagramming tools, like [yFiles](https://www.yworks.com/products/yfiles-for-html) or [GoJS](https://gojs.net/latest/index.html).

# History

We created mxGraph in 2005 as a commercial project and it ran through to 2016 that way. Our USP was the support for non-SVG browsers, when that advantage expired we moved onto commercial activity around draw.io. mxGraph is pretty much feature complete, production tested in many large enterprises and stable for many years.

Over time you can expect this codebase will break features against new browser releases, it's not advised to start new projects against this codebase for that reason.
