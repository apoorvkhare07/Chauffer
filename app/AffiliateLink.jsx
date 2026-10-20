import React from 'react';
import {useQuery} from 'convex/react';
import {productStore} from '../convex/storeConfig';
import {api} from '../convex/_generated/api';
// Regular anchors preserve new tabs, modifier keys, copy-link and keyboard use.
export default function AffiliateLink({reference,source,href,children,...props}){
 const link=useQuery(api.affiliate.link,reference?{reference,source}:'skip');
 const target=link===null?undefined:link?.href??(href&&productStore(href)?href:undefined);
 return <a {...props} aria-disabled={!target||undefined} href={target} target="_blank" rel="noopener noreferrer">{children}</a>;
}
export function AffiliateDisclosure(){
 const status=useQuery(api.affiliate.disclosure,{});
 if(!status?.enabled)return null;
 return <p className="account-note">Some store links may earn Chauffeur a commission.{status.amazon?' As an Amazon Associate, Chauffeur earns from qualifying purchases.':''}</p>;
}
