import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';

export const probe = file => JSON.parse(execFileSync('ffprobe', ['-v','error','-show_streams','-show_format','-of','json',file], {encoding:'utf8'}));

export function detectLetterbox(file) {
  const meta = probe(file);
  const video = meta.streams.find(s => s.codec_type === 'video');
  const duration = Number(meta.format.duration);
  const candidates = [];
  for (const fraction of [.1,.45,.8]) {
    const result = spawnSync('ffmpeg', ['-hide_banner','-ss',String(duration*fraction),'-i',file,'-t','0.4','-vf','cropdetect=24:2:0','-an','-f','null','-'], {encoding:'utf8'});
    if (result.status !== 0) return null;
    const matches = [...result.stderr.matchAll(/crop=(\d+):(\d+):(\d+):(\d+)/g)];
    if (!matches.length) return null;
    const last = matches.at(-1);
    candidates.push({w:Number(last[1]),h:Number(last[2]),x:Number(last[3]),y:Number(last[4])});
  }
  const crop = candidates[0];
  if (!candidates.every(c => JSON.stringify(c) === JSON.stringify(crop))) return null;
  const lower = video.height-crop.y-crop.h;
  if (crop.x !== 0 || crop.w !== video.width || crop.y <= 1 || Math.abs(crop.y-lower)>2 || crop.h<video.height*.7) return null;
  return crop;
}

function compatibleCopy(input, directory, label, crop, muted) {
  const stat = fs.statSync(input);
  const stamp = crypto.createHash('sha256').update(JSON.stringify([path.resolve(input),stat.size,stat.mtimeMs,crop,muted])).digest('hex').slice(0,12);
  const name = `${label}-${stamp}.mp4`;
  const output = path.join(directory, name);
  if (fs.existsSync(output)) {probe(output); return name;}
  const temporary = path.join(directory, `${label}-${stamp}-${crypto.randomUUID()}.tmp.mp4`);
  console.log(`Preparando cópia H.264: ${label}${crop ? ' (sem letterbox)' : ''}`);
  execFileSync('ffmpeg', ['-hide_banner','-loglevel','error','-i',input,'-map','0:v:0',
    ...(muted ? ['-an'] : ['-map','0:a:0?','-c:a','aac','-b:a','192k']),
    ...(crop ? ['-vf',`crop=${crop.w}:${crop.h}:${crop.x}:${crop.y}`] : []),
    '-c:v','libx264','-preset','veryfast','-crf','18','-g','48','-pix_fmt','yuv420p','-movflags','+faststart','-n',temporary], {stdio:'inherit'});
  probe(temporary);
  fs.renameSync(temporary, output);
  return name;
}

export function prepareMedia(work, cuts) {
  const publicDir = path.join(work, 'public');
  fs.mkdirSync(publicDir, {recursive:true});
  const source = path.join(work, 'source.mp4');
  const bottom = path.join(work, 'bottom.mp4');
  const bottomMeta = probe(bottom);
  const bv = bottomMeta.streams.find(s => s.codec_type === 'video');
  let bottomCrop = null;
  if (cuts.bottomCrop && typeof cuts.bottomCrop === 'object') bottomCrop = cuts.bottomCrop;
  else if (cuts.bottomCrop !== false && cuts.autoCropBottom !== false) bottomCrop = detectLetterbox(bottom);
  if (bottomCrop && !['x','y','w','h'].every(k => Number.isFinite(bottomCrop[k]))) throw Error('bottomCrop precisa de x,y,w,h numéricos.');
  if (bottomCrop && (bottomCrop.x<0 || bottomCrop.y<0 || bottomCrop.w<=0 || bottomCrop.h<=0 || bottomCrop.x+bottomCrop.w>bv.width || bottomCrop.y+bottomCrop.h>bv.height)) throw Error('bottomCrop sai da área do vídeo.');
  const sourceFile = compatibleCopy(source, publicDir, 'source', null, false);
  const bottomFile = compatibleCopy(bottom, publicDir, 'bottom', bottomCrop, true);
  const prepared = {
    publicDir, sourceFile, bottomFile, bottomCrop,
    source:probe(path.join(publicDir,sourceFile)), bottom:probe(path.join(publicDir,bottomFile)),
  };
  fs.writeFileSync(path.join(work,'media.json'), JSON.stringify(prepared,null,2));
  return prepared;
}
