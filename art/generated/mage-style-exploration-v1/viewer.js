(()=>{
const {document,Image}=globalThis;
const data=globalThis.MAGE_STYLE_REVIEW;
const status=document.querySelector('#status');
const images={};
function load(name,url){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[name]=im;resolve();};im.onerror=()=>reject(Error('Не загрузился '+url));im.src=url;});}
function text(g,value,x,y,color='#e3e6da',size=18){g.fillStyle=color;g.font=size+'px system-ui';g.fillText(value,x,y);}
function drawVisible(g,im,box,cx,foot,height){const s=height/box.height;g.drawImage(im,box.left,box.top,box.width,box.height,cx-box.width*s/2,foot-height,box.width*s,height);}
function drawSheet(){
 const canvas=document.querySelector('#sheet'),g=canvas.getContext('2d');g.imageSmoothingEnabled=false;
 g.fillStyle='#132127';g.fillRect(0,0,1280,500);
 text(g,'PIXEL SURVIVOR  /  MAGE CONCEPTS',28,37,'#cdb282',23);
 text(g,'PixelLab · средняя детализация · 4 статичных варианта',28,65,'#a8bcb5',15);
 for(let i=0;i<data.variants.length;i++){
  const v=data.variants[i],x=i*320;
  g.fillStyle='#1d2d32';g.fillRect(x+12,86,296,350);
  for(let y=86;y<436;y+=16)for(let xx=x+12;xx<x+308;xx+=16){if(((y-86)/16+(xx-x-12)/16)%2===0){g.fillStyle='#22343a';g.fillRect(xx,y,Math.min(16,x+308-xx),Math.min(16,436-y));}}
  // Equal native pixel multiplier; do not erase the candidates' original proportions.
  const im=images[v.id];g.drawImage(im,x+16,112,288,288);
  text(g,v.id.toUpperCase()+' · '+v.name,x+24,467,'#e7d7b9',20);
 }
 text(g,'Не интегрировано в игру. Выбор образа — до направлений и анимаций.',28,493,'#a8bcb5',13);
}
function drawScale(){
 const g=document.querySelector('#scale').getContext('2d');g.imageSmoothingEnabled=false;
 g.fillStyle='#1a282d';g.fillRect(0,0,1280,440);
 if(document.querySelector('#backdrop').value==='grove'){
  // Clean terrain crop from a real Grove capture. No actor is present in this crop.
  for(let y=0;y<440;y+=160)for(let x=0;x<1280;x+=320)g.drawImage(images.ground,24,490,320,160,x,y,320,160);
 }
 text(g,'DESKTOP · camera zoom 2 · одинаковая видимая высота',24,35,'#e8dfc8',18);
 text(g,'MOBILE LANDSCAPE · camera zoom 1.28',24,254,'#e8dfc8',18);
 const names=['Текущий','A · Наследник','B · Капюшон','C · Боевой маг','D · Пепельный плащ'];
 for(let i=0;i<5;i++){
  const x=128+i*256;g.fillStyle='#111f25';g.fillRect(x-118,49,236,29);text(g,names[i],x-107,69,'#e3d4b5',16);
  for(const [foot,zoom] of [[204,2],[384,1.28]]){
   g.strokeStyle='#718278';g.beginPath();g.moveTo(x-50,foot+2);g.lineTo(x+50,foot+2);g.stroke();
   if(!i)drawVisible(g,images.current,{left:56,top:31,width:136,height:222},x,foot,34.6875*zoom);
   else{const v=data.variants[i-1];drawVisible(g,images[v.id],v.bbox,x,foot,34.6875*zoom);}
  }
 }
 text(g,'Слева направо: текущий герой и A / B / C / D. Это сравнение, не игровые изменения.',24,423,'#d1d9c7',15);
}
async function start(){
 try{
  if(!data||data.variants.length!==4)throw Error('Нет локальных viewer-data.js');
  await Promise.all([
   ...data.variants.map(v=>load(v.id,'originals/'+v.id+'.png')),
   load('current','references/mage-current.png'),
   load('ground','../../../screenshots/mage-hero-v2/1280/run-north.png')
  ]);
  drawSheet();drawScale();document.querySelector('#backdrop').addEventListener('change',drawScale);
  status.textContent='Готово · 4 варианта · принятые ассеты и gameplay не изменены';
  globalThis.MAGE_STYLE_READY=true;
 }catch(error){status.classList.add('error');status.textContent='Ошибка: '+error.message;globalThis.MAGE_STYLE_ERROR=error.message;}
}
start();
})();
