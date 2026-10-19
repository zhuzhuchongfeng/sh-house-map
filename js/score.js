// 评分模型：各分项 0-100，缺数据的分项记为 null（不参与加权，权重按剩余项重新归一）。
window.Score=(function(){
const BUY_YEAR=2029; // 预计购房年份（2028年入职，社保/公积金满6个月后）
function lerp(x,pts){ // 分段线性：pts=[[x0,y0],[x1,y1],...] 递增
  if(x==null||isNaN(x))return null;if(x<=pts[0][0])return pts[0][1];
  for(let i=1;i<pts.length;i++){if(x<=pts[i][0]){const [a,ya]=pts[i-1],[b,yb]=pts[i];return ya+(yb-ya)*(x-a)/(b-a)}}
  return pts[pts.length-1][1]}
function avg(arr){const v=arr.filter(x=>x&&x[0]!=null);if(!v.length)return null;let s=0,w=0;v.forEach(([x,ww])=>{s+=x*ww;w+=ww});return s/w}
const DEF={value:20,age:15,commute:15,living:13,amen:10,noise:6,liq:8,supply:5,tenure:6,plan:2};
const NAMES={value:'保值性',age:'房龄与贷款',commute:'通勤',living:'居住体验',amen:'生活配套',noise:'噪音',liq:'流动性',supply:'挂牌供给压力',tenure:'产权类型风险',plan:'周边规划'};
function sub(c,ctx){
  const s={},why={};const D=ctx.districts[c.districtId]||{};
  // 1 保值性：区级回撤(40%) + 环线核心度(35%) + 产品代际(25%)
  const dd=D.drawdownAvg; // 负数，如 -0.18
  const sDD=dd==null?null:lerp(-dd*100,[[0,100],[10,80],[20,60],[30,40],[40,25]]);
  const ringMap={'内环以内':100,'内中环间':80,'中内环间':80,'中外环间':60,'外中环间':60,'外环以外':40,'外郊环间':40};
  const sRing=c.ring?(ringMap[c.ring]??null):null;
  const sGen=lerp(c.year,[[1990,35],[1995,45],[2000,65],[2005,80],[2010,95],[2015,100]]);
  s.value=avg([[sDD,40],[sRing,35],[sGen,25]]);
  why.value=`区回撤${dd==null?'待补':(dd*100).toFixed(0)+'%'}→${f(sDD)}；${c.ring||'环线待补'}→${f(sRing)}；${c.year||'?'}年产品→${f(sGen)}`;
  // 2 房龄与贷款：按购房年份与房龄规则算商贷最长年限
  if(c.year){const my=Loan.maxYears(c.year,BUY_YEAR,ctx.ageRule);s.age=lerp(my,[[10,0],[20,25],[25,45],[30,65],[35,82],[40,100]]);why.age=`${BUY_YEAR}年房龄${BUY_YEAR-c.year}年，规则≤${ctx.ageRule}→商贷最长${my}年`}else{s.age=null;why.age='建成年份待补'}
  // 3 通勤：步行距离(40%) + 可达线路数(20%) + 到人民广场/陆家嘴/徐家汇平均时间(40%)
  const st=c.metro||{};const sW=lerp(st.walk,[[400,100],[800,80],[1200,55],[1600,35],[2200,10]]);
  const nL=(st.linesNear||[]).length;const sL=nL?lerp(nL,[[1,55],[2,75],[3,90],[4,100]]):null;
  const sH=lerp(st.hubAvg,[[15,100],[25,80],[35,55],[45,30],[60,5]]);
  s.commute=avg([[sW,40],[sL,20],[sH,40]]);why.commute=`最近站${st.name||'?'}步行约${st.walk||'?'}m；800m内线路${nL}条；到三大中心平均${st.hubAvg||'?'}分钟`;
  // 4 居住体验：容积率(35%) 绿化率(25%) 物业费(作物业档次代理,25%) 电梯/人车分流(15%,多数待补)
  const sF=lerp(c.far,[[1.2,100],[1.8,88],[2.5,70],[3.0,55],[3.5,42],[4.5,25]]);
  const sG=lerp(c.green,[[20,30],[25,45],[30,60],[35,75],[40,88],[45,100]]);
  const sP=lerp(c.propFee,[[0.5,25],[1.0,45],[1.5,62],[2.0,75],[3.0,90],[4.0,100]]);
  const sE=c.elevator==null?null:(c.elevator?100:30);
  s.living=avg([[sF,35],[sG,25],[sP,25],[sE,15]]);why.living=`容积率${c.far??'待补'}；绿化率${c.green??'待补'}%；物业费${c.propFee??'待补'}元/㎡·月；电梯${c.elevator==null?'待补':(c.elevator?'有':'无')}`;
  // 5 配套（OSM）：1km内超市/菜场数、1.5km内商场数、最近医院距离、最近公园距离
  const p=c.poi;if(p){const a1=lerp(p.groc1k,[[0,20],[2,55],[5,80],[10,100]]),a2=lerp(p.mall15,[[0,30],[1,65],[3,90],[5,100]]),a3=lerp(p.hosp,[[500,100],[1000,85],[2000,60],[3500,30]]),a4=lerp(p.park,[[300,100],[700,85],[1200,65],[2000,40]]);s.amen=avg([[a1,30],[a2,20],[a3,25],[a4,25]]);why.amen=`1km内超市/菜场${p.groc1k}个；1.5km内商场${p.mall15}个；最近医院${p.hosp}m；最近公园${p.park}m（OSM，可能不全）`}else{s.amen=null;why.amen='待补'}
  // 6 噪音：离高架/快速路、铁路的直线距离（取较差者）
  const n=c.noise;if(n){const r=lerp(n.road,[[30,10],[80,35],[150,60],[300,85],[500,100]]),t=lerp(n.rail,[[50,10],[100,35],[200,60],[400,85],[600,100]]);s.noise=Math.min(r??100,t??100);why.noise=`距高架/快速路约${n.road}m（${n.roadName||''}）；距铁路约${n.rail}m`}else{s.noise=null;why.noise='待补'}
  // 7 流动性：房天下“最近成交”套数 / 总户数
  if(c.deals!=null&&c.households){const r=c.deals/c.households*100;s.liq=lerp(r,[[0.5,20],[2,45],[5,70],[10,88],[20,100]]);why.liq=`最近成交${c.deals}套/总${c.households}户=${r.toFixed(1)}%`}else{s.liq=null;why.liq='待补'}
  // 8 挂牌供给压力：在售套数 / 总户数（越低越好）
  if(c.onsale!=null&&c.households){const r=c.onsale/c.households*100;s.supply=lerp(r,[[0.3,100],[0.8,85],[1.5,65],[3,40],[5,15]]);why.supply=`在售${c.onsale}套/总${c.households}户=${r.toFixed(2)}%`}else{s.supply=null;why.supply='待补'}
  // 9 产权类型风险
  const tm={'商品房':100,'商品房(含部分动迁)':80,'动迁安置房':65,'经济适用房':40,'售后公房':55,'公房(使用权)':30,'商住/非70年':30};
  s.tenure=c.tenureType?(tm[c.tenureType]??70):null;why.tenure=c.tenureType?`${c.tenureType}；${c.tenure||''}`:`产权类型待补（${c.tenure||''}）`;
  // 10 周边规划：仅有人工核实的规划信息才打分
  s.plan=c.planScore??null;why.plan=c.planNote||'待补（未核实，不参与计分）';
  return {s,why};
}
function f(x){return x==null?'—':Math.round(x)}
function total(c,ctx){const {s,why}=sub(c,ctx);let a=0,w=0;for(const k in DEF){const ww=ctx.weights[k]||0;if(s[k]!=null&&ww>0){a+=s[k]*ww;w+=ww}}
  const cov=Object.keys(DEF).filter(k=>(ctx.weights[k]||0)>0&&s[k]!=null).length;
  return {total:w?a/w:null,s,why,coverage:cov}}
return {DEF,NAMES,BUY_YEAR,sub,total,lerp};
})();
