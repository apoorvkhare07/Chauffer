import React from 'react';
import {tryOnTargets} from '../shared/tryOnTargets';
export default function TryOnTargetField({value,onChange,disabled=false}){
 return <label className="account-field studio-target">Change only<select value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}>{tryOnTargets.map(([id,label])=><option key={id} value={id}>{id==='auto'?'Auto-detect':label}</option>)}</select></label>;
}
