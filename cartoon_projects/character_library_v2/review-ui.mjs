import {chromium} from '../../../Papermotion/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
try{os.setPriority(0,os.constants.priority.PRIORITY_BELOW_NORMAL)}catch{}
const root=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')),out=path.join(root,'review');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--renderer-process-limit=2','--num-raster-threads=2']});
try{
 const page=await browser.newPage({viewport:{width:1260,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3306',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>globalThis.ready===true);
 const catalog=await page.evaluate(()=>globalThis.catalog),motions=await page.evaluate(()=>globalThis.motionList),styles=await page.evaluate(()=>globalThis.styleList);
 for(const st of styles){const b=page.getByRole('button',{name:st.name,exact:true});await b.click();if(await b.getAttribute('aria-pressed')!=='true')throw Error('Group selection failed');for(const c of catalog){await page.getByRole('button',{name:c.name,exact:true}).click();if(await page.locator('#name').textContent()!==c.name)throw Error('Character selection failed');}}
 for(const m of motions){const b=page.getByRole('button',{name:m.name,exact:true});await b.click();if(await b.getAttribute('aria-pressed')!=='true')throw Error('Motion selection failed');}
 await page.getByRole('button',{name:catalog[0].name,exact:true}).click();await page.getByRole('button',{name:'تحية',exact:true}).click();
 await page.waitForTimeout(1300);const a=await page.locator('#preview').evaluate(c=>c.toDataURL());await page.waitForTimeout(240);const b=await page.locator('#preview').evaluate(c=>c.toDataURL());if(a===b)throw Error('Live animation did not advance');
 await page.getByRole('button',{name:'إيقاف الحركة',exact:true}).click();const pausedA=await page.locator('#preview').evaluate(c=>c.toDataURL());await page.waitForTimeout(150);const pausedB=await page.locator('#preview').evaluate(c=>c.toDataURL());if(pausedA!==pausedB)throw Error('Pause failed');
 for(const mode of ['light','dark','forced']){await page.emulateMedia(mode==='forced'?{colorScheme:'light',forcedColors:'active'}:{colorScheme:mode,forcedColors:'none'});await page.screenshot({path:path.join(out,`ui-${mode}.png`),fullPage:true});}
 await page.emulateMedia({colorScheme:'light',forcedColors:'none'});await page.getByRole('button',{name:'عكس الاتجاه',exact:true}).click();if(await page.locator('#flip').getAttribute('aria-pressed')!=='true')throw Error('Flip failed');
 await page.locator('#bones').check();if(!await page.locator('#bones').isChecked())throw Error('Bone toggle failed');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'ui-mobile.png'),fullPage:true});
 if(errors.length)throw Error(errors.join('\n'));
 const report={groups:styles.length,charactersPerGroup:catalog.length,modelCount:styles.length*catalog.length,motions:motions.length,selection:'passed',liveAnimation:'passed',pause:'passed',flip:'passed',bones:'passed',themes:['light','dark','forced-colors'],mobile:'390px checked',errors};fs.writeFileSync(path.join(out,'ui-checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close()}
