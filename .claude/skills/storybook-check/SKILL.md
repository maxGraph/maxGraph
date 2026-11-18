---
name: storybook-check
description: "Check that every Storybook story of packages/html renders without error, both in dev mode (storybook dev) and in prod mode (static storybook build), by loading each story in headless Chrome. Use to validate a Storybook or Vite upgrade, such as a Dependabot pull request bumping the storybook group, a change to packages/html/.storybook, or a change to @maxgraph/core that may break the stories."
argument-hint: "[dev|prod|all] [--skip-build]"
---

# Storybook check

Arguments: `$ARGUMENTS`

Run the script from the repository root, passing the arguments unchanged (none means `all`):

```bash
.claude/skills/storybook-check/scripts/check-storybook.bash [dev|prod|all] [--skip-build]
```

- Mode defaults to `all`. Set the Bash timeout to 600000: a full run takes several minutes. Each story rendering no
  SVG waits 5 seconds, so when most stories fail, a run of both modes exceeds that timeout and gets killed before its
  result: run `dev` and `prod` as separate calls then.
- Without `--skip-build`, it builds `packages/core` and, for the prod mode, `packages/html`. Pass `--skip-build` only
  when these builds are already fresh for the current checkout.
- `npm ci` must have been run for the current checkout, also after checking out a branch that changes
  `package-lock.json`, otherwise the check validates the previous versions. The script also needs `curl`, and network
  access on its first run to install `playwright-core`. It applies `.nvmrc` through nvm when nvm is installed.
- Ports 8901 (dev) and 8902 (prod) must be free: the mode fails if something already listens there, such as a running
  `npm run dev -w packages/html`, possibly from another worktree. Never stop a server you did not start: choose other
  ports with `STORYBOOK_CHECK_DEV_PORT` and `STORYBOOK_CHECK_PROD_PORT`.
- The browser is the local Google Chrome, or `STORYBOOK_CHECK_BROWSER_PATH` when set, any Chromium based executable.
  Without either, an already downloaded Playwright Chromium is used, otherwise the script names the command installing
  one.
- `playwright-core`, pinned in the script, and the logs go to `STORYBOOK_CHECK_DIR`, by default
  `~/.cache/maxgraph-storybook-check`, never into the repository.

## What it reports

For each mode, the browser used, the number of stories, the stories rendering no SVG within 5 seconds, then the
problems: navigation errors, uncaught errors, console errors, HTTP responses of 400 and above except `favicon.ico`, and
requests failing at network level. The Storybook UI itself is checked once, with a 30 seconds timeout. Build and
server log lines containing `error` or `warn` are listed too, with the path of the full log.

Once the checks have run, the last line is `PASS` or `FAIL`, matching the exit code: a busy port or a server that did
not start counts as a failed mode. A build failure exits with 1, naming its log. Exit code 2 means the check could not
run at all: unknown argument, no Node or wrong Node version, `playwright-core` install failed, no browser found, or
`index.json` unreadable.

## Reading the result

A problem is caused by the change under test only if `main` does not have it. When the run fails, run it again on
`main` (with a dependency upgrade, `npm ci` there too) and report only the difference; list the problems present on
both as pre-existing. Vite's chunk size warning in the Storybook build log is expected.

The script stops its servers on exit. Never stop them with `pkill -f "storybook dev"`: the pattern matches the shell
running it, which gets killed too.
