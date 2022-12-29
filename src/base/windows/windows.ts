import { NativeParsedArgs } from '@base/environment/argv';
import { Rectangle, BrowserWindow } from 'electron';
import { IDisposable } from '@base/common/lifecycle';

export interface IWindowState {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  mode?: WindowMode;
  display?: number;
}

export const enum WindowMode {
  Maximized,
  Normal,
  Minimized, // not used anymore, but also cannot remove due to existing stored UI state (needs migration)
  Fullscreen,
}

export interface ICodeWindow extends IDisposable {
  readonly whenClosedOrLoaded: Promise<void>;

  readonly id: number;
  readonly win: BrowserWindow;

  readonly backupPath?: string;

  readonly remoteAuthority?: string;

  readonly isExtensionDevelopmentHost: boolean;
  readonly isExtensionTestHost: boolean;

  readonly lastFocusTime: number;

  readonly isReady: boolean;
  ready(): Promise<ICodeWindow>;
  setReady(): void;

  readonly hasHiddenTitleBarStyle: boolean;

  addTabbedWindow(window: ICodeWindow): void;

  load(isReload?: boolean): void;
  reload(cli?: NativeParsedArgs): void;

  focus(options?: { force: boolean }): void;
  close(): void;

  getBounds(): Rectangle;

  send(channel: string, ...args: any[]): void;
  sendWhenReady(channel: string, ...args: any[]): void;

  readonly isFullScreen: boolean;
  toggleFullScreen(): void;

  isMinimized(): boolean;

  setRepresentedFilename(name: string): void;
  getRepresentedFilename(): string | undefined;

  setDocumentEdited(edited: boolean): void;
  isDocumentEdited(): boolean;

  handleTitleDoubleClick(): void;

  serializeWindowState(): IWindowState;
}
