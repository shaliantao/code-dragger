import crypto from 'crypto';
import { Readable } from 'stream';

export function getMd5(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');

    stream.on('data', function (data) {
      hash.update(data);
    });

    stream.on('end', function () {
      const md5 = hash.digest('hex');
      resolve(md5);
    });

    stream.on('error', function (error) {
      reject(error);
    });
  });
}
