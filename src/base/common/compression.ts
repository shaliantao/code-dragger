import tar from 'tar';
import { ReadStream } from 'fs';

interface CompressOptions {
  cwd?: string;
  excludes?: string[];
}
export function compress(sourcePath: string, options: CompressOptions) {
  return tar.c(
    {
      gzip: true,
      C: options.cwd,
      filter: (path) => {
        if (options?.excludes?.some((exclude) => path.includes(exclude))) {
          return false;
        }
        return true;
      },
    },
    [sourcePath],
  );
}

export async function decompress(sourceStream: ReadStream, targetPath: string) {
  return new Promise<void>((resolve) => {
    const localStream = tar.x({
      strip: 1,
      C: targetPath,
    });
    localStream.on('finish', () => {
      resolve();
    });
    sourceStream.pipe(localStream);
  });
}
