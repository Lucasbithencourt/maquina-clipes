// Coloca os hooks de engajamento (extras/assets/notificacao.html) em cima de um vídeo pronto, cada um com os
// sons ding → clique → pop, medidos contra a voz do vídeo (efeitos 12 dB abaixo no integrado; regra fixa do criador).
//
//   node extras/scripts/hooks.mjs entrada.mp4 saida.mp4 --nome "BRASIL NEWS" --hooks "seguir@3,comentar@14|Concorda com ele?" [--logo foto.jpg] [--topo 600]
// Padrão: versão MINI (pílula pequena), no máximo 2 hooks por vídeo: seguir no começo + 1 pergunta perto do fim.
//
// --hooks  lista "tipo@segundo[|linha1|linha2]" (tipos: seguir, curtir, comentar, compartilhar). Padrão: "seguir@3".
// --abaixo quantos dB os efeitos ficam abaixo da voz (padrão 12; mínimo 8)
// O vídeo de entrada não é alterado; grava saida.mp4 num render só (uma vez só).
import { createRequire } from 'node:module';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PACOTE = path.resolve(AQUI, '..');
// playwright-core fica na PASTA DE DADOS (como o motor), nunca dentro da skill:
//   npm install --prefix ".maquina-clipes/extras" playwright-core@1.63.0   (uma vez, na pasta de trabalho)
const _args = process.argv.slice(2);
const _home = (() => { const i = _args.indexOf('--home'); return i >= 0 ? _args[i + 1] : process.env.MAQUINA_CLIPES_HOME || path.join(process.cwd(), '.maquina-clipes'); })();
let chromium;
try { ({ chromium } = createRequire(path.join(path.resolve(_home), 'extras', 'x.js'))('playwright-core')); }
catch { console.error(`Falta o playwright-core. Rode: npm install --prefix "${path.join(_home, 'extras')}" playwright-core@1.63.0`); process.exit(1); }
function achaChrome() {                                   // Chrome/Chromium instalado (ou CHROME_PATH)
  const c = [process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Google.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ...['PROGRAMFILES', 'PROGRAMFILES(X86)', 'LOCALAPPDATA'].map((v) => process.env[v] && path.join(process.env[v], 'Google', 'Chrome', 'Application', 'chrome.exe')),
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const f = c.find((x) => x && fs.existsSync(x));
  if (!f) { console.error('Não achei o Google Chrome. Instale ou defina CHROME_PATH.'); process.exit(1); }
  return f;
}

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const soltos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && args[i - 1] !== '--grande'));
const [entrada, saida] = soltos;
if (!entrada || !saida) { console.error('uso: node notificacao.mjs entrada.mp4 saida.mp4 [--nome "BRASIL NEWS"] [--hooks "seguir@3,curtir@14"] [--abaixo 12]'); process.exit(1); }
const NOME = opt('--nome', 'BRASIL NEWS');
const TOPO = opt('--topo', '600');
const LOGO = path.resolve(opt('--logo', path.join(PACOTE, '..', 'assets', 'identidade', 'perfil.jpg')));   // foto do perfil (o preset da skill ou a do amigo)   // altura (px de 1920) do topo da notificação; 600 = peito, nos cortes metade/metade
const ABAIXO = Math.max(8, parseFloat(opt('--abaixo', '12')));
const HOOKS = (opt('--hooks', `seguir@${opt('--em', '3')}`)).split(',').map((h) => {
  const [cab, l1, l2] = h.split('|');
  const [tipo, em] = cab.split('@');
  return { tipo: tipo.trim(), em: parseFloat(em), l1, l2 };
});
const FPS = 30;

const HTML = path.join(PACOTE, 'assets', 'notificacao.html');
const SONS = path.join(PACOTE, 'assets', 'sons');
const somArq = (n) => [path.join(SONS, n + '.wav')].find((f) => fs.existsSync(f));
const catalogo = (() => { try { return JSON.parse(fs.readFileSync(path.join(SONS, 'catalogo.json'), 'utf8')); } catch { return []; } })();

const info = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration', '-of', 'json', entrada], { encoding: 'utf8' }));
const v = info.streams.find((s) => s.codec_type === 'video');
const temAudio = info.streams.some((s) => s.codec_type === 'audio');
const dur = parseFloat(info.format.duration);

// 1) quadros de cada hook (transparência)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hooks-'));
const nav = await chromium.launch({ executablePath: achaChrome(), headless: true, args: ['--allow-file-access-from-files'] });
const p = await nav.newPage({ viewport: { width: 540, height: 960 } });
p.on('pageerror', (e) => console.log('ERRO na página:', e.message));
for (const [k, h] of HOOKS.entries()) {
  const q = new URLSearchParams({ t: '0', fundo: 'transparente', nome: NOME, tipo: h.tipo, topo: TOPO });
  q.set('avatar', 'file://' + LOGO);
  if (!args.includes('--grande')) q.set('mini', '1');   // padrão: versão minimalista (17/11); --grande volta a antiga
  if (h.l1) q.set('l1', h.l1);
  if (h.l2) q.set('l2', h.l2);
  await p.goto('file://' + HTML + '?' + q.toString());
  await p.waitForFunction(() => window.pronto);
  const { DURACAO, SONS: marcas } = await p.evaluate(() => ({ DURACAO: window.DURACAO, SONS: window.SONS }));
  if (h.em + DURACAO > dur) { console.error(`hook ${h.tipo}@${h.em}: não cabe (vídeo de ${dur.toFixed(1)} s)`); process.exit(1); }
  h.dir = path.join(tmp, String(k)); fs.mkdirSync(h.dir);
  h.marcas = marcas; h.duracao = DURACAO;
  for (let i = 0; i <= Math.ceil(DURACAO * FPS); i++) {
    const url = await p.evaluate((t) => { window.desenhar(t); return document.getElementById('c').toDataURL('image/png'); }, i / FPS);
    fs.writeFileSync(path.join(h.dir, `n_${String(i).padStart(4, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
  }
}
await nav.close();

// 2) volume: mede a voz e põe cada efeito ABAIXO dB abaixo dela (volume do som vem do catálogo; nunca aumenta efeito)
const lufs = (arq) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', arq, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = [...r.stderr.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop();
  return m ? parseFloat(m[1]) : null;
};
const vozMedida = temAudio ? lufs(entrada) : null;
const semVoz = vozMedida == null || vozMedida < -50;      // edit sem música no arquivo (música entra pelo app): referência −16
const voz = semVoz ? -16 : vozMedida;
const alvo = voz - ABAIXO;
const efeitos = [];
for (const h of HOOKS) for (const m of h.marcas) {
  const arq = somArq(m.som); if (!arq) continue;
  const l = catalogo.find((x) => x.nome === m.som)?.lufs ?? -18;
  efeitos.push({ som: m.som, arq, em: h.em + m.t, ganhoDb: Math.min(0, alvo - l) });
}

// 3) monta tudo num render só
const ent = ['-y', '-v', 'error', '-i', entrada];
HOOKS.forEach((h) => ent.push('-framerate', String(FPS), '-i', path.join(h.dir, 'n_%04d.png')));
efeitos.forEach((e) => ent.push('-i', e.arq));
let fc = '', ult = '[0:v]';
HOOKS.forEach((h, k) => {
  fc += `[${k + 1}:v]scale=${v.width}:${v.height},format=rgba,setpts=PTS-STARTPTS+${h.em}/TB[n${k}];${ult}[n${k}]overlay=0:0:eof_action=pass[v${k}];`;
  ult = `[v${k}]`;
});
const base = HOOKS.length + 1;
const mix = temAudio ? ['[0:a]'] : [];
efeitos.forEach((e, i) => {
  const ms = Math.round(e.em * 1000);
  fc += `[${base + i}:a]volume=${e.ganhoDb.toFixed(2)}dB,adelay=${ms}|${ms},apad[s${i}];`;
  mix.push(`[s${i}]`);
});
fc += `${mix.join('')}amix=inputs=${mix.length}:duration=first:normalize=0[a]`;
execFileSync('ffmpeg', [...ent, '-filter_complex', fc, '-map', ult, '-map', '[a]', '-t', String(dur),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', saida], { stdio: 'inherit' });
fs.rmSync(tmp, { recursive: true, force: true });

// 4) conferência medida: pico momentâneo dos efeitos sozinhos × pico da voz, em cada hook
const maxM = (arq, ini, fim) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', arq, '-af', `atrim=${Math.max(0, ini)}:${fim},ebur128`, '-f', 'null', '-'], { encoding: 'utf8' });
  const ms = [...r.stderr.matchAll(/M:\s+(-?[\d.]+)/g)].map((m) => parseFloat(m[1])).filter((x) => x > -70);
  return ms.length ? Math.max(...ms) : null;
};
const stem = path.join(os.tmpdir(), `efeitos-${process.pid}.wav`);
const fcS = efeitos.map((e, i) => { const ms = Math.round(e.em * 1000); return `[${i + 1}:a]volume=${e.ganhoDb.toFixed(2)}dB,adelay=${ms}|${ms},apad=whole_dur=${dur}[s${i}]`; }).join(';')
  + `;${efeitos.map((_, i) => `[s${i}]`).join('')}amix=inputs=${efeitos.length}:duration=longest:normalize=0[a]`;
execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', `anullsrc=r=48000:cl=stereo:d=${dur}`, ...efeitos.flatMap((e) => ['-i', e.arq]), '-filter_complex', fcS, '-map', '[a]', '-t', String(dur), stem]);
const conf = HOOKS.map((h) => {
  const ef = maxM(stem, h.em, h.em + h.duracao), vz = temAudio ? maxM(entrada, h.em - 2, h.em + h.duracao + 2) : null;
  const folga = ef != null && vz != null ? +(vz - ef).toFixed(1) : null;
  return { hook: `${h.tipo}@${h.em}`, voz_pico: vz, efeitos_pico: ef, abaixo_db: folga, ok: folga == null ? 'sem voz' : folga >= 6 };
});
fs.rmSync(stem, { force: true });
console.log(JSON.stringify({ saida, nome: NOME, voz_lufs: voz, conferencia: conf }, null, 2));
// 5) volume final do vídeo inteiro a ≈ −14 LUFS com pico ≤ −1,5 dBFS (a diferença voz × efeitos não muda)
if (!semVoz) execFileSync(path.join(AQUI, 'volume_final.sh'), [saida], { stdio: 'inherit' });
else console.log('sem voz no arquivo: volume final não ajustado (a música entra pelo app)');
