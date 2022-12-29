import { Event } from '@base/common/event';

export interface ITerminalEnvironment {
  [key: string]: string | null;
}

export interface ITerminalLaunchError {
  message: string;
  code?: number;
}

export interface ITerminalChildProcess {
  onProcessData: Event<string>;
  onProcessExit: Event<number | undefined>;
  onProcessReady: Event<{ pid: number; cwd: string }>;
  onProcessTitleChanged: Event<string>;

  /**
   * Starts the process.
   *
   * @returns undefined when the process was successfully started, otherwise an object containing
   * information on what went wrong.
   */
  start(): Promise<ITerminalLaunchError | undefined>;

  /**
   * Shutdown the terminal process.
   *
   * @param immediate When true the process will be killed immediately, otherwise the process will
   * be given some time to make sure no additional data comes through.
   */
  shutdown(immediate: boolean): void;
  input(data: string): void;
  resize(cols: number, rows: number): void;

  getInitialCwd(): Promise<string>;
  getCwd(): Promise<string>;
  getLatency(): Promise<number>;
}

export interface IShellLaunchConfig {
  /**
   * The name of the terminal, if this is not set the name of the process will be used.
   */
  name?: string;

  /**
   * The shell executable (bash, cmd, etc.).
   */
  executable?: string;

  /**
   * The CLI arguments to use with executable, a string[] is in argv format and will be escaped,
   * a string is in "CommandLine" pre-escaped format and will be used as is. The string option is
   * only supported on Windows and will throw an exception if used on macOS or Linux.
   */
  args?: string[] | string;

  /**
   * The current working directory of the terminal, this overrides the `terminal.integrated.cwd`
   * settings key.
   */
  cwd?: string;

  /**
   * A custom environment for the terminal, if this is not set the environment will be inherited
   * from the VS Code process.
   */
  env?: ITerminalEnvironment;

  /**
   * Whether to ignore a custom cwd from the `terminal.integrated.cwd` settings key (e.g. if the
   * shell is being launched by an extension).
   */
  ignoreConfigurationCwd?: boolean;

  /** Whether to wait for a key press before closing the terminal. */
  waitOnExit?: boolean | string;

  /**
   * A string including ANSI escape sequences that will be written to the terminal emulator
   * _before_ the terminal process has launched, a trailing \n is added at the end of the string.
   * This allows for example the terminal instance to display a styled message as the first line
   * of the terminal. Use \x1b over \033 or \e for the escape control character.
   */
  initialText?: string;

  /**
   * Whether an extension is controlling the terminal via a `vscode.Pseudoterminal`.
   */
  isExtensionTerminal?: boolean;

  /**
   * This is a terminal that attaches to an already running remote terminal.
   */
  remoteAttach?: { id: number; pid: number; title: string; cwd: string };

  /**
   * Whether the terminal process environment should be exactly as provided in
   * `TerminalOptions.env`. When this is false (default), the environment will be based on the
   * window's environment and also apply configured platform settings like
   * `terminal.integrated.windows.env` on top. When this is true, the complete environment must be
   * provided as nothing will be inherited from the process or any configuration.
   */
  strictEnv?: boolean;

  /**
   * When enabled the terminal will run the process as normal but not be surfaced to the user
   * until `Terminal.show` is called. The typical usage for this is when you need to run
   * something that may need interactivity but only want to tell the user about it when
   * interaction is needed. Note that the terminals will still be exposed to all extensions
   * as normal.
   */
  hideFromUser?: boolean;

  /**
   * Whether this terminal is not a terminal that the user directly created and uses, but rather
   * a terminal used to drive some VS Code feature.
   */
  isFeatureTerminal?: boolean;
}
