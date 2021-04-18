# file-size-impact

Add files size impact into pull requests.

[![github package](https://img.shields.io/github/package-json/v/jsenv/jsenv-file-size-impact.svg?label=package&logo=github)](https://github.com/jsenv/jsenv-file-size-impact/packages)
[![npm package](https://img.shields.io/npm/v/@jsenv/file-size-impact.svg?logo=npm&label=package)](https://www.npmjs.com/package/@jsenv/file-size-impact)
[![workflow status](https://github.com/jsenv/jsenv-file-size-impact/workflows/ci/badge.svg)](https://github.com/jsenv/jsenv-file-size-impact/actions?workflow=ci)
[![codecov](https://codecov.io/gh/jsenv/jsenv-file-size-impact/branch/master/graph/badge.svg)](https://codecov.io/gh/jsenv/jsenv-file-size-impact)

# Table of contents

- [Presentation](#Presentation)
- [Size impact legend](#Size-impact-legend)
- [Configuring a github workflow](#Configuring-a-github-workflow)
- [Configuring a workflow](#configuring-a-workflow)
- [API](#API)
- [How it works](#How-it-works)
- [See also](#See-also)

# Presentation

`@jsenv/file-size-impact` analyses a pull request impact on specific files size. This analysis is posted in a comment of the pull request.

![screenshot of pull request comment](./docs/comment-collapsed.png)

The comment can be expanded to see details.

![screenshot of pull request comment expanded](./docs/comment-expanded.png)

</details>

- Compatible with any workflow like GitHub or Jenkins
- Can track compressed file size
- Configurable to create group of files according to your project. For exemple you can create one group with critical files and a second one for less important files.

# Pull request comment

This section document how to read two parts of the size impact comment: `group summary` and `size impact`.

![legend of pull request comment](./docs/comment-legend.png)

## group summary

"critical files (1/2)"

Translates into the following sentence:

"There is a group of files named `critical files` and pull request impacts `1` out of `2` files in this group".

## size impact

"83.45KB (+6.84KB / +8.92%)"

Translates into the following sentence:

"The size after merge is `83.45KB` and pull request adds `6.84KB` representing an increase of `8.92%` of the size before merge"

# Configuring a GitHub workflow

You need:

<details>
  <summary>1. @jsenv/file-size-impact in devDependencies</summary>

```console
npm install --save-dev @jsenv/file-size-impact
```

</details>

<details>
  <summary>2. Create a script file</summary>

`.github/workflows/report-size-impact.js`

```js
import { reportFileSizeImpact, readGithubWorkflowEnv } from "@jsenv/file-size-impact"

reportFileSizeImpact({
  ...readGithubWorkflowEnv(),
  buildCommand: "npm run dist",
  trackingConfig: {
    "dist/commonjs": {
      "./dist/commonjs/**/*": true,
      "./dist/commonjs/**/*.map": false,
    },
  },
})
```

</details>

<details>
  <summary>3. Create a workflow.yml file</summary>

`.github/workflows/size-impact.yml`

```yml
name: size-impact

on: pull_request_target

jobs:
  size-impact:
    strategy:
      matrix:
        os: [ubuntu-latest]
        node: [14.5.0]
    runs-on: ${{ matrix.os }}
    name: report size impact
    steps:
      - name: Setup git
        uses: actions/checkout@v2
      - name: Setup node ${{ matrix.node }}
        uses: actions/setup-node@v1
        with:
          node-version: ${{ matrix.node }}
      - name: npm install
        run: npm install
      - name: Report size impact
        run: node ./.github/workflows/report-size-impact.js
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

</details>

# Configuring a workflow

<details>
  <summary>1. @jsenv/file-size-impact in devDependencies</summary>

```console
npm install --save-dev @jsenv/file-size-impact
```

</details>

<details>
  <summary>2. Create a script file (depends what you use)</summary>

When outside a github workflow you must provide `{ projectDirectoryUrl, githubToken, repositoryOwner, repositoryName, pullRequestNumber }` "manually" to `reportFileSizeImpact`.

The code below is an example for Travis.

`report-size-impact.js`

```js
import { reportFileSizeImpact } from "@jsenv/file-size-impact"

reportFileSizeImpact({
  projectDirectoryUrl: process.env.TRAVIS_BUILD_DIR,
  githubToken: process.env.GITHUB_TOKEN,
  repositoryOwner: process.env.TRAVIS_REPO_SLUG.split("/")[0],
  repositoryName: process.env.TRAVIS_REPO_SLUG.split("/")[1],
  pullRequestNumber: process.env.TRAVIS_PULL_REQUEST,

  buildCommand: "npm run-script dist",
  trackingConfig: {
    "dist/commonjs": {
      "./dist/commonjs/**/*": true,
      "./dist/commonjs/**/*.map": false,
    },
  },
})
```

</details>

<details>
  <summary>3. Create a GitHub token</summary>

In order to have `process.env.GITHUB_TOKEN` you need to create a github token with `repo` scope at https://github.com/settings/tokens/new. After that you need to setup this environment variable. The exact way to do this is specific to your project and tools. Applied to travis you could add it to your environment variables as documented in https://docs.travis-ci.com/user/environment-variables/#defining-variables-in-repository-settings.

</details>

<details>
  <summary>4. Create your workflow (depends what you use)</summary>

`reportFileSizeImpact` must be called in a state where your git repository has been cloned and you are currently on the pull request branch. Inside github workflow this is done by the following lines in `file-size-impact.yml`.

```yml
uses: actions/checkout@v2
uses: actions/setup-node@v1
with:
  node-version: ${{ matrix.node }}
run: npm install
```

In your CI you must replicate this, the corresponding commands looks as below:

```console
git init
git remote add origin $GITHUB_REPOSITORY_URL
git fetch --no-tags --prune origin $PULL_REQUEST_HEAD_REF
git checkout origin/$PULL_REQUEST_HEAD_REF
npm install
node ./report-size-impact.js
```

</details>

# API

## reportFileSizeImpact

`reportFileSizeImpact` is an async function that will generate file size impact analysis on a pull request and post a comment with the result of this analysis.

<details>
  <summary>reportFileSizeImpact code example</summary>

```js
import { reportFileSizeImpact, raw } from "@jsenv/file-size-impact"

await reportFileSizeImpact({
  logLevel: "info",
  projectDirectoryUrl: "file:///directory",
  githubToken: "xxx",
  repositoryOwner: "jsenv",
  repositoryName: "jsenv-file-size-impact",
  pullRequestNumber: 10,
  installCommand: "npm install",
  buildCommand: "npm run build",
  trackingConfig: {
    dist: {
      "./dist/**/*.js": true,
    },
  },
  transformations: { raw },
  manifestConfig: {
    "./dist/**/manifest.json": true,
  },
})
```

[implementation](../src/reportFileSizeImpact.js)

</details>

<details>
  <summary>projectDirectoryUrl parameter</summary>

`projectDirectoryUrl` parameter is a string leading to your project root directory. This parameter is **required**.

  </details>

<details>
  <summary>logLevel parameter</summary>

`logLevel` parameter controls verbosity of logs during the function execution.

The list of available logLevel values can be found on [@jsenv/logger documentation](https://github.com/jsenv/jsenv-logger#list-of-log-levels)

</details>

<details>
  <summary>trackingConfig parameter</summary>

`trackingConfig` parameter is an object used to configure group of files you want to track. This parameter is optional with a default value exported in [src/jsenvTrackingConfig.js](./src/jsenvTrackingConfig.js)

`trackingConfig` keys are group names that will appear in the generated comment.
`trackingConfig` values are objects associating a pattern to a value. This object is refered as `metaValueMap` in https://github.com/jsenv/jsenv-url-meta.

For example you can create two groups named `critical files` and `remaining files` like this:

```js
import { reportFileSizeImpact } from "@jsenv/file-size-impact"

reportFileSizeImpact({
  trackingConfig: {
    "critical files": {
      "./dist/main.js": true,
      "./dist/main.css": true,
    },
    "remaining files": {
      "./dist/**/*.js": true,
      "./dist/**/*.css": true,
      "./dist/main.js": false,
      "./dist/main.css": false,
    },
  },
})
```

</details>

<details>
  <summary>transformations parameter</summary>

`transformations` parameter is an object used to transform files content before computing their size. This parameter is optional with a default tracking file size without transformation called `raw`.

You can use this parameter to track file size after gzip compression.

```js
import { reportFileSizeImpact, raw, gzip, brotli } from "@jsenv/file-size-impact"

reportFileSizeImpact({
  transformations: { raw, gzip, brotli },
})
```

![screenshot of pull request comment with gzip and brotli](./docs/comment-compression.png)

`raw`, `gzip` and `brotli` compression can be enabled this way.

It's also possible to control compression level.

```js
import { reportFileSizeImpact, raw, gzip } from "@jsenv/file-size-impact"

reportFileSizeImpact({
  transformations: {
    raw,
    gzip7: (buffer) => gzip(buffer, { level: 7 }),
    gzip9: (buffer) => gzip(buffer, { level: 9 }),
  },
})
```

Finally `transformations` can be used to add custom transformations.

```js
import { reportFileSizeImpact, raw, gzip, brotli } from "@jsenv/file-size-impact"

reportFileSizeImpact({
  transformations: {
    raw,
    trim: (buffer) => String(buffer).trim(),
  },
})
```

</details>

<details>
  <summary>installCommand parameter</summary>

`installCommand` parameter is a string representing the command to run in order to install things just after a switching to a git branch. This parameter is optional with a default value of `"npm install"`.

</details>

<details>
  <summary>buildCommand parameter</summary>

`buildCommand` parameter is a string representing the command to run in order to generate files. This parameter is optional with a default value of `"npm run-script build"`.

</details>

<details>

  <summary>manifestConfig parameter</summary>

`manifestConfig` parameter is an object used to configure the location of an optional [manifest file](#Manifest-file). This parameter is optional with a default considering `dist/**/manifest.json` as manifest files.

This parameter reuses the shape of `trackingConfig parameter` (associating pattern + value).

```js
import { reportFileSizeImpact } from "@jsenv/file-size-impact"

reportFileSizeImpact({
  manifestConfig: {
    "./dist/**/manifest.json": true,
  },
})
```

You can disable manifest file handling by passing `manifestConfig: null`.

</details>

<details>
  <summary>runLink parameter</summary>

`runLink` parameter allow to put a link to the workflow run in the generated comment body. It is used to indicates where file size impact was runned.

![screenshot of pull request comment where runlink is highlighted](./docs/runlink-highlighted.png)

This parameter is returned by [readGithubWorkflowEnv](#readGithubWorkflowEnv) meaning it comes for free inside a GitHub workflow.

Inside an other workflow, you can pass your own `runLink`. As in the example below where it is assumed that script is runned by jenkins.

```js
import { reportFileSizeImpact } from "@jsenv/file-size-impact"

reportFileSizeImpact({
  runLink: {
    url: process.env.BUILD_URL,
    text: `${process.env.JOB_NAME}#${process.env.BUILD_ID}`,
  },
})
```

</details>

## readGithubWorkflowEnv

`readGithubWorkflowEnv` is a function meant to be runned inside a GitHub workflow. It returns an object meant to be forwarded to [reportFileSizeImpact](reportFileSizeImpact).

<details>
  <summary>readGithubWorkflowEnv code example</summary>

```js
import { reportFileSizeImpact, readGithubWorkflowEnv } from "@jsenv/file-size-impact"

const githubWorkflowEnv = readGithubWorkflowEnv()

reportFileSizeImpact({
  projectDirectoryUrl: new URL("./", import.meta.url),
  ...githubWorkflowEnv,
})
```

`githubWorkflowEnv` object looks like this:

```js
const githubWorkflowEnv = {
  projectDirectoryUrl: "/home/runner/work/repo-name/repo-name",
  githubToken: "xxx",
  repositoryOwner: "jsenv",
  repositoryName: "jsenv-file-size-impact",
  pullRequestNumber: 10,
  runLink: {
    url: "https://github.com/jsenv/jsenv-file-size-impact/actions/runs/34",
    text: "workflow-name#34",
  },
}
```

[implementation](../src/readGithubWorkflowEnv.js).

</details>

# Manifest file

File size impact is comparing the files generated before merging and after merging the pull request. If the generated files have dynamic names the files after merge will always be considered as new files. Manifest file allows to compare file with dynamic names.

The content of a manifest file looks like this:

```json
{
  "dist/file.js": "dist/file.4798774987w97er984798.js"
}
```

These files are generated by build tools. For example by [webpack-manifest-plugin](https://github.com/danethurber/webpack-manifest-plugin) or [rollup-plugin-output-manifest](https://github.com/shuizhongyueming/rollup-plugin-output-manifest/tree/master/packages/main).

# Exclude specific size impacts

Size impact analysis occurs only if the file was deleted, added or modified between the base branch and after merging. To detect if the file is modified we compare file content on base branch and after merging. By default every file size impact is shown. You can control if the file ends up displayed in the github comment using [showSizeImpact](#showSizeImpact).

When excluded, an impact is not taken into account.

![screenshot of pull request comment with collapsed groups](./hidden-details-nested.png)

But when a group contains excluded impacts it has a details with excluded impacts inside.

![screenshot of pull request comment with collapsed hidden impacts](./hidden-details-collapsed.png)

Opening the hidden details shows impacts that where excluded in this group.

![screenshot of pull request comment with expanded hidden impacts](./hidden-details-expanded.png)

## showSizeImpact

`showSizeImpact` is a function that can appear in your `trackingConfig` as shown in the code below.

```js
import { reportFileSizeImpact, raw } from "@jsenv/file-size-impact"

await reportFileSizeImpact({
  transformations: { raw },
  trackingConfig: {
    dist: {
      "**/*.html": {
        showSizeImpact: ({ sizeImpactMap }) => Math.abs(sizeImpactMap.raw) > 10,
      },
    },
  },
})
```

`showSizeImpact` receives named parameters and should return a boolean. To illustrates the named parameter you will receive check the code below. It shows an example of how it could be called.

```js
showSizeImpact({
  fileRelativeUrl: "dist/file.js",
  event: "modified",
  sizeMapBeforeMerge: {
    raw: 200,
    gzip: 20,
  },
  sizeMapAfterMerge: {
    raw: 300,
    gzip: 15,
  },
  sizeImpactMap: {
    raw: 100,
    gzip: -5,
  },
})
```

### fileRelativeUrl

A string representing the file url relative to [projectDirectoryUrl](#projectDirectoryUrl).

### event

A string that can be either `added`, `removed`, `modified`.

### sizeMapBeforeMerge

An object mapping all transformations to a number corresponding to file size on base branch. This parameter is `null` when event is `added` because the file did not exists on base branch.

### sizeMapAfterMerge

An object mapping all transformations to a number corresponding to file size after merging pr in base branch. This parameter is `null` when event is `deleted` because the file is gone.

### sizeImpactMap

An object mapping all transformations to a number representing impact on that file size.

# How it works

In order to analyse the impact of a pull request on file size the following steps are executed:

1. Checkout pull request base branch
2. Execute command to generate files (`npm build` by default)
3. Take a snapshot of generated files
4. Merge pull request into its base
5. Execute command to generate files again
6. Take a second snapshot of generated files
7. Analyse differences between the two snapshots
8. Post or update comment in the pull request

# See also

- An other repository from jsenv monitoring pull requests impacts but on lighthouse score: https://github.com/jsenv/jsenv-lighthouse-score-impact

- A similar GitHub action called `compressed-size-action`: https://github.com/preactjs/compressed-size-action

- A related GitHub action called `size-limit`: https://github.com/andresz1/size-limit-action
