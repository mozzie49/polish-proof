#!/usr/bin/env node
/* Local-only screenshot evidence. No upload, telemetry, injected patch, or automatic clicks. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function validateContract(c) {
  if (c.version !== 1 || !Array.isArray(c.viewports) || !c.viewports.length) throw Error('Contract needs version: 1 and viewports');
  if (c.viewportCompanion !== undefined && typeof c.viewportCompanion !== 'boolean') throw Error('viewportCompanion must be a boolean');
  const names = new Set();
  for (const v of c.viewports) {
    if (!/^[a-z0-9-]+$/.test(v.name) || names.has(v.name) || !Number.isInteger(v.width) || !Number.isInteger(v.height) || v.width < 200 || v.height < 200 || v.width > 4000 || v.height > 4000) throw Error('Invalid or duplicate viewport');
    names.add(v.name);
  }
  if (!Array.isArray(c.targets) || !Array.isArray(c.protectedFiles)) throw Error('Contract needs targets and protectedFiles arrays');
  const targets = new Set();
  for (const t of c.targets) {
    if (typeof t.name !== 'string' || !t.name || targets.has(t.name) || typeof t.selector !== 'string' || !t.selector) throw Error('Invalid or duplicate target');
    if (['minWidth','minHeight'].some(k => t[k] !== undefined && (!Number.isFinite(t[k]) || t[k] < 0))) throw Error('Invalid target threshold');
    targets.add(t.name);
  }
  for (const f of c.protectedFiles) if (typeof f !== 'string' || path.isAbsolute(f) || f.split(/[\\/]/).includes('..')) throw Error('Protected files must stay in project root');
}
function protectedHashes(root, files) {
  const base = fs.realpathSync(root);
  return Object.fromEntries(files.map(f => {
    const real = fs.realpathSync(path.resolve(base, f));
    if (!real.startsWith(base + path.sep)) throw Error('Protected file escaped project root');
    return [f, hash(fs.readFileSync(real))];
  }));
}
function pngDimensions(bytes) {
  if (bytes.length < 24 || !bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || bytes.toString('ascii',12,16) !== 'IHDR') throw Error('Expected a PNG screenshot');
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
  if (!width || !height) throw Error('Invalid PNG dimensions');
  return {width,height};
}
async function captureImages(page, out, viewport, companion) {
  // Sequential captures on this page: no navigation, interaction, scrolling, or post-crop.
  // Geometry drift fails explicitly; dynamic JS content still needs a project-native state harness.
  const frame=()=>page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollX,scrollY,documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight}));
  const initial=await frame();
  const screenshots={};
  for (const kind of companion ? ['fullPage','viewport'] : ['fullPage']) {
    const file=kind==='fullPage'?`${viewport.name}.png`:`${viewport.name}.viewport.png`;
    const bytes=await page.screenshot({path:path.join(out,file),fullPage:kind==='fullPage',animations:'disabled'});
    if (JSON.stringify(initial)!==JSON.stringify(await frame())) throw Error('Page geometry changed during screenshot capture; stabilize the page and use a new output directory');
    screenshots[kind]={file,...pngDimensions(bytes),sha256:hash(bytes),frame:{width:initial.width,height:initial.height,scrollX:initial.scrollX,scrollY:initial.scrollY}};
  }
  return screenshots;
}
async function capture({url, contractPath, projectRoot, out, executablePath}) {
  const parsed = new URL(url);
  if (!['http:','https:'].includes(parsed.protocol) || !['localhost','127.0.0.1','[::1]'].includes(parsed.hostname)) throw Error('Only local HTTP(S) URLs are accepted. Run against an authorized local preview.');
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  validateContract(contract);
  // Refuse to overwrite a baseline accidentally.
  fs.mkdirSync(out, {recursive:true});
  if (fs.existsSync(path.join(out, 'snapshot.json'))) throw Error('Output already contains a snapshot; use a new directory');
  const protectedFiles = protectedHashes(projectRoot, contract.protectedFiles);
  const {chromium} = require('playwright');
  const browser = await chromium.launch({headless:true, ...(executablePath ? {executablePath} : {})});
  const snapshot = {version:2, contract, url, capturedAt:new Date().toISOString(), browser:browser.version(), protectedFiles, views:[]};
  try {
    for (const viewport of contract.viewports) {
      const context = await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1,colorScheme:'light',reducedMotion:'reduce',locale:'en-US',timezoneId:'UTC'});
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(url, {waitUntil:'networkidle',timeout:15000});
      await page.evaluate(() => document.fonts.ready);
      const screenshots=await captureImages(page,out,viewport,contract.viewportCompanion===true);
      const data = await page.evaluate(targets => {
        const norm = s => s.replace(/\s+/g,' ').trim();
        const visible = el => { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return r.width>0 && r.height>0 && s.visibility!=='hidden' && s.display!=='none' && Number(s.opacity)!==0; };
        const content = [];
        const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) { const node=walker.currentNode; if (!node.parentElement.closest('script,style,noscript,template') && norm(node.textContent)) content.push(norm(node.textContent)); }
        const controls=[...document.querySelectorAll('a,button,input,select,textarea,[role="button"]')].map(el=>({tag:el.tagName.toLowerCase(),text:norm(el.textContent),type:el.getAttribute('type'),name:el.getAttribute('name'),href:el.getAttribute('href'),role:el.getAttribute('role'),ariaLabel:el.getAttribute('aria-label'),disabled:el.hasAttribute('disabled')}));
        const smallText=[...document.body.querySelectorAll('*')].filter(el=>visible(el)&&[...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&norm(n.textContent))&&parseFloat(getComputedStyle(el).fontSize)<14).map(el=>({tag:el.tagName.toLowerCase(),id:el.id,text:norm(el.textContent).slice(0,100),fontSize:parseFloat(getComputedStyle(el).fontSize)}));
        const measured=targets.map(t=>{
          const els=document.querySelectorAll(t.selector);
          if(els.length!==1) return {name:t.name,matches:els.length};
          const el=els[0],r=el.getBoundingClientRect(),s=getComputedStyle(el);
          return {name:t.name,matches:1,visible:visible(el),width:r.width,height:r.height,x:r.x,y:r.y,fontSize:parseFloat(s.fontSize),withinHorizontalViewport:r.x>=-1&&r.right<=innerWidth+1,text:norm(el.textContent||el.getAttribute('placeholder')||'')};
        });
        return {content,controls,overflowPx:Math.max(0,document.documentElement.scrollWidth-innerWidth),smallText,targets:measured};
      },contract.targets);
      snapshot.views.push({viewport,...data,errors,screenshots});
      await context.close();
    }
    fs.writeFileSync(path.join(out,'snapshot.json'),JSON.stringify(snapshot,null,2)+'\n');
    return snapshot;
  } finally { await browser.close(); }
}
function compare(before, after) {
  const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
  const failures = [];
  if (before.version !== after.version) failures.push('Snapshot versions differ; recapture both sides with the same helper');
  if (!same(before.contract,after.contract)) failures.push('Capture contracts differ');
  if (before.browser !== after.browser) failures.push('Browser versions differ');
  if (!same(before.protectedFiles,after.protectedFiles)) failures.push('Protected source files changed');
  if (before.views.length !== after.views.length) failures.push('Viewport count changed');
  const views=[];
  for (const b of before.views) {
    const a=after.views.find(x=>x.viewport.name===b.viewport.name);
    if (!a) { failures.push(`Missing viewport: ${b.viewport.name}`); continue; }
    if (!same(a.viewport,b.viewport)) failures.push(`${b.viewport.name}: viewport geometry changed`);
    if (!same(a.content,b.content)) failures.push(`${b.viewport.name}: page text changed`);
    if (!same(a.controls,b.controls)) failures.push(`${b.viewport.name}: control contract changed`);
    if (a.errors.length) failures.push(`${b.viewport.name}: runtime errors`);
    if (a.overflowPx>0) failures.push(`${b.viewport.name}: horizontal overflow remains (${a.overflowPx}px)`);
    if (before.version >= 2 || after.version >= 2 || before.contract.viewportCompanion || after.contract.viewportCompanion) {
      const kinds=before.contract.viewportCompanion?['fullPage','viewport']:['fullPage'];
      for (const side of [b,a]) {
        for (const kind of kinds) {
          const shot=side.screenshots?.[kind],v=side.viewport;
          const file=kind==='fullPage'?`${v.name}.png`:`${v.name}.viewport.png`;
          const dimensions=shot && Number.isInteger(shot.width) && Number.isInteger(shot.height) && (kind==='viewport' ? shot.width===v.width&&shot.height===v.height : shot.width>=v.width&&shot.height>=v.height);
          const frame=shot?.frame;
          if (!shot || shot.file!==file || !dimensions || !/^[a-f0-9]{64}$/.test(shot.sha256||'') || !frame || frame.width!==v.width || frame.height!==v.height || !Number.isFinite(frame.scrollX) || !Number.isFinite(frame.scrollY)) failures.push(`${v.name}: invalid or missing ${kind} screenshot evidence`);
        }
        if (!!side.screenshots?.viewport!==!!before.contract.viewportCompanion) failures.push(`${side.viewport.name}: viewport companion does not match contract`);
        if (before.contract.viewportCompanion && !same(side.screenshots?.fullPage?.frame,side.screenshots?.viewport?.frame)) failures.push(`${side.viewport.name}: companion framing differs from full-page capture`);
      }
      for (const kind of kinds) if (!same(b.screenshots?.[kind]?.frame,a.screenshots?.[kind]?.frame)) failures.push(`${b.viewport.name}: ${kind} framing changed`);
    }
    const checks=[];
    for (const t of before.contract.targets) {
      const m=a.targets.find(x=>x.name===t.name);
      const pass=!!m&&m.matches===1&&(!t.visible||m.visible)&&m.withinHorizontalViewport&&m.width>=(t.minWidth||0)&&m.height>=(t.minHeight||0);
      checks.push({name:t.name,pass,before:b.targets.find(x=>x.name===t.name),after:m});
      if (!pass) failures.push(`${b.viewport.name}: target ${t.name} failed its declared contract`);
    }
    views.push({name:b.viewport.name,overflowBefore:b.overflowPx,overflowAfter:a.overflowPx,smallTextBefore:b.smallText.length,smallTextAfter:a.smallText.length,targets:checks,...(b.screenshots||a.screenshots?{screenshots:{before:b.screenshots,after:a.screenshots}}:{})});
  }
  return {version:1,verdict:failures.length?'needs-attention':'mechanical-checks-pass',failures,views,limitations:['This is not an aesthetic score or full accessibility audit.','Text/control/source invariants do not prove behavior; run project interaction tests.','Visual judgment still requires viewing the paired screenshots.','Small text count uses a reporting-only 14px threshold, not a universal design rule.']};
}
async function main() {
  const [command,...raw]=process.argv.slice(2); const args={};
  for(let i=0;i<raw.length;i+=2) { if(!raw[i].startsWith('--')||raw[i+1]===undefined) throw Error('Expected --key value arguments'); args[raw[i].slice(2)]=raw[i+1]; }
  if(command==='capture') {
    for(const key of ['url','contract','project-root','out']) if(!args[key]) throw Error(`Missing --${key}`);
    const s=await capture({url:args.url,contractPath:args.contract,projectRoot:args['project-root'],out:args.out,executablePath:args.chromium});
    console.log(JSON.stringify({snapshot:path.join(args.out,'snapshot.json'),viewports:s.views.length}));
  } else if(command==='compare') {
    for(const key of ['before','after','out']) if(!args[key]) throw Error(`Missing --${key}`);
    const result=compare(JSON.parse(fs.readFileSync(args.before)),JSON.parse(fs.readFileSync(args.after)));
    fs.writeFileSync(args.out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));process.exitCode=result.failures.length?1:0;
  } else throw Error('Commands: capture --url LOCAL_URL --contract FILE --project-root DIR --out DIR [--chromium PATH]; compare --before FILE --after FILE --out FILE');
}
module.exports={capture,compare,validateContract,protectedHashes,pngDimensions,captureImages};
if(require.main===module) main().catch(e=>{console.error(e.message);process.exitCode=2;});
