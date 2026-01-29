# Vercel PR Preview Deployment Plan

## Overview

This document outlines options for deploying PR previews using Vercel.

## Deployment Options

### Option 1: Vercel Builds the Site (Traditional)

- Connect the repository to Vercel
- Vercel runs the build command on each PR automatically
- Automatic preview deployments with zero CI configuration

### Option 2: Pre-build and Deploy

Build locally or in CI and deploy pre-built assets using the Vercel CLI.

**Simple deployment of static files:**
```bash
# Deploy a directory of static files
vercel deploy ./dist --prebuilt

# Or without --prebuilt for simple static sites
vercel deploy ./packages/html/storybook-static
```

**GitHub Actions workflow for PR previews:**
```yaml
- name: Build
  run: npm run build -w packages/html

- name: Deploy to Vercel
  run: |
    npm i -g vercel
    vercel deploy ./packages/html/storybook-static --token=${{ secrets.VERCEL_TOKEN }} --yes
```

The CLI returns the preview URL which can be posted as a PR comment.

## Comparison

| Aspect | Vercel Builds | Pre-built |
|--------|--------------|-----------|
| Build environment | Vercel's servers | Your CI (GitHub Actions) |
| Build minutes | Uses Vercel quota | Uses your CI minutes |
| Control | Less | Full control over build |
| Setup | Simpler | Requires CLI setup |
| Node.js version | Vercel's default or configured | Controlled via .nvmrc |

## Recommendation

For maxGraph, the **pre-built approach** is recommended because:

1. The project already has CI workflows in place
2. Full control over the Node.js version (uses `.nvmrc`)
3. Consistent build environment between CI tests and deployments
4. GitHub Actions minutes are available

## Next Steps

1. Create a Vercel project for the repository
2. Generate a Vercel token and add it as a GitHub secret (`VERCEL_TOKEN`)
3. Add a GitHub Actions workflow that:
   - Builds the static site
   - Deploys to Vercel using the CLI
   - Posts the preview URL as a PR comment
