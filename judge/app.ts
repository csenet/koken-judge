import {Docker} from 'node-docker-api';
import {Container, Exec} from "node-docker-api/lib/container";
import {Stream} from "stream";

const docker = new Docker({socketPath: '/var/run/docker.sock'})

async function main() {
    const container: Container = await docker.container.create({
        Image: 'ubuntu',
        name: `JudgeContainer-${new Date().getMilliseconds()}`,
        Tty: true,
        User: '1000',
        PidsLimit: 100
    })
    await container.start()
    const command: Exec = await container.exec.create({
        AttachStdout: true,
        AttachStderr: true,
        Cmd: ["echo", "Hello"]
    })
    const stream: Stream = <Stream>await command.start({Detach: false})
    const readOutput = async (stream: Stream): Promise<string> => {
        return new Promise((resolve) => {
            stream.on('data', (info: any) => {
                resolve(info.toString())
            })
        })
    }
    console.log(await readOutput(stream))
    await container.stop()
    await container.delete()
}

(async () => {
    await main()
})();
