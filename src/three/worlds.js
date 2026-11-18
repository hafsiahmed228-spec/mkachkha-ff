// Worlds / maps / lighting (ported)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CITY_MAPS, initCities } from './cities.js';
function shade(hex,amt){ // amt -1..1
  let c=hex.replace('#',''); if(c.length===3)c=c.split('').map(x=>x+x).join('');
  let n=parseInt(c,16), r=n>>16, g=(n>>8)&255, b=n&255;
  const f=v=>Math.max(0,Math.min(255,Math.round(amt<0?v*(1+amt):v+(255-v)*amt)));
  return '#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join('');
}

export { shade };

export function createWorlds(ctx){
  const { scene, renderer, hemi, sun, charLight, bloom } = ctx;
const PM=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:new THREE.Color(c),roughness:0.8,metalness:0},o||{}));
const TM=PM; const USE_OL=false;
const OUT=new THREE.MeshBasicMaterial({color:0x14141c,side:THREE.BackSide});
const SPH=new THREE.SphereGeometry(1,18,14), BOX=new THREE.BoxGeometry(1,1,1);
function mk(geo,mat,parent,o={}){
  const m=new THREE.Mesh(geo,mat); m.castShadow=o.shadow!==false; m.receiveShadow=!!o.recv;
  if(o.p) m.position.set(...o.p); if(o.s) m.scale.set(...o.s); if(o.r) m.rotation.set(...o.r);
  parent.add(m);
  if(o.ol&&USE_OL){ const ol=new THREE.Mesh(geo,OUT); ol.scale.setScalar(1+o.ol); ol.castShadow=false; ol.userData.outline=true; m.add(ol); }
  return m;
}
function disposeObj(obj){
  obj.traverse(o=>{ if(o.isMesh||o.isSprite){ if(o.geometry&&o.geometry!==SPH&&o.geometry!==BOX&&!o.userData.outline) o.geometry.dispose();
    const ms=Array.isArray(o.material)?o.material:[o.material]; ms.forEach(m=>{ if(m&&m!==OUT){ if(m.map) m.map.dispose(); m.dispose(); } }); } });
}

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
function stripeTex(c1,c2,n=8){ return canvasTex(256,8,(g,w,h)=>{ for(let i=0;i<n;i++){ g.fillStyle=i%2?c2:c1; g.fillRect(i*w/n,0,w/n+1,h);} }); }
const cyl=(rt,rb,h,seg=16,open=false)=>new THREE.CylinderGeometry(rt,rb,h,seg,1,open);
const rbox=(x,y,z,r)=>new RoundedBoxGeometry(x,y,z,3,Math.min(r,Math.min(x,y,z)*0.49));
/* =============== SKY & WORLD =============== */
const sky=new THREE.Mesh(new THREE.SphereGeometry(90,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,
  uniforms:{top:{value:new THREE.Color(0x3d8fff)},bot:{value:new THREE.Color(0xd6ecff)}},
  vertexShader:`varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`uniform vec3 top;uniform vec3 bot;varying float h;void main(){gl_FragColor=vec4(mix(bot,top,clamp(h*1.8,0.0,1.0)),1.0);
  #include <colorspace_fragment>
  }`}));
scene.add(sky);

const colliders=[];
function canvasTex(w,h,draw,rep){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rep,rep);} t.anisotropy=4; return t; }
function buildSidi(wg){
  const gt=canvasTex(256,256,(g)=>{ g.fillStyle='#e9d6ae'; g.fillRect(0,0,256,256); g.fillStyle='#e2cb9d'; g.fillRect(6,6,118,118); g.fillRect(134,134,116,116);
    g.strokeStyle='#cfb27e'; g.lineWidth=5; g.strokeRect(0,0,256,256); g.beginPath(); g.moveTo(128,0); g.lineTo(128,256); g.moveTo(0,128); g.lineTo(256,128); g.stroke(); },34);
  mk(new THREE.CircleGeometry(45,64),TM('#ffffff',{map:gt}),wg,{r:[-Math.PI/2,0,0],shadow:false,recv:true});
  const mt=canvasTex(512,512,(g,w)=>{ const c=w/2; const rings=['#1d5fbf','#ffffff','#2a9df4','#ffffff','#f2b400','#ffffff','#1d5fbf'];
    rings.forEach((col,i)=>{ g.fillStyle=col; g.beginPath(); g.arc(c,c,c-i*34,0,7); g.fill(); });
    g.fillStyle='#1d5fbf'; for(let k=0;k<2;k++){ g.save(); g.translate(c,c); g.rotate(k*Math.PI/4); g.fillRect(-60,-60,120,120); g.restore(); }
    g.fillStyle='#ffffff'; g.beginPath(); g.arc(c,c,34,0,7); g.fill();
    for(let i=0;i<24;i++){ const a=i/24*Math.PI*2; g.fillStyle=i%2?'#f2b400':'#1d5fbf'; g.beginPath(); g.arc(c+Math.cos(a)*(c-17),c+Math.sin(a)*(c-17),9,0,7); g.fill(); } });
  mk(new THREE.CircleGeometry(4.2,64),TM('#ffffff',{map:mt}),wg,{r:[-Math.PI/2,0,0],p:[0,0.012,0],shadow:false,recv:true});
  // fountain
  const fx=0,fz=-7; const fw=new THREE.Group(); fw.position.set(fx,0,fz); wg.add(fw);
  mk(new THREE.CylinderGeometry(1.5,1.6,0.55,40),TM('#f4f1ea'),fw,{p:[0,0.27,0],ol:0.015,recv:true});
  mk(new THREE.CylinderGeometry(1.32,1.32,0.05,40),TM('#47b5ff',{transparent:true,opacity:.9}),fw,{p:[0,0.53,0],shadow:false});
  mk(new THREE.CylinderGeometry(0.18,0.25,1.1,16),TM('#f4f1ea'),fw,{p:[0,0.9,0]});
  mk(new THREE.CylinderGeometry(0.6,0.25,0.25,24),TM('#1d5fbf'),fw,{p:[0,1.45,0],ol:0.03});
  mk(SPH,TM('#7fd0ff',{transparent:true,opacity:.85}),fw,{p:[0,1.62,0],s:[0.12,0.25,0.12],shadow:false});
  colliders.push({x:fx,z:fz,r:1.75});
  // houses
  const white=TM('#f7f4ec'), blue=TM('#1d5fbf'), blue2=TM('#2a9df4'), pink=TM('#e0479e'), leaf=TM('#2f9e44');
  for(let i=0;i<9;i++){
    const a=i/9*Math.PI*2+0.35; if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<0.4) continue; // keep the view in front open
    const r=15+(i%2)*1.5, x=Math.sin(a)*r, z=Math.cos(a)*r, w=3.2+(i%3)*0.8, h=2.8+((i*7)%3)*0.7, d=3;
    const hg=new THREE.Group(); hg.position.set(x,0,z); hg.rotation.y=Math.atan2(-x,-z); wg.add(hg);
    mk(new RoundedBoxGeometry(w,h,d,2,0.08),white,hg,{p:[0,h/2,0],recv:true});
    mk(new RoundedBoxGeometry(w+0.2,0.18,d+0.2,2,0.05),white,hg,{p:[0,h+0.05,0]});
    mk(new RoundedBoxGeometry(0.95,1.7,0.12,2,0.04),blue,hg,{p:[0,0.85,d/2]});
    mk(new THREE.CylinderGeometry(0.475,0.475,0.12,20,1,false,0,Math.PI),blue,hg,{p:[0,1.7,d/2],r:[Math.PI/2,0,Math.PI/2]});
    for(const s of [-1,1]){ mk(new RoundedBoxGeometry(0.62,0.72,0.1,2,0.03),blue2,hg,{p:[s*w*0.3,h*0.62,d/2]});
      mk(BOX,blue,hg,{p:[s*w*0.3,h*0.62-0.42,d/2+0.08],s:[0.75,0.06,0.18]}); }
    if(i%3===0) mk(new THREE.SphereGeometry(0.8,24,12,0,Math.PI*2,0,Math.PI/2),white,hg,{p:[w*0.15,h+0.1,-0.3]});
    if(i%2===1) for(let k=0;k<9;k++) mk(SPH,k%3?pink:leaf,hg,{p:[-w/2+0.25+((k*0.37)%1)*0.5, h-0.2-((k*0.53)%1)*1.6, d/2+0.12], s:[0.22,0.22,0.12],shadow:false});
    colliders.push({x,z,r:Math.max(w,d)*0.62});
  }
  // palms
  const trunkM=TM('#9a6b3c'), palmM=TM('#2e9a46'), cocoM=TM('#6b4423');
  [[6,2],[-6.5,1.5],[7,-6],[-7,-7],[3.5,8.5],[-4,9],[10,3],[-10.5,-2]].forEach(([x,z],i)=>{
    const p=new THREE.Group(); p.position.set(x,0,z); wg.add(p);
    const lean=0.12*(i%2?1:-1); let y=0,px=0;
    for(let k=0;k<6;k++){ mk(new THREE.CylinderGeometry(0.16-k*0.012,0.2-k*0.012,0.62,10),trunkM,p,{p:[px,y+0.31,0],r:[0,0,lean*k*0.3],ol:0.06}); y+=0.58; px-=Math.sin(lean*k*0.3)*0.58; }
    for(let k=0;k<7;k++){ const a=k/7*Math.PI*2; const lf=new THREE.Group(); lf.position.set(px,y,0); lf.rotation.y=a; p.add(lf);
      mk(SPH,palmM,lf,{p:[0,0.05,0.75],s:[0.28,0.07,0.85],r:[0.45,0,0]}); }
    for(let k=0;k<3;k++) mk(SPH,cocoM,p,{p:[px+Math.cos(k*2)*0.18,y-0.15,Math.sin(k*2)*0.18],s:[0.12,0.12,0.12]});
    colliders.push({x,z,r:0.45});
  });
  // pots
  const potM=TM('#c8643b'), flowerM=TM('#ff4f7b');
  [[3.6,-3.4],[-3.6,-3.4],[4.8,3.4],[-4.8,3.4]].forEach(([x,z])=>{
    mk(new THREE.CylinderGeometry(0.35,0.25,0.55,16),potM,wg,{p:[x,0.27,z],ol:0.04});
    mk(SPH,leaf,wg,{p:[x,0.65,z],s:[0.38,0.3,0.38]});
    for(let k=0;k<4;k++) mk(SPH,flowerM,wg,{p:[x+Math.cos(k*1.6)*0.22,0.85,z+Math.sin(k*1.6)*0.22],s:[0.08,0.08,0.08],shadow:false});
    colliders.push({x,z,r:0.45});
  });
}

/* =============== MAPS =============== */
function palm(wg,x,z,i){
  const trunkM=TM('#9a6b3c'), palmM=TM('#2e9a46'), cocoM=TM('#6b4423');
  const p=new THREE.Group(); p.position.set(x,0,z); wg.add(p);
  const lean=0.12*(i%2?1:-1); let y=0,px=0;
  for(let k=0;k<6;k++){ mk(new THREE.CylinderGeometry(0.16-k*0.012,0.2-k*0.012,0.62,10),trunkM,p,{p:[px,y+0.31,0],r:[0,0,lean*k*0.3],ol:0.06}); y+=0.58; px-=Math.sin(lean*k*0.3)*0.58; }
  for(let k=0;k<7;k++){ const lf=new THREE.Group(); lf.position.set(px,y,0); lf.rotation.y=k/7*Math.PI*2; p.add(lf); mk(SPH,palmM,lf,{p:[0,0.05,0.75],s:[0.28,0.07,0.85],r:[0.45,0,0]}); }
  for(let k=0;k<3;k++) mk(SPH,cocoM,p,{p:[px+Math.cos(k*2)*0.18,y-0.15,Math.sin(k*2)*0.18],s:[0.12,0.12,0.12]});
  colliders.push({x,z,r:0.45});
}
const lamps=[];
function lamp(wg,x,y,z,col,size=0.18){ const m=mk(SPH,TM(col,{emissive:0x000000}),wg,{p:[x,y,z],s:[size,size*1.15,size],shadow:false}); m.userData.glow=new THREE.Color(col); lamps.push(m); return m; }
let ball=null, sea=null, goalLock=0;
function makeBall(wg,x,z,r,pattern){
  const tex=canvasTex(256,128,(g,w,h)=>{ if(pattern==='beach'){ const cs=['#ff3d4f','#ffffff','#2a9df4','#ffc83d','#ffffff','#2e9a46']; cs.forEach((c,i)=>{ g.fillStyle=c; g.fillRect(i*w/6,0,w/6+1,h); }); }
    else { g.fillStyle='#ffffff'; g.fillRect(0,0,w,h); g.fillStyle='#111'; for(let i=0;i<10;i++){ const cx=(i*53)%w, cy=(i%2?0.3:0.7)*h; g.beginPath(); for(let k=0;k<5;k++){ const a=k/5*Math.PI*2; g.lineTo(cx+Math.cos(a)*16,cy+Math.sin(a)*16); } g.fill(); } } });
  const m=mk(new THREE.SphereGeometry(r,24,16),TM('#ffffff',{map:tex}),wg,{p:[x,r,z],ol:0.04});
  ball={mesh:m,r,pos:new THREE.Vector3(x,0,z),vel:new THREE.Vector3(),y:0,vy:0,home:new THREE.Vector3(x,0,z)};
}
function buildStade(wg){
  mk(new THREE.PlaneGeometry(90,90),TM('#3f7d34'),wg,{r:[-Math.PI/2,0,0],shadow:false,recv:true});
  const pt=canvasTex(512,768,(g,w,h)=>{ for(let i=0;i<12;i++){ g.fillStyle=i%2?'#4caf50':'#43a047'; g.fillRect(0,i*h/12,w,h/12+1); }
    g.strokeStyle='#ffffff'; g.lineWidth=5; const m=20; g.strokeRect(m,m,w-2*m,h-2*m); g.beginPath(); g.moveTo(m,h/2); g.lineTo(w-m,h/2); g.stroke();
    g.beginPath(); g.arc(w/2,h/2,70,0,7); g.stroke(); g.fillStyle='#fff'; g.beginPath(); g.arc(w/2,h/2,6,0,7); g.fill();
    for(const s of [0,1]){ const y=s?h-m:m, d=s?-1:1; g.strokeRect(w/2-130,s?y-120:y,260,120); g.strokeRect(w/2-60,s?y-45:y,120,45); g.beginPath(); g.arc(w/2,y+d*85,5,0,7); g.fill(); } });
  mk(new THREE.PlaneGeometry(24,36),TM('#ffffff',{map:pt}),wg,{r:[-Math.PI/2,0,0],p:[0,0.01,0],shadow:false,recv:true});
  const white=TM('#ffffff');
  const net=canvasTex(64,64,(g,w,h)=>{ g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=3; for(let i=0;i<=4;i++){ g.beginPath(); g.moveTo(i*16,0); g.lineTo(i*16,h); g.moveTo(0,i*16); g.lineTo(w,i*16); g.stroke(); } },1);
  net.repeat.set(12,4);
  const netM=new THREE.MeshBasicMaterial({map:net,transparent:true,side:THREE.DoubleSide,depthWrite:false});
  for(const sd of [-1,1]){ const z=sd*17; const g=new THREE.Group(); g.position.z=z; wg.add(g);
    for(const x of [-3,3]) mk(new THREE.CylinderGeometry(0.07,0.07,2.2,10),white,g,{p:[x,1.1,0],ol:0.2});
    mk(new THREE.CylinderGeometry(0.07,0.07,6.14,10),white,g,{p:[0,2.2,0],r:[0,0,Math.PI/2],ol:0.2});
    const back=new THREE.Mesh(new THREE.PlaneGeometry(6,2.2),netM); back.position.set(0,1.1,sd*1.4); g.add(back);
    const roof=new THREE.Mesh(new THREE.PlaneGeometry(6,1.4),netM); roof.rotation.x=Math.PI/2; roof.position.set(0,2.2,sd*0.7); g.add(roof);
    for(const x of [-3,3]){ const sdn=new THREE.Mesh(new THREE.PlaneGeometry(1.4,2.2),netM); sdn.rotation.y=Math.PI/2; sdn.position.set(x,1.1,sd*0.7); g.add(sdn); }
    // ad boards
    const ad=canvasTex(1024,64,(c,w,h)=>{ c.fillStyle='#0a0d18'; c.fillRect(0,0,w,h); c.font='40px Lalezar, Cairo, sans-serif'; c.textBaseline='middle';
      for(let k=0;k<4;k++){ c.fillStyle=k%2?'#ffc83d':'#ff3d4f'; c.fillText(k%2?'MKACHKHA FF':'⚽ دقدق وبيع',20+k*255,34); } });
    mk(new THREE.BoxGeometry(22,0.7,0.15),TM('#ffffff',{map:ad}),wg,{p:[0,0.35,sd*19.5],r:[0,sd>0?Math.PI:0,0]});
  }
  // stands with crowd
  const crowdCols=['#d62828','#ffcc00','#ffffff','#d62828','#ffcc00','#1d3557','#f2a65a','#111111'];
  let count=0; const spots=[];
  for(const sd of [-1,1]) for(let st=0;st<5;st++){ const x=sd*(14+st*1.1), y=0.4+st*0.6;
    mk(new THREE.BoxGeometry(1.1,y*2,38),TM(st%2?'#c1121f':'#ffc83d'),wg,{p:[x,y,0],recv:true});
    for(let z=-18;z<=18;z+=0.7){ if(Math.random()<0.8) spots.push([x,y*2+0.25,z+Math.random()*0.2]); } }
  const crowd=new THREE.InstancedMesh(new THREE.SphereGeometry(0.22,8,6),TM('#ffffff'),spots.length);
  const mtx=new THREE.Matrix4(), col=new THREE.Color();
  spots.forEach((p,i)=>{ mtx.makeScale(1,1.3,1).setPosition(p[0],p[1],p[2]); crowd.setMatrixAt(i,mtx); crowd.setColorAt(i,col.set(crowdCols[i%crowdCols.length])); });
  crowd.userData.spots=spots; wg.add(crowd); stadeCrowd=crowd;
  // floodlights
  for(const [x,z] of [[-17,-21],[17,-21],[-17,21],[17,21]]){ mk(new THREE.CylinderGeometry(0.2,0.3,12,10),TM('#9aa3b8'),wg,{p:[x,6,z]});
    const fr=mk(new THREE.BoxGeometry(3,1.6,0.3),TM('#3a3f4f'),wg,{p:[x,12.4,z]}); fr.lookAt(0,0,0);
    for(let k=0;k<6;k++){ const l=lamp(wg,x+(k%3-1)*0.9*Math.cos(Math.atan2(z,x)+Math.PI/2),12+(k<3?0.4:-0.3),z+(k%3-1)*0.9*Math.sin(Math.atan2(z,x)+Math.PI/2),'#fff6d5',0.28); } }
  makeBall(wg,0,0,0.22,'foot');
  stadeExtras(wg);
}
let stadeCrowd=null;
function buildPlage(wg){
  const st=canvasTex(256,256,(g,w,h)=>{ g.fillStyle='#f3dca6'; g.fillRect(0,0,w,h); for(let i=0;i<600;i++){ g.fillStyle=Math.random()<.5?'#e8cd92':'#f8e6bb'; g.fillRect(Math.random()*w,Math.random()*h,2,2); } },18);
  mk(new THREE.PlaneGeometry(90,60),TM('#ffffff',{map:st}),wg,{r:[-Math.PI/2,0,0],p:[0,0,20],shadow:false,recv:true});
  mk(new THREE.PlaneGeometry(90,6),TM('#e2c27f'),wg,{r:[-Math.PI/2,0,0],p:[0,0.005,-8],shadow:false,recv:true});
  const sg=new THREE.PlaneGeometry(140,70,70,35); sg.rotateX(-Math.PI/2);
  sea=new THREE.Mesh(sg,new THREE.MeshStandardMaterial({color:new THREE.Color('#1e8fd0'),roughness:0.12,metalness:0.15,transparent:true,opacity:0.94}));
  sea.position.set(0,0.05,-44); sea.receiveShadow=true; wg.add(sea); sea.userData.base=sg.attributes.position.array.slice();
  mk(new THREE.PlaneGeometry(140,1.2),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.7}),wg,{r:[-Math.PI/2,0,0],p:[0,0.08,-9.3],shadow:false}).userData.foam=true;
  const cols=[['#ff3d4f','#ffffff'],['#2a9df4','#ffffff'],['#ffc83d','#2e9a46'],['#6c3fc4','#ffc83d'],['#ff7b00','#ffffff']];
  [[-6,-2],[-2.5,1.5],[3,-1],[7,2],[-9,4]].forEach(([x,z],i)=>{ const [a,b]=cols[i];
    mk(new THREE.CylinderGeometry(0.04,0.04,2.4,8),TM('#dddddd'),wg,{p:[x,1.2,z]});
    mk(new THREE.ConeGeometry(1.5,0.55,12,1,true),TM('#ffffff',{map:(()=>{const t=stripeTex(a,b);t.repeat.set(1,1);return t;})(),side:THREE.DoubleSide}),wg,{p:[x,2.3,z],ol:0.02});
    mk(new THREE.BoxGeometry(0.9,0.03,1.8),TM(b==='#ffffff'?a:b),wg,{p:[x+1.1,0.02,z+0.6],r:[0,0.3,0],shadow:false,recv:true});
    colliders.push({x,z,r:0.25}); });
  // lifeguard tower
  const lg=new THREE.Group(); lg.position.set(11,0,-3); wg.add(lg); const red=TM('#e63946'), wood=TM('#c08a4a');
  for(const [x,z] of [[-0.7,-0.7],[0.7,-0.7],[-0.7,0.7],[0.7,0.7]]) mk(new THREE.CylinderGeometry(0.08,0.08,2.2,8),wood,lg,{p:[x,1.1,z]});
  mk(new RoundedBoxGeometry(1.8,1.2,1.8,2,0.08),red,lg,{p:[0,2.8,0]}); mk(new THREE.ConeGeometry(1.5,0.6,4),TM('#ffffff'),lg,{p:[0,3.7,0],r:[0,Math.PI/4,0]});
  colliders.push({x:11,z:-3,r:1.2});
  [[-12,6],[13,6],[-15,-1],[15,9],[-4,10],[5,11]].forEach(([x,z],i)=>palm(wg,x,z,i));
  makeBall(wg,1.5,3,0.32,'beach');
}
function buildSouk(wg){
  const tt=canvasTex(256,256,(g,w,h)=>{ g.fillStyle='#cbb994'; g.fillRect(0,0,w,h); g.strokeStyle='#a8946b'; g.lineWidth=4;
    for(let r=0;r<4;r++) for(let c=0;c<4;c++){ g.strokeRect(c*64+(r%2)*32,r*64,64,64); } },20);
  mk(new THREE.PlaneGeometry(80,80),TM('#ffffff',{map:tt}),wg,{r:[-Math.PI/2,0,0],shadow:false,recv:true});
  const wallC=['#f3e3c3','#efd8ae','#f7f1e3','#e9cfa0'], doorC=['#1d5fbf','#2e7d32','#a0522d','#1d5fbf'];
  const kilim=(a,b,c)=>canvasTex(128,192,(g,w,h)=>{ g.fillStyle=a; g.fillRect(0,0,w,h); for(let i=0;i<6;i++){ g.fillStyle=i%2?b:c; g.beginPath(); const y=16+i*30; g.moveTo(w/2,y); g.lineTo(w/2+40,y+14); g.lineTo(w/2,y+28); g.lineTo(w/2-40,y+14); g.fill(); }
    g.fillStyle=b; g.fillRect(0,0,w,8); g.fillRect(0,h-8,w,8); });
  const goods=['#c1440e','#ffb703','#e85d04','#6a994e','#9d0208','#7b2cbf'];
  for(const sd of [-1,1]) for(let k=0;k<7;k++){ const z=-18+k*6, h=3.4+(k%3)*0.6, x=sd*5.2;
    const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=sd>0?-Math.PI/2:Math.PI/2; wg.add(g);
    mk(new RoundedBoxGeometry(5.6,h,4,2,0.06),TM(wallC[(k+(sd>0?1:0))%4]),g,{p:[0,h/2,-2],recv:true});
    mk(new THREE.BoxGeometry(1.4,2.1,0.1),TM('#2b1d14'),g,{p:[0,1.05,0.01]});
    mk(new THREE.CylinderGeometry(0.7,0.7,0.1,20,1,false,-Math.PI/2,Math.PI),TM('#2b1d14'),g,{p:[0,2.1,0.01],r:[Math.PI/2,0,0]});
    mk(new THREE.BoxGeometry(1.2,1.9,0.08),TM(doorC[k%4]),g,{p:[-1.9,0.95,0.02]});
    const rug=new THREE.Mesh(new THREE.PlaneGeometry(1.0,1.5),TM('#ffffff',{map:kilim(goods[k%6],'#ffffff',goods[(k+3)%6])})); rug.position.set(1.9,1.6,0.05); g.add(rug);
    // stall
    mk(new RoundedBoxGeometry(2.0,0.8,0.9,2,0.05),TM('#8b5a2b'),g,{p:[0,0.4,0.8]});
    const aw=mk(new THREE.PlaneGeometry(2.6,1.2),TM('#ffffff',{map:stripeTex(k%2?'#d62828':'#1d5fbf','#ffffff'),side:THREE.DoubleSide}),g,{p:[0,2.4,0.9],r:[-1.0,0,0]});
    for(let q=0;q<5;q++){ const gx=-0.75+q*0.38; if(k%2) mk(new THREE.ConeGeometry(0.16,0.22,12),TM(goods[(q+k)%6]),g,{p:[gx,0.91,0.8]});
      else mk(SPH,TM(goods[(q+k)%6]),g,{p:[gx,0.95,0.8],s:[0.15,0.18,0.15],ol:0.08}); }
  }
  // lantern lines
  for(let z=-16;z<=16;z+=4){ mk(new THREE.CylinderGeometry(0.01,0.01,6.4,4),TM('#333333'),wg,{p:[0,3.6,z],r:[0,0,Math.PI/2],shadow:false});
    for(const x of [-2,0,2]){ mk(new THREE.CylinderGeometry(0.008,0.008,0.4,4),TM('#333333'),wg,{p:[x,3.4,z],shadow:false}); lamp(wg,x,3.1,z,['#ffb703','#ff3d4f','#2a9df4'][(x+2)/2|0],0.16); } }
  // gates
  for(const sd of [-1,1]){ const gz=sd*21; const gw=TM('#f3e3c3');
    for(const x of [-3.3,3.3]) mk(new RoundedBoxGeometry(1.4,5,1.4,2,0.08),gw,wg,{p:[x,2.5,gz]});
    mk(new RoundedBoxGeometry(8,1.2,1.4,2,0.08),gw,wg,{p:[0,5.4,gz]});
    mk(new THREE.TorusGeometry(2.6,0.25,8,24,Math.PI),TM('#1d5fbf'),wg,{p:[0,4.0,gz+sd*0.72]}); }
}
const MAPS={
  neon:{name:'مدينة نيون',emoji:'🌃',build:buildNeon,bounds:{x:5.6,z:45},spawnZ:3,profile:'neon'},
  studio:{name:'ستوديو',emoji:'📸',build:buildStudio,bounds:{c:7},spawnZ:0,profile:'studio'},
  sidi:{name:'سيدي بوسعيد',emoji:'🏘️',build:buildSidi,bounds:{c:20},spawnZ:2},
  stade:{name:'الملعب',emoji:'🏟️',build:buildStade,bounds:{x:12.2,z:19.3},spawnZ:3},
  plage:{name:'البحر',emoji:'🏖️',build:buildPlage,bounds:{x:17,zMin:-9.5,zMax:16},spawnZ:4},
  souk:{name:'السوق',emoji:'🛍️',build:buildSouk,bounds:{x:2.3,z:19},spawnZ:0},
};
const glowMats=[];
initCities({ PM, mk, SPH, BOX, canvasTex, stripeTex, V, cyl, rbox, colliders, lamp, palm, emitter: (...a)=>emitter(...a), glowMats, setSea:m=>{ sea=m; }, addFlag:fl=>{ fl.userData.base=fl.geometry.attributes.position.array.slice(); fl.userData.ph=Math.random()*6; flags.push(fl); } });
Object.assign(MAPS, CITY_MAPS);
let worldGroup=null, mapId='sidi', night=false;
const stars=new THREE.Points((()=>{ const g=new THREE.BufferGeometry(), a=[]; for(let i=0;i<700;i++){ const t=Math.random()*Math.PI*2, u=Math.random()*0.9+0.08; const r=80; a.push(Math.cos(t)*Math.sqrt(1-u*u)*r,u*r,Math.sin(t)*Math.sqrt(1-u*u)*r); } g.setAttribute('position',new THREE.Float32BufferAttribute(a,3)); return g; })(),
  new THREE.PointsMaterial({color:0xffffff,size:2,sizeAttenuation:false,fog:false}));
stars.visible=false; scene.add(stars);
function clampBounds(p){ const b=MAPS[mapId].bounds;
  if(b.c){ const L=Math.hypot(p.x,p.z); if(L>b.c){ p.x*=b.c/L; p.z*=b.c/L; } }
  if(b.x){ p.x=Math.max(-b.x,Math.min(b.x,p.x)); }
  if(b.z){ p.z=Math.max(-b.z,Math.min(b.z,p.z)); }
  if(b.zMin!=null){ p.z=Math.max(b.zMin,Math.min(b.zMax,p.z)); } }
function applyLighting(){
  const mp=MAPS[mapId]; const key=mp.profile||(night?(mapId==='stade'?'stadeNight':'night'):(mp.day||'day')); const pf=PROFILES[key]; const city=!!CITY_MAPS[mapId];
  const sm=sky.material.uniforms; sm.top.value.set(pf.top); sm.bot.value.set(pf.bot);
  scene.fog.color.set(pf.fog); scene.fog.near=city?pf.near*2.5:pf.near; scene.fog.far=city?Math.max(200,pf.far*2.5):pf.far;
  hemi.intensity=pf.hemi; sun.intensity=pf.sun; sun.color.set(pf.sunC); scene.environment=ENVS[pf.env];
  renderer.toneMappingExposure=pf.exp; bloom.strength=pf.bloom;
  const dark=key!=='day'; stars.visible=key==='night'||key==='stadeNight'; charLight.intensity=['night','stadeNight','neon'].includes(key)?5:0; charLight.decay=1.6; charLight.distance=8;
  const lampsOn=dark&&key!=='overcast'; lamps.forEach(l=>{ l.material.emissive.copy(lampsOn?l.userData.glow:new THREE.Color(0)); l.material.emissiveIntensity=2.5; });
  const nightish=['night','stadeNight','neon'].includes(key); glowMats.forEach(m=>{ m.emissiveIntensity=nightish?m.userData.glow.night:(key==='sunset'?m.userData.glow.night*0.35:m.userData.glow.day); });
}
function setMap(id,silent){
  if(worldGroup){ scene.remove(worldGroup); disposeObj(worldGroup); }
  colliders.length=0; lamps.length=0; glowMats.length=0; ball=null; sea=null; stadeCrowd=null; emitters.length=0; flags=[];
  mapId=id; worldGroup=new THREE.Group(); scene.add(worldGroup); MAPS[id].build(worldGroup); applyLighting();
  ctx.onMapChanged&&ctx.onMapChanged(id,silent);
}
function updateWorld(dt,t){
  updateEmitters(dt); if(flags.length) updateFlags(t);
  if(sea){ const P=sea.geometry.attributes.position, B=sea.userData.base; for(let i=0;i<P.count;i++){ const x=B[i*3], z=B[i*3+2]; P.array[i*3+1]=Math.sin(x*0.35+t*1.6)*0.12+Math.cos(z*0.5+t*1.1)*0.1; } P.needsUpdate=true; }
  if(night) lamps.forEach((l,i)=>{ l.material.emissiveIntensity=2.2+Math.sin(t*3+i)*0.4; });
  if(stadeCrowd&&goalLock>0){ const m=new THREE.Matrix4(); stadeCrowd.userData.spots.forEach((p,i)=>{ if(i%3) return; m.makeScale(1,1.3,1).setPosition(p[0],p[1]+Math.abs(Math.sin(t*12+i))*0.35,p[2]); stadeCrowd.setMatrixAt(i,m); }); stadeCrowd.instanceMatrix.needsUpdate=true; }
  if(goalLock>0){ goalLock-=dt; if(goalLock<=0&&ball){ ball.pos.copy(ball.home); ball.vel.set(0,0,0); ball.y=0; ball.vy=0;
      if(stadeCrowd){ const m=new THREE.Matrix4(); stadeCrowd.userData.spots.forEach((p,i)=>{ m.makeScale(1,1.3,1).setPosition(p[0],p[1],p[2]); stadeCrowd.setMatrixAt(i,m); }); stadeCrowd.instanceMatrix.needsUpdate=true; } } }
  if(!ball) return; const b=ball; const chars=ctx.chars(), active=ctx.active();
  chars.forEach((c,ci)=>{ const dx=b.pos.x-c.pos.x, dz=b.pos.z-c.pos.z, d=Math.hypot(dx,dz), min=b.r+c.width*0.28;
    if(d<min&&d>1e-4&&b.y<0.6){ const nx=dx/d,nz=dz/d; b.pos.x=c.pos.x+nx*min; b.pos.z=c.pos.z+nz*min; const pw=ci===active?2.5+c.moving*5.5:1.5; b.vel.set(nx*pw,0,nz*pw); b.vy=c.moving>0.6?2.6:0.8; } });
  b.pos.addScaledVector(b.vel,dt); b.vel.multiplyScalar(Math.pow(0.4,dt)); b.vy-=9.8*dt; b.y+=b.vy*dt;
  if(b.y<0){ b.y=0; b.vy=-b.vy*0.55; if(Math.abs(b.vy)<0.4) b.vy=0; }
  if(mapId==='stade'){
    if(Math.abs(b.pos.x)>11.6){ b.pos.x=Math.sign(b.pos.x)*11.6; b.vel.x*=-0.7; }
    if(Math.abs(b.pos.z)>17){ if(Math.abs(b.pos.x)<2.8&&b.y<2&&goalLock<=0){ goalLock=2.5; ctx.toast('⚽ GOOOOOL!! 🎉'); ctx.onGoal&&ctx.onGoal(); }
      if(Math.abs(b.pos.z)>18.2){ b.pos.z=Math.sign(b.pos.z)*18.2; b.vel.z*=-0.4; } else if(Math.abs(b.pos.x)>=2.8){ b.pos.z=Math.sign(b.pos.z)*17; b.vel.z*=-0.7; } }
  } else { const keep=b.pos.clone(); clampBounds(b.pos); if(keep.x!==b.pos.x) b.vel.x*=-0.7; if(keep.z!==b.pos.z) b.vel.z*=-0.7;
    for(const c of colliders){ const dx=b.pos.x-c.x, dz=b.pos.z-c.z, d=Math.hypot(dx,dz), mn=c.r+b.r; if(d<mn&&d>1e-4){ b.pos.x=c.x+dx/d*mn; b.pos.z=c.z+dz/d*mn; const vn=(b.vel.x*dx+b.vel.z*dz)/d; b.vel.x-=1.7*vn*dx/d; b.vel.z-=1.7*vn*dz/d; } } }
  const sp=Math.hypot(b.vel.x,b.vel.z); if(sp>0.01){ const ax=new THREE.Vector3(b.vel.z,0,-b.vel.x).normalize(); b.mesh.rotateOnWorldAxis(ax,sp*dt/b.r); }
  b.mesh.position.set(b.pos.x,b.r+b.y,b.pos.z);
}


/* =============== FX: particles =============== */
const emitters=[];
const glowTex=canvasTex(64,64,(g,w,h)=>{ const r=g.createRadialGradient(32,32,0,32,32,32); r.addColorStop(0,'rgba(255,255,255,1)'); r.addColorStop(0.35,'rgba(255,255,255,.6)'); r.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=r; g.fillRect(0,0,w,h); });
const smokeTex=canvasTex(64,64,(g,w,h)=>{ const r=g.createRadialGradient(32,32,0,32,32,32); r.addColorStop(0,'rgba(200,200,210,.55)'); r.addColorStop(1,'rgba(200,200,210,0)'); g.fillStyle=r; g.fillRect(0,0,w,h); });
function emitter(wg,type,origin,n){
  const geo=new THREE.BufferGeometry(), pos=new Float32Array(n*3), vel=new Float32Array(n*3), life=new Float32Array(n);
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const col= type==='spark'?new THREE.Color(4,2.2,0.7): type==='flare'?new THREE.Color(5,1.2,0.4):new THREE.Color(1,1,1);
  const mat=new THREE.PointsMaterial({color:col,size:type==='smoke'?1.6:type==='flare'?0.16:0.07,map:type==='smoke'?smokeTex:glowTex,transparent:true,depthWrite:false,blending:type==='smoke'?THREE.NormalBlending:THREE.AdditiveBlending,sizeAttenuation:true,toneMapped:type==='smoke'});
  if(type==='smoke') mat.opacity=0.28;
  const pts=new THREE.Points(geo,mat); pts.frustumCulled=false; wg.add(pts);
  const em={type,origin,pos,vel,life,n,geo,pts};
  for(let i=0;i<n;i++){ life[i]=-Math.random()*2; pos[i*3+1]=-99; }
  emitters.push(em); return em;
}
function respawn(em,i){ const o=em.origin, p=em.pos, v=em.vel;
  p[i*3]=o.x+(Math.random()-0.5)*0.2; p[i*3+1]=o.y; p[i*3+2]=o.z+(Math.random()-0.5)*0.2;
  if(em.type==='spark'){ const a=Math.random()*Math.PI*2, s=1+Math.random()*3; v[i*3]=Math.cos(a)*s; v[i*3+1]=Math.random()*2-0.5; v[i*3+2]=Math.sin(a)*s; em.life[i]=0.6+Math.random()*1.1; }
  else if(em.type==='flare'){ v[i*3]=(Math.random()-0.5)*0.6; v[i*3+1]=1.2+Math.random()*1.8; v[i*3+2]=(Math.random()-0.5)*0.6; em.life[i]=0.3+Math.random()*0.7; }
  else { v[i*3]=(Math.random()-0.5)*0.4; v[i*3+1]=0.6+Math.random()*0.6; v[i*3+2]=(Math.random()-0.5)*0.4; em.life[i]=2+Math.random()*3; } }
function updateEmitters(dt){ for(const em of emitters){ const p=em.pos,v=em.vel;
  for(let i=0;i<em.n;i++){ em.life[i]-=dt; if(em.life[i]<=0){ if(em.life[i]<-0.001&&em.life[i]+dt>0) {} respawn(em,i); continue; }
    p[i*3]+=v[i*3]*dt; p[i*3+1]+=v[i*3+1]*dt; p[i*3+2]+=v[i*3+2]*dt;
    if(em.type==='spark'){ v[i*3+1]-=9.8*dt; if(p[i*3+1]<0.02){ p[i*3+1]=0.02; v[i*3+1]*=-0.35; v[i*3]*=0.6; v[i*3+2]*=0.6; } } }
  em.geo.attributes.position.needsUpdate=true; } }

/* =============== ENV LIGHTING =============== */
const pmrem=new THREE.PMREMGenerator(renderer);
function envFrom(base,panels){ const sc=new THREE.Scene(); sc.background=new THREE.Color(base);
  panels.forEach(([c,x,y,z,sx,sy,sz,i])=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(i)})); m.position.set(x,y,z); m.scale.set(sx,sy,sz); sc.add(m); });
  return pmrem.fromScene(sc,0.04).texture; }
const ENVS={
  day:pmrem.fromScene(new RoomEnvironment(),0.04).texture,
  night:envFrom(0x05070f,[[0x7f8fd0,0,8,0,12,0.2,12,1.0],[0xffb060,0,0.5,6,6,1,0.2,0.8]]),
  neon:envFrom(0x06030c,[[0xff2fa0,-7,2,0,0.2,4,10,2],[0x00e5ff,7,2,0,0.2,4,10,2],[0x7b3cff,0,7,0,10,0.2,10,0.8]]),
  studio:envFrom(0x0a0614,[[0x8a4dff,0,3,-7,12,6,0.2,1.4],[0xff8a00,-7,3,-3,0.3,5,4,2.4],[0xffffff,0,7,6,5,0.2,5,2.6],[0x3a7bff,7,3,-2,0.3,4,3,1.2]]),
  stade:envFrom(0x070a18,[[0xffffff,-8,9,-8,3,2,3,4],[0xffffff,8,9,8,3,2,3,4],[0xffffff,-8,9,8,3,2,3,4],[0xffffff,8,9,-8,3,2,3,4],[0xff4020,0,1,-9,14,2,0.2,1.2],[0xffc020,0,1,9,14,2,0.2,1.2]])
};
const PROFILES={
  day:{top:0x3d8fff,bot:0xd6ecff,fog:0xd6ecff,near:24,far:70,hemi:0.55,sun:2.6,sunC:0xfff1dc,env:'day',bloom:0.12,exp:1.0},
  night:{top:0x060a20,bot:0x18204a,fog:0x10162e,near:18,far:60,hemi:0.18,sun:0.35,sunC:0xb8c6ff,env:'night',bloom:0.75,exp:1.15},
  neon:{top:0x0a0418,bot:0x2a0f45,fog:0x190a2c,near:12,far:60,hemi:0.14,sun:0.3,sunC:0xa98bff,env:'neon',bloom:0.7,exp:1.1},
  sunset:{top:0x3b2a7a,bot:0xff9a62,fog:0xf0a27a,near:30,far:90,hemi:0.55,sun:2.2,sunC:0xffa060,env:'day',bloom:0.35,exp:1.0},
  overcast:{top:0x8e98a6,bot:0xd5dbe2,fog:0xc8cfd8,near:25,far:80,hemi:0.85,sun:1.1,sunC:0xf2f4f7,env:'day',bloom:0.1,exp:1.05},
  studio:{top:0x0b0614,bot:0x1c0f2e,fog:0x120a1f,near:14,far:40,hemi:0.15,sun:0,sunC:0xffffff,env:'studio',bloom:0.45,exp:0.95},
  stadeNight:{top:0x070a1c,bot:0x26305e,fog:0x141a33,near:30,far:90,hemi:0.3,sun:1.6,sunC:0xe6eeff,env:'stade',bloom:0.85,exp:1.1}
};

/* =============== NEW MAPS =============== */
function windowTex(seed){ return canvasTex(128,256,(g,w,h)=>{ g.fillStyle='#000'; g.fillRect(0,0,w,h);
  for(let y=6;y<h;y+=14) for(let x=6;x<w;x+=12){ const r=Math.random(); if(r<0.55) continue; g.fillStyle=r<0.75?'#ffcf8a':r<0.88?'#9fd8ff':'#ff8ad8'; g.globalAlpha=0.5+Math.random()*0.5; g.fillRect(x,y,7,9); } g.globalAlpha=1; }); }
function neonSign(wg,text,col,x,y,z,ry,vertical,scale=1){
  const n=[...text].length; const W=vertical?120:Math.max(260,n*70), Hh=vertical?Math.max(260,n*86):120;
  const tex=canvasTex(W,Hh,(g,w,h)=>{ g.fillStyle='#000'; g.fillRect(0,0,w,h); g.strokeStyle=col; g.lineWidth=6; g.strokeRect(8,8,w-16,h-16);
    g.fillStyle=col; g.font='800 66px Cairo, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.shadowColor=col; g.shadowBlur=12;
    if(vertical){ [...text].forEach((ch,i)=>g.fillText(ch,w/2,52+i*80)); } else g.fillText(text,w/2,h/2+4,w-30); });
  const pw=(W/100)*0.5*scale, ph=(Hh/100)*0.5*scale;
  const m=mk(new THREE.PlaneGeometry(pw,ph),new THREE.MeshStandardMaterial({color:0x000000,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:2.6,roughness:0.6}),wg,{p:[x,y,z],r:[0,ry,0],shadow:false});
  return m; }
function moto(wg,x,z,ry){
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry; wg.add(g);
  const rub=PM('#111114',{roughness:0.85}), chrome=PM('#cfd3da',{roughness:0.2,metalness:1}), paint=PM('#1ae0ff',{roughness:0.25,metalness:0.5}), paint2=PM('#ff3fa4',{roughness:0.25,metalness:0.5});
  const neonC=new THREE.MeshStandardMaterial({color:0x000000,emissive:0x00e5ff,emissiveIntensity:3.5}), neonP=new THREE.MeshStandardMaterial({color:0x000000,emissive:0xff2fa0,emissiveIntensity:3.5});
  for(const zz of [0.72,-0.72]){ mk(new THREE.TorusGeometry(0.31,0.09,14,32),rub,g,{p:[0,0.4,zz],r:[0,Math.PI/2,0]}); mk(cyl(0.22,0.22,0.07,24),chrome,g,{p:[0,0.4,zz],r:[0,0,Math.PI/2]});
    mk(new THREE.TorusGeometry(0.235,0.012,6,32),neonC,g,{p:[0,0.4,zz],r:[0,Math.PI/2,0],shadow:false}); }
  mk(rbox(0.32,0.3,0.75,0.1),paint2,g,{p:[0,0.88,0.08]});
  mk(rbox(0.38,0.42,0.42,0.12),paint,g,{p:[0,0.92,0.55],r:[-0.55,0,0]});
  mk(rbox(0.3,0.09,0.55,0.04),rub,g,{p:[0,1.0,-0.32],r:[0.12,0,0]});
  mk(rbox(0.28,0.18,0.45,0.06),paint,g,{p:[0,1.03,-0.72],r:[0.35,0,0]});
  mk(rbox(0.26,0.26,0.42,0.06),PM('#2a2d36',{roughness:0.5,metalness:0.6}),g,{p:[0,0.58,0.02]});
  mk(cyl(0.05,0.06,0.7,12),chrome,g,{p:[0.16,0.5,-0.45],r:[1.25,0,0]});
  for(const s of [-1,1]) mk(cyl(0.025,0.025,0.62,8),chrome,g,{p:[s*0.1,0.75,0.68],r:[-0.38,0,0]});
  mk(cyl(0.018,0.018,0.62,8),chrome,g,{p:[0,1.12,0.48],r:[0,0,Math.PI/2]});
  mk(SPH,new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:3}),g,{p:[0,0.98,0.8],s:[0.07,0.05,0.04],shadow:false});
  mk(BOX,new THREE.MeshStandardMaterial({color:0x000000,emissive:0xff1030,emissiveIntensity:3}),g,{p:[0,1.07,-0.95],s:[0.16,0.03,0.03],shadow:false});
  for(const s of [-1,1]) mk(BOX,s>0?neonC:neonP,g,{p:[s*0.17,0.7,0.1],s:[0.012,0.03,0.9],shadow:false});
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(1.2,2.2),new THREE.MeshBasicMaterial({map:glowTex,color:new THREE.Color(0.2,1.4,1.8),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  glow.rotation.x=-Math.PI/2; glow.position.y=0.02; g.add(glow);
  colliders.push({x,z,r:0.95});
}
function buildNeon(wg){
  const gt=canvasTex(512,512,(g,w,h)=>{ g.fillStyle='#14151b'; g.fillRect(0,0,w,h); for(let i=0;i<5000;i++){ const v=18+Math.random()*26|0; g.fillStyle=`rgb(${v},${v},${v+5})`; g.fillRect(Math.random()*w,Math.random()*h,2,2);} },10);
  mk(new THREE.PlaneGeometry(40,100),new THREE.MeshStandardMaterial({map:gt,roughness:0.28,metalness:0.4,color:0x6a6a78,envMapIntensity:0.35}),wg,{r:[-Math.PI/2,0,0],shadow:false,recv:true});
  for(let z=-48;z<48;z+=4) mk(new THREE.PlaneGeometry(0.15,2),new THREE.MeshStandardMaterial({color:0x000000,emissive:0xffc040,emissiveIntensity:0.6}),wg,{r:[-Math.PI/2,0,0],p:[0,0.006,z],shadow:false});
  for(let i=0;i<7;i++) mk(new THREE.PlaneGeometry(0.5,3.2),PM('#8a8a94',{roughness:0.6,envMapIntensity:0.3}),wg,{r:[-Math.PI/2,0,0],p:[-2.4+i*0.8,0.007,6],shadow:false,recv:true});
  for(let i=0;i<14;i++) mk(new THREE.CircleGeometry(0.6+Math.random()*1.2,24),new THREE.MeshStandardMaterial({color:0x07070a,roughness:0.02,metalness:0.9}),wg,{r:[-Math.PI/2,0,0],p:[(Math.random()-0.5)*9,0.008,(Math.random()-0.5)*40],s:[1,0.6,1],shadow:false,recv:true});
  const swM=PM('#2a2b33',{roughness:0.55});
  for(const sd of [-1,1]){ mk(new THREE.BoxGeometry(3,0.16,100),swM,wg,{p:[sd*6.5,0.08,0],recv:true});
    for(let z=-44;z<48;z+=0){ const w=5+Math.random()*4, d=6+Math.random()*4, h=10+Math.random()*26, bx=sd*(8+w/2);
      const wt=windowTex(); wt.wrapS=wt.wrapT=THREE.RepeatWrapping; wt.repeat.set(Math.round(d/3),Math.round(h/6));
      mk(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:0x1a1b24,roughness:0.7,metalness:0.2,emissive:0xffffff,emissiveMap:wt,emissiveIntensity:1.1}),wg,{p:[bx,h/2,z+d/2],shadow:false,recv:true});
      z+=d+0.3; } }
  const signs=[['MKACHKHA','#ff2fa0',true],['نيون','#00e5ff',true],['ARCADE','#ffd23f',true],['قهوة','#ff6a3d',true],['24/7','#7cff6b',false],['TUNIS','#b48cff',true],['FF','#ff2fa0',false],['HOTEL','#00e5ff',true],['دقدق وبيع','#ffd23f',false],['PIZZA','#ff3d4f',false],['GAME','#00ffc8',true],['سوق','#ff8ad8',true]];
  signs.forEach(([t,c,v],i)=>{ const sd=i%2?1:-1, z=-30+i*5.2; const x=sd*7.85; const y=v?4+((i*3)%4):3+((i*5)%5);
    const m=neonSign(wg,t,c,x,y,z,sd>0?-Math.PI/2:Math.PI/2,v,v?0.9:1); if(i%3===0){ m.position.x=sd*7.0; m.rotation.y=0; m.position.z=z; } });
  for(const [x,z,c] of [[-5,-2,0x00e5ff],[5,-9,0xff2fa0],[-5,-16,0xffd23f],[5,4,0x00e5ff],[-5,10,0xff2fa0]]){
    mk(cyl(0.06,0.08,5,10),PM('#2c2e38',{roughness:0.4,metalness:0.7}),wg,{p:[x,2.5,z]});
    mk(BOX,PM('#2c2e38',{roughness:0.4,metalness:0.7}),wg,{p:[x-Math.sign(x)*0.6,5,z],s:[1.3,0.08,0.12]});
    mk(BOX,new THREE.MeshStandardMaterial({color:0x000000,emissive:c,emissiveIntensity:4}),wg,{p:[x-Math.sign(x)*1.1,4.92,z],s:[0.5,0.05,0.18],shadow:false});
    colliders.push({x,z,r:0.2}); }
  const pl1=new THREE.PointLight(0xff2fa0,7,14,1.6); pl1.position.set(-4,3.2,-1); wg.add(pl1);
  const pl2=new THREE.PointLight(0x00e5ff,7,14,1.6); pl2.position.set(4,3.2,-6); wg.add(pl2);
  const pl3=new THREE.PointLight(0xffb060,3,10,1.6); pl3.position.set(0,2.5,4); wg.add(pl3);
  moto(wg,1.9,-1.2,-0.5);
  emitter(wg,'spark',V(3.2,6.5,-4.5),220);
  emitter(wg,'spark',V(-6.8,8.5,-12),120);
}
function buildStudio(wg){
  mk(new THREE.CircleGeometry(30,64),new THREE.MeshStandardMaterial({color:0x14101f,roughness:0.35,metalness:0.3}),wg,{r:[-Math.PI/2,0,0],shadow:false,recv:true});
  const hexT=canvasTex(512,512,(g,w,h)=>{ g.fillStyle='#231b33'; g.fillRect(0,0,w,h); g.strokeStyle='rgba(255,176,32,.35)'; g.lineWidth=3; for(let r=60;r<256;r+=48){ g.beginPath(); g.arc(256,256,r,0,7); g.stroke(); }
    for(let i=0;i<24;i++){ const a=i/24*Math.PI*2; g.beginPath(); g.moveTo(256+Math.cos(a)*60,256+Math.sin(a)*60); g.lineTo(256+Math.cos(a)*250,256+Math.sin(a)*250); g.stroke(); } });
  mk(cyl(2.8,2.9,0.14,64),new THREE.MeshStandardMaterial({color:0xffffff,map:hexT,roughness:0.3,metalness:0.4,emissive:0xffffff,emissiveMap:hexT,emissiveIntensity:0.08}),wg,{p:[0,0.07,0],recv:true});
  mk(new THREE.TorusGeometry(2.85,0.03,8,128),new THREE.MeshStandardMaterial({color:0x000000,emissive:0xffb020,emissiveIntensity:4}),wg,{p:[0,0.145,0],r:[Math.PI/2,0,0],shadow:false});
  mk(new THREE.TorusGeometry(2.0,0.012,8,128),new THREE.MeshStandardMaterial({color:0x000000,emissive:0x8a4dff,emissiveIntensity:3}),wg,{p:[0,0.146,0],r:[Math.PI/2,0,0],shadow:false});
  const bd=canvasTex(16,256,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#05030a'); gr.addColorStop(0.55,'#2a1450'); gr.addColorStop(1,'#120a20'); g.fillStyle=gr; g.fillRect(0,0,w,h); });
  mk(new THREE.CylinderGeometry(14,14,14,64,1,true,Math.PI*0.6,Math.PI*0.8),new THREE.MeshBasicMaterial({map:bd,side:THREE.BackSide,fog:false}),wg,{p:[0,7,0],shadow:false});
  const bc=[0x8a4dff,0xff8a00,0x3a7bff,0xff2fa0];
  for(let i=0;i<70;i++){ const a=Math.PI*(0.68+Math.random()*0.64), r=9+Math.random()*4, s=0.04+Math.random()*0.14;
    mk(SPH,new THREE.MeshStandardMaterial({color:0x000000,emissive:bc[i%4],emissiveIntensity:2+Math.random()*3}),wg,{p:[Math.sin(a)*r,0.5+Math.random()*8,Math.cos(a)*r],s:[s,s,s],shadow:false}); }
  const key=new THREE.SpotLight(0xfff0dd,45,22,0.6,0.6,1.4); key.position.set(1.5,6.5,5.5); key.target.position.set(0,1,0); key.castShadow=true; key.shadow.mapSize.set(1024,1024); key.shadow.bias=-0.0004; wg.add(key); wg.add(key.target);
  const rimA=new THREE.PointLight(0x8a4dff,25,12,1.6); rimA.position.set(-3.5,3,-3); wg.add(rimA);
  const rimB=new THREE.PointLight(0xff8a00,18,12,1.6); rimB.position.set(3.5,2.5,-2.5); wg.add(rimB);
  const fill=new THREE.PointLight(0x6a8cff,8,10,1.6); fill.position.set(-3,2,4); wg.add(fill);
  emitter(wg,'smoke',V(0,0.1,-5.5),10);
}
let flags=[];
function stadeExtras(wg){
  const ban=canvasTex(1024,160,(g,w,h)=>{ g.fillStyle='#b30016'; g.fillRect(0,0,w,h); g.fillStyle='#ffcc00'; for(let i=0;i<w;i+=64) g.fillRect(i,0,32,10),g.fillRect(i+32,h-10,32,10);
    g.font='110px Lalezar, Cairo, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#ffcc00'; g.shadowColor='#000'; g.shadowBlur=10; g.fillText('MKACHKHA FF',w/2,h/2+8); });
  for(const sd of [-1,1]) mk(new THREE.PlaneGeometry(14,2.2),PM('#ffffff',{map:ban,roughness:0.9,side:THREE.DoubleSide}),wg,{p:[sd*16.8,4.6,0],r:[0,sd>0?-Math.PI/2:Math.PI/2,0],shadow:false});
  flags=[];
  const ft=stripeTex('#d62828','#ffcc00',6), ft2=stripeTex('#ffcc00','#111111',4);
  for(const sd of [-1,1]) for(let i=0;i<9;i++){ const z=-16+i*4, x=sd*(14+Math.random()*4.4), y=2.2+(Math.abs(x)-14)*0.55*1.1;
    const pg=new THREE.PlaneGeometry(1.3,0.85,10,4); const fl=new THREE.Mesh(pg,PM('#ffffff',{map:i%3?ft:ft2,side:THREE.DoubleSide,roughness:0.9})); fl.position.set(x,y+1.6,z); fl.rotation.y=sd>0?-Math.PI/2:Math.PI/2; wg.add(fl);
    mk(cyl(0.02,0.02,1.6,6),PM('#cccccc'),wg,{p:[x,y+0.8,z-0.65*sd*0],shadow:false});
    fl.userData.base=pg.attributes.position.array.slice(); fl.userData.ph=Math.random()*6; flags.push(fl); }
  for(const [x,z] of [[-15,-8],[15,6],[-16,10],[16,-12],[-14.5,2],[15.5,-2]]){ const y=0.4+((Math.abs(x)-14)/1.1|0)*0.6*2+0.5; emitter(wg,'flare',V(x,y+0.4,z),60); emitter(wg,'smoke',V(x,y+1,z),10); }
}
function updateFlags(t){ for(const fl of flags){ const P=fl.geometry.attributes.position, B=fl.userData.base; for(let i=0;i<P.count;i++){ const x=B[i*3]+0.65; P.array[i*3+2]=Math.sin(x*4-t*6+fl.userData.ph)*0.08*x; } P.needsUpdate=true; } }


  return { setMap, updateWorld, applyLighting, clampBounds, colliders, MAPS,
    get mapId(){ return mapId; }, get night(){ return night; }, set night(v){ night=v; applyLighting(); },
    PM, mk, SPH, BOX, canvasTex, stripeTex, disposeObj, V, cyl, rbox };
}
