import {useQuery} from 'convex/react';
import type {FunctionArgs} from 'convex/server';
import {api} from '../../../convex/_generated/api';
import {useBackend} from '../providers/Backend';
import {openProductLink} from '../platform/links';
import {useTask} from '../hooks/useTask';
import {Button,Muted,Notice} from './ui';
export type AffiliateReference=FunctionArgs<typeof api.affiliate.link>;
export function MerchantButton({url,affiliate,label='Open on store'}:{url:string;affiliate?:AffiliateReference;label?:string}){
 const link=useQuery(api.affiliate.link,affiliate??'skip');
 const {config}=useBackend(),task=useTask();
 return <><Button label={label} disabled={link===null} busy={task.busy} onPress={()=>void task.run(()=>openProductLink(link?.href??url,config?.url))}/>
 {link?.affiliate&&<Muted>Some store links may earn Chauffeur a commission.{link.amazon?' As an Amazon Associate, Chauffeur earns from qualifying purchases.':''}</Muted>}
 {!!task.error&&<Notice error>{task.error}</Notice>}</>;
}
