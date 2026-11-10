// Builds an exact MCP request body; importing/running this file NEVER submits a paid job.
import {readFileSync} from 'node:fs';
export function requestBody(direction){
 if(!['south','north'].includes(direction))throw Error('Only the two authorized directions');
 const root='art/generated/ash-warden-walk-rd-v2/',request=JSON.parse(readFileSync(root+'mcp/'+direction+'-request.json','utf8'));
 return {...request,input_image:readFileSync(root+'inputs/'+direction+'.png').toString('base64')};
}
