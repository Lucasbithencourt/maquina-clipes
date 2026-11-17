import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {installWhisperCpp, downloadWhisperModel} from '@remotion/install-whisper-cpp';

const home = process.env.MAQUINA_CLIPES_HOME || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const config = JSON.parse(fs.readFileSync(path.join(home, 'config.json'), 'utf8'));
const folder = path.join(home, 'whisper.cpp');
const binary = path.join(folder, process.platform === 'win32' ? 'main.exe' : 'main');
if (!fs.existsSync(binary)) await installWhisperCpp({to:folder, version:'1.5.5'});
if (!fs.existsSync(path.join(folder, `ggml-${config.whisperModel}.bin`))) {
  await downloadWhisperModel({model:config.whisperModel, folder});
}
