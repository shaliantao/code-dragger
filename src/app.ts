import path from 'path';
import { app, BrowserWindow, Menu } from 'electron';
import { CodeWindow } from '@src/window/window';
import { Server as ElectronIPCServer } from '@base/ipc/electron-main/ipc.electron-main';
import { createChannelReceiver } from '@base/ipc/common/ipc';
import { ILogService } from '@base/log/logService';
import { IEnvironmentService } from '@base/environment/environmentService';
import {
  ILifecycleMainService,
  ShutdownReason,
  LifecycleMainPhase,
} from '@base/lifecycle/lifecycleMainService';
import {
  IInstantiationService,
  ServiceIdentifier,
  ServicesAccessor,
} from '@base/instantiation/instantiation';
import { CodeService } from '@src/platform/code/codeService';
import { ICodeService } from '@src/platform/code/code';
import { ITerminalService, TerminalService } from '@src/platform/terminal/terminalService';
import { IAppService } from '@src/platform/app/app';
import { AppService } from '@src/platform/app/appService';
import { ExecutorService, IExecutorService } from '@src/platform/executor/executorService';
import { IComponentService } from '@src/platform/component/component';
import { ComponentService } from '@src/platform/component/componentService';
import { IGroupService } from '@src/platform/group/group';
import { GroupService } from '@src/platform/group/groupService';
import { IHttpService } from '@base/http/http';
import { HttpService } from '@base/http/httpService';
import { ITaskQueueService, ITaskScheduleService } from '@src/platform/task/task';
import { TaskScheduleService } from '@src/platform/task/taskScheduleService';
import { TaskQueueService } from '@src/platform/task/taskQueueService';
import { IAuthService, AuthService } from '@base/auth/authService';
import { ServiceCollection } from '@base/instantiation/serviceCollection';
import { SyncDescriptor } from '@base/instantiation/descriptors';
import { IFileService } from '@base/file/fileService';
import { isMacintosh } from '@base/common/platform';

export class CodeApplication {
  private codeWin: CodeWindow | null;
  constructor(
    @IInstantiationService private readonly instantiationService: IInstantiationService,
    @ILogService private readonly logService: ILogService,
    @IFileService private readonly fileService: IFileService,
    @IEnvironmentService private readonly environmentService: IEnvironmentService,
    @ILifecycleMainService private readonly lifecycleMainService: ILifecycleMainService,
  ) {
    this.codeWin = null;
    this.initFileSystem();
    this.registerListeners();
  }
  async startup() {
    this.logService.debug('Starting Code Dragger');
    this.logService.debug('cwd: ' + process.cwd());
    this.logService.debug('dirname: ' + path.join(__dirname));
    this.printEnviromentLog();
    const electronIpcServer = new ElectronIPCServer();
    this.lifecycleMainService.onWillShutdown((e) => {
      if (e.reason === ShutdownReason.KILL) {
        // When we go down abnormally, make sure to free up
        // any IPC we accept from other windows to reduce
        // the chance of doing work after we go down. Kill
        // is special in that it does not orderly shutdown
        // windows.
        electronIpcServer.dispose();
      }
    });
    // Services
    const appInstantiationService = await this.createServices();
    appInstantiationService.invokeFunction((accessor) =>
      this.openFirstWindow(accessor, electronIpcServer),
    );
  }
  private printEnviromentLog() {
    for (const key of Reflect.ownKeys(Object.getPrototypeOf(this.environmentService))) {
      if (key !== 'constructor') {
        this.logService.info(
          `${key as string}: ${
            key === 'args'
              ? JSON.stringify(this.environmentService[key])
              : this.environmentService[key]
          }`,
        );
      }
    }
  }
  private initFileSystem() {
    this.fileService.createFolder(this.environmentService.workspacePath);
    this.fileService.createFolder(this.environmentService.groupPath);
  }
  private _initChannel<T>(
    accessor: ServicesAccessor,
    electronIpcServer: ElectronIPCServer,
    name: string,
    serviceId: ServiceIdentifier<T>,
  ) {
    const service = accessor.get(serviceId);
    const channel = createChannelReceiver(service);
    electronIpcServer.registerChannel(name, channel);
  }
  private _initMenu() {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        {
          label: app.name,
          role: 'appMenu',
          submenu: [{ role: 'toggleDevTools' }],
        },
        {
          label: '编辑',
          submenu: [
            {
              label: 'Undo',
              accelerator: 'CmdOrCtrl+Z',
              role: 'undo',
            },
            {
              label: 'Redo',
              accelerator: 'Shift+CmdOrCtrl+Z',
              role: 'redo',
            },
            {
              type: 'separator',
            },
            {
              label: 'Cut',
              accelerator: 'CmdOrCtrl+X',
              role: 'cut',
            },
            {
              label: 'Copy',
              accelerator: 'CmdOrCtrl+C',
              role: 'copy',
            },
            {
              label: 'Paste',
              accelerator: 'CmdOrCtrl+V',
              role: 'paste',
            },
            {
              label: 'Select All',
              accelerator: 'CmdOrCtrl+A',
              role: 'selectAll',
            },
          ],
        },
      ]),
    );
  }
  private openFirstWindow(accessor: ServicesAccessor, electronIpcServer: ElectronIPCServer) {
    this._initMenu();
    this._initChannel<IAppService>(accessor, electronIpcServer, 'app', IAppService);
    this._initChannel<IComponentService>(
      accessor,
      electronIpcServer,
      'component',
      IComponentService,
    );
    this._initChannel<IGroupService>(accessor, electronIpcServer, 'group', IGroupService);
    this._initChannel<ITerminalService>(accessor, electronIpcServer, 'terminal', ITerminalService);
    this._initChannel<IExecutorService>(accessor, electronIpcServer, 'executor', IExecutorService);
    this._initChannel<IHttpService>(accessor, electronIpcServer, 'http', IHttpService);
    this._initChannel<IAuthService>(accessor, electronIpcServer, 'auth', IAuthService);
    this._initChannel<ITaskScheduleService>(
      accessor,
      electronIpcServer,
      'taskSchedule',
      ITaskScheduleService,
    );
    this.lifecycleMainService.phase = LifecycleMainPhase.Ready;
    this.codeWin = this.instantiationService.createInstance(CodeWindow);
    this.codeWin?.createWindow();
  }

  private async createServices(): Promise<IInstantiationService> {
    const services = new ServiceCollection();
    services.set(IAppService, new SyncDescriptor(AppService));
    services.set(IExecutorService, new SyncDescriptor(ExecutorService));
    services.set(IComponentService, new SyncDescriptor(ComponentService));
    services.set(IGroupService, new SyncDescriptor(GroupService));
    services.set(ICodeService, new SyncDescriptor(CodeService));
    services.set(ITerminalService, new SyncDescriptor(TerminalService));
    services.set(
      IHttpService,
      new SyncDescriptor(HttpService, [
        {
          baseURL: import.meta.env.VITE_GLOB_API_URL,
        },
      ]),
    );
    services.set(IAuthService, new SyncDescriptor(AuthService));
    services.set(ITaskScheduleService, new SyncDescriptor(TaskScheduleService));
    services.set(ITaskQueueService, new SyncDescriptor(TaskQueueService));

    return this.instantiationService.createChild(services);
  }
  private registerListeners(): void {
    const isFirstInstance = app.requestSingleInstanceLock();

    if (!isFirstInstance) {
      app.quit();
    } else {
      app.on('second-instance', () => {
        if (this.codeWin?.win) {
          this.codeWin.win.focus();
        }
      });
    }

    app.on('window-all-closed', () => {
      if (!isMacintosh) {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.codeWin?.createWindow();
      }
    });
  }
}
