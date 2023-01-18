import { CycleType, ExecMode, Platform } from '@src/platform/common/enum';

export interface UserInfo {
  id: number;
  username: string;
  email?: string;
  mobile?: string;
  role: RoleEnum;
  createdAt: string;
  updatedAt: string;
}

export interface AppInfo {
  id: number;
  appId: string;
  authorId: number;
  changeLog?: string;
  enabled: boolean;
  editable: boolean;
  published: boolean;
  version: number;
  md5: string;
  oss_path: string;
  platform: Platform;
  created_at: string;
  updated_at: string;
}

export interface TaskInfo {
  id: number;
  execMode: ExecMode;
  cycle?: CycleType;
  cron?: string;
  startTime?: string;
  validateStart?: string;
  validateEnd?: string;
  appId: string;
  authorId: number;
  created_at: string;
  updated_at: string;
  app: AppInfo;
}
