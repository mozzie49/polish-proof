const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {compare,validateContract,protectedHashes,capture}=require('../skills/polish-proof/scripts/receipt.cjs');
const contract={version:1,viewports:[{name:'phone',width:390,height:844}],protectedFiles:['app.js'],targets:[{name:'go',selector:'#go',minWidth:44,minHeight:44,visible:true}]};
const baseline=()=>({version:1,browser:'123',contract:structuredClone(contract),protectedFiles:{'app.js':'same'},views:[{viewport:contract.viewports[0],content:['Read a lesson'],controls:[{tag:'button',text:'Start'}],overflowPx:0,smallText:[],errors:[],targets:[{name:'go',matches:1,visible:true,width:100,height:44,withinHorizontalViewport:true}]}]});
test('a valid mechanical receipt passes without inventing a beauty score',()=>{const r=compare(baseline(),baseline());assert.equal(r.verdict,'mechanical-checks-pass');assert.ok(r.limitations.length);assert.equal(r.score,undefined)});
for (const [name,mutate,pattern] of [
 ['changed source',s=>s.protectedFiles['app.js']='changed',/Protected source/],
 ['removed text',s=>s.views[0].content=[],/text changed/],
 ['changed control',s=>s.views[0].controls[0].text='Buy',/control contract/],
 ['overflow',s=>s.views[0].overflowPx=60,/overflow remains/],
 ['tiny target',s=>s.views[0].targets[0].height=22,/target go/],
 ['offscreen target',s=>s.views[0].targets[0].withinHorizontalViewport=false,/target go/],
 ['hidden target',s=>s.views[0].targets[0].visible=false,/target go/],
 ['missing target',s=>s.views[0].targets=[],/target go/],
 ['ambiguous target',s=>s.views[0].targets[0].matches=2,/target go/],
 ['page exception',s=>s.views[0].errors=['broken'],/runtime errors/],
 ['missing viewport',s=>s.views=[],/Missing viewport/],
 ['changed browser',s=>s.browser='124',/Browser versions/],
 ['changed threshold',s=>s.contract.targets[0].minHeight=10,/contracts differ/]
]) test(`rejects ${name}`,()=>{const a=baseline();mutate(a);const r=compare(baseline(),a);assert.equal(r.verdict,'needs-attention');assert.ok(r.failures.some(x=>pattern.test(x)),r.failures.join('\n'))});
test('valid contract accepted',()=>assert.doesNotThrow(()=>validateContract(contract)));
test('rejects path traversal',()=>assert.throws(()=>validateContract({...contract,protectedFiles:['../secret']}),/project root/));
test('rejects duplicate viewport',()=>assert.throws(()=>validateContract({...contract,viewports:[contract.viewports[0],contract.viewports[0]]}),/viewport/));
test('rejects negative threshold',()=>assert.throws(()=>validateContract({...contract,targets:[{name:'bad',selector:'button',minHeight:-1}]}),/threshold/));
test('hashes source and rejects symlinks outside project',()=>{const root=fs.mkdtempSync(path.join(os.tmpdir(),'polish-proof-unit-'));try{fs.mkdirSync(path.join(root,'project'));fs.writeFileSync(path.join(root,'outside'),'secret');fs.writeFileSync(path.join(root,'project','app.js'),'x');fs.symlinkSync(path.join(root,'outside'),path.join(root,'project','link'));assert.equal(protectedHashes(path.join(root,'project'),['app.js'])['app.js'].length,64);assert.throws(()=>protectedHashes(path.join(root,'project'),['link']),/escaped/)}finally{fs.rmSync(root,{recursive:true,force:true})}});
test('capture refuses remote URLs before browser or filesystem work',async()=>{await assert.rejects(capture({url:'https://example.com'}),/Only local/)});

const {pngDimensions,captureImages}=require('../skills/polish-proof/scripts/receipt.cjs');
const png=(width,height)=>{const b=Buffer.alloc(24);Buffer.from([137,80,78,71,13,10,26,10]).copy(b);b.write('IHDR',12);b.writeUInt32BE(width,16);b.writeUInt32BE(height,20);return b};
const withImages=(companion=true)=>{
  const s=baseline();s.version=2;s.contract.viewportCompanion=companion;
  const frame={width:390,height:844,scrollX:0,scrollY:0};
  s.views[0].screenshots={fullPage:{file:'phone.png',width:390,height:4777,sha256:'a'.repeat(64),frame}};
  if(companion)s.views[0].screenshots.viewport={file:'phone.viewport.png',width:390,height:844,sha256:'b'.repeat(64),frame:structuredClone(frame)};
  return s;
};
test('optional companion requires a boolean',()=>assert.throws(()=>validateContract({...contract,viewportCompanion:'true'}),/boolean/));
test('PNG dimensions come from image bytes',()=>{assert.deepEqual(pngDimensions(png(375,4777)),{width:375,height:4777});assert.throws(()=>pngDimensions(Buffer.alloc(24)),/PNG/)});
test('capture keeps full-page filename and adds a direct viewport capture',async()=>{
  const calls=[],frame={width:375,height:812,scrollX:0,scrollY:0,documentWidth:375,documentHeight:4777};
  const page={evaluate:async()=>frame,screenshot:async options=>{calls.push(options);return png(375,options.fullPage?4777:812)}};
  const shots=await captureImages(page,'/proof',{name:'phone'},true);
  assert.deepEqual(calls.map(c=>[path.basename(c.path),c.fullPage]),[['phone.png',true],['phone.viewport.png',false]]);
  assert.ok(calls.every(c=>c.clip===undefined));assert.equal(shots.fullPage.height,4777);assert.equal(shots.viewport.height,812);assert.deepEqual(shots.fullPage.frame,shots.viewport.frame);
});
test('default capture still creates only the full-page image',async()=>{
  const calls=[];const page={evaluate:async()=>({width:375,height:812,scrollX:0,scrollY:0}),screenshot:async o=>{calls.push(o);return png(375,4777)}};
  const shots=await captureImages(page,'/proof',{name:'phone'},false);
  assert.equal(calls.length,1);assert.deepEqual(Object.keys(shots),['fullPage']);
});
test('capture rejects page geometry drift rather than pairing different frames',async()=>{
  let frame=0;const page={evaluate:async()=>({height:812,scrollY:frame++}),screenshot:async()=>png(375,4777)};
  await assert.rejects(captureImages(page,'/proof',{name:'phone'},true),/geometry changed/);
});
test('receipt preserves both screenshot manifests without requiring matching image hashes',()=>{
  const a=withImages();a.views[0].screenshots.viewport.sha256='c'.repeat(64);
  const r=compare(withImages(),a);assert.equal(r.failures.length,0);assert.equal(r.views[0].screenshots.after.viewport.file,'phone.viewport.png');
});
test('new default full-page-only snapshots compare successfully',()=>assert.equal(compare(withImages(false),withImages(false)).failures.length,0));
for(const [name,mutate,pattern] of [
 ['missing companion',s=>delete s.views[0].screenshots.viewport,/viewport screenshot/],
 ['missing full-page',s=>delete s.views[0].screenshots.fullPage,/fullPage screenshot/],
 ['incorrect viewport dimensions',s=>s.views[0].screenshots.viewport.height=4777,/viewport screenshot/],
 ['incorrect full-page filename',s=>s.views[0].screenshots.fullPage.file='phone-cropped.png',/fullPage screenshot/],
 ['invalid screenshot hash',s=>s.views[0].screenshots.fullPage.sha256='bad',/fullPage screenshot/],
 ['changed companion scroll',s=>s.views[0].screenshots.viewport.frame.scrollY=300,/framing/],
 ['mixed legacy/new snapshots',s=>s.version=1,/Snapshot versions/]
])test(`screenshot receipt rejects ${name}`,()=>{const a=withImages();mutate(a);assert.ok(compare(withImages(),a).failures.some(f=>pattern.test(f)))});
