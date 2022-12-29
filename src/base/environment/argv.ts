import minimist from 'minimist';

export interface NativeParsedArgs {
  _: string[];
  mode?: string;
  'logs-path'?: string;
  'open-devtools'?: boolean;
  log?: string;
}

export interface Option<OptionType> {
  type: OptionType;
  alias?: string;
  deprecates?: string; // old deprecated id
  description?: string;
}

export type OptionDescriptions<T> = {
  [P in keyof T]: Option<OptionTypeName<T[P]>>;
};

type OptionTypeName<T> = T extends boolean
  ? 'boolean'
  : T extends string
  ? 'string'
  : T extends string[]
  ? 'string[]'
  : T extends undefined
  ? 'undefined'
  : 'unknown';

export const OPTIONS: OptionDescriptions<Required<NativeParsedArgs>> = {
  mode: {
    type: 'string',
    alias: 'm',
    description: '开发模式，当与环境变量冲突时以此为准',
  },
  'logs-path': { type: 'string', alias: 'logsPath' },
  'open-devtools': { type: 'boolean' },
  log: {
    type: 'string',
    description:
      "Log level to use. Default is 'info'. Allowed values are 'fatal', 'error', 'warn', 'info', 'debug', 'trace', 'off', 'all'.",
  },
  _: { type: 'string[]' }, // main arguments
};

export interface ErrorReporter {
  onUnknownOption(id: string): void;
  onMultipleValues(id: string, usedValue: string): void;
}

const ignoringReporter: ErrorReporter = {
  onUnknownOption: () => {},
  onMultipleValues: () => {},
};

export function parseArgs<T>(
  args: string[],
  options: OptionDescriptions<T>,
  errorReporter: ErrorReporter = ignoringReporter,
): T {
  const alias: { [key: string]: string } = {};
  const string: string[] = [];
  const boolean: string[] = [];
  for (const optionId in options) {
    if (optionId[0] === '_') {
      continue;
    }

    const o = options[optionId];
    if (o.alias) {
      alias[optionId] = o.alias;
    }

    if (o.type === 'string' || o.type === 'string[]') {
      string.push(optionId);
      if (o.deprecates) {
        string.push(o.deprecates);
      }
    } else if (o.type === 'boolean') {
      boolean.push(optionId);
      if (o.deprecates) {
        boolean.push(o.deprecates);
      }
    }
  }
  // remove aliases to avoid confusion
  const parsedArgs = minimist(args, { string, boolean, alias });

  const cleanedArgs: any = {};
  const remainingArgs: any = parsedArgs;

  // https://github.com/microsoft/vscode/issues/58177, https://github.com/microsoft/vscode/issues/106617
  cleanedArgs._ = parsedArgs._.map((arg) => String(arg)).filter((arg) => arg.length > 0);

  delete remainingArgs._;

  for (const optionId in options) {
    const o = options[optionId];
    if (o.alias) {
      delete remainingArgs[o.alias];
    }

    let val = remainingArgs[optionId];
    if (o.deprecates && remainingArgs.hasOwnProperty(o.deprecates)) {
      if (!val) {
        val = remainingArgs[o.deprecates];
      }
      delete remainingArgs[o.deprecates];
    }

    if (typeof val !== 'undefined') {
      if (o.type === 'string[]') {
        if (val && !Array.isArray(val)) {
          val = [val];
        }
      } else if (o.type === 'string') {
        if (Array.isArray(val)) {
          val = val.pop(); // take the last
          errorReporter.onMultipleValues(optionId, val);
        }
      }
      cleanedArgs[optionId] = val;
    }
    delete remainingArgs[optionId];
  }

  for (const key in remainingArgs) {
    errorReporter.onUnknownOption(key);
  }

  return cleanedArgs;
}
