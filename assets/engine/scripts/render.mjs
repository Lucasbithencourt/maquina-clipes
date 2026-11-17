import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {probe} from './media.mjs';

const engine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function chromeIn(directory) {
  if (!fs.existsSync(directory)) return null;
  for (const entry of fs.readdirSync(directory,{withFileTypes:true})) {
    const name = path.join(directory,entry.name);
    if (entry.isFile() && ['chrome-headless-shell.exe','chrome-headless-shell'].includes(entry.name)) return name;
    if (entry.isDirectory()) {const found=chromeIn(name); if(found) return found;}
  }
  return null;
}

export async function renderJobs(jobs, publicDir, outDir, config) {
  const temp = path.join(path.dirname(publicDir),'temporarios');
  fs.mkdirSync(temp,{recursive:true});
  process.env.TEMP=temp; process.env.TMP=temp; process.env.TMPDIR=temp;
  const [{bundle},{openBrowser,selectComposition,renderStill,renderMedia}] = await Promise.all([import('@remotion/bundler'),import('@remotion/renderer')]);
  const browserExecutable = chromeIn(path.join(engine,'node_modules/.remotion'));
  if (!browserExecutable) throw Error('Chrome local ausente. Autorize e execute setup.mjs --install --allow-downloads; nenhum navegador foi baixado.');
  const serveUrl = await bundle({entryPoint:path.join(engine,'src/index.js'),publicDir,rootDir:engine,outDir:path.join(temp,'bundle-'+crypto.randomUUID()),enableCaching:false});
  const browser=await openBrowser('chrome',{browserExecutable});
  const qa=[];
  fs.mkdirSync(path.join(outDir,'conferencia'),{recursive:true});
  try {
    for (const {id,props} of jobs) {
      const output=path.join(outDir,id+'.mp4');
      if (fs.existsSync(output)) throw Error(`Saída já existe: ${output}. Use uma nova pasta de revisão.`);
      const composition=await selectComposition({serveUrl,id:'SplitCut',inputProps:props,browserExecutable,puppeteerInstance:browser});
      const common={serveUrl,composition,inputProps:props,browserExecutable,puppeteerInstance:browser,
        offthreadVideoCacheSizeInBytes:config.render?.cacheBytes || 67108864,offthreadVideoThreads:1,
        mediaCacheSizeInBytes:33554432,timeoutInMilliseconds:config.render?.timeoutMs || 120000};
      await renderStill({...common,frame:Math.min(90,composition.durationInFrames-1),imageFormat:'jpeg',output:path.join(outDir,'conferencia',id+'-previa.jpg')});
      const staging=path.join(outDir,`${id}-${crypto.randomUUID()}.staging.mp4`);
      console.log(`Renderizando ${id}: ${props.totalSeconds.toFixed(1)} s`);
      let last=-1;
      await renderMedia({...common,outputLocation:staging,codec:'h264',crf:20,pixelFormat:'yuv420p',
        concurrency:Math.max(1,Math.min(2,config.render?.concurrency || 1)),overwrite:true,
        onProgress:p=>{const n=Math.floor(p.progress*10); if(n!==last){last=n;console.log(`${id}: ${n*10}%`);}}});
      // Exclusive copy avoids unsupported hard links and never replaces an existing final.
      fs.copyFileSync(staging,output,fs.constants.COPYFILE_EXCL);
      fs.unlinkSync(staging);
      const n=composition.durationInFrames;
      const frames=[0,Math.min(90,n-1),Math.round((n-1)*.25),Math.round((n-1)*.5),Math.round((n-1)*.75),n-1].sort((a,b)=>a-b);
      const unique=[...new Set(frames)];
      execFileSync('ffmpeg',['-v','error','-i',output,'-vf',`select='${unique.map(f=>`eq(n,${f})`).join('+')}',scale=360:640,tile=3x2`,'-frames:v','1','-y',path.join(outDir,'conferencia',id+'-folha.jpg')],{stdio:'pipe'});
      execFileSync('ffmpeg',['-v','error','-i',output,'-f','null','-'],{stdio:'pipe'});
      const metadata=probe(output);
      qa.push({id,arquivo:output,duracao:Number(metadata.format.duration),quadros:frames,decode:'OK',visual:'pendente de leitura das imagens',escuta:'pendente',video:metadata.streams.find(s=>s.codec_type==='video'),audio:metadata.streams.find(s=>s.codec_type==='audio')});
      fs.writeFileSync(path.join(outDir,'conferencia/qa.json'),JSON.stringify(qa,null,2));
      fs.writeFileSync(path.join(outDir,'ENTREGA.md'),`# Cortes exportados\n\n${qa.map(q=>`- ${q.id}.mp4: ${q.duracao.toFixed(1)} s`).join('\n')}\n\n1080×1920, 30 fps, H.264/AAC. Decodificação dos arquivos concluídos: OK.\nAs folhas e prévias precisam ser vistas; marque a conferência visual depois de lê-las. Escuta integral pendente.\n`);
    }
  } finally {await browser.close({silent:true});}
  return qa;
}
