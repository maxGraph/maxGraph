# ADR: PR Preview Deployment

## Status

Proposed

## Context

When working on the website (docs, homepage, or Storybook examples), previewing changes made in a PR is difficult. The build runs via GitHub Actions, but no preview is exposed. Reviewers must download artifacts and run a local server, which is not user-friendly.

**Requirements** (from [#889](https://github.com/maxGraph/maxGraph/issues/889)):
- Deploy a preview version of the website for every Pull Request
- Host on a public URL to make review easier
- Support PRs from forks (external contributors)

**Constraints:**
- The website is a static site
- CI workflows already exist in GitHub Actions
- Build environment should be controlled (Node.js version via `.nvmrc`)

## Decision

### Hosting Platform: Vercel

Use **Vercel** for PR preview deployments.

**Rationale:**
- Known to work well for this use case
- Supports PRs from forks
- Simple setup and good documentation
- Free tier sufficient for open source projects

**Alternatives considered:**
- Netlify
- Cloudflare Pages
- DigitalOcean App Platform
- Surge

These alternatives may be revisited if Vercel proves unsatisfactory or if another platform offers compelling features in the future.

### Build Strategy: Pre-built Deployment

Build in GitHub Actions and deploy pre-built assets to Vercel, rather than letting Vercel manage builds.

**Rationale:**
- CI workflows already exist
- Full control over build environment
- Node.js version controlled via `.nvmrc`
- Uses GitHub Actions minutes (already available) instead of Vercel build quota

| Aspect | Vercel-Managed | Pre-built |
|--------|----------------|-----------|
| Build environment | Vercel's servers | GitHub Actions |
| Build minutes | Vercel quota | GitHub Actions quota |
| Control | Limited | Full control |
| Setup complexity | Simple | Requires workflow setup |
| Node.js version | Vercel's default | Controlled via `.nvmrc` |

### Workflow Architecture: Two-Stage Pattern

Use a two-stage workflow to support PRs from forks. PRs from forks do not have access to repository secrets (GitHub security measure).

| Stage | Trigger | Context | Secrets Access |
|-------|---------|---------|----------------|
| Build | `pull_request` | Fork's context | No |
| Deploy | `workflow_run` | Base repo context | Yes |

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

### Preview URLs

Use Vercel's default random URL pattern (`project-name-randomString.vercel.app`).

**Rationale:**
- The `workflow_run` trigger does not have PR context, so GitHub Actions for Vercel cannot resolve PR number template variables
- Custom PR-based URLs would require additional complexity (Vercel CLI with manual alias, wildcard domain configuration)
- Random URLs are acceptable since the preview URL is posted as a PR comment

## Implementation

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

### Required Secrets

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel organization ID (from `.vercel` directory after linking) |
| `VERCEL_PROJECT_ID` | Vercel project ID (from `.vercel` directory after linking) |

## Consequences

### Positive

- PRs get automatic preview deployments with public URLs
- Works for PRs from forks (external contributors)
- Full control over build environment
- Reviewers can easily preview changes without local setup
- No additional cost (uses existing GitHub Actions minutes and Vercel free tier)

### Negative

- Preview URLs are random (not predictable based on PR number)
- Two-stage workflow is more complex than single-stage
- Requires Vercel account setup and secret management

### Neutral

- May revisit hosting platform choice if better alternatives emerge
