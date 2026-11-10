local root=app.params["root"]
do
local s=Sprite(128,128,ColorMode.RGB)
s.layers[1].name="code-spawn"

s:newCel(s.layers[1],s.frames[1],Image{fromFile=root.."/code/spawn/00.png"},Point(0,0))
s.frames[1].duration=0.07
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[2],Image{fromFile=root.."/code/spawn/01.png"},Point(0,0))
s.frames[2].duration=0.07
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[3],Image{fromFile=root.."/code/spawn/02.png"},Point(0,0))
s.frames[3].duration=0.07
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[4],Image{fromFile=root.."/code/spawn/03.png"},Point(0,0))
s.frames[4].duration=0.07
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[5],Image{fromFile=root.."/code/spawn/04.png"},Point(0,0))
s.frames[5].duration=0.08
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[6],Image{fromFile=root.."/code/spawn/05.png"},Point(0,0))
s.frames[6].duration=0.08
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[7],Image{fromFile=root.."/code/spawn/06.png"},Point(0,0))
s.frames[7].duration=0.08
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[8],Image{fromFile=root.."/code/spawn/07.png"},Point(0,0))
s.frames[8].duration=0.08
s:saveAs(root.."/prepared/code-spawn.aseprite")
local elapsed, previous=0,0
for _,f in ipairs(s.frames) do elapsed=elapsed+f.duration*1000;local stop=math.floor(elapsed/10+0.5)*10;f.duration=(stop-previous)/1000;previous=stop end
s:saveAs(root.."/prepared/code-spawn.gif")
s:close()
end
do
local s=Sprite(128,128,ColorMode.RGB)
s.layers[1].name="code-idle"

s:newCel(s.layers[1],s.frames[1],Image{fromFile=root.."/code/idle/00.png"},Point(0,0))
s.frames[1].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[2],Image{fromFile=root.."/code/idle/01.png"},Point(0,0))
s.frames[2].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[3],Image{fromFile=root.."/code/idle/02.png"},Point(0,0))
s.frames[3].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[4],Image{fromFile=root.."/code/idle/03.png"},Point(0,0))
s.frames[4].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[5],Image{fromFile=root.."/code/idle/04.png"},Point(0,0))
s.frames[5].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[6],Image{fromFile=root.."/code/idle/05.png"},Point(0,0))
s.frames[6].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[7],Image{fromFile=root.."/code/idle/06.png"},Point(0,0))
s.frames[7].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[8],Image{fromFile=root.."/code/idle/07.png"},Point(0,0))
s.frames[8].duration=0.1
s:saveAs(root.."/prepared/code-idle.aseprite")
local elapsed, previous=0,0
for _,f in ipairs(s.frames) do elapsed=elapsed+f.duration*1000;local stop=math.floor(elapsed/10+0.5)*10;f.duration=(stop-previous)/1000;previous=stop end
s:saveAs(root.."/prepared/code-idle.gif")
s:close()
end
do
local s=Sprite(128,128,ColorMode.RGB)
s.layers[1].name="code-vanish"

s:newCel(s.layers[1],s.frames[1],Image{fromFile=root.."/code/vanish/00.png"},Point(0,0))
s.frames[1].duration=0.06
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[2],Image{fromFile=root.."/code/vanish/01.png"},Point(0,0))
s.frames[2].duration=0.06
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[3],Image{fromFile=root.."/code/vanish/02.png"},Point(0,0))
s.frames[3].duration=0.06
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[4],Image{fromFile=root.."/code/vanish/03.png"},Point(0,0))
s.frames[4].duration=0.07
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[5],Image{fromFile=root.."/code/vanish/04.png"},Point(0,0))
s.frames[5].duration=0.07
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[6],Image{fromFile=root.."/code/vanish/05.png"},Point(0,0))
s.frames[6].duration=0.07
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[7],Image{fromFile=root.."/code/vanish/06.png"},Point(0,0))
s.frames[7].duration=0.07
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[8],Image{fromFile=root.."/code/vanish/07.png"},Point(0,0))
s.frames[8].duration=0.07
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[9],Image{fromFile=root.."/code/vanish/08.png"},Point(0,0))
s.frames[9].duration=0.07
s:saveAs(root.."/prepared/code-vanish.aseprite")
local elapsed, previous=0,0
for _,f in ipairs(s.frames) do elapsed=elapsed+f.duration*1000;local stop=math.floor(elapsed/10+0.5)*10;f.duration=(stop-previous)/1000;previous=stop end
s:saveAs(root.."/prepared/code-vanish.gif")
s:close()
end
do
local s=Sprite(128,128,ColorMode.RGB)
s.layers[1].name="ai-spawn"

s:newCel(s.layers[1],s.frames[1],Image{fromFile=root.."/raw/flame-spawn/00.png"},Point(0,0))
s.frames[1].duration=0.06
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[2],Image{fromFile=root.."/raw/flame-spawn/01.png"},Point(0,0))
s.frames[2].duration=0.06
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[3],Image{fromFile=root.."/raw/flame-spawn/02.png"},Point(0,0))
s.frames[3].duration=0.06
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[4],Image{fromFile=root.."/raw/flame-spawn/03.png"},Point(0,0))
s.frames[4].duration=0.07
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[5],Image{fromFile=root.."/raw/flame-spawn/04.png"},Point(0,0))
s.frames[5].duration=0.07
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[6],Image{fromFile=root.."/raw/flame-spawn/05.png"},Point(0,0))
s.frames[6].duration=0.07
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[7],Image{fromFile=root.."/raw/flame-spawn/06.png"},Point(0,0))
s.frames[7].duration=0.07
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[8],Image{fromFile=root.."/raw/flame-spawn/07.png"},Point(0,0))
s.frames[8].duration=0.07
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[9],Image{fromFile=root.."/raw/flame-spawn/08.png"},Point(0,0))
s.frames[9].duration=0.07
s:saveAs(root.."/prepared/ai-spawn.aseprite")
local elapsed, previous=0,0
for _,f in ipairs(s.frames) do elapsed=elapsed+f.duration*1000;local stop=math.floor(elapsed/10+0.5)*10;f.duration=(stop-previous)/1000;previous=stop end
s:saveAs(root.."/prepared/ai-spawn.gif")
s:close()
end
do
local s=Sprite(128,128,ColorMode.RGB)
s.layers[1].name="ai-idle"

s:newCel(s.layers[1],s.frames[1],Image{fromFile=root.."/raw/flame-idle/01.png"},Point(0,0))
s.frames[1].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[2],Image{fromFile=root.."/raw/flame-idle/02.png"},Point(0,0))
s.frames[2].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[3],Image{fromFile=root.."/raw/flame-idle/03.png"},Point(0,0))
s.frames[3].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[4],Image{fromFile=root.."/raw/flame-idle/04.png"},Point(0,0))
s.frames[4].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[5],Image{fromFile=root.."/raw/flame-idle/05.png"},Point(0,0))
s.frames[5].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[6],Image{fromFile=root.."/raw/flame-idle/06.png"},Point(0,0))
s.frames[6].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[7],Image{fromFile=root.."/raw/flame-idle/07.png"},Point(0,0))
s.frames[7].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[8],Image{fromFile=root.."/raw/flame-idle/08.png"},Point(0,0))
s.frames[8].duration=0.1
s:saveAs(root.."/prepared/ai-idle.aseprite")
local elapsed, previous=0,0
for _,f in ipairs(s.frames) do elapsed=elapsed+f.duration*1000;local stop=math.floor(elapsed/10+0.5)*10;f.duration=(stop-previous)/1000;previous=stop end
s:saveAs(root.."/prepared/ai-idle.gif")
s:close()
end
do
local s=Sprite(128,128,ColorMode.RGB)
s.layers[1].name="ai-vanish"

s:newCel(s.layers[1],s.frames[1],Image{fromFile=root.."/raw/flame-vanish/00.png"},Point(0,0))
s.frames[1].duration=0.06
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[2],Image{fromFile=root.."/raw/flame-vanish/01.png"},Point(0,0))
s.frames[2].duration=0.06
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[3],Image{fromFile=root.."/raw/flame-vanish/02.png"},Point(0,0))
s.frames[3].duration=0.06
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[4],Image{fromFile=root.."/raw/flame-vanish/03.png"},Point(0,0))
s.frames[4].duration=0.07
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[5],Image{fromFile=root.."/raw/flame-vanish/04.png"},Point(0,0))
s.frames[5].duration=0.07
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[6],Image{fromFile=root.."/raw/flame-vanish/05.png"},Point(0,0))
s.frames[6].duration=0.07
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[7],Image{fromFile=root.."/raw/flame-vanish/06.png"},Point(0,0))
s.frames[7].duration=0.07
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[8],Image{fromFile=root.."/raw/flame-vanish/07.png"},Point(0,0))
s.frames[8].duration=0.07
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[9],Image{fromFile=root.."/raw/flame-vanish/08.png"},Point(0,0))
s.frames[9].duration=0.07
s:saveAs(root.."/prepared/ai-vanish.aseprite")
local elapsed, previous=0,0
for _,f in ipairs(s.frames) do elapsed=elapsed+f.duration*1000;local stop=math.floor(elapsed/10+0.5)*10;f.duration=(stop-previous)/1000;previous=stop end
s:saveAs(root.."/prepared/ai-vanish.gif")
s:close()
end
do
local s=Sprite(128,128,ColorMode.RGB)
s.layers[1].name="current-spawn"

s:newCel(s.layers[1],s.frames[1],Image{fromFile=root.."/current/spawn/00.png"},Point(0,0))
s.frames[1].duration=0.067
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[2],Image{fromFile=root.."/current/spawn/01.png"},Point(0,0))
s.frames[2].duration=0.066
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[3],Image{fromFile=root.."/current/spawn/02.png"},Point(0,0))
s.frames[3].duration=0.067
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[4],Image{fromFile=root.."/current/spawn/03.png"},Point(0,0))
s.frames[4].duration=0.067
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[5],Image{fromFile=root.."/current/spawn/04.png"},Point(0,0))
s.frames[5].duration=0.066
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[6],Image{fromFile=root.."/current/spawn/05.png"},Point(0,0))
s.frames[6].duration=0.067
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[7],Image{fromFile=root.."/current/spawn/06.png"},Point(0,0))
s.frames[7].duration=0.067
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[8],Image{fromFile=root.."/current/spawn/07.png"},Point(0,0))
s.frames[8].duration=0.066
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[9],Image{fromFile=root.."/current/spawn/08.png"},Point(0,0))
s.frames[9].duration=0.067
s:saveAs(root.."/prepared/current-spawn.aseprite")
local elapsed, previous=0,0
for _,f in ipairs(s.frames) do elapsed=elapsed+f.duration*1000;local stop=math.floor(elapsed/10+0.5)*10;f.duration=(stop-previous)/1000;previous=stop end
s:saveAs(root.."/prepared/current-spawn.gif")
s:close()
end
do
local s=Sprite(128,128,ColorMode.RGB)
s.layers[1].name="current-idle"

s:newCel(s.layers[1],s.frames[1],Image{fromFile=root.."/current/idle/00.png"},Point(0,0))
s.frames[1].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[2],Image{fromFile=root.."/current/idle/01.png"},Point(0,0))
s.frames[2].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[3],Image{fromFile=root.."/current/idle/02.png"},Point(0,0))
s.frames[3].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[4],Image{fromFile=root.."/current/idle/03.png"},Point(0,0))
s.frames[4].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[5],Image{fromFile=root.."/current/idle/04.png"},Point(0,0))
s.frames[5].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[6],Image{fromFile=root.."/current/idle/05.png"},Point(0,0))
s.frames[6].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[7],Image{fromFile=root.."/current/idle/06.png"},Point(0,0))
s.frames[7].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[8],Image{fromFile=root.."/current/idle/07.png"},Point(0,0))
s.frames[8].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[9],Image{fromFile=root.."/current/idle/08.png"},Point(0,0))
s.frames[9].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[10],Image{fromFile=root.."/current/idle/09.png"},Point(0,0))
s.frames[10].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[11],Image{fromFile=root.."/current/idle/10.png"},Point(0,0))
s.frames[11].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[12],Image{fromFile=root.."/current/idle/11.png"},Point(0,0))
s.frames[12].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[13],Image{fromFile=root.."/current/idle/12.png"},Point(0,0))
s.frames[13].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[14],Image{fromFile=root.."/current/idle/13.png"},Point(0,0))
s.frames[14].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[15],Image{fromFile=root.."/current/idle/14.png"},Point(0,0))
s.frames[15].duration=0.15
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[16],Image{fromFile=root.."/current/idle/15.png"},Point(0,0))
s.frames[16].duration=0.15
s:saveAs(root.."/prepared/current-idle.aseprite")
local elapsed, previous=0,0
for _,f in ipairs(s.frames) do elapsed=elapsed+f.duration*1000;local stop=math.floor(elapsed/10+0.5)*10;f.duration=(stop-previous)/1000;previous=stop end
s:saveAs(root.."/prepared/current-idle.gif")
s:close()
end
do
local s=Sprite(128,128,ColorMode.RGB)
s.layers[1].name="current-vanish"

s:newCel(s.layers[1],s.frames[1],Image{fromFile=root.."/current/vanish/00.png"},Point(0,0))
s.frames[1].duration=0.038
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[2],Image{fromFile=root.."/current/vanish/01.png"},Point(0,0))
s.frames[2].duration=0.037
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[3],Image{fromFile=root.."/current/vanish/02.png"},Point(0,0))
s.frames[3].duration=0.038
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[4],Image{fromFile=root.."/current/vanish/03.png"},Point(0,0))
s.frames[4].duration=0.037
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[5],Image{fromFile=root.."/current/vanish/04.png"},Point(0,0))
s.frames[5].duration=0.038
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[6],Image{fromFile=root.."/current/vanish/05.png"},Point(0,0))
s.frames[6].duration=0.037
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[7],Image{fromFile=root.."/current/vanish/06.png"},Point(0,0))
s.frames[7].duration=0.038
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[8],Image{fromFile=root.."/current/vanish/07.png"},Point(0,0))
s.frames[8].duration=0.037
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[9],Image{fromFile=root.."/current/vanish/08.png"},Point(0,0))
s.frames[9].duration=0.038
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[10],Image{fromFile=root.."/current/vanish/09.png"},Point(0,0))
s.frames[10].duration=0.037
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[11],Image{fromFile=root.."/current/vanish/10.png"},Point(0,0))
s.frames[11].duration=0.038
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[12],Image{fromFile=root.."/current/vanish/11.png"},Point(0,0))
s.frames[12].duration=0.037
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[13],Image{fromFile=root.."/current/vanish/12.png"},Point(0,0))
s.frames[13].duration=0.038
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[14],Image{fromFile=root.."/current/vanish/13.png"},Point(0,0))
s.frames[14].duration=0.037
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[15],Image{fromFile=root.."/current/vanish/14.png"},Point(0,0))
s.frames[15].duration=0.038
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[16],Image{fromFile=root.."/current/vanish/15.png"},Point(0,0))
s.frames[16].duration=0.037
s:saveAs(root.."/prepared/current-vanish.aseprite")
local elapsed, previous=0,0
for _,f in ipairs(s.frames) do elapsed=elapsed+f.duration*1000;local stop=math.floor(elapsed/10+0.5)*10;f.duration=(stop-previous)/1000;previous=stop end
s:saveAs(root.."/prepared/current-vanish.gif")
s:close()
end
