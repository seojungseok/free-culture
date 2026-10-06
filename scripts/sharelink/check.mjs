import {withClient} from './client.mjs';
try{await withClient(async({request})=>{const health=await request('/health');if(health?.status!=='ok')throw new Error('Health not ok');console.log('SHARELINK_AUTH_IP_OK');});}catch(error){console.error(error.message);process.exitCode=1;}
