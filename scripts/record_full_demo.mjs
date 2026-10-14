import http from 'node:http';
import { spawn as execSpawn, execSync } from 'node:child_process';
import { existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const ffmpeg = 'C:\\Users\\ERDEM\\AppData\\Local\\Cypress\\Cache\\16.1.1\\Cypress\\resources\\app\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';
const root = process.cwd();

console.log('1. Building synchronized narration audio track...');
execSync('node scripts/build_full_audio.mjs', { stdio: 'inherit' });

console.log('2. Starting static demo server...');
const serverProc = execSpawn('node', ['scripts/serve.mjs'], { stdio: 'inherit', shell: true });

function waitForServer(retries = 25) {
  return new Promise((resolve, reject) => {
    const check = (count) => {
      http
        .get('http://localhost:4173/fixtures/browser_demo.html', (res) => {
          if (res.statusCode === 200) {
            console.log('Server is healthy! Launching Cypress recording...');
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
    console.log('3. Recording 1080p video with Cypress (--no-runner-ui)...');

    const cypressProc = execSpawn(
      'npx',
      [
        'cypress',
        'run',
        '--spec',
        'cypress/e2e/website_demo.cy.js',
        '--no-runner-ui',
      ],
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

      if (code !== 0) {
        console.error('Cypress run failed with exit code:', code);
        process.exit(code || 1);
      }

      const rawVideo = join(root, 'cypress', 'videos', 'website_demo.cy.js.mp4');
      const audioTrack = join(root, 'demo_audio_final.wav');
      const finalVideo = join(root, 'cypress', 'videos', 'clauseradar_website_demo_1080p_sesli.mp4');
      const rootVideo = join(root, 'clauseradar_demo_1080p_sesli.mp4');

      if (!existsSync(rawVideo)) {
        console.error('Raw Cypress video not found at:', rawVideo);
        process.exit(1);
      }

      console.log('4. Muxing video and synchronized audio track via FFmpeg...');
      const muxCmd = `"${ffmpeg}" -i "${rawVideo}" -i "${audioTrack}" -c:v copy -c:a aac -b:a 192k -shortest "${finalVideo}" -y`;
      execSync(muxCmd, { stdio: 'inherit' });

      // Also copy to root for easy user access
      copyFileSync(finalVideo, rootVideo);

      console.log('========================================================');
      console.log('SUCCESS! Final demo video with audio is ready at:');
      console.log('  -> ' + finalVideo);
      console.log('  -> ' + rootVideo);
      console.log('========================================================');

      // Check duration & streams of final video
      try {
        const probe = execSync(`"${ffmpeg}" -i "${rootVideo}" 2>&1`, { encoding: 'utf8' });
        console.log(probe);
      } catch (e) {
        console.log((e.stdout || '') + (e.stderr || ''));
      }

      process.exit(0);
    });
  } catch (err) {
    console.error('Error during recording:', err);
    serverProc.kill();
    process.exit(1);
  }
}

main();
