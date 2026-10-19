// 户型/可买判断的展示工具（数据见 data/units.json，构建时合并进 communities.json 的 units 字段）
window.Units=(function(){
const RN={1:'1房',2:'2房',3:'3房',4:'4房',5:'5房',6:'6房'};
const fmt=(x,d=0)=>x==null||isNaN(x)?'—':Number(x).toFixed(d);
function tier(c,b){return (c.units&&c.units.tiers&&c.units.tiers[b])||{status:'tbd'}}
function ok(c,b){const t=tier(c,b);return (t.status==='listing'||t.status==='est')&&(t.rooms||0)>=2}
function area(c,b){const t=tier(c,b);return ok(c,b)?t.area:null}
// 简短 HTML：用于表格、tooltip
function short(c,b,withLink=true){const t=tier(c,b);
  if(t.status==='listing'){const a=`${t.room} <b>${fmt(t.area,1)}</b>㎡ · ${fmt(t.price)}万`;return (withLink&&t.url?`<a href="${t.url}" target="_blank" rel="noopener">${a}</a>`:a)+` <span class="tag ok">挂牌</span>`+(t.low?' <span class="tag warn">单价偏低待核实</span>':'')+(t.area<75?' <span class="tag warn">偏小</span>':'')}
  if(t.status==='est')return `${RN[t.rooms]||''} <b>${fmt(t.area,0)}</b>㎡ ≈${fmt(t.price)}万 <span class="tag warn">估算</span>`;
  if(t.status==='no')return `<span class="tag bad">此档买不到</span>`+(t.basis==='listing'?`<div class="muted">挂牌最便宜${t.minRoom} ${fmt(t.minArea,1)}㎡ ${fmt(t.minPrice)}万</div>`:`<div class="muted">最小${RN[t.minRooms]||''}${fmt(t.minArea)}㎡≈${fmt(t.minPrice)}万</div>`)+(t.oneRoom?`<div class="muted">预算内只有一房 ${fmt(t.oneRoom.area,1)}㎡</div>`:'');
  return '<span class="todo">户型待补</span>'}
function plain(c,b){const t=tier(c,b);
  if(t.status==='listing')return `${t.room}${fmt(t.area,0)}㎡/${fmt(t.price)}万(挂牌)`;
  if(t.status==='est')return `${RN[t.rooms]||''}${fmt(t.area,0)}㎡≈${fmt(t.price)}万(估算)`;
  if(t.status==='no')return '此档买不到';return '户型待补'}
// 详情：户型分布 + 在售样本
function detail(c){const u=c.units;if(!u)return '<p class="todo">户型待补</p>';let h='';
  h+=`<h3>该预算可买的真实户型</h3><div class="kv">${[800,850,900].map(b=>`<div>${b}万档</div><div>${short(c,b)}${tier(c,b).alt3?`<div class="muted">另有 <a href="${tier(c,b).alt3.url}" target="_blank" rel="noopener">${tier(c,b).alt3.room} ${fmt(tier(c,b).alt3.area,1)}㎡ ${fmt(tier(c,b).alt3.price)}万</a></div>`:''}</div>`).join('')}</div>
  <p class="small muted">规则：先看预算内的真实挂牌（≥2房，取面积最大的一套）；没有挂牌样本时，用该小区已知户型面积×参考均价估算并标“估算”；有挂牌但都超预算的标“此档买不到”。单价低于小区锚定价（参考均价、成交价、挂牌中位数中最低者）85%的挂牌视为疑似引流，不参与判断。挂牌价≠成交价，可议价空间另算。</p>`;
  h+=`<h3>户型分布</h3>`;
  if(u.layouts&&u.layouts.length)h+=`<table class="small"><tr><th>户型</th><th>面积段</th><th>来源</th></tr>${u.layouts.map(q=>`<tr><td>${q.label}</td><td>${q.area[0]===q.area[1]?q.area[0]:q.area[0]+'–'+q.area[1]}㎡${q.priceRange?`<div class="muted">${q.priceRange[0]}–${q.priceRange[1]}万</div>`:''}</td><td><a href="${q.url}" target="_blank" rel="noopener">${q.src}</a></td></tr>`).join('')}</table><p class="small muted">房天下“主力户型”的面积段由平台自动汇总，个别极端值可能是录入错误。</p>`;
  else h+='<p class="small"><span class="todo">户型分布待补</span></p>';
  if(u.rentTypes&&u.rentTypes.length)h+=`<div class="small">出租房源中出现的户型：${u.rentTypes.map(r=>`${r.room} ${r.area}㎡`).join('；')}（房天下小区页）</div>`;
  h+=`<h3>在售样本（${u.nSamples}套${u.xm?`，其中房天下第1页 ${u.xm.sampled}/${u.xm.total} 套`:''}）</h3>`;
  if(u.samples&&u.samples.length){const rows=u.samples.slice().sort((a,b)=>a.price-b.price);
    h+=`<div class="tbl-wrap" style="max-height:260px;overflow:auto"><table class="small"><tr><th>户型</th><th>面积</th><th>总价</th><th>单价</th><th>来源/日期</th></tr>${rows.map(s=>`<tr${s.suspect?' style="opacity:.5"':''}><td>${s.room}</td><td>${fmt(s.area,2)}㎡</td><td>${fmt(s.price)}万</td><td>${fmt(s.unit/1e4,2)}万${s.suspect?' <span class="tag bad">疑似引流,已剔除</span>':s.low?' <span class="tag warn">偏低</span>':''}</td><td><a href="${s.url}" target="_blank" rel="noopener">${s.src}</a><div class="muted">${s.listed?'挂牌'+s.listed:'获取'+s.date}</div></td></tr>`).join('')}</table></div>`;
    if(u.nSamples>u.samples.length)h+=`<div class="small muted">只显示最便宜的 ${u.samples.length} 套。</div>`}
  else h+='<p class="small"><span class="todo">在售样本待补</span>（没有查到公开挂牌，或遇到验证码已停止抓取）</p>';
  return h}
return {tier,ok,area,short,plain,detail};
})();
