declare module 'ssh2-sftp-client' {
  import { Client } from 'ssh2';

  export interface ListEntry {
    type: string;
    name: string;
    size: number;
    modifyTime: number;
    accessTime: number;
    mode: string;
  }

  export interface ConnectOptions {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    privateKey?: string | Buffer;
    readyTimeout?: number;
    debug?: (msg: string) => void;
  }

  export default class SftpClient extends Client {
    connect(options: ConnectOptions): Promise<this>;
    end(): void;
    list(path: string): Promise<ListEntry[]>;
    get(remotePath: string, localPath?: string): Promise<string | Buffer>;
    put(localPath: string, remotePath: string): Promise<void>;
    delete(remotePath: string): Promise<void>;
    mkdir(path: string, recursive?: boolean): Promise<void>;
    exists(path: string): Promise<boolean | string>;
  }
}