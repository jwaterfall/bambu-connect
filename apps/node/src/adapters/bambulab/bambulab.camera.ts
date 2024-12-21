import net from "net";
import tls from "tls";

export class BambulabCamera {
  hostname: string;
  port: number;
  username: string;
  authPacket: Buffer;
  streaming: boolean;
  streamThread: any;

  constructor(hostname: string, accessCode: string, port: number = 6000) {
    this.hostname = hostname;
    this.port = port;
    this.username = "bblp";
    this.authPacket = this.createAuthPacket(this.username, accessCode);
    this.streaming = false;
    this.streamThread = null;
  }

  createAuthPacket(username: string, accessCode: string): Buffer {
    const authData = Buffer.alloc(80);
    authData.writeUInt32LE(0x40, 0); // '@'\0\0\0
    authData.writeUInt32LE(0x3000, 4); // \0'0'\0\0
    authData.writeUInt32LE(0, 8); // \0\0\0\0
    authData.writeUInt32LE(0, 12); // \0\0\0\0

    for (let i = 0; i < username.length; i++) {
      authData.write(username[i]!, 16 + i, "ascii");
    }

    for (let i = 0; i < accessCode.length; i++) {
      authData.write(accessCode[i]!, 48 + i, "ascii");
    }

    return authData;
  }

  findJpeg(
    buf: Buffer,
    startMarker: Buffer,
    endMarker: Buffer
  ): [Buffer | null, Buffer] {
    const start = buf.indexOf(startMarker);
    const end = buf.indexOf(endMarker, start + startMarker.length);

    if (start !== -1 && end !== -1) {
      return [
        buf.slice(start, end + endMarker.length),
        buf.slice(end + endMarker.length),
      ];
    }

    return [null, buf];
  }

  captureFrame(): Promise<Buffer | null> {
    const jpegStart = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    const jpegEnd = Buffer.from([0xff, 0xd9]);
    const readChunkSize = 4096;

    return new Promise((resolve, reject) => {
      const socket = net.connect(this.port, this.hostname, () => {
        const tlsSocket = tls.connect(
          {
            socket: socket,
            rejectUnauthorized: false, // Disable cert check
          },
          () => {
            tlsSocket.write(this.authPacket);

            let buf = Buffer.alloc(0);

            tlsSocket.on("data", (data) => {
              buf = Buffer.concat([buf, data]);
              const [img, remaining] = this.findJpeg(buf, jpegStart, jpegEnd);
              buf = remaining;

              if (img) {
                resolve(img);
                tlsSocket.end();
              }
            });
          }
        );

        tlsSocket.on("error", (err) => reject(err));
      });

      socket.on("error", (err) => reject(err));
    });
  }

  captureStream(imgCallback: (img: Buffer) => void): void {
    const jpegStart = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    const jpegEnd = Buffer.from([0xff, 0xd9]);
    const readChunkSize = 4096;

    const socket = net.connect(this.port, this.hostname, () => {
      const tlsSocket = tls.connect(
        {
          socket: socket,
          rejectUnauthorized: false, // Disable cert check
        },
        () => {
          tlsSocket.write(this.authPacket);

          let buf = Buffer.alloc(0);

          tlsSocket.on("data", (data) => {
            if (!this.streaming) {
              tlsSocket.end();
              return;
            }

            buf = Buffer.concat([buf, data]);
            const [img, remaining] = this.findJpeg(buf, jpegStart, jpegEnd);
            buf = remaining;

            if (img) {
              imgCallback(img);
            }
          });
        }
      );

      tlsSocket.on("error", (err) => console.error(err));
    });

    socket.on("error", (err) => console.error(err));
  }

  startStream(imgCallback: (img: Buffer) => void): void {
    if (this.streaming) {
      console.log("Stream already running.");
      return;
    }

    this.streaming = true;
    this.captureStream(imgCallback);
  }

  stopStream(): void {
    if (!this.streaming) {
      console.log("Stream is not running.");
      return;
    }

    this.streaming = false;
  }
}
