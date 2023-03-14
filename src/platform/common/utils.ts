import { isWindows, isMacintosh } from '@base/common/platform';
import { Platform, ValueType } from '@src/platform/common/enum';

export const createGetNameFunc = (PREFIX: string) => {
  return (uuid: string) => {
    return uuid.startsWith(PREFIX) ? uuid : `${PREFIX}${uuid}`;
  };
};

export const getPlatform = (diffPlatform = false): Platform => {
  let platform = Platform.Common;
  if (diffPlatform) {
    if (isMacintosh) {
      platform = Platform.Mac;
    } else if (isWindows) {
      platform = Platform.Windows;
    }
  }
  return platform;
};

export const strToObj = (str: string) => {
  return Function('"use strict";return (' + str + ')')();
};

export const convertStrByType = (value: string, type: ValueType) => {
  if (type === ValueType.List || type === ValueType.Object) {
    return strToObj(value);
  } else if (type === ValueType.Boolean) {
    if (value.trim() === 'false') {
      return false;
    }
    return Boolean(value);
  } else if (type === ValueType.Number) {
    return Number.parseInt(value, 10);
  } else {
    return value;
  }
};
