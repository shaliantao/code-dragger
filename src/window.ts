import { BrowserWindow, screen, app } from 'electron';
import path from 'path';
import { ILogService } from '@base/log/logService';
import { IEnvironmentService } from '@base/environment/environmentService';
import { Disposable } from '@base/common/lifecycle';

export class CodeWindow extends Disposable {
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
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        additionalArguments: ['--window-id=1'],
        preload: path.join(__dirname, './preload.js'),
      },
      backgroundColor: '#fff',
    });
    if (app.isPackaged) {
      this._win.loadFile(path.join(__dirname, '../index.html'));
    } else {
      const url = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`;
      this._win.loadURL(url);
    }

    this._win.on('ready-to-show', () => {
      this._win?.show();
    });
  }
  close(): void {
    if (this._win) {
      this._win.close();
    }
  }
}
