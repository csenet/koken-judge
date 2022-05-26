import { Docker } from 'node-docker-api';
import { ContainerManager } from './ContainerManager';

const docker: Docker = new Docker({ socketPath: '/var/run/docker.sock' });


async function main() {
  const container = new ContainerManager(docker, 'ubuntu');
  await container.createContainer('ruby');
  await container.putFile(' puts "数字を入れてください"\nnumber = gets\nputs number', 'judge', 'main.rb');
  await container.putFile('3', 'judge', '0.in');
  console.log(await container.execCommandOutput(['ruby', 'main.rb', '0.in'], '3'));
  await container.removeContainer();
}

(async () => {
  await main();
})();
