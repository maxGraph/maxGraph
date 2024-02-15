# Website

This website is built using [Docusaurus 3](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ npm install
```

### Local Development

```
$ npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ npm build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.


### External resources to include within the site

The navbar includes links to external resources built by other packages
- the API documentation
- the Storybook demo

Such resources are expected to be copied into the `generated` directory of the website.
- build the related resources
- copy `/packages/core/` to `/packages/webapp/generated/api-docs`
- copy `/packages/html/dist` to `/packages/webapp/generated/demo`

Run the following commands to copy the resources:
```bash
npm run extra:copy-gen-resources
```
