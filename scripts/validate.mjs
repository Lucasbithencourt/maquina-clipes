#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=[];
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){if(item.name==='.git')continue;const file=path.join(dir,item.name);if(item.isDirectory())walk(file);else files.push(file);}}
walk(root);
const skill=fs.readFileSync(path.join(root,'SKILL.md'),'utf8');
assert.match(skill,/^---\r?\nname: maquina-clipes\r?\ndescription: .+\r?\n---/);
assert.ok(!skill.includes('[TODO:'));
const description=skill.split(/\r?\n/).find(l=>l.startsWith('description: ')).slice(13);
assert.ok(description.length<=1024 && !/[<>]/.test(description));
for(const file of files){
  const relative=path.relative(root,file);
  assert.ok(!/(?:^|[\\/])(?:node_modules|\.env|work|temporarios|bundle)(?:[\\/]|$)/.test(relative),relative);
  assert.ok(!/\.(?:mp4|mov|mkv|bin|exe|dll|pem|key)$/i.test(relative),relative);
  if(/\.(?:mjs|js|json)$/.test(file) && !file.endsWith('.jsx')) {
    if(file.endsWith('.json')) JSON.parse(fs.readFileSync(file,'utf8'));
    else execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
  }
  if(/\.(?:md|mjs|js|jsx|json|yaml)$/.test(file)) {
    const text=fs.readFileSync(file,'utf8');
    assert.ok(!/[CD]:[\\/]/.test(text),`Caminho absoluto pessoal: ${relative}`);
    assert.ok(!/gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|^-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----$/m.test(text),`Credencial: ${relative}`);
    if(file.endsWith('.md')) for(const match of text.matchAll(/\]\(([^)]+)\)/g)) {
      if(/^(?:https?:|#)/.test(match[1]))continue;
      assert.ok(fs.existsSync(path.resolve(path.dirname(file),match[1])),`${relative}: ${match[1]}`);
    }
  }
}
assert.ok(fs.existsSync(path.join(root,'assets/identidade/fontes/OFL.txt')));
console.log(`Pacote validado: ${files.length} arquivos, referências resolvidas, sintaxe e credenciais verificadas.`);
