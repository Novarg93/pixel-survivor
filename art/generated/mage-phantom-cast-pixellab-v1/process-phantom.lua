-- Native-pixel art treatment only. Pose differences come from PixelLab skeleton generation.
local options=...
local root=options.root
local raw=options.input
local stabilize=options.stabilizeHead~=false
local durations={20,20,20,30,30,30,40,40,30,30,30,20}
local density={0,.20,.39,.54,.61,.65,.65,.60,.46,.28,.13,0}
local offsets={0,2,5,8,12,16,19,19,13,8,3,0}
local palms={{88,139},{109,107},{124,95},{119,105},{111,124},{109,144},{110,163},{111,161},{111,146},{104,127},{94,133},{88,139}}
local elbows={{87,103},{93,98},{97,99},{97,104},{98,108},{100,113},{101,119},{102,118},{100,113},{95,104},{90,103},{87,103}}
local reference=Image{fromFile=root..'/reference/mage-south.png'}
local function clamp(v,a,b)return math.max(a,math.min(b,v))end
local function distance(x,y,a,b)
 local dx,dy=b[1]-a[1],b[2]-a[2];local t=clamp(((x-a[1])*dx+(y-a[2])*dy)/(dx*dx+dy*dy),0,1)
 return math.sqrt((x-a[1]-t*dx)^2+(y-a[2]-t*dy)^2)
end
local function rgba(r,g,b,a)return app.pixelColor.rgba(math.floor(clamp(r,0,255)),math.floor(clamp(g,0,255)),math.floor(clamp(b,0,255)),math.floor(clamp(a,0,255)))end
local s=Sprite(256,256,ColorMode.RGB)
local body=s.layers[1];body.name='Phantom Upper Body'
local glow=s:newLayer();glow.name='Phantom Glow';glow.stackIndex=1
local arm=s:newLayer();arm.name='Phantom Arm Hand'
local sparks=s:newLayer();sparks.name='Small Cast Sparks'
local sheets={body=Image(1024,768,ColorMode.RGB),arm=Image(1024,768,ColorMode.RGB),glow=Image(1024,768,ColorMode.RGB),sparks=Image(1024,768,ColorMode.RGB),composite=Image(1024,768,ColorMode.RGB)}
local audit={}
for index=0,11 do
 if index>0 then s:newEmptyFrame()end
 s.frames[index+1].duration=durations[index+1]/1000
 local source=Image{fromFile=raw..'/'..string.format('%02d',index)..'.png'}
 -- The brief turn uses the accepted native North/East views of THIS Mage.
 -- The eight visible gesture poses (frames 3..10) remain the generated South rig.
 if index==1 then source=Image{fromFile=root..'/reference/mage-north.png'}end
 if index==2 then source=Image{fromFile=root..'/reference/mage-east.png'}end
 local images={body=Image(256,256,ColorMode.RGB),arm=Image(256,256,ColorMode.RGB),glow=Image(256,256,ColorMode.RGB),sparks=Image(256,256,ColorMode.RGB)}
 local mask={};local strength=density[index+1];local shift=offsets[index+1]
 for y=0,199 do for x=0,255 do
  local p=source:getPixel(x,y)
  -- Preserve the approved head at its original pixel scale; no face re-design or bbox fitting.
  if stabilize and index>=3 and (y<56 or (y<71 and x>=110 and x<=147))then p=reference:getPixel(x,y)end
  local a=app.pixelColor.rgbaA(p)
  if a>0 and strength>0 then
   local edge=136+6*math.sin((x-128)/12)+4*math.cos(x/7)
   local taper=clamp((edge+18-y)/25,0,1)
   taper=math.ceil(taper*4)/4
   local right= y>=80 and y<184 and (distance(x,y,{104,77},elbows[index+1])<14 or distance(x,y,elbows[index+1],palms[index+1])<11 or math.sqrt((x-palms[index+1][1])^2+(y-palms[index+1][2])^2)<11)
   local left= y>=81 and y<153 and (distance(x,y,{154,78},{169,103})<12 or distance(x,y,{169,103},{174,141})<10)
   local isArm=right or left
   local keep=isArm and 1 or taper
   if y>=185 then keep=0 end
   local targetY=y+shift
   local alpha=math.floor(a*strength*keep)
   if alpha>0 and targetY<200 then
    local r,g,b=app.pixelColor.rgbaR(p),app.pixelColor.rgbaG(p),app.pixelColor.rgbaB(p)
    local l=.2126*r+.7152*g+.0722*b
    local mix=.58
    local c=rgba(r*(1-mix)+(l*.58+38)*mix,g*(1-mix)+(l*.68+50)*mix,b*(1-mix)+(l*1.03+85)*mix,alpha)
    local layer=isArm and images.arm or images.body
    layer:drawPixel(x,targetY,c);mask[targetY*256+x]=alpha
   end
  end
 end end
 -- Crisp 1-3px outside contour. No Gaussian blur or opaque duplicate silhouette.
 if strength>0 then for y=0,199 do for x=1,254 do
  if not mask[y*256+x]then local near=4
   for dy=-3,3 do for dx=-3,3 do local xx,yy=x+dx,y+dy;if xx>=0 and xx<256 and yy>=0 and yy<256 and mask[yy*256+xx]then near=math.min(near,math.max(math.abs(dx),math.abs(dy)))end end end
   if near<=3 then local a=math.floor((near==1 and 104 or near==2 and 54 or 24)*strength);images.glow:drawPixel(x,y,rgba(128,155,248,a))end
  end
 end end end
 -- A few returning flecks at the lower edge, never a smoke cloud.
 if index>=8 and index<=10 then local t=(index-8)/3
  for n=0,4 do local fromX=96+n*14;local fromY=142+((n*7)%13);local x=math.floor(fromX+(128-fromX)*t);local y=math.floor(fromY+(76-fromY)*t+shift)
   local c=rgba(171,197,255,math.floor(125*(1-t)))
   images.sparks:drawPixel(x,y,c);images.sparks:drawPixel(x+1,y,c);if n%2==0 then images.sparks:drawPixel(x,y-1,c)end
  end
 end
 -- Separate warm palm flash: exactly the two release frames, no baked projectile.
 if index==6 or index==7 then local p=palms[index+1];local x,y=p[1],p[2]+shift
  for d=-5,5 do local a=230-math.abs(d)*26;images.sparks:drawPixel(x+d,y,rgba(255,199,109,a));images.sparks:drawPixel(x,y+d,rgba(255,219,155,a))end
  for d=-2,2 do images.sparks:drawPixel(x+d,y+d,rgba(255,236,190,180))end
  images.sparks:drawPixel(x,y,rgba(255,251,225,255))
 end
 for name,layer in pairs({body=body,arm=arm,glow=glow,sparks=sparks})do
  s:newCel(layer,index+1,images[name],Point(0,0));sheets[name]:drawImage(images[name],Point(index%4*256,math.floor(index/4)*256))
 end
 local composite=Image(256,256,ColorMode.RGB)
 for _,name in ipairs({'glow','body','arm','sparks'})do composite:drawImage(images[name],Point(0,0))end
 composite:saveAs(root..'/processed/frame-'..string.format('%02d',index)..'.png')
 sheets.composite:drawImage(composite,Point(index%4*256,math.floor(index/4)*256))
 audit[#audit+1]={frame=index,durationMs=durations[index+1],density=strength,projectionShiftNative={0,shift},palmNative={palms[index+1][1],palms[index+1][2]+shift}}
end
for name,image in pairs(sheets)do image:saveAs(root..(name=='composite'and '/phantom-cast.png'or '/layers/'..name..'.png'))end
local tag=s:newTag(1,12);tag.name='Arcane Phantom Cast South';tag.aniDir=AniDir.FORWARD
local slice=s:newSlice(Rectangle(0,0,256,256));slice.name='shoulder-anchor';slice.pivot=Point(128,64)
s:saveAs(root..'/phantom-cast.aseprite')
s:saveAs(root..'/phantom-cast.gif')
return {frames=12,width=256,height=256,durationMs=340,loop=false,layers={'Phantom Glow','Phantom Upper Body','Phantom Arm Hand','Small Cast Sparks'},headStabilizedFromApprovedReference=stabilize,processed=audit}
