const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const dataContext={window:{}};vm.runInNewContext(fs.readFileSync('dist/data.js','utf8'),dataContext);const rows=dataContext.window.UNGM_DATA;
const {createModel}=require('../dist/model.js');const model=createModel(rows);
assert.equal(model.sourceCount,13511);assert.equal(model.roots.map(n=>n.code).join(''),'ABCDEFGHIJ');assert.equal(model.missingCount,18);
const seen=new Set(),leaves=[];
function traverse(id){assert(!seen.has(id),'cycle or duplicate');seen.add(id);const n=model.nodes.get(id);if(model.isFinal(n))leaves.push(n);for(const c of n.children){assert.equal(model.nodes.get(c).parent,id);traverse(c);}}
model.roots.forEach(n=>traverse(n.id));assert.equal(seen.size,13512);assert.equal(leaves.length,model.roots.reduce((a,n)=>a+model.finalCount(n.id),0));
for(const r of rows){const n=model.nodes.get(String(r[0]));assert.equal(n.code,r[2]);assert.equal(n.name,r[3].trim());assert.equal(model.path(n.id)[0].parent,'');}
const wheat=model.search('10121501')[0];assert.equal(wheat.name,'Pure wheat bran');assert.equal(model.path(wheat.id).map(n=>n.code).join('/'),'A/10000000/10120000/10121500/10121501');
assert.equal(model.excelText([wheat.id]),'Code\tName\r\n10121501\tPure wheat bran');const rootTsv=model.excelText(model.roots.map(n=>n.id));assert.equal(rootTsv.split('\r\n').length,11);assert(rootTsv.split('\r\n').every(row=>row.split('\t').length===2));
assert(model.search('office furniture').length>0);assert(model.search('WHEAT BRAN').length>0);assert.equal(model.search('this phrase does not exist zxqz').length,0);
const rootA=model.roots[0];assert.equal(model.search('10121501',{scope:rootA.id}).length,1);assert.equal(model.search('10121501',{scope:model.roots[1].id}).length,0);
assert(model.search('10121500',{finalOnly:false}).some(n=>n.code==='10121500'));assert.equal(model.search('10121500').length,0);
assert.equal(model.excelText(['unlinked']),'Code\tName');assert.equal(model.path('unlinked')[0].code,'H');
// Exercise the actual application handlers in a small DOM harness, without a browser server.
class El{constructor(id=''){this.id=id;this.style={};this.innerHTML='';this.value='';this.hidden=false;this.dataset={};this.listeners={};this.classList={add(){},remove(){},toggle(){}};this.isConnected=true;this.checked=false;}addEventListener(t,fn){this.listeners[t]=fn;}setAttribute(k,v){this[k]=v;}hasAttribute(k){return !!this.attrs?.includes(k);}focus(){this.focused=true;}scrollIntoView(){}select(){this.selected=true;}remove(){}closest(){return this;}querySelectorAll(){return this.resultRows||[];}querySelector(){return this.firstButton||null;}}
const ids={};const document={getElementById:id=>ids[id]||(ids[id]=new El(id)),querySelectorAll:()=>[],querySelector:()=>null,createElement:()=>new El(),body:{classList:{toggle(){}},appendChild(){}}};
let hash='',clipboard='';const location={pathname:'/',get hash(){return hash},set hash(v){hash=v}};
const history={pushState(a,b,url){hash=url.startsWith('#')?url:'';},replaceState(a,b,url){hash=url.startsWith('#')?url:'';}};
const window={UNGM_DATA:rows,UNGM_MODEL:{createModel},addEventListener(){}};
const context={window,document,location,history,navigator:{clipboard:{writeText:async t=>{clipboard=t}}},URLSearchParams,setTimeout:()=>1,clearTimeout(){},console};
vm.runInNewContext(fs.readFileSync('dist/app.js','utf8'),context);
assert(ids.content.innerHTML.includes('Choose a category'));assert.equal((ids.content.innerHTML.match(/class="category-choice"/g)||[]).length,10);
const click=async (dataset,attrs=[])=>{const b=new El();b.dataset=dataset;b.attrs=attrs;await ids.content.listeners.click({target:b});return b;};
(async()=>{
 await click({open:rootA.id});assert(ids.content.innerHTML.includes('Raw Materials, Chemicals, Paper, Fuel'));assert(ids.content.innerHTML.includes('10000000'));assert(!ids.content.innerHTML.includes('10121501'));
 for(const n of model.path(wheat.id).slice(1))await click({open:n.id});assert(ids.content.innerHTML.includes('Your code is ready'));assert(ids.content.innerHTML.includes('Copy list for Excel'));assert.equal((ids.content.innerHTML.match(/data-copy-list/g)||[]).length,1);assert(!ids.content.innerHTML.includes('data-copy='));
 await click({},['data-copy-list']);assert.equal(clipboard,'Code\tName\r\n10121501\tPure wheat bran');
 await click({open:wheat.parent});assert(!ids.content.innerHTML.includes('Your code is ready'));assert(ids.content.innerHTML.includes('Pure wheat bran'));
 await click({},['data-home']);assert(ids.content.innerHTML.includes('Choose a category'));
 ids.search.value='wheat bran';ids['search-form'].listeners.submit({preventDefault(){}});assert(ids.content.innerHTML.includes('Search results'));assert(ids.content.innerHTML.includes('10121501'));
 ids.search.value='qwertyzzzznonsense';ids['search-form'].listeners.submit({preventDefault(){}});assert(ids.content.innerHTML.includes('No matching final codes'));
 ids.search.value='10121500';ids['search-form'].listeners.submit({preventDefault(){}});assert(ids.content.innerHTML.includes('No matching final codes'));ids.content.listeners.change({target:{id:'final-only',checked:false}});assert(ids.content.innerHTML.includes('Livestock feed'));assert(ids['final-only'].focused);ids.content.listeners.change({target:{id:'scope',value:rootA.id}});assert(ids.scope.focused);
 ids.content.listeners.change({target:{id:'scope',value:''}});ids.search.value='medical';ids['search-form'].listeners.submit({preventDefault(){}});const expectedSearch=model.search('medical',{finalOnly:false});assert(expectedSearch.length>40);await click({},['data-copy-list']);assert.equal(clipboard,model.excelText(expectedSearch.map(n=>n.id)));const addedResult=new El();const resultRows=Array.from({length:80},()=>new El());resultRows[40].firstButton=addedResult;ids.content.resultRows=resultRows;await click({},['data-more']);assert(addedResult.focused,'Show more must focus the first newly revealed result');
 await click({open:'unlinked'});assert(ids.content.innerHTML.includes('18 entries have missing parent links'));assert(ids.content.innerHTML.includes('Exact parent information is missing'));
 for(const n of model.nodes.values()){if(!n.children.length)continue;await click({open:n.id});assert.equal((ids.content.innerHTML.match(/data-copy-list/g)||[]).length,1,'One footer for '+n.id);assert(!ids.content.innerHTML.includes('data-copy='));await click({},['data-copy-list']);const expected=model.excelText(n.children);assert.equal(clipboard,expected,'Group TSV mismatch '+n.id);assert(clipboard.split('\r\n').every(row=>row.split('\t').length===2));}
 await click({},['data-home']);await click({},['data-copy-list']);assert.equal(clipboard,model.excelText(model.roots.map(n=>n.id)));
 await click({open:wheat.id});context.navigator.clipboard.writeText=async()=>{throw Error('Clipboard denied')};const target=await click({},['data-copy-list']);assert.equal(ids['manual-copy'].hidden,false);assert.equal(ids['manual-text'].value,'Code\tName\r\n10121501\tPure wheat bran');ids['close-manual'].onclick();assert.equal(ids['manual-copy'].hidden,true);assert(target.focused);
 const html=fs.readFileSync('dist/index.html','utf8');for(const file of ['styles.css','data.js','model.js','app.js','favicon.svg']){assert(html.includes(file));assert(fs.existsSync('dist/'+file));}assert(html.includes('role="search"'));assert(html.includes('aria-live="polite"'));
 console.log(JSON.stringify({status:'passed',sourceRecords:rows.length,reachableNodes:seen.size,finalCodes:leaves.length,categories:model.roots.length,checks:['parent-child navigation','source coverage','search by code and name','category scope','broader-group filter','no-results recovery','one bottom copy button in every group/category','Excel two-column TSV for every group','all search results copied across pagination','clipboard-denied fallback','missing-parent warnings','asset references']},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
