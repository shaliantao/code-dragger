import { isWindows, isMacintosh } from '@base/common/platform';
import { Platform } from '@src/platform/common/enum';

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
