# Vercel PR Preview Deployment Plan

## Overview

This document outlines the approach for deploying PR previews to Vercel, with support for PRs from forks.

## Deployment Approaches

### Vercel-Managed Builds

- Connect the repository to Vercel
- Vercel runs the build command on each PR automatically
- Automatic preview deployments with zero CI configuration

### Pre-built Deployment

Build in CI and deploy pre-built assets using the Vercel CLI or a GitHub Action.

```bash
vercel deploy ./packages/html/storybook-static --token=$VERCEL_TOKEN --yes
```

### Comparison

| Aspect | Vercel-Managed | Pre-built |
|--------|----------------|-----------|
| Build environment | Vercel's servers | GitHub Actions |
| Build minutes | Vercel quota | GitHub Actions quota |
| Control | Limited | Full control |
| Setup complexity | Simple | Requires workflow setup |
| Node.js version | Vercel's default | Controlled via `.nvmrc` |

**Recommendation:** Use the pre-built approach for maxGraph because CI workflows already exist, and it provides full control over the build environment.

## GitHub Actions for Vercel

Several GitHub Actions can deploy to Vercel and post PR comments.

### Available Actions

| Action | Stars | Prebuilt Support | PR Comments | GitHub Deployments |
|--------|-------|------------------|-------------|-------------------|
| [amondnet/vercel-action](https://github.com/marketplace/actions/vercel-action) | 739 | Via `vercel.json` | Yes | Yes |
| [BetaHuhn/deploy-to-vercel-action](https://github.com/BetaHuhn/deploy-to-vercel-action) | ~200 | `PREBUILT: true` | Yes | Yes |
| [ngduc/vercel-deploy-action](https://github.com/marketplace/actions/vercel-deploy-action) | ~50 | Via `vercel.json` | Yes | No |

### Preview URL Patterns

By default, Vercel generates URLs with a random string: `project-name-randomString.vercel.app`

Both major actions support custom URL patterns with PR numbers:

| Action | Input | Template Variables |
|--------|-------|-------------------|
| amondnet/vercel-action | `alias-domains` | `{{PR_NUMBER}}`, `{{BRANCH}}` |
| BetaHuhn/deploy-to-vercel-action | `PR_PREVIEW_DOMAIN` | `{PR}`, `{BRANCH}`, `{SHA}`, `{USER}`, `{REPO}` |

**Note:** Custom PR-based URLs require a wildcard domain configured in Vercel (e.g., `*.your-project.vercel.app`).

### PR Number Limitation in workflow_run Context

Neither action accepts PR number as an input parameter. They infer it from GitHub's `pull_request` event context.

In a `workflow_run` trigger (used for fork support):
- `github.event.pull_request.number` is not available
- Template variables (`{{PR_NUMBER}}`, `{PR}`) do not resolve
- Custom alias domains with PR numbers do not work

**Workarounds:**
1. **Use default random URLs** - Accept Vercel's random URLs (simplest approach)
2. **Use Vercel CLI directly** - Deploy with CLI and manually set alias using PR number from artifact

## Two-Stage Workflow for Fork Support

PRs from forks do not have access to repository secrets (GitHub security measure). A two-stage workflow pattern solves this.

### Why Two Stages?

| Stage | Trigger | Context | Secrets Access |
|-------|---------|---------|----------------|
| Build | `pull_request` | Fork's context | No |
| Deploy | `workflow_run` | Base repo context | Yes |

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

Two options are available for deployment. Both use random Vercel URLs since PR number context is not available (see [PR Number Limitation](#pr-number-limitation-in-workflow_run-context)).

#### Using amondnet/vercel-action

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
              body: `## Preview Deployment\n\n**URL:** ${{ steps.vercel.outputs.preview-url }}\n\nDeployed from commit ${{ github.event.workflow_run.head_sha }}.`
            })
```

#### Using Vercel CLI

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

      - name: Install Vercel CLI
        run: npm i -g vercel

      - name: Deploy to Vercel
        id: deploy
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: |
          cd packages/html/storybook-static
          url=$(vercel deploy --token=${{ secrets.VERCEL_TOKEN }} --yes)
          echo "preview-url=$url" >> $GITHUB_OUTPUT

      # Optional: Set predictable alias (requires wildcard domain in Vercel)
      # - name: Set Alias
      #   run: |
      #     vercel alias ${{ steps.deploy.outputs.preview-url }} \
      #       maxgraph-pr-${{ steps.pr.outputs.number }}.vercel.app \
      #       --token=${{ secrets.VERCEL_TOKEN }}

      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: ${{ steps.pr.outputs.number }},
              body: `## Preview Deployment\n\n**URL:** ${{ steps.deploy.outputs.preview-url }}\n\nDeployed from commit ${{ github.event.workflow_run.head_sha }}.`
            })
```

### Key Points

1. **Artifact passing:** PR number and build assets are passed via `actions/upload-artifact` / `actions/download-artifact`
2. **Security:** Secrets are only accessed in Stage 2, which runs in the base repo context
3. **PR comment:** Uses `actions/github-script` with the PR number from artifact since `workflow_run` lacks PR context
4. **Conditional execution:** Stage 2 only runs if Stage 1 succeeds (`workflow_run.conclusion == 'success'`)

## Next Steps

1. Create a Vercel project for the repository
2. Generate a Vercel token and add as GitHub secret: `VERCEL_TOKEN`
3. Get org and project IDs (from `.vercel` directory after linking) and add as secrets:
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
4. Create the two GitHub Actions workflows:
   - `.github/workflows/pr-build.yml`
   - `.github/workflows/pr-deploy.yml`
5. Test with a PR from a fork to verify the workflow
