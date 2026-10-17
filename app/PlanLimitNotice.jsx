import React from 'react';
import {ArrowUpRight} from 'lucide-react';

const copy={
 wardrobe:{title:'You’ve used this month’s wardrobe allowance',body:'Free includes 3 new wardrobe pieces each month.'},
 conversations:{title:'You’ve used this month’s conversation allowance',body:'Your 10 free conversations renew next month.'},
 stylistSessions:{title:'You’ve used this month’s styling allowance',body:'Your 3 free styling sessions renew next month.'},
};
export default function PlanLimitNotice({feature,plan,onDismiss}){
 const text=copy[feature];if(!text)return null;
 const renew=plan?.periodEndsAt?new Date(plan.periodEndsAt).toLocaleDateString('en-IN',{day:'numeric',month:'long'}):'next month';
 return <aside className="plan-limit-banner" role="status"><div><strong>{text.title}</strong><span>{text.body} Allowance renews {renew}, or upgrade for unlimited access.</span></div><a href="/pricing/index.html">See plans <ArrowUpRight size={15}/></a>{onDismiss&&<button type="button" className="chat-chip" onClick={onDismiss}>Close</button>}</aside>;
}
