import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const setup=path.join(root,'scripts/setup.mjs');
const run=(home,...args)=>spawnSync(process.execPath,[setup,'--home',home,...args],{encoding:'utf8'});

test('check and denied installation do not initialize or download',()=>{
  const sandbox=fs.mkdtempSync(path.join(os.tmpdir(),'clipes-setup-'));
  const home=path.join(sandbox,'dados');
  assert.equal(run(home,'--check').status,0);
  assert.equal(fs.existsSync(home),false);
  assert.equal(run(home,'--install').status,2);
  assert.equal(fs.existsSync(home),false);
});

test('personalization preserves bundled identity and existing engine edits',()=>{
  const sandbox=fs.mkdtempSync(path.join(os.tmpdir(),'clipes-perfil-'));
  const home=path.join(sandbox,'dados com espaço');
  assert.equal(run(home,'--init').status,0);
  const configPath=path.join(home,'config.json');
  assert.equal(JSON.parse(fs.readFileSync(configPath)).profileName,'brasilnews1231');
  const engineFile=path.join(home,'engine/src/index.js');
  fs.appendFileSync(engineFile,'\n// teste de personalização preservada\n');
  const before=fs.readFileSync(engineFile,'utf8');
  const customized=run(home,'--profile','@perfil-do-amigo','--logo',path.join(root,'assets/identidade/perfil.jpg'));
  assert.equal(customized.status,0,customized.stderr);
  const config=JSON.parse(fs.readFileSync(configPath));
  assert.equal(config.profileName,'perfil-do-amigo');
  assert.equal(fs.existsSync(path.join(home,config.logo)),true);
  assert.equal(fs.readFileSync(engineFile,'utf8'),before);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root,'assets/identidade/perfil.json'))).profileName,'brasilnews1231');
});
