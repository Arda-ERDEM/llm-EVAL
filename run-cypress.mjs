import http from 'node:http';
import { spawn as execSpawn } from 'node:child_process';

console.log('Starting static demo server (scripts/serve.mjs)...');
const serverProc = execSpawn('node', ['scripts/serve.mjs'], { stdio: 'inherit', shell: true });

function waitForServer(retries = 25) {
  return new Promise((resolve, reject) => {
    const check = (count) => {
      http
        .get('http://localhost:4173/panel.html?fixture=happy', (res) => {
          if (res.statusCode === 200) {
            console.log('Server is healthy! Launching Cypress...');
            resolve();
          } else {
            retry(count);
          }
        })
        .on('error', () => {
          retry(count);
        });
    };

    const retry = (count) => {
      if (count <= 0) return reject(new Error('Server failed to start in time.'));
      setTimeout(() => check(count - 1), 400);
    };

    check(retries);
  });
}

async function main() {
  try {
    await waitForServer();
    console.log('Executing Cypress with --no-runner-ui...');
    const cypressProc = execSpawn(
      'npx',
      ['cypress', 'run', '--no-runner-ui'],
      {
        stdio: 'inherit',
        shell: true,
        env: {
          ...process.env,
          CYPRESS_RECORD: 'false',
          CYPRESS_NO_COMMAND_LOG: '1',
        },
      }
    );

    cypressProc.on('exit', (code) => {
      console.log(`Cypress finished with code ${code}. Cleaning up server...`);
      serverProc.kill();
      process.exit(code || 0);
    });
  } catch (err) {
    console.error('Error running Cypress:', err);
    serverProc.kill();
    process.exit(1);
  }
}

main();
