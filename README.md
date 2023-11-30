# alal.js

![.](https://repository-images.githubusercontent.com/719530853/1966e2a0-d7a9-4273-8947-469dfe4ee2e7)

## Status

[![CodeQL](https://github.com/skjsjhb/alal.js/actions/workflows/codeql.yml/badge.svg)](https://github.com/skjsjhb/alal.js/actions/workflows/codeql.yml)
[![Autotest](https://github.com/skjsjhb/alal.js/actions/workflows/test.yml/badge.svg)](https://github.com/skjsjhb/alal.js/actions/workflows/test.yml)
[![Cross Packaging](https://github.com/skjsjhb/alal.js/actions/workflows/package.yml/badge.svg)](https://github.com/skjsjhb/alal.js/actions/workflows/package.yml)
![GitHub License](https://img.shields.io/github/license/skjsjhb/alal.js)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/skjsjhb/alal.js)

## What Is This?

**alal.js**, (i.e. **Al**icorn **A**gain **L**auncher **J**ava**S**cript Edition), is a successor of the
unmaintained [Alicorn](https://github.com/Andy-K-Sparklight/Alicorn) launcher.

We originally forked the repository and decide to refactor it, fix bugs and then republish. However, during the code
review, we doubt the benefit of refactoring compared with restarting a standalone project. We selected the latter and
created project alal.js here.

Most modules and code are wiped and the code is written from scratch, but some build tools are continuing to be used.
Though this project is now on a different road from Alicorn, it's heavily inspired by that, and we're still crediting
the original work by naming our project alal.js.

## Disclaimer

**alal.js** is not an official follow-up project of Alicorn. It's made by a user of Alicorn for hobby and with good
intends. However, apart from some common collaborators, alal.js is neither affiliated with Alicorn Launcher, nor Mojang
Studios, Microsoft Corp. or other unmentioned individuals or organizations.

## Build

### In Short - If You've Done This Kind of Thing Before

```shell
yarn && yarn bundle-release && yarn make-release
```

### Targets

alal.js uses **webpack** and **electron-builder** to build the app. We've pre-configured several targets for the
following scenarios:

- Debug - Development build for realtime running. Used actively during the code-and-test process. This target contains
  source map for tracing.

- Autotest - Development build for automated testing. Test modules are embedded into the application by a specially
  designed test entry. The test system runs parallel with the application, reflects the most realistic and convincing
  test results. This target builds using development config, but without a source map.

- Release - Production build for releases. This is not the final version handed to users, but being part of the
  ingredients.

### Prerequisites

- Node.js 18+ with corepack

- Git

- Node.js toolchain (If building native libraries on Windows ARM)

### How To

We've created seperated all-in-one scripts for the build. Below is an example of running the **release** build, but *
*debug** and **autotest** are also similar.

1. Clone the repository.

   ```shell
   git clone https://github.com/skjsjhb/alal.js.git --depth 1
   ```

   If you're trying to contribute, please consider forking over cloning directly.

2. Enable corepack and install deps:

   ```shell
   corepack enable && yarn
   ```

   You may encounter build failures for this step. If you see anything related to `lzma-native`, this is OK - Your
   platform does not have prebuilt binaries and nor can the build tools create one. See **Hints** below for details
   about this.

3. Bundle scripts:

   ```shell
   yarn bundle-release
   ```

4. Pack the application output:

   ```shell
   yarn make-release
   ```

   Output files locates at `dist/<target>`.

### Hints

- We maintain a file `jre-map.json` to keep up-to-date with the latest Mojang JRE manifests. This file should be updated
  once a new profile releases. To do that, run the following command before build:

  ```shell
  node tools/syncJreVerMap.js
  ```

- `lzma-native` is disabled by default for platform `win32-arm64` and `darwin-arm64` (and other platforms not officially
  supported), as the library does not come with a valid prebuilt (either missing or malfunctioned). We use a JS-based
  implementation under this case. Usages of LZMA are also reduced.

  However, the software version is comparably slow and (more importantly) unreliable due to the lack of maintenance of
  the package. You might want to enable `lzma-native` manually. To do that:

    1. Confirm that `lzma-native` has been built successfully (`yarn` and check for any errors).

    2. Rebuild libraries using `@electron/rebuild` (`yarn electron-rebuild` will work).

    3. Edit `resources/build/feature-matrix.json`, and add an entry:

       ```json5
       [
           //... Other rules
           {
             "enable": true,
             "platform": "^win32-arm64$", // Or your platform name
             "value": [
               "lzma-native"
             ]
           }
       ]
       ```

    4. Edit `resource/build/resource-map.json`, and add a field:

       ```json5
       { 
           // ...
           "<source/to/your/build>": "natives/lzma/${platform}/electron.napi.node"
       }
       ```

       Where `<source/to/your/build>` should be the path to the rebuilt binaries **for electron**. If there are any
       dependencies (e.g. `liblzma.dll`), add extra entries to make the copy plugin realize their existence.

    5. Run to check whether these modifications work.

- The package script only builds the same output as the runner's platform. i.e. On macOS only macOS packages are built,
  etc. However, architecture of the host does not matter. (x64 packages can be built on arm64 and vice versa)

- If you're using yarn v1, do not run `yarn` directly. It will refuse to install.

## Copying

Copyright (C) 2023 Ted "skjsjhb" Gao (skjsjhb). alal.js is no longer affiliated with Alicorn Launcher.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not,
see <https://www.gnu.org/licenses/>.
