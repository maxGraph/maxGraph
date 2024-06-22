# Website

This website is built using [Docusaurus 3](https://docusaurus.io/), a modern static website generator.

## Installation

```
$ npm install
```

## Prerequisites

### External resources that MUST include within the site

The navbar includes links to external resources built by other packages
- the API documentation
- the Storybook demo

Such resources are expected to be copied into the `generated` directory of the website.
- build the related resources
- copy `/packages/core/` to `/packages/website/generated/api-docs`
- copy `/packages/html/dist` to `/packages/website/generated/demo`

Run the following commands to copy the resources:
```bash
npm run extra:copy-gen-resources
```

In local development, not copying the resources let the server start but the links to the resources will be broken.

When building, you must run this command at least once before building the website. Otherwise, the docusaurus will fail to build because of `Error: Docusaurus found broken links!`.


## Local Development

```
$ npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```
$ npm build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.
