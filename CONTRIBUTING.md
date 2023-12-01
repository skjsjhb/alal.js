# How to Contribute

## Development Workflow

alal.js uses React and Electron to build the entire app. This empowers the overall performance, but also brings significant amout of works to do during development.

In the past days, getting alal.js to run updated code is a cumbersome job. Write the code, run several build commands, wait half a minute for the compilation, launch the application, repeat all operations done before, check for any errors. Then again. This swallows one's patience really fast and slows down the development progress.

Luckliy for us, we've recently managed to upgrade our build system for development and introduced the HMR (Hot Module Reload) feature. Development has become much easier since this change.

Below shows how we develop alal.js. These steps are only a reference, you can modify them freely to fit your styles as long as not breaking the build system.

The prerequisites are the same as described in README.

1. Clone the repository and checkout a new branch for editing:
   
   ```shell
   git clone https://github.com/skjsjhb/alal.js.git
   git checkout -b my-new-branch-blahblah
   ```

2. Enable corepack and install dependencies:
   
   ```shell
   corepack enable && yarn
   ```

3. Run extra prebuild tasks (currently only sync `jre-map.json`):
   
   ```shell
   node tools/syncJreVerMap.js # Sync jre-map.json
   ```

4. Edit code.

5. Build static debug output with changes watched:
   
   ```shell
   yarn bundle-debug --watch
   ```

6. Open another terminal, start the dev server (it watches automatically):
   
   ```shell
   yarn dev-server
   ```

7. Open another terminal and launch the app:
   
   ```shell
   yarn launch-debug
   ```

8. Make some modifications to modules or UI components. The changes take effect immediately.

9. Run tests:
   
   ```shell
   yarn bundle-autotest && yarn test
   ```
   
   Since the full test takes rather long time (hours) and large disk space (tens of GiBs), you might want to run simplified test with environment variable `ALAL_TEST_SIMPLE` set to `1`. However, before a release is published, a full test must pass.

10. Complete work and push / open a pull request.

There are several hints during the build process we think worth noticing:

- Checking out a new branch is **IMPORTANT**. See the next section for details.

- HMR does not work for the background scripts (i.e. generated `main.js`). A full restart is required for them to take effect.

- `dev-server` does **NOT** emit files and we haven't intended to let it do so. Considering this, `bundle-debug` is still required to create `main.js` as an entry point for Electron (which is not reloadable, obviously). Running both in parallel brings the best development experience, but might cause significant stuck on low-end machines.
  
  Whether to use `dev-server` is totally a personal choice, you can still use the traditional **write, build, launch, build, launch...** It's totally acceptable.

- Build steps like `node tools/syncJreVerMap.js` which are optional for users are **mandatory** for our developers.

- You may use a custom pakcage manager to install dependencies. However, we've verified that `pnpm` does **not** work. Also, when commiting code, `yarn` is still required.

## Pull Request Workflow

Here shows how to purpose your changes and let us know so that we can review them.

1. Fork the repository, clone it and checkout a new branch.

2. Make modifications are described above.

3. Test locally and push to the forked repository.

4. Open a pull request, desribing what this PR solves and what has changed, especially breaking changes or libraries newly introduced.

5. We'll review your changes and give our opinions. Either using conversations or comments.

6. Resolve the conversations.

7. If there are no other problems, this PR will be merged.

Also, some hints might be useful when doing the steps above:

- Always work on a new branch. i.e. Keep `main` on the local always a mirror of the `main` branch of ours (and yours). If you've made modifications to the main branch which has many conflicts, it might be hard to restore the original main branch.

- When syncing between remote and local, use fast-forward (or rebase) only. Avoid creating redundant merge commits.

- If there are changes to `main` since you've checked-out your branch:
  
  - First, update the main branch of your fork and local repository.
  
  - Then, if possible, try to rebase your changes on top of the newly updated main branch. Note that this might cause conflicts which must be resolved for each commit for your feature branch. If you found conflicts hard to resolve, abort the rebase.
  
  - If it's not possible or hard to rebase, use a merge commit to merge your changes into `main`. Resolve any conflicts exists. If you don't mind losing some commit history, a squash-and-merge can also make the tree cleaner.
  
  - The base branch of a PR must be up-do-date before it can be merged. Considering that, once you've synced the progress, resolve conversations as fast as possible to avoid changes from other people interfering yours.
  
  - You only need to sync once before the PR. Focus on finish the feature or bug fix, rather than waste your valuable energy on those git operations.

## Code Style

We don't have strict requirements like "do not use chained methods". However, there do exist some rules for the committed code:

- Code must be GPL-3.0 licensed or compatible.

- Name all methods and variables `inCamelCase`, modules and classes `InPascalCase`. Constants in enums should be `ALL_UPPER_CASE`. `snake_case` is discouraged and should be limited for compatibility only (e.g. `assetIndex.map_to_resources`).

- Avoid exporting classes inside a namespace if not absolutely necessary. Instead, export them at the same level.

- Do not bring namespaces in namespaces, which is considered confusing.

- Add an extra pair of parentheses around the value of assignment (`if ((condition = foo()))`) used as condition to emphasize that this is designed as so.

- Avoid using JavaScript files, which do not come with type declarations.

- Avoid over complexed method or component.

- Do not use `continue <label>` or `break <label>`.

- Do not use callbacks when a `Promise` version is available.

- Use `let` and `const` instead of `var` whenever possible.

- Write inline documents `/** */` for exported methods. No need to follow TSDoc parameters strictly, but basic and clear description is mandatory. For simple methods whose function are clear by their name and parameters, the docs can be omitted.

For other unsettled affairs, you're welcome to talk and raise your questions during the PR.

## Why a PR Might Be Closed

A pull request might not end up being merged, out of the following reasons:

- The author required.
  
  You can close a PR at any time before being merged, without any reason.

- Terrible code quality.
  
  We'll try our best to make the code reliable, but we can't always achieve this. If the code quality is too low to be fixed, then we have no choice but to reject it.

- The feature is irrelevant or not worthing its cost.
  
  Not all PRs are considered cost-effective. Let alone irrelevant commits!

- Code contains malicious code.
  
  This will harm the community and the codebase. Relevant personnel will be dealt with **seriously**.

- Unable to reach consensus on discussions.
  
  We can't just leave problems unresolved and, if neither of us can convince the other, we will have to reject the request.

- Other special circumstances.

Please understand that your PR might not ended up being merged out of these reasons. Whether this happens or not, please don't let it discourage you from raising possible suggestions or starting a new one. Each issue or PR helps us to find our faults and improve the project. Even if your code does not ultimately appear in the repository, as long as they are purposed out of good intentions, your contributionwill still be recorded and mentioned.
