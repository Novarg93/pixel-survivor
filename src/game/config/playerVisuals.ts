// Approved PixelLab Blink/Shield are enabled; archived primitive geometry stays hidden.
// Ability mechanics, cooldowns and HUD are independent of these switches.
export const PLAYER_VISUALS={arcaneBlink:true,legacyArcaneBlink:false,arcaneShield:true,legacyArcaneShield:false} as const;

// Adapt to large displays without swallowing the user's larger-size preset.
// Integer zoom keeps the desktop pixel grid crisp at FHD, QHD and UHD.
export function playerCameraZoom(width:number,height:number,pixelScale:number){
 return Math.max(2,Math.ceil(width/960),Math.ceil(height/640))+pixelScale-2;
}
