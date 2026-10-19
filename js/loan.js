// 房贷测算（等额本息）。单位：万元。
window.Loan=(function(){
function ann(L,r,years){const n=years*12,i=r/12;if(L<=0)return 0;return L*i*Math.pow(1+i,n)/(Math.pow(1+i,n)-1)}
function maxYears(builtYear,buyYear,rule,borrowerAge){ // rule: 50 | 70
  const age=buyYear-builtYear;let y=Math.min(40,rule-age);if(borrowerAge)y=Math.min(y,80-borrowerAge);return Math.max(0,Math.floor(y))}
function gjjYears(builtYear,buyYear){const age=buyYear-builtYear;if(age<20)return 30;if(age<35)return Math.max(5,50-age);return 15}
function calc(o){ // o: price, area, cash, emergency, agentRate, reno, gjjAmt, gjjRate, sdRate, sdYears, gjjYearsCap, income
  const deedRate=o.area>140?0.015:0.01;const deed=o.price*deedRate, agent=o.price*o.agentRate;
  let dp=o.cash-o.emergency-deed-agent-o.reno; const minDp=o.price*0.15; dp=Math.min(dp,o.price);
  const loan=Math.max(0,o.price-dp);const gjj=Math.min(o.gjjAmt,loan);const sd=loan-gjj;
  const gy=Math.min(30,o.gjjYearsCap||30);
  const mG=ann(gjj,o.gjjRate,gy),mS=ann(sd,o.sdRate,o.sdYears);const m=mG+mS;
  const totalInt=(mG*gy*12-gjj)+(mS*o.sdYears*12-sd);
  return {deedRate,deed,agent,dp,minDp,dpOk:dp>=minDp,loan,gjj,sd,gy,mG,mS,m,totalInt,ratio:o.income?m/o.income:null}
}
return {ann,maxYears,gjjYears,calc};
})();
