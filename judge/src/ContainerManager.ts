import { Docker } from 'node-docker-api';
import { Container, Exec } from 'node-docker-api/lib/container';
import { Readable, Stream } from 'stream';
import * as fs from 'fs';
import * as tar from 'tar-stream';
import * as path from 'path';
import { createWriteStream, read, write, WriteStream } from 'fs';

export class ContainerManager {
  private docker: Docker;
  private container: Container | null = null;

  constructor(dockerInstance: Docker, imageName: string) {
    this.docker = dockerInstance;
  }

  async createContainer(imageName: String): Promise<void> {
    if (!imageName) throw Error('imageName required');
    // create new Container for Judge
    this.container = await this.docker.container.create({
      Image: imageName,
      name: `Judge-${imageName}-${new Date().getMilliseconds()}`,
      Tty: true,
      // User: '1000', // Set UID (disable root)
      PidsLimit: 100, // Limit Container PIDs
      Memory: 0, // Limit Container Memory Size (byte),
      WorkingDir: '/judge/'
    });
    const stream: Stream = <Stream>await this.container.logs({
      follow: true,
      stdout: true,
      stderr: true
    });
    stream.on('error', (err: any) => {
      console.log(err);
    });
    stream.on('date', (data: any) => {
      console.log(data);
    });
    await this.container.start();
  }

  async removeContainer(): Promise<void> {
    if (this.container == null) throw Error('No Container has created');
    await this.container.stop();
    await this.container.delete();
  }

  async crateTarStream(fileName: string, data: string): Promise<fs.ReadStream> {
    const writeStream: fs.WriteStream = fs.createWriteStream(fileName + '.tar');
    const pack = tar.pack();
    pack.entry({ name: fileName }, data, function(err) {
      if (err) throw err;
      pack.finalize();
    });
    pack.pipe(writeStream);
    const ReadStream: fs.ReadStream = fs.createReadStream(fileName + '.tar');
    return ReadStream;
  }

  writeFile(stream: Stream): Promise<void> {
    return new Promise((resolve, reject) => {
      stream.on('data', (info: any) => {
        console.log(info.toString());
      });
      stream.on('end', (info: any) => {
        resolve();
      });
      stream.on('close', (info: any) => {
        resolve();
      });
      stream.on('error', (error: any) => {
        console.log(error.toString());
        reject();
      });
    });
  }

  async putFile(source: string, pathString: string, fileName: string): Promise<void> {
    if (this.container == null) throw Error('No Container has created');
    const fileStream: fs.ReadStream = await this.crateTarStream(fileName, source);
    const stream = <Stream>await this.container.fs.put(fileStream, { path: pathString });
    const output = await this.writeFile(stream);
    fs.unlink(fileName + '.tar', (err) => {
      if (err) {
        console.log(err);
        return;
      }
    });
    return output;
  }

  async execCommand(cmd: string[]): Promise<Stream> {
    if (this.container == null) throw Error('No Container has created');
    const command: Exec = await this.container.exec.create({
      AttachStdout: true,
      AttachStderr: true,
      Cmd: cmd
    });
    return await command.start({ Detach: false }) as Promise<Stream>;
  }

  async readOutput(stream: Stream): Promise<string> {
    return new Promise((resolve) => {
      stream.on('data', (info: any) => {
        resolve(info.toString());
      });
      stream.on('error', (error: any) => {
        resolve(error.toString());
      });
    });
  }

  async execCommandOutput(cmd: string[], input: string): Promise<string> {
    const stream: Stream = await this.execCommand(cmd);
    return this.readOutput(stream);
  }
}
