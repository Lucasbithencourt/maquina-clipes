#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync, execSync, execFileSync} from 'node:child_process';

const skill = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const value = key => {
  const i = args.indexOf(key);
  if (i < 0) return undefined;
  if (!args[i + 1] || args[i + 1].startsWith('--')) throw Error(`Falta o valor de ${key}`);
  return args[i + 1];
};
const home = path.resolve(value('--home') || process.env.MAQUINA_CLIPES_HOME || '.maquina-clipes');
const engine = path.join(home, 'engine');
const configFile = path.join(home, 'config.json');
const readConfig = () => fs.existsSync(configFile) ? JSON.parse(fs.readFileSync(configFile, 'utf8')) : {};
const existsOnPath = bin => spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', [bin], {stdio:'pipe'}).status === 0;
const hasBinary = () => fs.existsSync(path.join(home, 'whisper.cpp', process.platform === 'win32' ? 'main.exe' : 'main'));

function state() {
  const config = readConfig();
  return {
    home, engine, node: process.versions.node, nodeOk: Number(process.versions.node.split('.')[0]) >= 22,
    ffmpeg: existsOnPath('ffmpeg'), ffprobe: existsOnPath('ffprobe'), ytdlp: existsOnPath('yt-dlp'),
    engineInstalled: fs.existsSync(path.join(engine, 'node_modules/remotion')),
    whisperBinary: hasBinary(),
    whisperModel: fs.existsSync(path.join(home, 'whisper.cpp', `ggml-${config.whisperModel || 'small'}.bin`)),
    profile: config.profileName || null,
    logo: !!config.logo && fs.existsSync(path.join(home, config.logo)),
    downloadsPerformed: false,
  };
}

if (args.includes('--check')) {
  console.log(JSON.stringify(state(), null, 2));
  process.exit(0);
}
const install = args.includes('--install');
if (install && !args.includes('--allow-downloads')) {
  console.error('Instalação exige autorização para downloads. Depois dela, use --install --allow-downloads.');
  process.exit(2);
}
if (!args.includes('--init') && !install && !value('--profile') && !value('--logo')) {
  console.log('Use --check, --init, --profile NOME --logo ARQUIVO, ou --install --allow-downloads.');
  process.exit(0);
}
if (Number(process.versions.node.split('.')[0]) < 22) throw Error('Use Node 22 ou superior.');

const identity = path.join(skill, 'assets/identidade');
fs.mkdirSync(home, {recursive:true});
if (!fs.existsSync(configFile)) {
  fs.copyFileSync(path.join(identity, 'perfil.json'), configFile);
  for (const name of ['perfil.jpg', 'fontes', 'sfx']) fs.cpSync(path.join(identity, name), path.join(home, name), {recursive:true});
}
if (!fs.existsSync(path.join(engine, 'package.json'))) {
  fs.cpSync(path.join(skill, 'assets/engine'), engine, {recursive:true});
}
const config = readConfig();
if (value('--profile')) config.profileName = value('--profile').replace(/^@/, '');
if (value('--logo')) {
  const logo = path.resolve(value('--logo'));
  if (!fs.existsSync(logo)) throw Error(`Logo não encontrada: ${logo}`);
  const ext = path.extname(logo).toLowerCase();
  if (!['.jpg','.jpeg','.png','.webp'].includes(ext)) throw Error('Use logo JPG, PNG ou WebP.');
  const name = 'perfil-personalizado' + ext;
  if (logo !== path.join(home, name)) fs.copyFileSync(logo, path.join(home, name));
  config.logo = name;
}
fs.writeFileSync(configFile, JSON.stringify(config, null, 2) + '\n');

if (install) {
  if (!existsOnPath('ffmpeg') || !existsOnPath('ffprobe')) throw Error('Instale FFmpeg/ffprobe completos e adicione ao PATH antes de instalar o motor.');
  console.log('Instalando dependências do motor local.');
  execSync('npm install --no-audit --no-fund', {cwd:engine, stdio:'inherit'});
  console.log('Preparando Chrome headless.');
  execSync('npx --no-install remotion browser ensure', {cwd:engine, stdio:'inherit'});
  execFileSync(process.execPath, [path.join(engine, 'scripts/install-whisper.mjs')], {
    cwd:engine, stdio:'inherit', env:{...process.env, MAQUINA_CLIPES_HOME:home},
  });
}
console.log(JSON.stringify({...state(), downloadsPerformed:install}, null, 2));
