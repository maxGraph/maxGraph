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

**GitHub Actions workflow for PR previews:** See [GitHub Actions for Vercel](#github-actions-for-vercel) section below.

## Comparison

| Aspect | Vercel Builds | Pre-built |
|--------|--------------|-----------|
| Build environment | Vercel's servers | Your CI (GitHub Actions) |
| Build minutes | Uses Vercel quota | Uses your CI minutes |
| Control | Less | Full control over build |
| Setup | Simpler | Requires CLI setup |
| Node.js version | Vercel's default or configured | Controlled via .nvmrc |

## GitHub Actions for Vercel

Several GitHub Actions exist for deploying pre-built assets to Vercel with automatic PR comments.

### Option 1: amondnet/vercel-action (Most Popular - 739 stars)

**Repository:** https://github.com/marketplace/actions/vercel-action

**Features:**
- Automated PR/commit comments with deployment status
- Basic auth support for previews
- Custom domain aliasing with dynamic templates
- Team scope support

**Prebuilt support:** Configure `vercel.json` with `@vercel/static`:
```json
{"builds": [{"src": "dist", "use": "@vercel/static"}]}
```

**Usage:**
```yaml
- uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.ORG_ID }}
    vercel-project-id: ${{ secrets.PROJECT_ID }}
    github-token: ${{ secrets.GITHUB_TOKEN }}
    github-comment: true
```

### Option 2: BetaHuhn/deploy-to-vercel-action (Recommended)

**Repository:** https://github.com/BetaHuhn/deploy-to-vercel-action

**Features:**
- Explicit `PREBUILT` parameter for pre-built projects
- GitHub Deployments integration
- Dynamic domain assignment (`{BRANCH}`, `{PR}`, `{SHA}`)
- Fork/Dependabot PR support

**Prebuilt support:** Native via `PREBUILT: true` input

**Usage:**
```yaml
- uses: BetaHuhn/deploy-to-vercel-action@v1
  with:
    GITHUB_TOKEN: ${{ secrets.GH_PAT }}
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    PREBUILT: true
    CREATE_COMMENT: true
```

### Option 3: ngduc/vercel-deploy-action

**Repository:** https://github.com/marketplace/actions/vercel-deploy-action

**Features:**
- PR and commit comments
- Basic auth for previews
- Outputs: `preview-url`, `preview-url-host`, `preview-name`

**Usage:**
```yaml
- uses: ngduc/vercel-deploy-action@master
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.ORG_ID }}
    vercel-project-id: ${{ secrets.PROJECT_ID }}
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### GitHub Actions Comparison

| Feature | amondnet/vercel-action | BetaHuhn/deploy-to-vercel-action | ngduc/vercel-deploy-action |
|---------|------------------------|----------------------------------|---------------------------|
| Stars | 739 | ~200 | ~50 |
| Explicit prebuilt flag | No (via vercel.json) | **Yes** (`PREBUILT: true`) | No |
| PR comments | Yes | Yes | Yes |
| GitHub Deployments | Yes | Yes | No |
| Maintenance | Active | Active | Less active |

### Recommended Action

**BetaHuhn/deploy-to-vercel-action** is recommended because:
1. Has explicit `PREBUILT` parameter (cleanest for pre-built deployments)
2. Well-maintained with good documentation
3. Built-in PR comment support
4. GitHub Deployments integration

## Two-Stage Workflow for Fork Support

PRs from forks don't have access to repository secrets (GitHub security measure). To support fork PRs, use a two-stage workflow pattern:

### Why Two Stages?

| Stage | Trigger | Context | Secrets Access |
|-------|---------|---------|----------------|
| Stage 1 (Build) | `pull_request` | Fork's context | ❌ No |
| Stage 2 (Deploy) | `workflow_run` | Base repo context | ✅ Yes |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Stage 1: Build Workflow (pr-build.yml)                     │
│  Trigger: pull_request                                      │
│                                                             │
│  1. Checkout code                                           │
│  2. Build static assets                                     │
│  3. Save PR number to file                                  │
│  4. Upload artifact (assets + PR number)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ triggers
┌─────────────────────────────────────────────────────────────┐
│  Stage 2: Deploy Workflow (pr-deploy.yml)                   │
│  Trigger: workflow_run (completed)                          │
│                                                             │
│  1. Download artifact from Stage 1                          │
│  2. Extract PR number                                       │
│  3. Deploy to Vercel (has access to secrets)                │
│  4. Post comment on PR with preview URL                     │
└─────────────────────────────────────────────────────────────┘
```

### Stage 1: Build Workflow

**File:** `.github/workflows/pr-build.yml`

```yaml
name: PR Build

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build static site
        run: npm run build -w packages/html

      - name: Save PR number
        run: echo "${{ github.event.pull_request.number }}" > pr_number.txt

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: pr-build
          path: |
            packages/html/storybook-static
            pr_number.txt
          retention-days: 1
```

### Stage 2: Deploy Workflow

**File:** `.github/workflows/pr-deploy.yml`

```yaml
name: PR Deploy Preview

on:
  workflow_run:
    workflows: ["PR Build"]
    types: [completed]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.event.workflow_run.conclusion == 'success'
    steps:
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: pr-build
          run-id: ${{ github.event.workflow_run.id }}
          github-token: ${{ secrets.GITHUB_TOKEN }}

      - name: Get PR number
        id: pr
        run: echo "number=$(cat pr_number.txt)" >> $GITHUB_OUTPUT

      - name: Deploy to Vercel
        id: vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: packages/html/storybook-static
          github-token: ${{ secrets.GITHUB_TOKEN }}
          github-comment: false

      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: ${{ steps.pr.outputs.number }},
              body: `## 🚀 Preview Deployment Ready!\n\n**Preview URL:** ${{ steps.vercel.outputs.preview-url }}\n\nThis preview was automatically deployed from commit ${{ github.event.workflow_run.head_sha }}.`
            })
```

### Key Points

1. **Artifact passing:** The PR number and build assets are passed via `actions/upload-artifact` / `actions/download-artifact`
2. **Security:** Secrets are only accessed in Stage 2, which runs in the base repo context
3. **PR comment:** Must use `actions/github-script` with the PR number from artifact since `workflow_run` doesn't have direct PR context
4. **Conditional execution:** Stage 2 only runs if Stage 1 succeeds (`workflow_run.conclusion == 'success'`)

### Alternative: Using BetaHuhn Action with workflow_run

The BetaHuhn action can also work in Stage 2, but requires manual PR comment handling:

```yaml
- name: Deploy to Vercel
  uses: BetaHuhn/deploy-to-vercel-action@v1
  with:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    PREBUILT: true
    WORKING_DIRECTORY: packages/html/storybook-static
    CREATE_COMMENT: false  # Handle manually since we're in workflow_run context
```

## Recommendation

For maxGraph, the **pre-built approach** is recommended because:

1. The project already has CI workflows in place
2. Full control over the Node.js version (uses `.nvmrc`)
3. Consistent build environment between CI tests and deployments
4. GitHub Actions minutes are available

## Next Steps

1. Create a Vercel project for the repository
2. Generate a Vercel token and add it as a GitHub secret (`VERCEL_TOKEN`)
3. Get the Vercel org ID and project ID (from `.vercel` directory after linking) and add as secrets:
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
4. Create two GitHub Actions workflows:
   - `.github/workflows/pr-build.yml` - Build and upload artifact
   - `.github/workflows/pr-deploy.yml` - Deploy to Vercel and comment on PR
5. Test with a PR from a fork to verify secrets access works correctly
