import { app, nativeTheme } from 'electron';
import installExtension from 'electron-devtools-installer';
import { CodeApplication } from './app';
import { ServiceCollection } from '@base/instantiation/serviceCollection';
import { IInstantiationService } from '@base/instantiation/instantiation';
import { SyncDescriptor } from '@base/instantiation/descriptors';
import { InstantiationService } from '@base/instantiation/instantiationService';
import { IEnvironmentService, EnvironmentService } from '@base/environment/environmentService';
import { NativeParsedArgs, parseArgs, OPTIONS } from '@base/environment/argv';
import { ILogService, ConsoleLogMainService } from '@base/log/logService';
import { ILoggerService, LoggerService } from '@base/log/loggerService';
import { IFileService, FileService } from '@base/file/fileService';
import { IStateService, StateService } from '@base/state/stateService';

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

class CodeMain {
  main(): void {
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
    try {
      if (process.platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
        async function delDevExtensions() {
          const fs = await import('fs');
          const path = await import('path');
          fs.unlinkSync(path.join(app.getPath('userData'), 'DevTools Extensions'));
        }
        void delDevExtensions();
      }
    } catch (_) {}
    void this.startup();
  }

  private startup() {
    const instantiationService = this.createServices(parseArgs(process.argv, OPTIONS));
    instantiationService.createInstance(CodeApplication).startup();
  }

  private createServices(args: NativeParsedArgs): IInstantiationService {
    const services = new ServiceCollection();
    const environmentService = new EnvironmentService(args);
    services.set(ILogService, new SyncDescriptor(ConsoleLogMainService));
    services.set(ILoggerService, new SyncDescriptor(LoggerService));
    services.set(IEnvironmentService, environmentService);
    services.set(IFileService, new SyncDescriptor(FileService));
    services.set(IStateService, new SyncDescriptor(StateService));
    return new InstantiationService(services);
  }
}

const code = new CodeMain();
app.whenReady().then(() => {
  if (!app.isPackaged) {
    installExtension('nhdogjmejiglipccpnnnanhbledajbpd')
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err));
  }
  code.main();
});
