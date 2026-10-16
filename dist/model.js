(function (global) {
  'use strict';
  const shortNames = {
    A: 'Raw materials, chemicals, paper & fuel', B: 'Industrial equipment & tools', C: 'Components & supplies',
    D: 'Construction, transport & facilities', E: 'Medical, laboratory & pharmaceuticals',
    F: 'Food, cleaning & service equipment', G: 'Business, communication & technology',
    H: 'Defence, security & safety', I: 'Personal, domestic & consumer goods', J: 'Services'
  };
  const normalize = s => String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  function createModel(rows) {
    const nodes = new Map(rows.map((r, order) => [String(r[0]), {id: String(r[0]), parent: String(r[1] || ''), originalParent: String(r[1] || ''), code: String(r[2]), name: String(r[3]).trim(), order, children: [], warning: false}]));
    const roots = [...nodes.values()].filter(n => /^[A-J]$/.test(n.code)).sort((a,b) => a.code.localeCompare(b.code));
    const h = roots.find(n => n.code === 'H');
    const missing = [...nodes.values()].filter(n => n.parent && !nodes.has(n.parent));
    if (missing.length) {
      const special = {id:'unlinked',parent:h.id,code:'',name:'Entries with missing parent information',children:[],synthetic:true,warning:true,order:Infinity};
      nodes.set(special.id,special);
      for (const n of missing) { n.parent=special.id; n.warning=true; }
    }
    for (const n of nodes.values()) if (n.parent && nodes.has(n.parent)) nodes.get(n.parent).children.push(n.id);
    for (const n of nodes.values()) n.children.sort((a,b) => nodes.get(a).order-nodes.get(b).order);
    // The source's insertion order is not hierarchical. Sort siblings by their displayed code.
    for (const n of nodes.values()) n.children.sort((a,b) => nodes.get(a).synthetic ? 1 : nodes.get(b).synthetic ? -1 : nodes.get(a).code.localeCompare(nodes.get(b).code,'en',{numeric:true}) || nodes.get(a).order-nodes.get(b).order);
    const paths=new Map();
    function path(id) {
      if(paths.has(id))return paths.get(id);
      const trail=[],seen=new Set();let n=nodes.get(id);
      while(n&&!seen.has(n.id)){trail.unshift(n);seen.add(n.id);n=nodes.get(n.parent);}
      paths.set(id,trail);return trail;
    }
    const isFinal=n=>!!n && !n.synthetic && !n.children.length && /^\d{8}$/.test(n.code);
    const all=[...nodes.values()].filter(n=>!n.synthetic);
    for(const n of all){n.searchText=normalize(n.code+' '+n.name);n.root=path(n.id)[0]?.id;}
    const finalCount=id=>{let count=0,stack=[id];while(stack.length){const n=nodes.get(stack.pop());if(isFinal(n))count++;stack.push(...n.children);}return count;};
    function search(query,{finalOnly=true,scope=''}={}) {
      const q=normalize(query),tokens=q.split(' ').filter(Boolean);if(!tokens.length)return [];
      return all.filter(n=>(!finalOnly||isFinal(n))&&(!scope||n.root===scope)&&tokens.every(t=>n.searchText.includes(t))).map(n=>({n,rank:n.code===q?0:n.code.startsWith(q)?1:normalize(n.name)===q?2:normalize(n.name).startsWith(q)?3:4})).sort((a,b)=>a.rank-b.rank||a.n.name.localeCompare(b.n.name)||a.n.code.localeCompare(b.n.code)).map(x=>x.n);
    }
    function excelText(ids) {
      const items=ids.map(id=>nodes.get(id)).filter(n=>n&&!n.synthetic&&n.code);
      const cell=value=>String(value).replace(/[\t\r\n]+/g,' ');
      return [['Code','Name'],...items.map(n=>[n.code,n.name])].map(row=>row.map(cell).join('\t')).join('\r\n');
    }
    return {nodes,roots,path,isFinal,search,excelText,finalCount,shortNames,sourceCount:rows.length,missingCount:missing.length};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={createModel,normalize};
  else global.UNGM_MODEL={createModel,normalize};
})(typeof window!=='undefined'?window:globalThis);
