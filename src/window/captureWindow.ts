import { BrowserWindow, screen, session } from 'electron';
const { ElectronChromeExtensions } = require('electron-chrome-extensions');
import path from 'path';
import { ILogService } from '@base/log/logService';
import { IEnvironmentService } from '@base/environment/environmentService';
import { Disposable } from '@base/common/lifecycle';

export class CaptureWindow extends Disposable {
  private _win: BrowserWindow | undefined | null;
  get win(): BrowserWindow {
    return this._win as BrowserWindow;
  }
  constructor(
    @ILogService private readonly logService: ILogService,
    @IEnvironmentService private readonly environmentService: IEnvironmentService,
  ) {
    super();
  }
  createWindow() {
    /**
     * Initial window options
     */
    const displayWorkAreaSize = screen.getAllDisplays()[0].workArea;
    const browserSession = session.fromPartition('persist:custom');
    const extensions = new ElectronChromeExtensions({
      session: browserSession,
    });
    browserSession.loadExtension(
      path.join(this.environmentService.resourcePath, 'rpa-xpath-getter'),
    );
    session.defaultSession.loadExtension(
      path.join(this.environmentService.resourcePath, 'rpa-xpath-getter'),
    );
    this._win = new BrowserWindow({
      width: parseInt(`${displayWorkAreaSize.width * 0.95}`, 10),
      height: parseInt(`${displayWorkAreaSize.height * 0.95}`, 10),
      minWidth: parseInt(`${displayWorkAreaSize.width * 0.85}`, 10),
      minHeight: parseInt(`${displayWorkAreaSize.height * 0.85}`, 10),
      movable: true,
      // frame: false,
      show: false,
      center: true,
      resizable: true,
      // transparent: true,
      titleBarStyle: 'default',
      webPreferences: {
        session: browserSession,
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        additionalArguments: ['--window-id=3'],
        preload: path.join(__dirname, './preload.js'),
      },
      backgroundColor: '#fff',
    });
    extensions.addTab(this._win.webContents, this._win);
  }
  async show(url = 'https://www.baidu.com'): Promise<void> {
    if (this._win) {
      await this._win.loadURL(url);
      this._win.show();
    }
  }
  hide(): void {
    if (this._win) {
      this._win.hide();
    }
  }
  close(): void {
    if (this._win) {
      this._win.close();
    }
  }
  destroy(): void {
    if (this._win) {
      this._win.destroy();
    }
  }
}
