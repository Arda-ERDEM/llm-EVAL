import http from 'node:http';
import { spawn as execSpawn } from 'node:child_process';
import path from 'node:path';

// Start server
console.log('Starting demo server...');
const serverProc = execSpawn('node', ['server.mjs'], { stdio: 'inherit', shell: true });

function waitForServer(retries = 20) {
  return new Promise((resolve, reject) => {
    const check = (count) => {
      http
        .get('http://127.0.0.1:8080/demo/index.html', (res) => {
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
      setTimeout(() => check(count - 1), 500);
    };

    check(retries);
  });
}

async function main() {
  try {
    await waitForServer();
    console.log('Executing: npx cypress run --no-runner-ui...');
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
