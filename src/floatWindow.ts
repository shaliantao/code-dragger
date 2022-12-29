import { BrowserWindow, screen, app } from 'electron';
import path from 'path';
import { ILogService } from '@base/log/logService';
import { IEnvironmentService } from '@base/environment/environmentService';
import { Disposable } from '@base/common/lifecycle';

export class FloatWindow extends Disposable {
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
    if (this._win?.id) {
      return;
    }
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const x = width - 360;
    const y = height - 100;
    this._win = new BrowserWindow({
      width: 680,
      height: 440,
      x: x,
      y: y,
      hasShadow: true,
      useContentSize: true,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      minimizable: false,
      maximizable: false,
      movable: false,
      skipTaskbar: true,
      show: false,
      webPreferences: {
        webSecurity: false,
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        additionalArguments: ['--window-id=2'],
        preload: path.join(__dirname, './preload.js'),
      },
    });
    this._win.on('closed', () => (this._win = null));
    //必须加上第二个参数'normal'，否则弹窗不能按预期层级显示
    this._win.setAlwaysOnTop(true, 'normal');
    this._win.webContents.openDevTools();
    if (app.isPackaged) {
      this._win.loadFile(path.join(__dirname, '../index.html/#/progress'));
    } else {
      const url = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}/#/progress`;
      this._win.loadURL(url);
    }
  }
  showInactive(): void {
    if (this._win) {
      this._win.showInactive();
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
