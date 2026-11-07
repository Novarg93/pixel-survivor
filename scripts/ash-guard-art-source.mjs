// Original Ash Grove Warden. Independent armor/cloth/limb/weapon construction;
// authored on an integer grid, never samples or enlarges any existing actor.
export function drawAshGuardAtlas(layout){
  const canvas=globalThis.document.createElement('canvas');canvas.width=layout.width;canvas.height=layout.height;
  const atlas=canvas.getContext('2d');atlas.imageSmoothingEnabled=false;
  for(const f of layout.frames){
    const tile=globalThis.document.createElement('canvas');tile.width=tile.height=128;const c=tile.getContext('2d');
    const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill();};
    const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
    const line=(points,color,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.lineJoin='miter';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x)+.5,Math.round(y)+.5):c.moveTo(Math.round(x)+.5,Math.round(y)+.5));c.stroke();};
    const counts={spawn:6,idle:4,walk:6,chargeWindup:5,chargeTravel:3,chargeBrake:3,swordWindup:6,swordActive:5,recovery:4,ritualEnter:5,ritualChannel:4,meteorCast:5,shieldBreak:5,phaseTransition:6,phase3Idle:3,phase3Walk:2,hit:2,death:10};
    const p=f.index/Math.max(1,counts[f.pose]-1),pose=f.pose,up=f.facing==='up',side=f.facing==='side';
    const phase3=pose==='phase3Idle'||pose==='phase3Walk';
    const walk=pose==='phase3Walk'?(f.index===0?-1:1):pose==='walk'?Math.sin(p*Math.PI*2):0,ritual=pose==='ritualChannel'||pose==='meteorCast'||pose==='ritualEnter';
    const crouch=phase3?2:pose==='chargeWindup'?p*6:pose==='chargeTravel'?6+f.index*.5:pose==='chargeBrake'?5*(1-p):pose==='shieldBreak'?Math.sin(p*Math.PI)*7:0;
    const lean=phase3?-2:pose==='chargeWindup'?p*5:pose==='chargeTravel'?6+f.index*.5:pose==='swordWindup'?-p*3:pose==='swordActive'?(p-.5)*7:0;
    const death=pose==='death'?p:0,bob=pose==='phase3Idle'?Math.sin(f.index*Math.PI*2/3):pose==='idle'||pose==='ritualChannel'?Math.sin(p*Math.PI*2):Math.abs(walk)*1.5;
    const ox=64+lean+death*9,oy=8+crouch-bob+death*12;
    const q=(points)=>points.map(([x,y])=>[x+ox,y+oy]);
    const plate=(points)=>{poly(q(points),'#18252e');poly(q(points.map(([x,y])=>[x*.85,y+1])),'#52636d');};
    // Torn root-woven mantle, deliberately not a symmetric ellipse.
    poly(q([[-20,42],[-28,57],[-30,87],[-22,81],[-18,94],[-9,84],[0,92],[12,86],[21,91],[27,75],[21,43]]),'#142029');
    poly(q([[-21,47],[-22,80],[-16,76],[-12,87],[-7,72],[-11,49]]),'#293844');
    line(q([[-19,51],[-18,73],[-13,78]]),'#43505a');
    // Separate planted boots, greaves and layered knees; actual alternating support steps.
    for(const sign of [-1,1]){
      const step=walk*sign*5,dx=sign*(side?7:10),dy=step+death*5;
      poly(q([[dx-7,69+dy],[dx+6,69+dy],[dx+7,88+dy],[dx+11,91+dy],[dx+10,96+dy],[dx-9,96+dy],[dx-8,87+dy]]),'#17242c');
      poly(q([[dx-5,72+dy],[dx+4,72+dy],[dx+3,87+dy],[dx-4,90+dy]]),'#6e818c');
      poly(q([[dx-4,73+dy],[dx+1,73+dy],[dx-1,87+dy],[dx-4,87+dy]]),'#afbec3');
      line(q([[dx-7,91+dy],[dx+6,91+dy]]),'#87979f');
      poly(q([[dx-7,68+dy],[dx,64+dy],[dx+7,68+dy],[dx+4,76+dy],[dx-5,76+dy]]),'#889aa3');
      rect(ox+dx-2,oy+68+dy,3,2,'#d6d9c7');
    }
    // Cuirass: six planes, breastbone crest, articulated fauld and ash-dark joints.
    plate([[-17,43],[-9,38],[12,38],[19,47],[14,65],[0,73],[-16,65]]);
    poly(q([[-14,44],[-2,42],[-2,62],[-12,58]]),up?'#52636a':'#9bacb3');
    poly(q([[0,42],[13,44],[12,58],[1,64]]),'#697f8a');
    poly(q([[-1,44],[3,45],[3,62],[-1,65],[-4,61]]),'#d5ded9');
    line(q([[-12,46],[-6,46],[-6,50],[-2,54]]),'#e3e5ce');
    for(let i=0;i<3;i++)poly(q([[-14-i,60+i*4],[0,65+i*3],[15+i,60+i*4],[15+i,64+i*4],[0,70+i*3],[-15-i,64+i*4]]),i%2?'#6b7e85':'#91a2a8');
    // Huge asymmetric root pauldrons with pale steel faces and splintered black wood.
    for(const sign of [-1,1]){
      const sx=sign*(side?13:20),sy=40+(sign===1?2:0);
      poly(q([[sx-sign*10,sy-3],[sx,sy-9],[sx+sign*12,sy-3],[sx+sign*14,sy+8],[sx+sign*5,sy+14],[sx-sign*8,sy+8]]),'#17272e');
      poly(q([[sx-sign*8,sy-3],[sx,sy-6],[sx+sign*9,sy-2],[sx+sign*9,sy+4],[sx,sy+8],[sx-sign*6,sy+5]]),'#9eafb5');
      line(q([[sx-sign*6,sy-3],[sx,sy-5],[sx+sign*7,sy-1]]),'#e6e9d9',2);
      poly(q([[sx+sign*3,sy-6],[sx+sign*4,sy-14],[sx+sign*8,sy-21],[sx+sign*6,sy-11],[sx+sign*13,sy-15],[sx+sign*10,sy-5],[sx+sign*13,sy+1],[sx+sign*7,sy+4]]),'#393735');
      line(q([[sx+sign*5,sy-7],[sx+sign*7,sy-12]]),'#8d7958');
    }
    // Closed angular helm, a narrow ember slit; back has rivets and a spine.
    poly(q([[-10,24],[-5,20],[7,20],[12,26],[10,39],[2,44],[-9,39],[-12,30]]),'#15232b');
    poly(q([[-8,25],[-3,22],[5,22],[9,26],[7,36],[1,40],[-7,36]]),'#9aaeb7');
    poly(q([[0,23],[4,25],[4,37],[0,41],[-3,36]]),'#cad7d8');
    poly(q([[-9,29],[-1,31],[8,28],[7,32],[-1,35],[-8,32]]),up?'#5b707b':'#20272b');
    if(!up){line(q([[-7,31],[-3,32]]),death>.65?'#4b5553':'#f6c67c');line(q([[2,32],[6,30]]),death>.65?'#4b5553':'#f6c67c');}
    else for(let i=0;i<3;i++)rect(ox-1,oy+26+i*4,2,2,'#d9dfd1');
    // Two arms truly follow the heavy weapon's grip, rather than rotating the whole actor.
    let angle=side?.7:up?-1.8:1.15,hx=side?12:7,hy=58;
    const facingAngle=side?0:up?-Math.PI/2:Math.PI/2;
    if(pose==='swordWindup'){angle=facingAngle+.65-p*2.1;hx=5-p*5;hy=56-p*14;}
    if(pose==='swordActive'){angle=facingAngle-1.48+p*2.96;hx=-1+p*12;hy=42+p*14;}
    if(pose==='recovery'){angle=1.2-p*.3;hx=12-p*5;hy=59;}
    if(pose==='chargeWindup'||pose==='chargeTravel'){angle=-.4;hx=13;hy=57+crouch*.2;}
    if(ritual){angle=Math.PI/2;hx=0;hy=pose==='ritualEnter'?45+p*12:57;}
    if(pose==='meteorCast'){angle=1.57;hx=0;hy=57;}
    if(pose==='shieldBreak'){angle=1.57-p*.9;hx=p*12;hy=58;}
    if(pose==='phaseTransition'){angle=-1.6+p*.2;hx=8;hy=51-p*9;}
    if(phase3){angle=-1.5+Math.sin(f.index*Math.PI*2/3)*.06;hx=8;hy=43;}
    if(pose==='spawn'){angle=-.2-p*1.2;hx=10;hy=62-p*10;}
    if(pose==='death'){angle=.9+p*.7;hx=12+p*8;hy=59+p*5;}
    const grip=[ox+hx,oy+hy],v=[Math.cos(angle),Math.sin(angle)],n=[-v[1],v[0]],point=(along,across)=>[grip[0]+v[0]*along+n[0]*across,grip[1]+v[1]*along+n[1]*across];
    for(const sign of [-1,1]){
      const elbow=[ox+sign*(side?15:22),oy+55+sign*walk],hand=point(sign===1?-1:-8,sign*1);
      line([[ox+sign*20,oy+47],elbow,hand],'#17272f',10);line([[ox+sign*20,oy+47],elbow,hand],'#788f99',6);
      line([elbow,hand],'#bcc9cb',2);poly([[hand[0]-4,hand[1]-3],[hand[0]+3,hand[1]-4],[hand[0]+5,hand[1]+2],[hand[0]-2,hand[1]+4]],'#bac5be');
    }
    // Cleaver-shaped greatsword with stepped tip, fuller, twin edge and sparse ember cracks.
    poly([point(-16,-2),point(1,-2),point(1,2),point(-16,2)],'#272e34');
    for(let i=-14;i<0;i+=3)line([point(i,-2),point(i+1,2)],'#b58c52');
    poly([point(1,-11),point(5,-10),point(7,-4),point(7,4),point(5,10),point(1,11),point(2,4),point(2,-4)],'#b6a478');
    poly([point(6,-5),point(35,-5),point(44,0),point(35,6),point(6,6)],'#202f3a');
    poly([point(7,-4),point(34,-4),point(42,0),point(33,4),point(7,4)],'#becdd0');
    poly([point(8,-2),point(33,-2),point(38,0),point(32,1),point(8,1)],'#607d8d');
    line([point(8,4),point(33,4),point(42,0)],'#edf1e4');
    line([point(15,0),point(18,1),point(20,-2),point(25,0),point(28,-1)],death>.7?'#697875':pose==='phaseTransition'?'#ffe5a0':'#d4a36c');
    // Meteor's raised free hand and cyan invocation, separate from blade.
    if(pose==='meteorCast'){
      const lift=Math.sin(p*Math.PI)*24;line(q([[-19,47],[-25,47-lift],[-23,39-lift]]),'#24343d',9);line(q([[-19,47],[-25,47-lift],[-23,39-lift]]),'#b4c3c8',5);
      line(q([[-28,30-lift],[-23,26-lift],[-18,30-lift],[-23,34-lift],[-28,30-lift]]),'#b5e5ed');
    }
    if(pose==='phaseTransition'||pose==='hit'||phase3)for(let i=0;i<4;i++)line(q([[-9+i*5,47],[-7+i*5,51],[-9+i*5,56]]),phase3?'#e7d8b0':'#e4b66f');
    if(phase3){line(q([[-26,39],[-22,43],[-24,47],[-19,50]]),'#d0d6c7');line(q([[19,42],[24,45],[21,49]]),'#d0d6c7');}
    if(pose==='spawn'){
      // Materialization erases upward in six distinct stages, with ash at the seam.
      const cutoff=Math.max(6,Math.round((1-p)*98));c.clearRect(0,0,128,cutoff);
      for(let i=0;i<15;i++)rect(23+(i*17)%67,cutoff+(i%3),1,2,'#b2cbd1');
    }
    if(pose==='death'&&f.index>=2){
      c.clearRect(0,0,128,128);
      // Authored articulated fall: one knee buckles, a hand braces, the torso
      // rolls onto the ground. No rescaling or flattening of an upright actor.
      const poses=[
        [65,87,66,63,69,43,.12],[61,94,66,72,72,54,.22],
        [58,99,68,80,79,65,.48],[55,102,69,87,86,76,.8],
        [54,103,70,93,94,87,1.08],[53,104,69,97,99,94,1.3],
        [53,104,68,99,102,99,1.42],[53,104,68,99,104,101,1.46],
      ];
      const [px,py,cx,cy,hx,hy,tilt]=poses[f.index-2],fallen=f.index>=6,settled=f.index>=8;
      const armor=(a,b,width)=>{
        const d=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/d,ny=(b[0]-a[0])/d;
        const shape=w=>[[a[0]+nx*w,a[1]+ny*w],[b[0]+nx*w,b[1]+ny*w],[b[0]-nx*w,b[1]-ny*w],[a[0]-nx*w,a[1]-ny*w]];
        poly(shape(width+2),'#17262e');poly(shape(width),'#6a7f89');line([[a[0]+nx*width*.6,a[1]+ny*width*.6],[b[0]+nx*width*.6,b[1]+ny*width*.6]],'#b3c3c6',2);
      };
      poly([[cx-20,cy-12],[cx-26,cy+10],[px-17,py+5],[px-25,py+9],[px-6,py+9],[cx+10,cy+15],[cx+17,cy-2]],'#17242d');
      line([[cx-18,cy-7],[px-17,py+1],[px-7,py+5]],'#42515a');
      const rearKnee=fallen?[39,100]:[50,93],rearFoot=fallen?[25,105]:[43,105],frontKnee=fallen?[48,109]:[77,99],frontFoot=fallen?[37,113]:[87,106];
      armor([px-5,py],rearKnee,5);armor(rearKnee,rearFoot,5);armor([px+4,py],frontKnee,6);armor(frontKnee,frontFoot,5);
      for(const foot of [rearFoot,frontFoot]){poly([[foot[0]-7,foot[1]-3],[foot[0]+5,foot[1]-4],[foot[0]+10,foot[1]+1],[foot[0]+8,foot[1]+5],[foot[0]-8,foot[1]+5]],'#263640');line([[foot[0]-6,foot[1]+1],[foot[0]+6,foot[1]+1]],'#a4b4b8');}
      const transform=(x,y)=>[cx+x*Math.cos(tilt)-y*Math.sin(tilt),cy+x*Math.sin(tilt)+y*Math.cos(tilt)];
      const body=pts=>pts.map(([x,y])=>transform(x*(side?.84:1),y));
      poly(body([[-16,-17],[12,-16],[18,-8],[14,11],[0,16],[-16,9]]),'#17262e');
      poly(body([[-13,-15],[-1,-13],[1,9],[-11,8]]),up?'#627580':'#a3b4bc');
      poly(body([[1,-13],[11,-14],[14,-5],[11,9],[2,12]]),'#6f8793');
      line(body([[-11,-14],[-1,-12],[11,-13]]),'#d5e0dd',2);
      for(let i=0;i<3;i++)line(body([[-13,6+i*3],[0,12+i*2],[13,7+i*3]]),i%2?'#4b606c':'#bdc8c8',2);
      line(body([[0,-11],[3,-5],[-1,0],[3,8]]),f.index<6?'#c4a47a':'#344b57');
      // Root pauldrons rotate with the shoulder line; one separates as armor settles.
      for(const sign of [-1,1]){
        const shoulder=transform(sign*16,-12),offset=settled&&sign===1?2:0,sx=shoulder[0]+offset,sy=shoulder[1]+offset;
        poly([[sx-9,sy-5],[sx,sy-10],[sx+10,sy-4],[sx+9,sy+6],[sx,sy+9],[sx-10,sy+4]],'#21323c');
        poly([[sx-7,sy-4],[sx,sy-7],[sx+7,sy-3],[sx+6,sy+3],[sx,sy+6],[sx-7,sy+2]],'#9db0b9');
        line([[sx-5,sy-4],[sx,sy-6],[sx+5,sy-3]],'#dae2de',2);
        poly([[sx+3,sy-5],[sx+5,sy-13],[sx+9,sy-18],[sx+7,sy-8],[sx+12,sy-11],[sx+9,sy-2]],'#383a37');
      }
      const brace=fallen?[87,109]:[88,102],elbow=fallen?[87,102]:[83,88],grip=fallen?[68,111]:[76,85+(f.index-2)*5];
      armor(transform(-13,-7),[cx-12,cy+12],4);armor([cx-12,cy+12],grip,4);
      armor(transform(13,-7),elbow,5);armor(elbow,brace,4);rect(brace[0]-4,brace[1]-2,8,5,'#b9c5c3');
      const headTilt=tilt*.8,head=pts=>pts.map(([x,y])=>[hx+x*Math.cos(headTilt)-y*Math.sin(headTilt),hy+x*Math.sin(headTilt)+y*Math.cos(headTilt)]);
      poly(head([[-10,-8],[-3,-12],[7,-10],[12,-3],[8,9],[-4,12],[-11,4]]),'#1d2d36');
      poly(head([[-7,-7],[-2,-10],[6,-8],[9,-2],[6,6],[-2,9],[-8,3]]),'#a9bdc6');
      poly(head([[0,-9],[4,-7],[3,7],[0,10],[-2,6]]),'#d1dcd9');
      line(head([[-7,0],[-1,3],[7,-1]]),up?'#647e8a':f.index<6?'#b99d75':'#354b58',2);
      // The dropped blade settles separately from the body, its ember channel extinguished.
      const swordAngle=fallen?.02:Math.max(.06,.6-(f.index-2)*.16),v=[Math.cos(swordAngle),Math.sin(swordAngle)],n=[-v[1],v[0]],wp=(along,across)=>[grip[0]+v[0]*along+n[0]*across,grip[1]+v[1]*along+n[1]*across];
      poly([wp(-13,-2),wp(5,-2),wp(5,2),wp(-13,2)],'#26313a');
      poly([wp(2,-9),wp(6,-8),wp(7,-3),wp(7,6),wp(3,8)],'#9c9679');
      poly([wp(7,-5),wp(36,-5),wp(44,0),wp(36,5),wp(7,5)],'#263b49');
      poly([wp(8,-3),wp(35,-3),wp(42,0),wp(34,3),wp(8,3)],settled?'#82959f':'#bccbd0');
      line([wp(9,3),wp(34,3),wp(42,0)],settled?'#a5b5b8':'#e1e7de');line([wp(13,0),wp(23,1),wp(29,-1)],f.index<5?'#b08f65':'#455f6e');
      for(let i=0;i<8;i++){const drift=(f.index-2)*1.5,x=cx-25+(i*19)%48+(i%2?drift:-drift),y=cy-14+(i*13)%19-drift;rect(x,y,2,2,i%2?'#78919d':'#c1cdca');}
    }
    atlas.drawImage(tile,f.frame.x,f.frame.y);
  }
  return canvas.toDataURL('image/png');
}
