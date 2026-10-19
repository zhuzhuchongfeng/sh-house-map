window.Pages=(function(){
const $=s=>document.querySelector(s);let D,S;const LS='shm_mine_v1',LSP='shm_params_v1';
const fmt=(x,d=0)=>x==null||isNaN(x)?'—':Number(x).toFixed(d);
const DEFP={cash:0,emergency:0,agentRate:1.5,reno:0,gjjAmt:0,gjjRate:2.6,sdRate:3.05,sdYears:40,income:0,buyYear:2029,ageRule:50};
let PR=Object.assign({},DEFP,JSON.parse(localStorage.getItem(LSP)||'{}'));
function init(d,s){D=d;S=s;Pages.ready=true;renderDecision();renderMethod();renderAbout();renderMine();renderRec();show((location.hash||'#map').slice(1).split('/')[0])}
function show(p){}
function ln(r){const f=D.lines.features.find(x=>x.properties.ref===r);return `<span class="ln" style="background:${f?f.properties.colour:'#888'}">${r}</span>`}
function calcFor(price,area,year,rule){const r=rule||PR.ageRule;const sdY=year?Math.min(PR.sdYears,Loan.maxYears(year,PR.buyYear,r)):PR.sdYears;
  return Object.assign(Loan.calc({price,area,cash:PR.cash,emergency:PR.emergency,agentRate:PR.agentRate/100,reno:PR.reno,gjjAmt:PR.gjjAmt,gjjRate:PR.gjjRate/100,sdRate:PR.sdRate/100,sdYears:sdY,gjjYearsCap:year?Loan.gjjYears(year,PR.buyYear):30,income:PR.income}),{sdY})}
// ---------- 推荐 ----------
function renderRec(){const el=$('#rec-body');if(!el||!D)return;const sc=APP.scored();const byId=Object.fromEntries(sc.map(c=>[c.id,c]));const R=D.meta.recommend;
  let h=`<h2>推荐清单（800 / 850 / 900万三档）</h2><p class="small">口径：面向约 <b>800–900 万</b>自住预算；优先 2010 年后建成（避免部分银行「房龄+贷款年限≤50」把 40 年压短）。推荐板块：静安大宁、普陀武宁/长风、徐汇漕河泾/田林；黄浦房龄偏老、前滩核心和徐汇滨江900万只能买60-75㎡，陆家嘴这个价位基本没有房源。“可买户型”不再用总价÷均价粗算，而是看该小区<b>真实存在的户型</b>：优先用预算内的真实挂牌（≥2房里面积最大的一套，点开是挂牌链接）；没有挂牌样本时用已知户型面积×参考均价估算并标“估算”；挂牌都超预算的不进入该档。挂牌价不是成交价。<b>⭐主推</b>的小区在主推板块，房龄达标且预算内有真实2房及以上户型；<b>○区内可选</b>的小区方便你在各区之间比较，不在上列主推板块里。</p>`;
  [800,850,900].forEach(b=>{const ids=(R.tiers[b]||[]).slice().sort((x,y)=>{const a=byId[x],c=byId[y];if(!a||!c)return 0;return (a.rec.level==='主推'?0:1)-(c.rec.level==='主推'?0:1)||(c._t-a._t)});const c0=calcFor(b,100,null);const c1=calcFor(b,100,2010,50);const c2=calcFor(b,100,2005,50);
    h+=`<div class="tier"><h3>${b}万档</h3><div class="small">${PR.cash>0||PR.gjjAmt>0||PR.income>0?`本档资金测算（≤140㎡，按你在「我的房源」填写的参数）：首付约${fmt(c0.dp,1)}万，贷款约${fmt(c0.loan,1)}万（公积金${PR.gjjAmt}万＋商贷${c0.sdY}年），月供约<b>${fmt(c0.m*1e4)}</b>元${PR.income>0?`，约占月收入 ${PR.income} 万的 <b>${fmt(c0.ratio*100)}%</b>${c0.ratio>0.5?' <span class="tag bad">超过50%红线</span>':''}`:''}。<br>若银行按「房龄+年限≤50」：2010 年建成商贷最长 ${c1.sdY} 年、月供约 ${fmt(c1.m*1e4)} 元${PR.income>0?`（${fmt(c1.ratio*100)}%）`:''}；2005 年建成最长 ${c2.sdY} 年、月供约 ${fmt(c2.m*1e4)} 元${PR.income>0?`（${fmt(c2.ratio*100)}%）`:''}${PR.income>0&&c2.ratio>0.5?' <span class="tag bad">超50%</span>':''}。`:`本档先看面积与房龄；<a href="#mine">到「我的房源」填写首付、公积金、月收入等参数</a>后，这里会按你的数字重算月供（参数只存在本机浏览器）。`}</div>`;
    h+=`<div class="tbl-wrap"><table><tr><th>小区</th><th>区/板块</th><th>参考单价</th><th>${b}万内真实可买户型</th><th>建成/2029房龄</th><th>商贷最长(≤50规则)</th><th>最近地铁</th><th>评分</th><th>主要风险</th></tr>`;
    ids.forEach(id=>{const c=byId[id];if(!c)return;const my=c.year?Loan.maxYears(c.year,2029,50):null;
      h+=`<tr><td><a href="#map/${c.id}">${c.rec.level==='主推'?'⭐':'○'} ${c.name}</a><div class="muted">${c.rec.level}</div></td><td>${c.districtShort}/${c.plate}</td><td>${fmt(c.price/1e4,2)}万/㎡<br><a class="small" href="${c.sources[0].url}" target="_blank">来源</a> <span class="muted">${c.priceMonth||''}</span></td><td class="small">${Units.short(c,b)}</td><td>${c.year||'待补'} / ${c.year?2029-c.year+'年':''}</td><td>${my==null?'待补':my+'年'}${my!=null&&my<40?' <span class="tag warn">受限</span>':''}</td><td>${c.metro?.name||''} ${(c.metro?.lines||[]).map(ln).join('')}<br><span class="muted">步行约${c.metro?.walk}m</span></td><td><b>${fmt(c._t)}</b></td><td class="small">${c.rec.risk}</td></tr>`});
    h+=`</table></div></div>`});
  h+=`<div class="tier"><h3>多花50万能换来什么？</h3>${R.extra50||''}<div id="extra50"></div></div>`;
  h+=`<h3>推荐理由（逐个）</h3><div class="cards">${sc.filter(c=>c.rec).sort((a,b)=>(a.rec.level>b.rec.level?1:-1)||(b._t-a._t)).map(c=>`<div class="card"><h4><a href="#map/${c.id}">${c.rec.level==='主推'?'⭐':'○'} ${c.name}</a> <span class="muted">${c.districtShort}·${c.plate} · ${fmt(c._t)}分</span></h4><div class="small"><b>理由：</b>${c.rec.reason}</div><div class="small"><b>风险：</b>${c.rec.risk}</div></div>`).join('')}</div>`;
  el.innerHTML=h;
  // 多花50万：同一小区面积增量与月供增量
  const a=calcFor(800,100,null),b=calcFor(850,100,null),c=calcFor(900,100,null);
  const mainIds=[...new Set(Object.values(R.tiers).flat())].map(i=>byId[i]).filter(x=>x&&x.rec.level==='主推');
  $('#extra50').innerHTML=`<table><tr><th></th><th>800→850万</th><th>850→900万</th></tr>
  <tr><td>月供增加</td><td>+${fmt((b.m-a.m)*1e4)} 元/月（${fmt(a.m*1e4)}→${fmt(b.m*1e4)}）</td><td>+${fmt((c.m-b.m)*1e4)} 元/月（→${fmt(c.m*1e4)}）</td></tr>
  ${PR.income>0?`<tr><td>月供/月收入</td><td>${fmt(a.ratio*100)}% → ${fmt(b.ratio*100)}%</td><td>→ ${fmt(c.ratio*100)}%${c.ratio>0.5?'（超50%）':''}</td></tr>`:''}
  <tr><td>贷款增加</td><td>+${fmt(b.loan-a.loan,1)} 万</td><td>+${fmt(c.loan-b.loan,1)} 万</td></tr>
  <tr><td>总利息增加（估）</td><td>+${fmt(b.totalInt-a.totalInt,1)} 万</td><td>+${fmt(c.totalInt-b.totalInt,1)} 万</td></tr>
  <tr><td>跌20%时多亏</td><td>+10 万</td><td>+10 万</td></tr>
  <tr><th colspan="3" style="text-align:left">各主推小区三档真实可买户型</th></tr>${mainIds.map(x=>`<tr><td>${x.name}</td><td class="small">${Units.plain(x,800)} → ${Units.plain(x,850)}</td><td class="small">→ ${Units.plain(x,900)}</td></tr>`).join('')}</table>
  <p class="small muted">${PR.cash>0||PR.gjjAmt>0||PR.income>0?`按你在「我的房源」填写的参数计算（可动用 ${PR.cash} 万、应急 ${PR.emergency} 万、中介 ${PR.agentRate}%、装修 ${PR.reno} 万、公积金 ${PR.gjjAmt} 万、商贷 ${PR.sdRate}%/${PR.sdYears} 年${PR.income>0?`、月收入 ${PR.income} 万`:''}）。`:`月供对比需先在「我的房源」填写资金参数；未填写时下表主要展示同小区可多买的面积。`}</p>`}
// ---------- 购房决策 ----------
function renderDecision(){$('#decision-body').innerHTML=D.meta.decisionHtml}
function renderMethod(){$('#method-body').innerHTML=D.meta.methodHtml}
function renderAbout(){$('#about-body').innerHTML=D.meta.aboutHtml}
// ---------- 我的房源 ----------
function load(){return JSON.parse(localStorage.getItem(LS)||'[]')}
function save(a){localStorage.setItem(LS,JSON.stringify(a))}
function prefill(id){setTimeout(()=>{const c=APP.scored().find(x=>x.id===id);if(!c)return;$('#m-name').value=c.name;$('#m-year').value=c.year||'';$('#m-comm').value=c.id;if($('#m-area').value&&!$('#m-price').value)$('#m-price').value=Math.round(c.price*$('#m-area').value/1e4)},80)}
function renderMine(){const el=$('#mine-body');
  const opts=APP.scored().slice().sort((a,b)=>a.name.localeCompare(b.name,'zh')).map(c=>`<option value="${c.id}">${c.name}（${c.districtShort}）</option>`).join('');
  el.innerHTML=`<h2>我的房源（存在本机浏览器 localStorage，不上传）</h2>
  <div class="grid2"><div>
   <h3>添加房源</h3>
   <div class="grid2"><label>小区名<input id="m-name" type="text" placeholder="如：华悦家园"></label><label>关联已收录小区<select id="m-comm"><option value="">（不关联）</option>${opts}</select></label>
   <label>面积㎡<input id="m-area" type="number" step="0.01"></label><label>总价（万）<input id="m-price" type="number" step="1"></label>
   <label>建成年份<input id="m-year" type="number"></label><label>楼层<input id="m-floor" type="text" placeholder="中/12层"></label>
   <label>朝向<input id="m-dir" type="text" placeholder="南北"></label><label>户型<input id="m-room" type="text" placeholder="3室2厅"></label></div>
   <label>链接<input id="m-url" type="url" placeholder="https://..."></label><label>备注<input id="m-note" type="text"></label>
   <p><button class="btn" id="m-add">保存并测算</button> <button class="btn gray" id="m-export">导出JSON</button> <label class="btn gray" style="cursor:pointer">导入<input type="file" id="m-import" accept=".json" style="display:none"></label></p>
  </div><div>
   <h3>测算参数（请自行填写，保存在本机浏览器）</h3><div class="grid2" id="params"></div>
   <p class="small muted">默认不预填任何个人金额。契税：首套≤140㎡ 1%，&gt;140㎡ 1.5%。首付 = 可动用资金 − 应急金 − 契税 − 中介费 − 装修，其余贷款；首付低于总价 15% 会提示。公积金可贷额度以当地政策与账户为准。商贷年限 = min(设定年限, 房龄规则−房龄)。利率默认接近当前常见水平，可改。</p>
   <p><button class="btn gray" id="p-reset">参数恢复默认</button></p>
  </div></div>
  <h3>已保存房源</h3><div id="m-list"></div>`;
  const P=[['cash','可动用资金(万)'],['emergency','应急金(万)'],['agentRate','买方中介费(%)'],['reno','装修(万)'],['gjjAmt','公积金贷款额(万)'],['gjjRate','公积金利率(%)'],['sdRate','商贷利率(%)'],['sdYears','商贷年限(年)'],['income','月收入(万，用于算占比)'],['buyYear','购房年份'],['ageRule','房龄+年限上限(50/70)']];
  $('#params').innerHTML=P.map(([k,n])=>`<label>${n}<input type="number" step="any" data-p="${k}" value="${PR[k]}"></label>`).join('');
  $('#params').addEventListener('input',e=>{const k=e.target.dataset.p;if(!k)return;PR[k]=+e.target.value;localStorage.setItem(LSP,JSON.stringify(PR));list();renderRec()});
  $('#p-reset').onclick=()=>{PR=Object.assign({},DEFP);localStorage.removeItem(LSP);renderMine();renderRec()};
  $('#m-comm').onchange=e=>{const c=APP.scored().find(x=>x.id===e.target.value);if(c){if(!$('#m-name').value)$('#m-name').value=c.name;if(!$('#m-year').value)$('#m-year').value=c.year||''}};
  $('#m-add').onclick=()=>{const it={id:Date.now(),name:$('#m-name').value.trim(),comm:$('#m-comm').value,area:+$('#m-area').value,price:+$('#m-price').value,year:+$('#m-year').value||null,floor:$('#m-floor').value,dir:$('#m-dir').value,room:$('#m-room').value,url:$('#m-url').value,note:$('#m-note').value,added:new Date().toISOString().slice(0,10)};
    if(!it.name||!it.area||!it.price){alert('请至少填写小区名、面积、总价');return}const a=load();a.unshift(it);save(a);list()};
  $('#m-export').onclick=()=>{const b=new Blob([JSON.stringify(load(),null,1)],{type:'application/json'});const u=URL.createObjectURL(b);const x=document.createElement('a');x.href=u;x.download='我的房源.json';x.click()};
  $('#m-import').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const a=JSON.parse(t);if(Array.isArray(a)){save(a.concat(load()));list()}}catch(err){alert('文件格式不对')}})};
  list()}
function list(){const a=load();const el=$('#m-list');if(!el)return;if(!a.length){el.innerHTML='<p class="muted">还没有房源。把挂牌信息填在上面即可测算；数据只存在本机，不会上传。</p>';return}
  el.innerHTML=`<div class="tbl-wrap"><table><tr><th>房源</th><th>单价</th><th>首付</th><th>贷款(公积金+商贷)</th><th>月供(等额本息)</th><th>占收入</th><th>小区评分</th><th></th></tr>${a.map(it=>{const r=calcFor(it.price,it.area,it.year);const c=it.comm?APP.scored().find(x=>x.id===it.comm):null;
   return `<tr><td><b>${it.url?`<a href="${it.url}" target="_blank" rel="noopener">${it.name}</a>`:it.name}</b><div class="muted">${it.area}㎡ ${it.room||''} ${it.floor||''} ${it.dir||''} · ${it.year||'年份?'}年 · ${it.price}万</div><div class="muted">${it.note||''}</div></td>
   <td>${fmt(it.price/it.area,2)}万${c?`<div class="muted">小区均价${fmt(c.price/1e4,2)}万 ${it.price/it.area*1e4>c.price*1.05?'<span class="tag warn">高于均价</span>':it.price/it.area*1e4<c.price*0.95?'<span class="tag ok">低于均价</span>':''}</div>`:''}</td>
   <td>${fmt(r.dp,1)}万${r.dpOk?'':' <span class="tag bad">低于15%</span>'}<div class="muted">契税${(r.deedRate*100).toFixed(1)}% ${fmt(r.deed,1)}万；中介${fmt(r.agent,1)}万</div></td>
   <td>${fmt(r.loan,1)}万<div class="muted">${fmt(r.gjj,1)}（${r.gy}年）+${fmt(r.sd,1)}（${r.sdY}年${r.sdY<PR.sdYears?' 房龄受限':''}）</div></td>
   <td><b>${fmt(r.m*1e4)}</b>元<div class="muted">总利息约${fmt(r.totalInt,0)}万</div></td><td>${fmt(r.ratio*100)}%${r.ratio>0.5?' <span class="tag bad">>50%</span>':''}</td>
   <td>${c?`<a href="#map/${c.id}">${fmt(c._t)}分</a>`:'—'}</td><td><button class="btn red" data-del="${it.id}">删</button></td></tr>`}).join('')}</table></div>`;
  el.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{save(load().filter(x=>String(x.id)!==b.dataset.del));list()})}
return {init,show,renderRec,prefill,ready:false};
})();
