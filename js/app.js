(function(){
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const LS_W='shm_weights_v1',LS_MINE='shm_mine_v1';
const S={weights:Object.assign({},Score.DEF,JSON.parse(localStorage.getItem(LS_W)||'{}')),ageRule:50,budget:850,minArea:75,minYear:1995,maxWalk:2500,dists:new Set(),recOnly:false,base:'amap',showLines:new Set(),selected:null};
let D={},map,layers={},baseLayer,scored=[];
const DCOL={putuo:'#0ea5e9',changning:'#8b5cf6',huangpu:'#ef4444',jingan:'#f59e0b',pudong:'#10b981',xuhui:'#ec4899'};
const fmt=(x,d=0)=>x==null||isNaN(x)?'—':Number(x).toFixed(d);
const TD=x=>x==null||x===''?'<span class="todo">待补</span>':x;
window.APP={S,get D(){return D},scoreAll,openCommunity,go};

Promise.all(['data/communities.json','data/meta.json','data/districts.geojson','data/metro_lines.geojson','data/metro_stations.json'].map(u=>fetch(u).then(r=>r.json()))).then(([c,m,dg,ml,ms])=>{
  D={communities:c.communities,meta:m,distGeo:dg,lines:ml,stations:ms.stations,built:c.built};
  Object.keys(m.districts).forEach(k=>S.dists.add(k));
  ml.features.forEach(f=>S.showLines.add(f.properties.ref));
  initUI();initMap();scoreAll();route();Pages.init(D,S);
  window.addEventListener('hashchange',route);
});
function ctx(){return {weights:S.weights,ageRule:S.ageRule,districts:D.meta.districts,budget:S.budget}}
function scoreAll(){
  scored=D.communities.map(c=>{const r=Score.total(c,ctx());const area=Units.area(c,S.budget);return Object.assign({},c,{_t:r.total,_s:r.s,_why:r.why,_area:area})});
  scored.sort((a,b)=>(b._t??-1)-(a._t??-1));scored.forEach((c,i)=>c._rank=i+1);
  renderMarkers();renderList();updateCount();
  if(S.selected)openCommunity(S.selected,false);
  if(window.Pages&&Pages.ready)Pages.renderRec();
}
function pass(c){const tt=Units.tier(c,S.budget);return S.dists.has(c.districtId)&&(c.year==null||c.year>=S.minYear)&&(tt.status==='tbd'||(c._area!=null&&c._area>=S.minArea))&&((c.metro?.walk??0)<=S.maxWalk)&&(!S.recOnly||c.rec)}
function updateCount(){const n=scored.filter(pass).length;$('#f-count').textContent=`当前显示 ${n} / ${scored.length} 个小区（${S.budget}万预算内能买到≥${S.minArea}㎡的2房及以上；户型待补的也显示）`}
// ---------- UI ----------
function initUI(){
  $('#datainfo').innerHTML=`数据更新：${D.built}　小区 ${D.communities.length} 个<br>价格为挂牌参考价，非成交价，仅供参考`;
  const fd=$('#f-dist');Object.entries(D.meta.districts).forEach(([k,v])=>{fd.insertAdjacentHTML('beforeend',`<label><input type="checkbox" data-d="${k}" checked><span class="dot" style="background:${DCOL[k]}"></span>${v.short}</label>`)});
  fd.addEventListener('change',e=>{const k=e.target.dataset.d;e.target.checked?S.dists.add(k):S.dists.delete(k);scoreAll()});
  const bind=(id,key,num=true)=>{const el=$(id);el.addEventListener('input',()=>{S[key]=num?+el.value:el.value;const v=$(id+'-v');if(v)v.textContent=el.value;scoreAll()})};
  bind('#f-area','minArea');bind('#f-year','minYear');bind('#f-walk','maxWalk');bind('#f-budget','budget');
  $('#f-agerule').addEventListener('change',e=>{S.ageRule=+e.target.value;scoreAll()});
  $('#f-reconly').addEventListener('change',e=>{S.recOnly=e.target.checked;scoreAll()});
  const w=$('#weights');Object.keys(Score.DEF).forEach(k=>{w.insertAdjacentHTML('beforeend',`<label class="row">${Score.NAMES[k]}<span><input type="range" min="0" max="40" value="${S.weights[k]}" data-w="${k}"> <b id="wv-${k}">${S.weights[k]}</b></span></label>`)});
  w.addEventListener('input',e=>{const k=e.target.dataset.w;if(!k)return;S.weights[k]=+e.target.value;$('#wv-'+k).textContent=e.target.value;localStorage.setItem(LS_W,JSON.stringify(S.weights));scoreAll()});
  $('#w-reset').onclick=()=>{S.weights=Object.assign({},Score.DEF);localStorage.removeItem(LS_W);$$('[data-w]').forEach(el=>{el.value=S.weights[el.dataset.w];$('#wv-'+el.dataset.w).textContent=el.value});scoreAll()};
  $('#basemap').addEventListener('change',e=>{S.base=e.target.value;setBase();redrawOverlays()});
  $('#l-dist').addEventListener('change',redrawOverlays);$('#l-station').addEventListener('change',redrawOverlays);
  const ll=$('#l-lines');D.lines.features.forEach(f=>{const p=f.properties;ll.insertAdjacentHTML('beforeend',`<label><input type="checkbox" data-l="${p.ref}" checked><span class="ln" style="background:${p.colour}">${p.ref}</span></label>`)});
  ll.addEventListener('change',e=>{const r=e.target.dataset.l;e.target.checked?S.showLines.add(r):S.showLines.delete(r);redrawOverlays()});
  $('#l-all').onclick=e=>{e.preventDefault();$$('[data-l]').forEach(x=>{x.checked=true;S.showLines.add(x.dataset.l)});redrawOverlays()};
  $('#l-none').onclick=e=>{e.preventDefault();$$('[data-l]').forEach(x=>{x.checked=false;S.showLines.delete(x.dataset.l)});redrawOverlays()};
  $('#panel-close').onclick=()=>{$('#panel').classList.remove('on');S.selected=null;setTimeout(()=>map.invalidateSize(),50)};
  $('#mob-toggle').onclick=()=>$('#sidebar').classList.toggle('open');
  $('#legend').innerHTML=`<div><span class="star-icon" style="font-size:14px">⭐</span> 推荐小区</div><div><span class="dot" style="background:#16a34a"></span>≥75分 <span class="dot" style="background:#84cc16"></span>65-75 <span class="dot" style="background:#f59e0b"></span>55-65 <span class="dot" style="background:#ef4444"></span>&lt;55</div><div class="muted">点区域看板块概况，点小区看详情</div>`;
}
function go(p){location.hash=p}
function route(){const p=(location.hash||'#map').slice(1).split('/');const pg=p[0]||'map';$$('.page').forEach(x=>x.classList.toggle('on',x.id==='page-'+pg));$$('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.p===pg));
  if(pg==='map'){setTimeout(()=>map&&map.invalidateSize(),50);if(p[1])openCommunity(p[1])}
  if(window.Pages&&Pages.ready)Pages.show(pg)}
// ---------- Map ----------
function P(lat,lng){return S.base==='amap'?Coord.wgs2gcj(lat,lng):[lat,lng]}
function PL(coords){return coords.map(([lng,lat])=>P(lat,lng))}
function initMap(){
  map=L.map('map',{zoomControl:true,preferCanvas:true}).setView(P(31.225,121.465),12);
  setBase();redrawOverlays();
  map.on('zoomend',()=>{if(layers.stations){const z=map.getZoom();layers.stations.eachLayer(l=>l.setRadius(z>=14?5:z>=12?3.5:2))}})
}
function setBase(){if(baseLayer)map.removeLayer(baseLayer);
  const B={amap:['https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',{subdomains:'1234',maxZoom:18,attribution:'底图 © 高德地图（GCJ-02，叠加层已纠偏）'}],
    osm:['https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}],
    carto:['https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:19,attribution:'© OpenStreetMap © CARTO'}]};
  const b=B[S.base];baseLayer=L.tileLayer(b[0],b[1]).addTo(map)}
function redrawOverlays(){
  ['dist','lines','stations'].forEach(k=>{if(layers[k])map.removeLayer(layers[k]);layers[k]=null});
  if($('#l-dist').checked){layers.dist=L.layerGroup();D.distGeo.features.forEach(f=>{const id=f.properties.id;const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
    polys.forEach(pg=>{const pl=L.polygon(pg.map(PL),{color:DCOL[id],weight:2,fillOpacity:0.04,dashArray:'6 4'});pl.on('click',e=>{L.DomEvent.stopPropagation(e);openDistrict(id)});pl.bindTooltip(f.properties.name,{sticky:true});layers.dist.addLayer(pl)})});layers.dist.addTo(map)}
  layers.lines=L.layerGroup();D.lines.features.forEach(f=>{const p=f.properties;if(!S.showLines.has(p.ref))return;const g=f.geometry;const segs=g.type==='LineString'?[g.coordinates]:g.coordinates;segs.forEach(s=>layers.lines.addLayer(L.polyline(PL(s),{color:p.colour,weight:3.5,opacity:.85,interactive:false})))});layers.lines.addTo(map);
  if($('#l-station').checked){layers.stations=L.layerGroup();D.stations.forEach(s=>{if(!s.lines.some(l=>S.showLines.has(l)))return;const m=L.circleMarker(P(s.lat,s.lon),{radius:3.5,color:'#334155',weight:1.2,fillColor:'#fff',fillOpacity:1});m.bindTooltip(`${s.name} ${s.lines.map(l=>lnTag(l)).join('')}`);layers.stations.addLayer(m)});layers.stations.addTo(map)}
  renderMarkers();
}
function lnTag(r){const f=D.lines.features.find(x=>x.properties.ref===r);return `<span class="ln" style="background:${f?f.properties.colour:'#888'}">${r}</span>`}
function col(t){return t==null?'#9ca3af':t>=75?'#16a34a':t>=65?'#84cc16':t>=55?'#f59e0b':'#ef4444'}
function renderMarkers(){if(!map)return;if(layers.comm)map.removeLayer(layers.comm);layers.comm=L.layerGroup();
  scored.filter(pass).forEach(c=>{if(c.lat==null)return;let m;
    if(c.rec){m=L.marker(P(c.lat,c.lng),{icon:L.divIcon({className:'',html:`<div class="star-icon">★</div>`,iconSize:[26,26],iconAnchor:[13,13]}),zIndexOffset:1000})}
    else m=L.circleMarker(P(c.lat,c.lng),{radius:7,color:'#fff',weight:1.5,fillColor:col(c._t),fillOpacity:.95});
    m.bindTooltip(`${c.rec?'⭐':''}${c.name} ${fmt(c._t)}分<br>${fmt(c.price/1e4,2)}万/㎡ · ${c.year||'?'}年 · ${S.budget}万：${Units.plain(c,S.budget)}`);
    m.on('click',()=>openCommunity(c.id));layers.comm.addLayer(m)});layers.comm.addTo(map)}
function showPanel(html,center){$('#panel-body').innerHTML=html;$('#panel').scrollTop=0;$('#panel').classList.add('on');$('#sidebar').classList.remove('open');setTimeout(()=>{map.invalidateSize();if(center){const mob=innerWidth<=820;map.setView(center,Math.max(map.getZoom(),14),{animate:false});if(mob)map.panBy([0,innerHeight*0.25],{animate:false})}},60)}
function openDistrict(id){const d=D.meta.districts[id];const cs=scored.filter(c=>c.districtId===id);
  const plates={};cs.forEach(c=>{(plates[c.plate]=plates[c.plate]||[]).push(c)});
  let h=`<h2>${d.name}</h2><div class="kv">`;
  h+=`<div>区挂牌均价</div><div>${fmt(d.goto.price)} 元/㎡（${d.goto.month}，聚汇数据）同比 ${d.goto.yoy}%</div>`;
  h+=`<div>较高点回撤</div><div>聚汇：${(d.goto.drawdown*100).toFixed(1)}%（高点${d.goto.peak_month}）${d.caishang!=null?`；财商在线通报道：${d.caishang}%`:''}<br><span class="muted">评分用两者均值 ${(d.drawdownAvg*100).toFixed(1)}%</span></div>`;
  h+=`<div>租金回报</div><div>${d.goto.rent_yield}%（聚汇）</div>`;
  h+=`<div>900万可买</div><div>按区均价约 ${fmt(9e6/d.goto.price)}㎡</div></div>`;
  h+=`<p class="small">${d.note||''}</p><h3>板块概况</h3>`;
  const tp=(D.meta.plates||[]).filter(p=>p.districtId===id);
  if(tp.length){h+=`<div class="muted">太平洋房屋挂牌（2026-10-19，每板块首页20条样本，非成交价）</div><table><tr><th>板块</th><th>800-1000万面积中位</th><th>该价段单价中位</th><th>建成年中位</th><th>2010后占比</th></tr>`;
    tp.forEach(p=>h+=`<tr><td>${p.plate}${p.verdict?`<br><span class="tag ${p.verdict==='推荐'?'ok':'bad'}">${p.verdict}</span>`:''}</td><td>${fmt(p.area)}㎡</td><td>${fmt(p.unit)}</td><td>${p.year||'—'}</td><td>${p.p2010==null?'—':Math.round(p.p2010*100)+'%'}</td></tr>`);h+='</table>'}
  h+=`<h3>本站收录小区（按当前得分）</h3>`;
  Object.entries(plates).forEach(([pl,arr])=>{h+=`<div class="small" style="margin-top:6px"><b>${pl}</b>（${arr.length}个，均价中位 ${fmt(median(arr.map(c=>c.price))/1e4,2)}万）</div>`;arr.forEach(c=>h+=`<div class="small">· <a href="#map/${c.id}">${c.rec?'⭐':''}${c.name}</a> ${fmt(c._t)}分 · ${c.year||'?'}年 · ${S.budget}万：${Units.plain(c,S.budget)}</div>`)});
  showPanel(h)}
function median(a){a=a.filter(x=>x!=null).sort((x,y)=>x-y);return a.length?a[Math.floor(a.length/2)]:null}
function bars(c){return Object.keys(Score.DEF).map(k=>{const v=c._s[k];return `<div class="sc" title="${c._why[k]}"><span>${Score.NAMES[k]}</span><div class="bar"><i style="width:${v==null?0:v}%;background:${v==null?'#ddd':col(v)}"></i></div><b>${v==null?'待补':Math.round(v)}</b></div><div class="muted" style="margin:-2px 0 4px 98px">${c._why[k]}</div>`}).join('')}
function openCommunity(id,fly=true){const c=scored.find(x=>x.id===id);if(!c)return;S.selected=id;
  const my50=c.year?Loan.maxYears(c.year,Score.BUY_YEAR,50):null,my70=c.year?Loan.maxYears(c.year,Score.BUY_YEAR,70):null;
  let h=`<h2>${c.rec?'⭐ ':''}${c.name}</h2><div class="muted">${c.districtName} · ${c.plate} · ${c.address||''}${c.alias?'<br>别名：'+c.alias:''}</div>`;
  h+=`<div style="display:flex;align-items:baseline;gap:10px;margin:8px 0"><span class="score-big">${fmt(c._t)}</span><span>分（第${c._rank}/${scored.length}名）</span></div>`;
  if(c.rec)h+=`<div class="card" style="background:#fffbeb"><b>推荐理由：</b>${c.rec.reason}<br><b>主要风险：</b>${c.rec.risk}</div>`;
  h+=`<h3>价格与面积</h3><div class="kv"><div>参考均价</div><div><b>${fmt(c.price)}</b> 元/㎡（房天下${c.priceMonth||''}参考均价，挂牌口径）</div>`;
  if(c.weekPrice)h+=`<div>本周挂牌均价</div><div>${fmt(c.weekPrice)} 元/㎡</div>`;
  if(c.dealRecords&&c.dealRecords.length)h+=`<div>近期成交</div><div>${c.dealRecords.map(r=>`${r.date} ${r.area}㎡ ${r.total||'价格未披露'}${r.unit?' ('+r.unit+')':''}`).join('<br>')}<br><span class="muted">房天下“市场信息”</span></div>`;
  h+=`</div>${Units.detail(c)}<h3>基本信息</h3><div class="kv">`;
  h+=`<div>建成年份</div><div>${TD(c.yearRaw||c.year)}</div><div>产权</div><div>${TD(c.tenure)} ${c.tenureType?`<span class="tag">${c.tenureType}</span>`:''}</div>`;
  h+=`<div>贷款年限</div><div>${c.year?`${Score.BUY_YEAR}年房龄${Score.BUY_YEAR-c.year}年：按≤50规则商贷最长<b>${my50}</b>年；按≤70规则<b>${my70}</b>年；公积金最长${Loan.gjjYears(c.year,Score.BUY_YEAR)}年`:'<span class="todo">待补</span>'}${my50!=null&&my50<40?' <span class="tag warn">40年受限</span>':''}</div>`;
  h+=`<div>环线</div><div>${TD(c.ring)}</div><div>建筑类型</div><div>${TD(c.buildType)}</div><div>容积率</div><div>${TD(c.far)}</div><div>绿化率</div><div>${c.green!=null?c.green+'%':TD(null)}</div>`;
  h+=`<div>总户数/楼栋</div><div>${TD(c.households)} 户 / ${TD(c.buildings)} 栋</div><div>物业公司</div><div>${TD(c.propCo)}</div><div>物业费</div><div>${c.propFee!=null?c.propFee+' 元/㎡·月':TD(null)}</div>`;
  h+=`<div>开发商</div><div>${TD(c.developer)}</div><div>车位</div><div>${TD(c.parking)}</div><div>电梯</div><div>${TD(c.elevator==null?null:(c.elevator?'有':'无'))}</div><div>人车分流</div><div>${TD(c.pedSep)}</div>`;
  h+=`<div>在售/最近成交</div><div>${TD(c.onsale)} 套 / ${TD(c.deals)} 套（房天下）</div></div>`;
  const m=c.metro||{};h+=`<h3>交通</h3><div class="kv"><div>最近地铁站</div><div>${m.name||'—'} ${(m.lines||[]).map(lnTag).join('')}<br>直线${m.dist}m，步行约${m.walk}m（直线×1.3估算）</div>`;
  h+=`<div>800m内线路</div><div>${(m.linesNear||[]).map(lnTag).join('')||'无'}</div>`;
  h+=`<div>到中心(估算)</div><div>${Object.entries(m.hubs||{}).map(([k,v])=>`${k} ${v}分钟`).join('；')}<br><span class="muted">含步行，按地铁站间距离估算，不含候车</span></div></div>`;
  if(c.poi)h+=`<h3>配套与噪音（OSM）</h3><div class="kv"><div>超市/菜场</div><div>1km内 ${c.poi.groc1k} 个</div><div>商场</div><div>1.5km内 ${c.poi.mall15} 个</div><div>最近医院</div><div>${c.poi.hospName||''} ${c.poi.hosp}m</div><div>最近公园</div><div>${c.poi.parkName||''} ${c.poi.park}m</div>${c.noise?`<div>高架/快速路</div><div>${c.noise.roadName||''} 约${c.noise.road}m</div><div>铁路</div><div>约${c.noise.rail}m</div>`:''}</div>`;
  h+=`<h3>评分明细</h3>${bars(c)}`;
  if(c.notes&&c.notes.length)h+=`<h3>备注</h3><ul class="small">${c.notes.map(x=>`<li>${x}</li>`).join('')}</ul>`;
  h+=`<h3>数据来源</h3><ul class="small">${(c.sources||[]).map(s=>`<li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>（${s.date}）</li>`).join('')}</ul>`;
  if(c.missing&&c.missing.length)h+=`<div class="small">待补字段：${c.missing.map(x=>`<span class="todo">${x}</span>`).join(' ')}</div>`;
  h+=`<p><a class="btn" href="#mine" onclick="Pages.prefill('${c.id}')">用此小区测算房源</a></p>`;
  showPanel(h,fly&&c.lat?P(c.lat,c.lng):null)}
// ---------- List ----------
let sortKey='_t',sortDir=-1;
function renderList(){const t=$('#list-tbl');if(!t)return;const rows=scored.filter(pass).slice().sort((a,b)=>{const x=val(a,sortKey),y=val(b,sortKey);return ((x??-1e9)>(y??-1e9)?1:(x??-1e9)<(y??-1e9)?-1:0)*sortDir});
  const cols=[['name','小区'],['districtName','区'],['plate','板块'],['_t','总分'],['price','均价'],['_area',S.budget+'万可买户型'],['year','建成'],['walk','步行m'],...Object.keys(Score.DEF).map(k=>['s_'+k,Score.NAMES[k]])];
  $('#list-info').textContent=`${rows.length} 个`;
  t.innerHTML=`<tr>${cols.map(([k,n])=>`<th data-k="${k}">${n}${sortKey===k?(sortDir<0?'▼':'▲'):''}</th>`).join('')}</tr>`+rows.map(c=>`<tr><td><a href="#map/${c.id}">${c.rec?'⭐':''}${c.name}</a></td><td>${c.districtShort}</td><td>${c.plate}</td><td><b>${fmt(c._t)}</b></td><td>${fmt(c.price/1e4,2)}万</td><td class="small">${Units.short(c,S.budget,false)}</td><td>${c.year||'待补'}</td><td>${c.metro?.walk??''}</td>${Object.keys(Score.DEF).map(k=>`<td>${c._s[k]==null?'<span class="muted">—</span>':Math.round(c._s[k])}</td>`).join('')}</tr>`).join('');
  t.querySelectorAll('th').forEach(th=>th.onclick=()=>{const k=th.dataset.k;if(sortKey===k)sortDir*=-1;else{sortKey=k;sortDir=-1}renderList()})}
function val(c,k){if(k==='walk')return c.metro?.walk;if(k.startsWith('s_'))return c._s[k.slice(2)];return c[k]}
window.APP.scored=()=>scored;
})();
