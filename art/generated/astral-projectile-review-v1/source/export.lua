local root=app.params["root"]
do
local s=Sprite(128,128,ColorMode.RGB)
s.layers[1].name="code-flight"

s:newCel(s.layers[1],s.frames[1],Image{fromFile=root.."/code/flight/00.png"},Point(0,0))
s.frames[1].duration=0.08
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[2],Image{fromFile=root.."/code/flight/01.png"},Point(0,0))
s.frames[2].duration=0.08
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[3],Image{fromFile=root.."/code/flight/02.png"},Point(0,0))
s.frames[3].duration=0.08
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[4],Image{fromFile=root.."/code/flight/03.png"},Point(0,0))
s.frames[4].duration=0.08
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[5],Image{fromFile=root.."/code/flight/04.png"},Point(0,0))
s.frames[5].duration=0.08
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[6],Image{fromFile=root.."/code/flight/05.png"},Point(0,0))
s.frames[6].duration=0.08
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[7],Image{fromFile=root.."/code/flight/06.png"},Point(0,0))
s.frames[7].duration=0.08
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[8],Image{fromFile=root.."/code/flight/07.png"},Point(0,0))
s.frames[8].duration=0.08
s:saveAs(root.."/prepared/code-flight.aseprite")
local elapsed, previous=0,0
for _, f in ipairs(s.frames) do elapsed=elapsed+f.duration*1000; local stop=math.floor(elapsed/10+0.5)*10; f.duration=(stop-previous)/1000; previous=stop end
s:saveAs(root.."/prepared/code-flight.gif")
s:close()
end
do
local s=Sprite(128,128,ColorMode.RGB)
s.layers[1].name="code-impact"

s:newCel(s.layers[1],s.frames[1],Image{fromFile=root.."/code/impact/00.png"},Point(0,0))
s.frames[1].duration=0.045
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[2],Image{fromFile=root.."/code/impact/01.png"},Point(0,0))
s.frames[2].duration=0.045
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[3],Image{fromFile=root.."/code/impact/02.png"},Point(0,0))
s.frames[3].duration=0.045
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[4],Image{fromFile=root.."/code/impact/03.png"},Point(0,0))
s.frames[4].duration=0.045
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[5],Image{fromFile=root.."/code/impact/04.png"},Point(0,0))
s.frames[5].duration=0.045
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[6],Image{fromFile=root.."/code/impact/05.png"},Point(0,0))
s.frames[6].duration=0.045
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[7],Image{fromFile=root.."/code/impact/06.png"},Point(0,0))
s.frames[7].duration=0.045
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[8],Image{fromFile=root.."/code/impact/07.png"},Point(0,0))
s.frames[8].duration=0.045
s:saveAs(root.."/prepared/code-impact.aseprite")
local elapsed, previous=0,0
for _, f in ipairs(s.frames) do elapsed=elapsed+f.duration*1000; local stop=math.floor(elapsed/10+0.5)*10; f.duration=(stop-previous)/1000; previous=stop end
s:saveAs(root.."/prepared/code-impact.gif")
s:close()
end
do
local s=Sprite(128,128,ColorMode.RGB)
s.layers[1].name="ai-flight"

s:newCel(s.layers[1],s.frames[1],Image{fromFile=root.."/raw/projectile-flight/01.png"},Point(0,0))
s.frames[1].duration=0.08
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[2],Image{fromFile=root.."/raw/projectile-flight/02.png"},Point(0,0))
s.frames[2].duration=0.08
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[3],Image{fromFile=root.."/raw/projectile-flight/03.png"},Point(0,0))
s.frames[3].duration=0.08
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[4],Image{fromFile=root.."/raw/projectile-flight/04.png"},Point(0,0))
s.frames[4].duration=0.08
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[5],Image{fromFile=root.."/raw/projectile-flight/05.png"},Point(0,0))
s.frames[5].duration=0.08
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[6],Image{fromFile=root.."/raw/projectile-flight/06.png"},Point(0,0))
s.frames[6].duration=0.08
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[7],Image{fromFile=root.."/raw/projectile-flight/07.png"},Point(0,0))
s.frames[7].duration=0.08
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[8],Image{fromFile=root.."/raw/projectile-flight/08.png"},Point(0,0))
s.frames[8].duration=0.08
s:saveAs(root.."/prepared/ai-flight.aseprite")
local elapsed, previous=0,0
for _, f in ipairs(s.frames) do elapsed=elapsed+f.duration*1000; local stop=math.floor(elapsed/10+0.5)*10; f.duration=(stop-previous)/1000; previous=stop end
s:saveAs(root.."/prepared/ai-flight.gif")
s:close()
end
do
local s=Sprite(128,128,ColorMode.RGB)
s.layers[1].name="ai-impact"

s:newCel(s.layers[1],s.frames[1],Image{fromFile=root.."/raw/projectile-impact-soft/00.png"},Point(0,0))
s.frames[1].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[2],Image{fromFile=root.."/raw/projectile-impact-soft/01.png"},Point(0,0))
s.frames[2].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[3],Image{fromFile=root.."/raw/projectile-impact-soft/02.png"},Point(0,0))
s.frames[3].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[4],Image{fromFile=root.."/raw/projectile-impact-soft/03.png"},Point(0,0))
s.frames[4].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[5],Image{fromFile=root.."/raw/projectile-impact-soft/04.png"},Point(0,0))
s.frames[5].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[6],Image{fromFile=root.."/raw/projectile-impact-soft/05.png"},Point(0,0))
s.frames[6].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[7],Image{fromFile=root.."/raw/projectile-impact-soft/06.png"},Point(0,0))
s.frames[7].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[8],Image{fromFile=root.."/raw/projectile-impact-soft/07.png"},Point(0,0))
s.frames[8].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[9],Image{fromFile=root.."/raw/projectile-impact-soft/08.png"},Point(0,0))
s.frames[9].duration=0.04
s:saveAs(root.."/prepared/ai-impact.aseprite")
local elapsed, previous=0,0
for _, f in ipairs(s.frames) do elapsed=elapsed+f.duration*1000; local stop=math.floor(elapsed/10+0.5)*10; f.duration=(stop-previous)/1000; previous=stop end
s:saveAs(root.."/prepared/ai-impact.gif")
s:close()
end
do
local s=Sprite(128,128,ColorMode.RGB)
s.layers[1].name="current-flight"

s:newCel(s.layers[1],s.frames[1],Image{fromFile=root.."/current/flight/00.png"},Point(0,0))
s.frames[1].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[2],Image{fromFile=root.."/current/flight/01.png"},Point(0,0))
s.frames[2].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[3],Image{fromFile=root.."/current/flight/02.png"},Point(0,0))
s.frames[3].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[4],Image{fromFile=root.."/current/flight/03.png"},Point(0,0))
s.frames[4].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[5],Image{fromFile=root.."/current/flight/04.png"},Point(0,0))
s.frames[5].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[6],Image{fromFile=root.."/current/flight/05.png"},Point(0,0))
s.frames[6].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[7],Image{fromFile=root.."/current/flight/06.png"},Point(0,0))
s.frames[7].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[8],Image{fromFile=root.."/current/flight/07.png"},Point(0,0))
s.frames[8].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[9],Image{fromFile=root.."/current/flight/08.png"},Point(0,0))
s.frames[9].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[10],Image{fromFile=root.."/current/flight/09.png"},Point(0,0))
s.frames[10].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[11],Image{fromFile=root.."/current/flight/10.png"},Point(0,0))
s.frames[11].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[12],Image{fromFile=root.."/current/flight/11.png"},Point(0,0))
s.frames[12].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[13],Image{fromFile=root.."/current/flight/12.png"},Point(0,0))
s.frames[13].duration=0.15
s:saveAs(root.."/prepared/current-flight.aseprite")
local elapsed, previous=0,0
for _, f in ipairs(s.frames) do elapsed=elapsed+f.duration*1000; local stop=math.floor(elapsed/10+0.5)*10; f.duration=(stop-previous)/1000; previous=stop end
s:saveAs(root.."/prepared/current-flight.gif")
s:close()
end
do
local s=Sprite(128,128,ColorMode.RGB)
s.layers[1].name="current-impact"

s:newCel(s.layers[1],s.frames[1],Image{fromFile=root.."/current/impact/05.png"},Point(0,0))
s.frames[1].duration=0.12
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[2],Image{fromFile=root.."/current/impact/06.png"},Point(0,0))
s.frames[2].duration=0.12
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[3],Image{fromFile=root.."/current/impact/07.png"},Point(0,0))
s.frames[3].duration=0.12
s:saveAs(root.."/prepared/current-impact.aseprite")
local elapsed, previous=0,0
for _, f in ipairs(s.frames) do elapsed=elapsed+f.duration*1000; local stop=math.floor(elapsed/10+0.5)*10; f.duration=(stop-previous)/1000; previous=stop end
s:saveAs(root.."/prepared/current-impact.gif")
s:close()
end
