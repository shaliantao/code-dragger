export enum LogLevel {
  Trace = 'trace',
  Debug = 'debug',
  Info = 'info',
  Warning = 'warn',
  Error = 'error',
  Fatal = 'fatal',
  All = 'all',
  Off = 'off',
}

export const DEFAULT_LOG_LEVEL: LogLevel = LogLevel.Info;

export function getLogLevel(logLevel: string | undefined): LogLevel {
  switch (logLevel) {
    case 'trace':
      return LogLevel.Trace;
    case 'debug':
      return LogLevel.Debug;
    case 'info':
      return LogLevel.Info;
    case 'warn':
      return LogLevel.Warning;
    case 'error':
      return LogLevel.Error;
    case 'fatal':
      return LogLevel.Fatal;
    case 'off':
      return LogLevel.Off;
    case 'all':
      return LogLevel.All;
  }

  return DEFAULT_LOG_LEVEL;
}
