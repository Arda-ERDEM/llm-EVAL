import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ffmpeg = 'C:\\Users\\ERDEM\\AppData\\Local\\Cypress\\Cache\\16.1.1\\Cypress\\resources\\app\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';
const tempDir = join(process.cwd(), 'temp_audio');
if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });

console.log('Generating earcons with ffmpeg...');
// High risk earcon: 3 descending tones (392Hz, 311.13Hz, 233.08Hz)
execSync(`"${ffmpeg}" -f lavfi -i "sine=frequency=392:duration=0.2" -f lavfi -i "sine=frequency=311:duration=0.2" -f lavfi -i "sine=frequency=233:duration=0.4" -filter_complex "[0:0][1:0][2:0]concat=n=3:v=0:a=1[a]" -map "[a]" "${join(tempDir, 'earcon_high.wav')}" -y`, { stdio: 'inherit' });

// Alert earcon: 2 warning beeps (440Hz, pause, 440Hz)
execSync(`"${ffmpeg}" -f lavfi -i "sine=frequency=440:duration=0.15" -f lavfi -i "sine=frequency=0:duration=0.1" -f lavfi -i "sine=frequency=440:duration=0.15" -filter_complex "[0:0][1:0][2:0]concat=n=3:v=0:a=1[a]" -map "[a]" "${join(tempDir, 'earcon_alert.wav')}" -y`, { stdio: 'inherit' });

// Safe earcon: 2 soft ascending tones (659Hz, 988Hz)
execSync(`"${ffmpeg}" -f lavfi -i "sine=frequency=659:duration=0.25" -f lavfi -i "sine=frequency=988:duration=0.35" -filter_complex "[0:0][1:0]concat=n=2:v=0:a=1[a]" -map "[a]" "${join(tempDir, 'earcon_safe.wav')}" -y`, { stdio: 'inherit' });

// Timeline specification in seconds:
// 0.0s: 1_intro.mp3 (7.51s) -> ends at 7.51s
// 7.8s: 2_scan.mp3 (6.91s) -> ends at 14.71s
// 15.0s: earcon_high.wav (0.8s)
// 15.8s: 3_verdict.mp3 (5.98s) -> ends at 21.78s
// 22.0s: 4_findings.mp3 (10.39s) -> ends at 32.39s
// 32.8s: 5_highlight.mp3 (7.66s) -> ends at 40.46s
// 40.8s: earcon_alert.wav (0.4s)
// 41.3s: 6_injection.mp3 (7.54s) -> ends at 48.84s
// 49.2s: 7_uncertainty.mp3 (6.74s) -> ends at 55.94s
// 56.2s: 8_outro.mp3 (8.33s) -> ends at 64.53s
// 64.7s: earcon_safe.wav (0.6s) -> ends at 65.3s

console.log('Building mixed audio track using ffmpeg amix / adelay filter...');

const inputs = [
  { file: '1_intro.mp3', delayMs: 200 },
  { file: '2_scan.mp3', delayMs: 8000 },
  { file: 'earcon_high.wav', delayMs: 15200 },
  { file: '3_verdict.mp3', delayMs: 16200 },
  { file: '4_findings.mp3', delayMs: 22400 },
  { file: '5_highlight.mp3', delayMs: 33200 },
  { file: 'earcon_alert.wav', delayMs: 41200 },
  { file: '6_injection.mp3', delayMs: 41800 },
  { file: '7_uncertainty.mp3', delayMs: 49800 },
  { file: '8_outro.mp3', delayMs: 57000 },
  { file: 'earcon_safe.wav', delayMs: 65600 },
];

let inputArgs = '';
let filterPads = '';
for (let i = 0; i < inputs.length; i++) {
  const item = inputs[i];
  inputArgs += ` -i "${join(tempDir, item.file)}"`;
  filterPads += `[${i}:a]adelay=${item.delayMs}|${item.delayMs},aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a${i}];`;
}

const mixInputs = inputs.map((_, i) => `[a${i}]`).join('');
const filterComplex = `${filterPads}${mixInputs}amix=inputs=${inputs.length}:dropout_transition=2,volume=1.8[out]`;

const finalAudioPath = join(process.cwd(), 'demo_audio_final.wav');
const mixCmd = `"${ffmpeg}" ${inputArgs} -filter_complex "${filterComplex}" -map "[out]" -t 67 "${finalAudioPath}" -y`;

execSync(mixCmd, { stdio: 'inherit' });
console.log('Audio track successfully built at:', finalAudioPath);
