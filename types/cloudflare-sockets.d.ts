declare module 'cloudflare:sockets' {
  export interface SocketAddress {
    hostname: string;
    port: number;
  }
  export interface SocketOptions {
    secureTransport?: 'on' | 'off' | 'starttls';
    allowHalfOpen?: boolean;
  }
  export interface Socket {
    readonly readable: ReadableStream<Uint8Array>;
    readonly writable: WritableStream<Uint8Array>;
    readonly opened: Promise<void>;
    readonly closed: Promise<void>;
    close(): Promise<void>;
    startTls(): Socket;
  }
  export function connect(address: SocketAddress | string, options?: SocketOptions): Socket;
}
