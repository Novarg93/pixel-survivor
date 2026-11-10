// Coordinates in the accepted 128px RD source, placed at (32,32) on 192px.
export const RIG={
 canvas:192,offset:[32,32],pivot:[96,154],worldScale:72.68625/111,
 gripPivot:[62,59],handMarkers:[[56,61],[67,54]],bladeRoot:[51,72],bladeTip:[5,121],
 weapon:[[40,61],[50,60],[55,53],[65,50],[78,53],[77,60],[66,65],[60,72],[59,80],[19,122],[5,124],[2,122],[5,113],[18,96],[38,77],[41,72],[37,67]],
 arms:{
  left:{mask:[[31,47],[37,44],[45,48],[55,53],[54,63],[47,66],[39,61],[33,56]],shoulder:[36,47],elbow:[37,57],wrist:[50,59],bend:1},
  right:{mask:[[84,47],[91,46],[94,51],[90,57],[82,62],[72,59],[73,53]],shoulder:[87,46],elbow:[90,53],wrist:[76,54],bend:-1},
 },
 // Blade moves only through the lower/front half-plane; angles are relative to idle.
 poses:[
  {angle:0,grip:[62,59],bodyX:0,bodyY:0,durationMs:80,phase:'stance'},
  {angle:6,grip:[61,59],bodyX:-1,bodyY:0,durationMs:70,phase:'windup'},
  {angle:-22,grip:[61,59],bodyX:-1,bodyY:1,durationMs:70,phase:'swing-start'},
  {angle:-56,grip:[62,58],bodyX:0,bodyY:1,durationMs:60,phase:'swing'},
  {angle:-94,grip:[61,56],bodyX:1,bodyY:0,durationMs:90,phase:'hit'},
  {angle:-60,grip:[62,58],bodyX:1,bodyY:0,durationMs:80,phase:'return-1'},
  {angle:-20,grip:[62,59],bodyX:0,bodyY:0,durationMs:90,phase:'return-2'},
  {angle:0,grip:[62,59],bodyX:0,bodyY:0,durationMs:110,phase:'stance'},
 ],
};
