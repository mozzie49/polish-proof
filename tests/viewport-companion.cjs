// Browser-backed regression fixture; called by demo:verify so the existing CI covers it.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {capture,compare,pngDimensions}=require('../skills/polish-proof/scripts/receipt.cjs');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function verifyViewportCompanion({base,root,out,executablePath}) {
  const dir=path.join(out,'viewport-companion');fs.mkdirSync(dir,{recursive:true});
  const contract={version:1,viewports:[{name:'phone',width:375,height:812}],protectedFiles:['long-page.html'],targets:[]};
  const snapshots={};
  for(const name of ['default','before','after']) {
    const c=name==='default'?contract:{...contract,viewportCompanion:true};
    const contractPath=path.join(dir,`${name}-contract.json`);fs.writeFileSync(contractPath,JSON.stringify(c));
    const output=path.join(dir,name);
    const snapshot=await capture({url:`${base}/tests/fixtures/long-page.html`,contractPath,projectRoot:path.join(root,'tests/fixtures'),out:output,executablePath});
    snapshots[name]=snapshot;
    const shots=snapshot.views[0].screenshots;
    const expected=name==='default'?['phone.png','snapshot.json']:['phone.png','phone.viewport.png','snapshot.json'];
    assert.deepEqual(fs.readdirSync(output).sort(),expected.sort());
    assert.deepEqual(pngDimensions(fs.readFileSync(path.join(output,'phone.png'))),{width:375,height:4777});
    for(const shot of Object.values(shots)) {
      const bytes=fs.readFileSync(path.join(output,shot.file));
      assert.deepEqual(pngDimensions(bytes),{width:shot.width,height:shot.height});assert.equal(sha(bytes),shot.sha256);
      assert.deepEqual(shot.frame,{width:375,height:812,scrollX:0,scrollY:0});
    }
    if(name!=='default')assert.deepEqual(pngDimensions(fs.readFileSync(path.join(output,'phone.viewport.png'))),{width:375,height:812});
  }
  // Opting in must not silently crop or replace the existing full-page evidence.
  assert.equal(snapshots.default.views[0].screenshots.fullPage.sha256,snapshots.before.views[0].screenshots.fullPage.sha256);
  const receipt=compare(snapshots.before,snapshots.after);
  assert.equal(receipt.verdict,'mechanical-checks-pass');
  assert.equal(receipt.views[0].screenshots.before.fullPage.file,'phone.png');
  assert.equal(receipt.views[0].screenshots.after.viewport.file,'phone.viewport.png');
  fs.writeFileSync(path.join(dir,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
  return {result:'pass',fullPage:{width:375,height:4777},viewport:{width:375,height:812},fullPagePreserved:true,captures:3};
}
module.exports={verifyViewportCompanion};
