import { ipcRenderer, webFrame, crashReporter, contextBridge } from 'electron';
// @ts-check
(function () {
  // #######################################################################
  // ###                                                                 ###
  // ###       !!! DO NOT USE GET/SET PROPERTIES ANYWHERE HERE !!!       ###
  // ###       !!!  UNLESS THE ACCESS IS WITHOUT SIDE EFFECTS  !!!       ###
  // ###       (https://github.com/electron/electron/issues/25516)       ###
  // ###                                                                 ###
  // #######################################################################

  /**
   * @param {string} key the name of the process argument to parse
   * @returns {string | undefined}
   */
  function parseArgv(key) {
    for (const arg of process.argv) {
      if (arg.indexOf(`--${key}=`) === 0) {
        return arg.split('=')[1];
      }
    }

    return undefined;
  }

  const globals = {
    /**
     * A minimal set of methods exposed from Electron's `ipcRenderer`
     * to support communication to main process.
     */
    ipcRenderer: {
      /**
       * @param {string} channel
       * @param {any[]} args
       */
      send(channel, ...args) {
        if (validateIPC(channel)) {
          ipcRenderer.send(channel, ...args);
        }
      },

      /**
       * @param {string} channel
       * @param {(event: import('electron').IpcRendererEvent, ...args: any[]) => void} listener
       */
      on(channel, listener) {
        if (validateIPC(channel)) {
          ipcRenderer.on(channel, listener);
        }
      },

      /**
       * @param {string} channel
       * @param {(event: import('electron').IpcRendererEvent, ...args: any[]) => void} listener
       */
      once(channel, listener) {
        if (validateIPC(channel)) {
          ipcRenderer.once(channel, listener);
        }
      },

      /**
       * @param {string} channel
       * @param {(event: import('electron').IpcRendererEvent, ...args: any[]) => void} listener
       */
      removeListener(channel, listener) {
        if (validateIPC(channel)) {
          ipcRenderer.removeListener(channel, listener);
        }
      },
    },

    /**
     * Support for subset of methods of Electron's `webFrame` type.
     */
    webFrame: {
      /**
       * @param {number} level
       */
      setZoomLevel(level) {
        if (typeof level === 'number') {
          webFrame.setZoomLevel(level);
        }
      },
    },

    /**
     * Support for subset of methods of Electron's `crashReporter` type.
     */
    crashReporter: {
      /**
       * @param {string} key
       * @param {string} value
       */
      addExtraParameter(key, value) {
        crashReporter.addExtraParameter(key, value);
      },
    },

    /**
     * Support for a subset of access to node.js global `process`.
     */
    process: {
      get platform() {
        return process.platform;
      },
      get env() {
        return process.env;
      },
      get versions() {
        return process.versions;
      },
      get type() {
        return 'renderer';
      },

      _whenEnvResolved: undefined as Promise<void> | undefined,
      whenEnvResolved:
        /**
         * @returns when the shell environment has been resolved.
         */
        function () {
          if (!this._whenEnvResolved) {
            this._whenEnvResolved = resolveEnv();
          }

          return this._whenEnvResolved;
        },

      nextTick:
        /**
         * Adds callback to the "next tick queue". This queue is fully drained
         * after the current operation on the JavaScript stack runs to completion
         * and before the event loop is allowed to continue.
         *
         * @param {Function} callback
         * @param {any[]} args
         */
        function nextTick(callback, ...args) {
          return process.nextTick(callback, ...args);
        },

      cwd:
        /**
         * @returns the current working directory.
         */
        function () {
          return process.cwd();
        },

      getuid:
        /**
         * @returns the numeric user identity of the process
         */
        function () {
          return process.getuid();
        },

      getProcessMemoryInfo:
        /**
         * @returns {Promise<import('electron').ProcessMemoryInfo>}
         */
        function () {
          return process.getProcessMemoryInfo();
        },

      on:
        /**
         * @param {string} type
         * @param {() => void} callback
         */
        function (type, callback) {
          if (validateProcessEventType(type)) {
            process.on(type, callback);
          }
        },
    },

    /**
     * Some information about the context we are running in.
     */
    context: {
      get sandbox() {
        return process.argv.includes('--enable-sandbox');
      },
      get windowId() {
        const windowId = parseArgv('window-id');
        return windowId;
      },
    },
  };

  // Use `contextBridge` APIs to expose globals to VSCode
  // only if context isolation is enabled, otherwise just
  // add to the DOM global.
  if (process.contextIsolated) {
    try {
      contextBridge.exposeInMainWorld('smart', globals);
    } catch (error) {
      console.error(error);
    }
  } else {
    window.smart = globals;
  }

  //#region Utilities

  /**
   * @param {string} channel
   */
  function validateIPC(channel: string) {
    if (!channel || !channel.startsWith('smart:')) {
      throw new Error(`Unsupported event IPC channel '${channel}'`);
    }

    return true;
  }

  /**
   * @param {string} type
   * @returns {type is 'uncaughtException'}
   */
  function validateProcessEventType(type: string) {
    if (type !== 'uncaughtException') {
      throw new Error(`Unsupported process event '${type}'`);
    }

    return true;
  }

  /**
   * If VSCode is not run from a terminal, we should resolve additional
   * shell specific environment from the OS shell to ensure we are seeing
   * all development related environment variables. We do this from the
   * main process because it may involve spawning a shell.
   *
   * @returns {Promise<void>}
   */
  function resolveEnv() {
    return new Promise<void>(function (resolve) {
      const handle = setTimeout(function () {
        console.warn('Preload: Unable to resolve shell environment in a reasonable time');

        // It took too long to fetch the shell environment, return
        resolve();
      }, 3000);

      ipcRenderer.once('smart:acceptShellEnv', function (event, shellEnv) {
        clearTimeout(handle);

        // Assign all keys of the shell environment to our process environment
        Object.assign(process.env, shellEnv);

        resolve();
      });

      ipcRenderer.send('smart:fetchShellEnv');
    });
  }

  //#endregion
})();
