-- Authored pixel/pose pilot. Execute THIS file through aseprite-mcp run_lua backend=live.
-- No inference, global image fitting, asset replacement, preferences, or document closing.
local root=assert(args.root)
local size=192
local pc=app.pixelColor
local function blank() return Image(size,size,ColorMode.RGB) end
local function rgba(r,g,b) return pc.rgba(r,g,b,255) end
local sources={}
for _,key in ipairs({'upper','pelvis','left','right'}) do sources[key]=Image{fromFile=root..'/source/'..key..'.png'} end
local dark=rgba(28,24,26)
local shade=rgba(47,40,41)
local edge=rgba(69,59,56)
local function sample(im,x,y)
 x=math.floor(x+0.5);y=math.floor(y+0.5)
 if x<0 or y<0 or x>=im.width or y>=im.height then return 0 end
 return im:getPixel(x,y)
end
local function dot(a,b) return a[1]*b[1]+a[2]*b[2] end
local function sub(a,b) return {a[1]-b[1],a[2]-b[2]} end
local function length(a) return math.sqrt(dot(a,a)) end
local function disc(im,p,r,color)
 for y=math.floor(p[2]-r),math.ceil(p[2]+r) do for x=math.floor(p[1]-r),math.ceil(p[1]+r) do
  if x>=0 and y>=0 and x<size and y<size and (x-p[1])^2+(y-p[2])^2<=r*r then im:drawPixel(x,y,color) end
 end end
end
local function backing(im,a,b,wa,wb)
 local v=sub(b,a);local d=dot(v,v)
 for y=math.floor(math.min(a[2],b[2])-wa-2),math.ceil(math.max(a[2],b[2])+wa+2) do
  for x=math.floor(math.min(a[1],b[1])-wa-2),math.ceil(math.max(a[1],b[1])+wa+2) do
   local t=math.max(0,math.min(1,((x-a[1])*v[1]+(y-a[2])*v[2])/d))
   local cx=a[1]+v[1]*t;local cy=a[2]+v[2]*t
   local w=wa+(wb-wa)*t
   if x>=0 and y>=0 and x<size and y<size and (x-cx)^2+(y-cy)^2<=w*w then
    -- Restored hidden armor: dark silhouette, narrow lit upper-left edge.
    im:drawPixel(x,y,(x<cx-w*.45 and y<cy+1) and edge or ((x-cx)^2+(y-cy)^2>(w-1)^2 and dark or shade))
   end
  end
 end
end
local function bonePatch(dst,src,box,sa,sb,ta,tb)
 local sv=sub(sb,sa);local sl=length(sv);local sn={-sv[2]/sl,sv[1]/sl}
 local tv=sub(tb,ta);local tl=length(tv);local tn={-tv[2]/tl,tv[1]/tl}
 for y=95,165 do for x=42,158 do
  local dv={x-ta[1],y-ta[2]}
  local t=dot(dv,tv)/(tl*tl);local u=dot(dv,tn)
  local sx=sa[1]+t*sv[1]+u*sn[1];local sy=sa[2]+t*sv[2]+u*sn[2]
  if sx>=box[1] and sy>=box[2] and sx<box[3] and sy<box[4] then
   local color=sample(src,sx,sy)
   if pc.rgbaA(color)>0 then dst:drawPixel(x,y,color) end
  end
 end end
end
local function rigid(dst,src,pivot,target,angle,box)
 local co=math.cos(angle);local si=math.sin(angle)
 for y=0,size-1 do for x=0,size-1 do
  local xx=x-target[1];local yy=y-target[2]
  local sx=co*xx+si*yy+pivot[1];local sy=-si*xx+co*yy+pivot[2]
  if not box or (sx>=box[1] and sy>=box[2] and sx<box[3] and sy<box[4]) then
   local color=sample(src,sx,sy)
   if pc.rgbaA(color)>0 then dst:drawPixel(x,y,color) end
  end
 end end
end
local function kneeFor(hip,ankle,l1,l2)
 local v=sub(ankle,hip);local d=length(v)
 assert(d<l1+l2,'Pose exceeds fixed leg reach: '..tostring(d)..' / '..tostring(l1+l2))
 local a=(l1*l1-l2*l2+d*d)/(2*d);local h=math.sqrt(math.max(0,l1*l1-a*a))
 return {hip[1]+v[1]*a/d+v[2]*h/d,hip[2]+v[2]*a/d-v[1]*h/d}
end
local geometry={
 left={hip={89,112},sole={81,153},ankle={79,145},knee={81,132},thighBox={70,112,97,133},shinBox={69,132,96,146},bootBox={68,145,93,155},l1=23,l2=20},
 right={hip={110,114},sole={126,149},ankle={123,139},knee={117,133},thighBox={105,114,132,135},shinBox={105,133,136,141},bootBox={111,138,143,151},l1=22,l2=18}
}
local function leg(name,pose)
 local g=geometry[name];local dst=blank();local hip=pose.hip;local sole=pose.sole
 local ankle={sole[1]+g.ankle[1]-g.sole[1],sole[2]+g.ankle[2]-g.sole[2]}
 local knee=kneeFor(hip,ankle,g.l1,g.l2)
 backing(dst,hip,knee,5.5,6)
 backing(dst,knee,ankle,5,3)
 disc(dst,knee,5,dark)
 bonePatch(dst,sources[name],g.thighBox,g.hip,g.knee,hip,knee)
 bonePatch(dst,sources[name],g.shinBox,g.knee,g.ankle,knee,ankle)
 -- Small knee seam, two authored pixels bridge the occluded armor plate.
 local kx=math.floor(knee[1]+.5);local ky=math.floor(knee[2]+.5)
 dst:drawPixel(kx-2,ky-2,edge);dst:drawPixel(kx-1,ky-2,shade)
 rigid(dst,sources[name],g.sole,sole,pose.roll,g.bootBox)
 pose.knee=knee;pose.ankle=ankle;pose.lengths={g.l1,g.l2}
 return dst
end
local function layer(spr,name) local l=spr:newLayer();l.name=name;return l end
local function put(spr,l,f,im) local c=l:cel(f);if c then c.image=im;c.position=Point(0,0);return c end;return spr:newCel(l,f,im,Point(0,0)) end
local original={}
for f=1,8 do original[f]=Image{fromFile=root..'/source/frames/'..string.format('%02d',f-1)..'.png'} end
local outputs={}
local phaseNamesWalk={'left contact / right toe-off','left load / right recovery','left support / right passing','left push / right reach','right contact / left toe-off','right load / left recovery','right support / left passing','right push / left reach'}
local phaseNamesRun={'left impact','left compression','left drive','left toe-off','left heel recovery','short suspension / right reach','right impact','right compression','right drive','right toe-off','right heel recovery','short suspension / left reach'}
for _,kind in ipairs({'source','walk','run'}) do
 local n=kind=='run' and 12 or 8
 local spr
 if args.reuse then for _,s in ipairs(app.sprites) do if s.id==args.reuse[kind] then spr=s end end end
 local ref,right,left,pelvis,upper
 if spr then
  assert(spr.filename:find('ash%-warden%-run%-aseprite%-pilot%-01'),'Refusing a non-pilot document')
  -- Preserve the entire prior pilot, including any dirty state, before a revision.
  local backup=root..'/analysis/pre-revision-'..kind..'.aseprite'
  if not app.fs.isFile(backup) then spr:saveCopyAs(backup) end
  ref=spr.layers[1];right=spr.layers[2];left=spr.layers[3];pelvis=spr.layers[4];upper=spr.layers[5]
 else
  spr=Sprite(size,size,ColorMode.RGB);spr.layers[1].name='Reference'
  ref=spr.layers[1];right=layer(spr,'Right Leg');left=layer(spr,'Left Leg');pelvis=layer(spr,'Pelvis');upper=layer(spr,'Upper Body')
 end
 local poses={}
 local bodyX=kind=='run' and {0,1,1,0,-1,-1,0,-1,-1,0,1,1} or {-1,-1,0,1,1,1,0,-1}
 local bodyY=kind=='run' and {1,3,1,-1,-3,-1,1,3,1,-1,-3,-1} or {0,2,1,-1,0,2,1,-1}
 local pelvisX=kind=='run' and {1,0,-1,-1,0,1,-1,-2,-1,0,1,2} or {-2,-1,1,2,2,1,-1,-2}
 local feetX=kind=='run' and {24,8,-8,-24,-26,-24,-16,-2,16,28,28,27} or {16,8,0,-8,-16,-14,-2,12}
 local lift=kind=='run' and {0,0,0,0,5,9,10,10,7,4,2,1} or {0,0,0,0,0,4,7,3}
 app.transaction('East '..kind..' pilot: authored pelvis, thigh, knee and foot',function()
  for f=1,n do
   if #spr.frames<f then spr:newEmptyFrame() end
   spr.frames[f].duration=(kind=='source' and 64 or kind=='walk' and 80 or 50)/1000
   local originalIndex=math.floor((f-1)*8/n)+1
   local rc=ref:cel(f)
   if rc then rc.image=original[originalIndex]:clone() else put(spr,ref,f,original[originalIndex]:clone()) end
   if kind~='source' then
    local bx,by=bodyX[f],bodyY[f]
    local px=pelvisX[f];local py=by+((f-1)%(n/2)==1 and 1 or 0)
    local pose={frame=f,phase=(kind=='run' and phaseNamesRun or phaseNamesWalk)[f],durationMs=kind=='walk' and 80 or 50,upper={bx,by},pelvis={px,py},legs={}}
    for _,name in ipairs({'left','right'}) do
     local phase=(f-1+(name=='right' and n/2 or 0))%n+1
     local g=geometry[name]
     local center=kind=='run' and g.hip[1] or (name=='left' and 84 or 122)
     local tilt=name=='left' and -.5 or .5
     local p={phase=phase,hip={g.hip[1]+px,g.hip[2]+py+tilt*px},sole={center+feetX[phase],g.sole[2]-lift[phase]},support=kind=='run' and phase<=4 or kind=='walk' and phase<=5,roll=0}
     if kind=='run' then p.roll=phase==4 and -.12 or phase==5 and -.22 or phase==6 and -.18 or phase>=10 and .08 or 0
     else p.roll=phase==5 and -.08 or phase==6 and -.15 or phase==8 and .06 or 0 end
     put(spr,name=='left' and left or right,f,leg(name,p));pose.legs[name]=p
    end
    local pi=blank();rigid(pi,sources.pelvis,{101,110},{101+px,110+py},px*.008)
    put(spr,pelvis,f,pi)
    local ui=blank();rigid(ui,sources.upper,{0,0},{bx,by},0)
    put(spr,upper,f,ui)
    poses[f]=pose
   end
  end
 end)
 ref.isVisible=kind=='source';ref.isEditable=false
 local tag=spr.tags[1] or spr:newTag(1,n);tag.name=kind=='source' and 'Original East Walk' or kind=='walk' and 'Polished East Walk' or 'East Heavy Run'
 spr.data='East-only Aseprite MCP Live pilot; canvas192; pivot96,154; worldScale0.6548310811; manual review pending'
 -- An explicit lossless palette prevents RGB-to-GIF export from using the default palette.
 local used={};local colors={}
 for _,l in ipairs(spr.layers) do if l.isVisible then for _,cel in ipairs(l.cels) do for p in cel.image:pixels() do local v=p();if pc.rgbaA(v)>0 then used[v]=true end end end end end
 for v in pairs(used) do colors[#colors+1]=v end;table.sort(colors)
 assert(#colors<256,'Lossless GIF palette budget exceeded')
 local palette=Palette(#colors+1);palette:setColor(0,Color{r=0,g=0,b=0,a=0})
 for i,v in ipairs(colors) do palette:setColor(i,Color{r=pc.rgbaR(v),g=pc.rgbaG(v),b=pc.rgbaB(v),a=255}) end
 spr:setPalette(palette)
 app.sprite=spr;app.frame=1;app.editor.zoom=4;app.editor.scroll={x=100,y=107}
 local file=root..'/'..(kind=='source' and 'source/east-walk-source.aseprite' or kind..'/east-'..kind..'.aseprite')
 spr:saveAs(file)
 outputs[kind]={id=spr.id,file=file,frames=n,poses=poses}
end
app.refresh()
return {backend='live',ui=app.isUIAvailable,outputs=outputs}
