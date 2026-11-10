local options=...
local root=options.root
local durations={20,20,20,30,30,30,40,40,30,30,30,20}
local density={0,.20,.39,.54,.61,.65,.65,.60,.46,.28,.13,0}
local shift={0,2,5,8,12,16,19,19,13,8,3,0}
local function clamp(v,a,b)return math.max(a,math.min(b,v))end
local function rgba(r,g,b,a)return app.pixelColor.rgba(math.floor(clamp(r,0,255)),math.floor(clamp(g,0,255)),math.floor(clamp(b,0,255)),math.floor(clamp(a,0,255)))end
local function distance(x,y,a,b)
 local dx,dy=b[1]-a[1],b[2]-a[2];local n=dx*dx+dy*dy
 local t=n>0 and clamp(((x-a[1])*dx+(y-a[2])*dy)/n,0,1)or 0
 return math.sqrt((x-a[1]-t*dx)^2+(y-a[2]-t*dy)^2)
end
local function grade(p,strength)
 local a=app.pixelColor.rgbaA(p);local r,g,b=app.pixelColor.rgbaR(p),app.pixelColor.rgbaG(p),app.pixelColor.rgbaB(p)
 local l=.2126*r+.7152*g+.0722*b
 return rgba(r*.42+(l*.58+38)*.58,g*.42+(l*.68+50)*.58,b*.42+(l*1.03+85)*.58,a*strength)
end
local count=0
for _,info in ipairs(options.directions)do
 local direction=info.direction;local dx,dy=info.vector[1],info.vector[2]
 local reference=Image{fromFile=root..'/reference/'..direction..'.png'}
 local headMin,headMax=256,0
 for y=15,49 do for x=0,255 do if app.pixelColor.rgbaA(reference:getPixel(x,y))>0 then headMin=math.min(headMin,x);headMax=math.max(headMax,x)end end end
 headMin=headMin-4;headMax=headMax+4
 if not info.reuse then
 local s=Sprite(256,256,ColorMode.RGB);s.layers[1].name='Phantom Upper Body'
 local glow=s:newLayer();glow.name='Phantom Glow';glow.stackIndex=1
 local arm=s:newLayer();arm.name='Phantom Arm Hand'
 local sparks=s:newLayer();sparks.name='Small Cast Sparks'
 local body=s.layers[2]
 for index=0,11 do
  if index>0 then s:newEmptyFrame()end;s.frames[index+1].duration=durations[index+1]/1000
  local source=Image{fromFile=root..'/raw/'..direction..'/'..string.format('%02d',index)..'.png'}
  local handRepair=direction=='north'and index==5 and Image{fromFile=root..'/raw/north/06.png'}or nil
  local images={body=Image(256,256,ColorMode.RGB),arm=Image(256,256,ColorMode.RGB),glow=Image(256,256,ColorMode.RGB),sparks=Image(256,256,ColorMode.RGB)}
  local strength=density[index+1];local rig=info.poses[index+1];local sx=math.floor(dx*shift[index+1]+.5);local sy=math.floor(dy*shift[index+1]+.5)
  if direction=='north'then sy=math.floor(dy*shift[index+1]*.4+.5)end
  local mask={}
  for y=0,184 do for x=0,255 do
   local p=source:getPixel(x,y)
   if handRepair and x>148 and y<70 then p=handRepair:getPixel(x,y)end
   -- Keep the accepted hair, face and pauldrons' upper boundary at fixed native size.
   if y<70 and x>=headMin and x<=headMax then p=reference:getPixel(x,y)end
   if app.pixelColor.rgbaA(p)>0 and strength>0 then
    local isArm=false
    if y>=67 then for _,side in ipairs({'right','left'})do local r=rig[side]
     if distance(x,y,r.shoulder,r.elbow)<14 or distance(x,y,r.elbow,r.palm)<12 or distance(x,y,r.palm,r.palm)<12 then isArm=true end
    end end
    local edge=136+6*math.sin((x-128)/12)+4*math.cos(x/7)
    local taper=math.ceil(clamp((edge+18-y)/25,0,1)*4)/4
    local keep=isArm and 1 or taper;local tx,ty=x+sx,y+sy
    if keep>0 and tx>0 and tx<255 and ty>0 and ty<200 then
     local c=grade(p,strength*keep);images[isArm and 'arm'or'body']:drawPixel(tx,ty,c);mask[ty*256+tx]=true
    end
   end
  end end
  if strength>0 then for y=1,199 do for x=1,254 do if not mask[y*256+x]then
   local near=4;for yy=-3,3 do for xx=-3,3 do if mask[(y+yy)*256+x+xx]then near=math.min(near,math.max(math.abs(xx),math.abs(yy)))end end end
   if near<=3 then images.glow:drawPixel(x,y,rgba(128,155,248,(near==1 and 104 or near==2 and 54 or 24)*strength))end
  end end end end
  if index==6 or index==7 then local palm=rig[info.active].palm;local px,py=math.floor(palm[1]+sx),math.floor(palm[2]+sy)
   for n=-3,3 do images.sparks:drawPixel(px+n,py,rgba(199,211,255,180));images.sparks:drawPixel(px,py+n,rgba(158,185,255,160))end
  end
  if index>=8 and index<=10 then for n=0,4 do local t=(index-8)/3;local x=math.floor(96+n*14+(128-96-n*14)*t+sx);local y=math.floor(145+(65-145)*t+sy)
   images.sparks:drawPixel(x,y,rgba(171,197,255,125*(1-t)))
  end end
  s:newCel(body,index+1,images.body,Point(0,0));s:newCel(arm,index+1,images.arm,Point(0,0));s:newCel(glow,index+1,images.glow,Point(0,0));s:newCel(sparks,index+1,images.sparks,Point(0,0))
  local composite=Image(256,256,ColorMode.RGB);composite:drawImage(images.glow);composite:drawImage(images.body);composite:drawImage(images.arm);composite:drawImage(images.sparks)
  composite:saveAs(root..'/processed/'..direction..'/'..string.format('%02d',index)..'.png')
 end
 local tag=s:newTag(1,12);tag.name='Shared Arcane Phantom Cast '..direction
 local slice=s:newSlice(Rectangle(0,0,256,256));slice.name='shoulder-anchor';slice.pivot=Point(128,64)
 s:saveAs(root..'/sources/'..direction..'.aseprite');s:close()
 end
 count=count+1
 -- Existing reference poses only, for direction-dependent manifestation before the generated cast.
 for phase=1,2 do local image=Image(256,256,ColorMode.RGB)
  for y=0,168 do for x=0,255 do local edge=136+6*math.sin((x-128)/12)+4*math.cos(x/7);local keep=math.ceil(clamp((edge+18-y)/25,0,1)*4)/4
   if keep>0 then image:drawPixel(x,y,grade(reference:getPixel(x,y),density[phase+1]*keep))end
  end end
  image:saveAs(root..'/manifestation/'..direction..'-'..phase..'.png')
 end
end
return {directions=count,framesPerDirection=12,durationMs=340,anchor={128,64},layers=4}
