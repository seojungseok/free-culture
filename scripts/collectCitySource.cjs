// Public standard-data table; no API credentials or visitor-time network calls.
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const page=await browser.newPage();
    const url='https://www.data.go.kr/data/15025456/standard.do';
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>[...document.querySelectorAll('table')].some(t=>t.querySelectorAll('tbody tr').length>100),{timeout:30000});
    const rows=await page.evaluate(()=>{
      const table=[...document.querySelectorAll('table')].find(t=>t.querySelector('th')?.textContent.trim()==='시도명');
      const fields=[...table.querySelectorAll('th')].map(t=>t.textContent.trim());
      return [...table.querySelectorAll('tbody tr')].map(tr=>Object.fromEntries([...tr.querySelectorAll('td')].map((td,i)=>[fields[i],td.textContent.trim()])));
    });
    if(rows.length<100||rows.some(r=>!r['시티투어코스명']))throw Error('Unexpected source structure');
    fs.writeFileSync('data/city-tour-source.json',JSON.stringify({sourceUrl:url,collectedAt:new Date().toISOString(),rows},null,2)+'\n');
    console.log(JSON.stringify({rows:rows.length,areas:[...new Set(rows.map(r=>r['시도명']))]}));
  } finally {await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1});
