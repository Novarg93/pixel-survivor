local root=app.params["root"]
do
local s=Sprite(128,128,ColorMode.RGB)
s.layers[1].name="flight"

s:newCel(s.layers[1],s.frames[1],Image{fromFile=root.."/prepared/flight/00.png"},Point(0,0))
s.frames[1].duration=0.05
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[2],Image{fromFile=root.."/prepared/flight/01.png"},Point(0,0))
s.frames[2].duration=0.05
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[3],Image{fromFile=root.."/prepared/flight/02.png"},Point(0,0))
s.frames[3].duration=0.05
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[4],Image{fromFile=root.."/prepared/flight/03.png"},Point(0,0))
s.frames[4].duration=0.05
s:saveAs(root.."/source/flight.aseprite")
s:saveAs(root.."/source/flight.gif")
s:close()
end
do
local s=Sprite(128,128,ColorMode.RGB)
s.layers[1].name="illumination"

s:newCel(s.layers[1],s.frames[1],Image{fromFile=root.."/prepared/illumination/00.png"},Point(0,0))
s.frames[1].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[2],Image{fromFile=root.."/prepared/illumination/01.png"},Point(0,0))
s.frames[2].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[3],Image{fromFile=root.."/prepared/illumination/02.png"},Point(0,0))
s.frames[3].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[4],Image{fromFile=root.."/prepared/illumination/03.png"},Point(0,0))
s.frames[4].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[5],Image{fromFile=root.."/prepared/illumination/04.png"},Point(0,0))
s.frames[5].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[6],Image{fromFile=root.."/prepared/illumination/05.png"},Point(0,0))
s.frames[6].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[7],Image{fromFile=root.."/prepared/illumination/06.png"},Point(0,0))
s.frames[7].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[8],Image{fromFile=root.."/prepared/illumination/07.png"},Point(0,0))
s.frames[8].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[9],Image{fromFile=root.."/prepared/illumination/08.png"},Point(0,0))
s.frames[9].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[10],Image{fromFile=root.."/prepared/illumination/09.png"},Point(0,0))
s.frames[10].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[11],Image{fromFile=root.."/prepared/illumination/10.png"},Point(0,0))
s.frames[11].duration=0.04
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[12],Image{fromFile=root.."/prepared/illumination/11.png"},Point(0,0))
s.frames[12].duration=0.04
s:saveAs(root.."/source/illumination.aseprite")
local bg=s:newLayer()
bg.name="Grove preview only"
bg.stackIndex=1
local image=Image(128,128,ColorMode.RGB)
image:clear(app.pixelColor.rgba(58,74,59,255))
for n=1,12 do s:newCel(bg,s.frames[n],image,Point(0,0)) end
s:saveAs(root.."/source/illumination-grove-preview.gif")
s:close()
end
do
local s=Sprite(128,128,ColorMode.RGB)
s.layers[1].name="impact"

s:newCel(s.layers[1],s.frames[1],Image{fromFile=root.."/prepared/impact/00.png"},Point(0,0))
s.frames[1].duration=0.06
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[2],Image{fromFile=root.."/prepared/impact/01.png"},Point(0,0))
s.frames[2].duration=0.06
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[3],Image{fromFile=root.."/prepared/impact/02.png"},Point(0,0))
s.frames[3].duration=0.06
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[4],Image{fromFile=root.."/prepared/impact/03.png"},Point(0,0))
s.frames[4].duration=0.06
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[5],Image{fromFile=root.."/prepared/impact/04.png"},Point(0,0))
s.frames[5].duration=0.06
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[6],Image{fromFile=root.."/prepared/impact/05.png"},Point(0,0))
s.frames[6].duration=0.06
s:saveAs(root.."/source/impact.aseprite")
s:saveAs(root.."/source/impact.gif")
s:close()
end
do
local s=Sprite(128,128,ColorMode.RGB)
s.layers[1].name="ground"

s:newCel(s.layers[1],s.frames[1],Image{fromFile=root.."/prepared/ground/00.png"},Point(0,0))
s.frames[1].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[2],Image{fromFile=root.."/prepared/ground/01.png"},Point(0,0))
s.frames[2].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[3],Image{fromFile=root.."/prepared/ground/02.png"},Point(0,0))
s.frames[3].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[4],Image{fromFile=root.."/prepared/ground/03.png"},Point(0,0))
s.frames[4].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[5],Image{fromFile=root.."/prepared/ground/04.png"},Point(0,0))
s.frames[5].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[6],Image{fromFile=root.."/prepared/ground/05.png"},Point(0,0))
s.frames[6].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[7],Image{fromFile=root.."/prepared/ground/06.png"},Point(0,0))
s.frames[7].duration=0.1
s:newEmptyFrame()
s:newCel(s.layers[1],s.frames[8],Image{fromFile=root.."/prepared/ground/07.png"},Point(0,0))
s.frames[8].duration=0.1
s:saveAs(root.."/source/ground.aseprite")
s:saveAs(root.."/source/ground.gif")
s:close()
end
