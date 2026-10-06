import {readTossFeed} from '@/lib/sharelink';
export const dynamic='force-dynamic';
export function GET(){return Response.json(readTossFeed(),{headers:{'Cache-Control':'no-store'}});}
