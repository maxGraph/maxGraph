---
name: storybook-check
description: "Check that every Storybook story of packages/html renders without error, both in dev mode (storybook dev) and in prod mode (static storybook build), by loading each story in headless Chromium. Use to validate a Storybook or Vite upgrade, such as a Dependabot pull request bumping the storybook group, a change to packages/html/.storybook, or a change to @maxgraph/core that may break the stories."
---

# Storybook check

Run the script from the repository root, with the scratchpad of the session as work directory:

```bash
STORYBOOK_CHECK_DIR=<scratchpad>/storybook-check .claude/skills/storybook-check/scripts/check-storybook.bash [dev|prod|all] [--skip-build]
```

- Mode defaults to `all`. Set the Bash timeout to 600000: a full run takes several minutes.
- Without `--skip-build`, it builds `packages/core` and, for the prod mode, `packages/html`. Pass `--skip-build` only
  when both builds are already fresh for the current checkout.
- `node_modules` must match the lock file. After checking out a branch that changes `package-lock.json`, run
  `npm ci` first, otherwise the check validates the previous versions.
- `playwright-core` is installed in the work directory on the first run, never in the repository. The browser is the
  most recent Chromium cached in `~/.cache/ms-playwright`; set `CHROMIUM_PATH` to use another one.

## What it reports

For each mode, the number of stories and, per story: no SVG rendered, uncaught errors, console errors, HTTP responses
of 400 and above. Build and server log lines containing `error` or `warn` are listed too, with the path of the full
log. The last line is `PASS` or `FAIL`, matching the exit code.

## Reading the result

A problem is caused by the change under test only if `main` does not have it. When the run fails, run it again on
`main` (with a dependency upgrade, `npm ci` there too) and report only the difference; list the problems present on
both as pre-existing. Vite's chunk size warning in the build log is expected.

The script stops its servers on exit. Never stop them with `pkill -f "storybook dev"`: the pattern matches the shell
running it, which gets killed too.
