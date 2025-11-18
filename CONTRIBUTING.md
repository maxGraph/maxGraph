# Contributing Guidelines

Thank you for your interest in contributing to `maxGraph`! We welcome contributions from the community and appreciate your help in making this project better.

All members of our community are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Please ensure you are welcoming and friendly in all of our spaces.

## Table of Contents

- [Before You Start](#before-you-start)
- [Ways to Contribute](#ways-to-contribute)
- [Reporting Issues](#reporting-issues)
- [Contributing Code or Documentation](#contributing-code-or-documentation)
- [Pull Request Process](#pull-request-process)
- [Additional Resources](#additional-resources)

## Before You Start

**⚠️ IMPORTANT: Always communicate before starting work on an issue!**

Before you invest time in working on code changes, please follow these critical steps:

1. **Find or create an issue** - Check if an issue already exists for what you want to work on. If not, create one first.

2. **Comment on the issue** - Leave a comment stating that you would like to work on it. This is **mandatory** and helps us:
   - Confirm that you understand the requirements the same way we do
   - Verify that your proposed implementation approach aligns with project expectations
   - Avoid duplicate work (multiple people working on the same issue)
   - Provide guidance and feedback before you invest significant time

3. **Wait for assignment** - A maintainer will review your comment and assign you to the issue if appropriate. **Do not start coding until you are assigned.**

4. **Understand the scope** - Make sure you fully understand the issue requirements and any technical constraints before beginning work.

**Why is this important?**
- It maximizes the chances of your contribution being accepted
- It prevents wasted effort on approaches that won't be merged
- It ensures contributions are integrated quickly into the project
- It helps maintain code quality and consistency

**Not following this process may result in your Pull Request being rejected**, even if the code is good, because it might not align with project direction or may duplicate other ongoing work.

## Ways to Contribute

There are many valuable ways to contribute to `maxGraph`:

- **Help others** - Answer questions on [GitHub Issues](https://github.com/maxGraph/maxGraph/issues)
- **Report bugs** - Submit bug reports using the [bug report template](#reporting-issues)
- **Request features** - Suggest new features or enhancements
- **Write code** - Fix bugs or implement new features
- **Improve documentation** - Help make our docs clearer and more comprehensive
- **Enhance examples** - Improve the [example applications](https://github.com/maxGraph/maxgraph-integration-examples) to better demonstrate features

## Reporting Issues

### Using Issue Templates

**⚠️ CRITICAL: Always use the appropriate issue template when creating an issue.**

When creating a new issue, GitHub will present you with several templates to choose from:

- **Bug Report** - For reporting bugs or unexpected behavior
- **Feature Request** - For suggesting new features or enhancements
- **Documentation Request** - For documentation improvements
- **Technical Request** - For technical debt, refactoring, or infrastructure improvements

### Bug Reports - Complete Information Required

**⚠️ WARNING: Bug reports that do not provide complete information will be rejected or closed.**

When filing a bug report, you **MUST** fill out **ALL** sections of the template:

- **Describe the bug** - Clear, concise description
- **To Reproduce** - Detailed step-by-step instructions
- **Expected behavior** - What should happen
- **Screenshots** - Visual evidence (if applicable)
- **Environment** - ALL environment details:
  - `maxGraph` version or commit
  - Desktop or mobile
  - OS and version
  - Browser and version
  - Node/npm version (if applicable)
  - Used frameworks (if applicable)
- **Additional context** - Any other relevant information

**Incomplete bug reports waste maintainer time and delay fixes for everyone.** If you don't provide enough information, your issue will be closed, and you'll be asked to create a new one with complete details.

### Best Practices for Issues

- **One issue per bug or feature** - Do not combine multiple unrelated issues. Create separate issues for each problem.
- **Search first** - Check if your issue already exists before creating a new one
- **Be specific** - Provide concrete examples and reproduction steps
- **Use text, not images** - Include code and error messages as text (not screenshots) so they're searchable
- **Include a minimal reproduction** - If possible, provide a repository or code snippet that demonstrates the issue

## Contributing Code or Documentation

### Prerequisites

Before making code or documentation changes, ensure you have:

1. **Created or identified an issue** to work on
2. **Commented on the issue** expressing your intent to work on it
3. **Been assigned** to the issue by a maintainer
4. **Understood** the requirements and received any necessary guidance

### Development Setup

1. **Fork the repository** - [Fork maxGraph](https://help.github.com/articles/fork-a-repo) to your GitHub account

2. **Clone your fork**
   ```sh
   git clone https://github.com/YOUR-USERNAME/maxGraph.git
   cd maxGraph
   ```

3. **Set up the development environment**

   NodeJS requirements:
   - Use the version declared in `.nvmrc` (other versions may work but are not supported)
   - This is the version used by GitHub Actions
   - nvm users can run `nvm use` (if the Node version is not installed, nvm will show installation instructions)

   **Note**: maxGraph relies on npm workspaces to build.

   ```sh
   nvm use              # Use the correct Node.js version
   npm install          # Install dependencies
   ```

4. **Create a descriptive branch** - Use a clear, descriptive name:
   ```sh
   git checkout -b feat/25-add-annotation-support
   ```

   Branch naming convention:
   - `feat/ISSUE_NUMBER-short-description` - For new features
   - `fix/ISSUE_NUMBER-short-description` - For bug fixes
   - `docs/ISSUE_NUMBER-short-description` - For documentation
   - `refactor/ISSUE_NUMBER-short-description` - For refactoring

   Example: `feat/25-annotations_to_tasks` or `fix/42-edge-rendering-safari`

### Development Commands

Here are the most common commands you'll use during development:

**Watch and develop:**
```sh
# Watch and rebuild core package (run in one terminal)
npm run dev -w packages/core

# Watch and run Storybook examples (run in another terminal)
npm run dev -w packages/html
```

Since both commands are in watch mode, it's recommended to open two terminals and run them separately. When a file is saved from the core package, the Storybook will automatically update.

For more details about `@maxgraph/html`, see the README that explains the [maxGraph storybook package](./packages/html/README.md).

**Building:**
```sh
# Build everything (core package, Storybook, examples)
npm run all

# Build only the core package
npm run build -w packages/core

# Build Storybook mini-site
npm run build -w packages/html
```

**Testing:**
```sh
# Run all tests
npm test -w packages/core

# Run tests with coverage
npm test -w packages/core -- --coverage

# Run a specific test file
npm test -w packages/core -- path/to/test.test.ts
```

**Code quality:**
```sh
# Lint all TypeScript files
npm run lint

# Lint with auto-fix
npm run lint:fix

# Check for circular dependencies
npm run check:circular-dependencies -w packages/core
```

**📚 Additional resources:**
- [CLAUDE.md](CLAUDE.md) - Detailed architecture, commands, and development patterns
- `packages/website/docs/development/` - API descriptions, release procedures, and development guidance

### Development Guidelines

Follow these guidelines while developing:

1. **Keep changes focused** - Each Pull Request should address **one** issue only. Do not combine multiple features or fixes.

2. **Don't modify unrelated files** - Only change files relevant to your feature or bugfix (avoid changes to `.gitignore`, configs, etc. unless that's the purpose of your PR).

3. **Write tests** - Provide tests for your changes whenever possible:
   - Add automated tests in `packages/core/__tests__/`
   - Or create/update a Storybook story in `packages/html/stories/`

4. **Follow code style** - Match the existing code style in the project. The linter will help catch issues.

5. **Update documentation** - Add or update documentation as needed for your changes.

6. **Test thoroughly** - Before opening a PR, run the full test suite:
   ```sh
   npm run all
   ```
   This runs build, checks, and tests. **All must pass.**

### Commit Messages

There is no strict convention for commit messages within your branch, as:
- All Pull Requests are merged via squash commits
- The PR title becomes the commit message in the `main` branch

However, the **PR title** must follow the [Conventional Commits](https://www.conventionalcommits.org/) standard (see [Pull Request Process](#pull-request-process)).

## Pull Request Process

### Before Opening a Pull Request

Ensure you have:

1. ✅ Discussed the issue with maintainers and been assigned
2. ✅ Made focused changes addressing only one issue
3. ✅ Added tests demonstrating your fix/feature works
4. ✅ Updated relevant documentation
5. ✅ Run `npm run all` successfully (build, checks, tests pass)
6. ✅ Prepared screenshots/videos demonstrating the change (if UI-related)

### Opening a Pull Request

**⚠️ CRITICAL: You MUST use the Pull Request template when creating a PR.**

When you open a Pull Request, GitHub will automatically populate it with the PR template. **You must fill out all sections completely:**

#### 1. PR Checklist

The template includes a checklist that you **must** review and check off:

- [ ] Addresses an existing open issue with `closes #ISSUE_NUMBER` (or explain why not needed)
- [ ] You have discussed this issue with maintainers and are assigned to it
- [ ] The scope is sufficiently narrow to be reviewed in a single session
- [ ] Tests are included (automated tests or Storybook stories)
- [ ] Screenshots/videos provided (or explain why not relevant)
- [ ] Documentation added/updated (or explain why not needed)
- [ ] PR title follows Conventional Commits guidelines

**Do not skip checklist items.** If an item isn't applicable, explain why in the PR description.

#### 2. PR Title - Conventional Commits

Your PR title **must** follow this format:

```
<type>[optional scope]: <lowercase description>
```

**Types:**
- `feat` - New feature or enhancement
- `fix` - Bug fix
- `refactor` - Code refactoring (no functional changes)
- `docs` - Documentation changes
- `chore` - Maintenance (dependencies, build, config)
- `test` - Adding or updating tests
- `perf` - Performance improvements
- `style` - Code style changes (formatting, whitespace)

**Examples:**
- ✅ `feat: add annotation support for cells`
- ✅ `fix(edge): correct rendering issue in Safari`
- ✅ `docs: update contributing guidelines`
- ✅ `refactor(layout): simplify ParallelEdgeLayout implementation`
- ✅ `chore(deps): update TypeScript to 5.3`

**Scope** (optional): Component or module name in parentheses

**Note:** The PR title becomes the commit message when merged, so make it clear and descriptive.

#### 3. Overview Section

In the Overview section, provide:

- **What and why** - Explain what changes you made and why they were necessary
- **How** - Describe how your code achieves the goal
- **Issue reference** - Include `closes #ISSUE_NUMBER` or `fixes #ISSUE_NUMBER` to auto-close the issue when merged
- **Breaking changes** - If your PR includes breaking changes, explicitly mark this in the title with `!` (e.g., `feat!: change API signature`) and document in the overview

#### 4. Notes Section

Use the Notes section for:
- Additional context for reviewers
- Known limitations or trade-offs
- Areas where you'd like specific feedback
- Related issues or PRs

### After Submitting

- **Be responsive** - Respond to review comments promptly
- **Accept feedback** - Be willing to accept constructive criticism and improve your code
- **Be patient** - This is an open-source project maintained by volunteers. Reviews may take time.
- **Keep your PR updated** - If the `main` branch advances, you may need to rebase or merge

**Working on your first Pull Request?** Check out this free series: [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github)

## Additional Resources

- **Project priorities** - Check [GitHub Milestones](https://github.com/maxGraph/maxGraph/milestones) to see current priorities and roadmap
- **Issue templates** - Available at `.github/ISSUE_TEMPLATE/`
- **PR template** - Available at `.github/pull_request_template.md`
- **Code of Conduct** - See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- **Conventional Commits** - Learn more at [conventionalcommits.org](https://www.conventionalcommits.org/)

---

Thank you for contributing to maxGraph! Your efforts help make this project better for everyone. 🙏
