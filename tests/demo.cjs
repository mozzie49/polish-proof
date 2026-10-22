#!/usr/bin/env node
// Reproduce browser evidence from the immutable demo. No downloads.
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {capture,compare}=require('../skills/polish-proof/scripts/receipt.cjs');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const out=path.resolve(process.env.PROOF_OUT||path.join(root,'evidence',`run-${Date.now()}`));
const executablePath=process.env.CHROMIUM_PATH;
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript'};
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(root,'.'+decodeURIComponent(pathname)+(pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data);});
});
async function flows(browser,url,viewport){
  const page=await browser.newPage({viewport});
  try {
    await page.goto(url);
    await page.locator('#search').fill('science');
    assert.equal(await page.locator('.lesson:visible').count(),1);
    await page.locator('#search').fill('not-present');
    assert.equal(await page.locator('.lesson:visible').count(),0);
    assert.equal(await page.locator('#no-results').isVisible(),true);
    await page.locator('#search').fill('');
    assert.equal(await page.locator('.lesson:visible').count(),2);
    for(const entry of ['continue','explore','review']){
      await page.locator('#'+entry).click();
      assert.equal(await page.locator('#lesson-dialog').isVisible(),true);
      await page.locator('[value="length"]').check();
      await page.locator('#quiz button').click();
      assert.match(await page.locator('#feedback').textContent(),/Try again/);
      await page.locator('[value="context"]').check();
      await page.locator('#quiz button').click();
      assert.match(await page.locator('#feedback').textContent(),/Exactly/);
      await page.getByRole('button',{name:'Close lesson'}).click();
      assert.equal(await page.locator('#lesson-dialog').isVisible(),false);
    }
    await page.locator('#continue').click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#lesson-dialog').isVisible(),false);
    await page.locator('#help').click();
    assert.match(await page.locator('#status').textContent(),/Choose a lesson/);
    return {viewport,result:'pass',flows:['filter-match','filter-empty','filter-reset','3 entries × wrong/correct answer/close','reopen/Escape','help']};
  } finally {await page.close();}
}
(async()=>{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    const captures={};
    for(const name of ['before','after'])captures[name]=await capture({url:`${base}/demo/${name}/`,contractPath:path.join(root,'demo/contract.json'),projectRoot:path.join(root,'demo',name),out:path.join(out,name),executablePath});
    const receipt=compare(captures.before,captures.after);
    fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));
    const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
    const results=[];
    try{for(const name of ['before','after'])for(const viewport of [{width:390,height:844},{width:1440,height:1000}])results.push({variant:name,...await flows(browser,`${base}/demo/${name}/`,viewport)});}finally{await browser.close()}
    fs.writeFileSync(path.join(out,'interactions.json'),JSON.stringify(results,null,2));
    console.log(JSON.stringify({out,verdict:receipt.verdict,interactionRuns:results.length,failures:receipt.failures},null,2));
    process.exitCode=receipt.failures.length?1:0;
  }finally{await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error.stack);process.exitCode=2;server.close()});
