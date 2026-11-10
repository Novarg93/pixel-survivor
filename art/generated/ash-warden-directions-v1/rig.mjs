// Direction-specific masks in raw RD rotation coordinates. One fixed translation per base.
export const COMMON={canvas:192,pivot:[96,154],worldScale:72.68625/111,strideSource:56,idleMs:1800,maxPreviewFPS:20,
 foot:[14,7,0,-7,-14,-10,0,12],lift:[0,0,0,0,0,6,10,4],bodyX:[-1,-1,0,1,1,1,0,-1],bodyY:[0,1,0,-1,0,1,0,-1]};
export const RIGS={
 north:{frame:5,translation:[8,-3],legTop:103,split:97,vector:[0,-1],
  cloth:[[[75,88],[109,88],[119,105],[124,139],[117,144],[109,139],[104,147],[97,139],[87,145],[78,138],[74,125],[66,132],[68,116]]],
  weapon:[[110,86],[122,91],[163,114],[158,122],[136,115],[113,104],[109,99]],chest:[[86,61],[108,61],[110,77],[97,83],[85,77]],
  belt:[[75,89],[113,89],[119,111],[73,112]],
  legs:[{name:'left',hip:[77,103],sole:[74,156],ankleOffset:[0,-6],
   parts:[{name:'thigh',pivot:[73,116],box:[60,102,90,126]},{name:'shin',pivot:[71,136],box:[60,126,90,146]},{name:'boot',pivot:[74,156],box:[60,146,90,159]}]},
   {name:'right',hip:[111,103],sole:[115,156],ankleOffset:[0,-6],parts:[{name:'thigh',pivot:[115,114],box:[106,102,133,125]},{name:'shin',pivot:[116,134],box:[106,125,132,145]},{name:'boot',pivot:[115,156],box:[106,145,133,159]}]}]},
 east:{frame:7,translation:[8,-7],legTop:112,split:84,vector:[1,0],
  cloth:[[[77,88],[88,94],[83,111],[80,135],[76,140],[71,136],[64,143],[68,123],[73,108]]],
  weapon:[[115,85],[124,89],[133,95],[137,92],[139,96],[130,103],[153,121],[181,151],[179,159],[166,153],[142,130],[122,112],[120,105],[111,102]],
  chest:[[88,66],[101,67],[103,79],[93,83],[86,77]],belt:[[82,102],[105,102],[110,118],[80,119]],
  legs:[{name:'far',hip:[88,110],sole:[83,151],ankleOffset:[-2,-5],copyNear:true,shade:.84,
   parts:[{name:'thigh',pivot:[92,120],box:[82,112,113,131]},{name:'shin',pivot:[90,138],box:[82,131,111,148]},{name:'boot',pivot:[90,158],box:[77,148,105,163]}]},
   {name:'near',hip:[95,109],sole:[90,158],ankleOffset:[-3,-5],parts:[{name:'thigh',pivot:[92,120],box:[82,112,113,131]},{name:'shin',pivot:[90,138],box:[82,131,111,148]},{name:'boot',pivot:[90,158],box:[77,148,105,163]}]}]},
};
