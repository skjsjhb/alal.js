# Alicorn Launcher Again (JS Edition)

## This Is a Fork

The story has ended, really, but I'll light up everything again.

This is a fork of a the original [Alicorn](https://github.com/Andy-K-Sparklight/Alicorn) repository. See the original README there. The name **ALAL** stands for **AL**icorn **A**gain **L**auncher. 

## Disclaimer

**ALAL is not compatible with Alicorn Legacy.** The data file format is updated and containers have changed a lot. No backward compatibility is guaranteed.

Many packages of the original author is not possible to update in a few commits, they might get updated soon to avoid vulnerabilities, but with no warranty.

The fork is made to keep the software alive, not a follow-up or series. The updates are made out of good intentions, but still, with no warranty.

## What To Update

- **Add Tests**: The original repository contains no tests.

- **Remove Unused Modules**: Many unused features should be discarded.

- **Fix Bugs**: There are several bugs with the latest game. They should be fixed.

- **Improve Download Speed**: Add an aria2 daemon as a faster download alternative.

- **Improve UI**: The UI needs to be clearer.

- **Support macOS**: We're restarting to macOS.

## Build

#### Build Executable

To build Alicorn, you'll need:

- [Node.js](https://nodejs.org)

- [Git](https://git-scm.com)

- Clone the repository:
  
  ```shell
  git clone https://github.com/Andy-K-Sparklight/Alicorn.git --depth=1
  ```

- Install dependencies:
  
  ```shell
  yarn
  ```

- Run build:
  
  ```shell
  yarn make
  ```
  
  This will generate binaries and put them under `out`, including Windows x64, Windows ia32, GNU/Linux x64, GNU/Linux arm64 ~~and macOS x64~~. This will also generate corresponding archives.
  
  _The support for macOS has ended and no more platform dependent code will be commited. The modules present are still kept, but might not run correctly._
  
  You also need `wine` to complete the cross build progress on platforms other than Windows. Follow the instructions given by `electron-packager`.
