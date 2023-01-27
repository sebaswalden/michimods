import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { clone } from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import { encode, decode, Byte } from 'nbt-ts';

import { ServerNBT } from './interfaces';

// Repository folder where the mods are located
const repoUrl = 'https://github.com/sebaswalden/michimods.git';
const branch = 'mods';

// Function to get the Minecraft installation folder based on the operating system
function getMinecraftFolder(): string {
  const home = os.homedir();
  switch (process.platform) {
    case 'win32':
      return path.join(home, 'AppData', 'Roaming', '.minecraft');
    case 'darwin':
      return path.join(home, 'Library', 'Application Support', 'minecraft');
    case 'linux':
      return path.join(home, '.minecraft');
    default:
      throw new Error('Unsupported operating system');
  }
}

// Minecraft installation folder
const minecraftFolder = getMinecraftFolder();

// Function to delete .git folder to force cloning the repo.
const deleteGitFolder = async (): Promise<void> => {
  try {
    await fs.promises.rm(path.join(minecraftFolder, 'mods', '.git'), { recursive: true });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('No .git file present on mods folder.');
    } else {
      throw error;
    }
  }
}

const addMichiServer = () => {
  try {
    const serverDatBuffer = fs.readFileSync(path.join(minecraftFolder, 'servers.dat'));
    const nbtData = decode(serverDatBuffer) as ServerNBT;

    if (nbtData.value) {
      if (nbtData.value.servers) {
        for (const server of nbtData.value.servers) {
          if (server.ip === 'michiconlagmodeado.aternos.me:13939') {
            console.log('Server already exists on servers.dat, skipping');
            return;
          }
        }

        nbtData.value.servers.push({
          hidden: new Byte(0),
          ip: 'michiconlagmodeado.aternos.me:13939',
          name: 'Michiserver',
        });

        const encodedServers = encode('', nbtData.value);
        fs.writeFileSync(path.join(minecraftFolder, 'servers.dat'), encodedServers);

        console.log('Added server to servers.dat');
      }
    }
  } catch (error) {
    console.error(error);
  }
}

const main = async () => {
  try {
    // Add server to servers.dat
    addMichiServer();
    // Delete .git folder if exists
    await deleteGitFolder()
    // Clone the repository
    await clone({
      fs,
      http,
      ref: branch,
      dir: path.join(minecraftFolder, 'mods'),
      url: repoUrl,
      depth: 1,
      singleBranch: true,
    });

    console.log('Repository cloned successfully!');

    const keypress = async (): Promise<void> => {
      process.stdin.setRawMode(true);
      return new Promise((resolve) =>
        process.stdin.once('data', () => {
          process.stdin.setRawMode(false);
          resolve();
        })
      );
    };

    (async (): Promise<void> => {
      console.log('Mods copied succesfully! Press any key to exit.');
      await keypress();
      process.exit();
    })();
  } catch (error) {
    console.error(error);
  }
};

main();
