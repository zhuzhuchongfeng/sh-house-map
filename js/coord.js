// WGS84 <-> GCJ-02 转换（用于高德底图）。数据统一以 WGS84 存储。
(function(){
const PI=Math.PI,A=6378245.0,EE=0.00669342162296594323;
function tlat(x,y){let r=-100+2*x+3*y+0.2*y*y+0.1*x*y+0.2*Math.sqrt(Math.abs(x));r+=(20*Math.sin(6*x*PI)+20*Math.sin(2*x*PI))*2/3;r+=(20*Math.sin(y*PI)+40*Math.sin(y/3*PI))*2/3;r+=(160*Math.sin(y/12*PI)+320*Math.sin(y*PI/30))*2/3;return r}
function tlng(x,y){let r=300+x+2*y+0.1*x*x+0.1*x*y+0.1*Math.sqrt(Math.abs(x));r+=(20*Math.sin(6*x*PI)+20*Math.sin(2*x*PI))*2/3;r+=(20*Math.sin(x*PI)+40*Math.sin(x/3*PI))*2/3;r+=(150*Math.sin(x/12*PI)+300*Math.sin(x/30*PI))*2/3;return r}
function wgs2gcj(lat,lng){let dlat=tlat(lng-105,lat-35),dlng=tlng(lng-105,lat-35);const rl=lat/180*PI;let m=Math.sin(rl);m=1-EE*m*m;const sm=Math.sqrt(m);dlat=dlat*180/((A*(1-EE))/(m*sm)*PI);dlng=dlng*180/(A/sm*Math.cos(rl)*PI);return [lat+dlat,lng+dlng]}
window.Coord={wgs2gcj};
})();
