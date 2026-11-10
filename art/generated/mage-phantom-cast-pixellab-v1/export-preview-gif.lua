local options=...
local durations={20,20,20,30,30,30,40,40,30,30,30,20}
local s=Sprite(512,512,ColorMode.RGB);s.layers[1].name='North Run and Arcane Phantom Cast Preview'
for i=0,11 do if i>0 then s:newEmptyFrame()end;s.frames[i+1].duration=durations[i+1]/1000
 s:newCel(s.layers[1],i+1,Image{fromFile=options.root..'/comparisons/gif-frames/'..string.format('%02d',i)..'.png'},Point(0,0))
end
s:saveAs(options.root..'/comparisons/combined-preview.aseprite');s:saveAs(options.root..'/phantom-cast.gif')
return {gif='phantom-cast.gif',width=512,height=512,frames=12,durationMs=340,background='Actual Shard Grove; composited to preserve the semi-transparent projection in GIF colour format.'}
