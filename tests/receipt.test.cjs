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
