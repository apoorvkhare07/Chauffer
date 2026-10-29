import React,{createContext,useCallback,useContext,useEffect,useRef,useState} from 'react';
import {useQuery} from 'convex/react';
import {api} from '../convex/_generated/api';
import {createAttemptObserver} from './creationAnalytics';

const PreviewAnalytics=createContext(null);
export const usePreviewAnalytics=()=>useContext(PreviewAnalytics);

// Keep scheduled saved-photo attempts observed when the user closes the details
// or moves to another app tab. Subscribe only while this page has pending attempts.
export default function CreationAnalyticsProvider({children}){
 const attempts=useRef(null);if(!attempts.current)attempts.current=createAttemptObserver();
 const [pending,setPending]=useState(0);
 const previews=useQuery(api.tryOn.list,pending?{}:'skip');
 const observe=useCallback((id,attempt)=>{attempts.current.add(id,attempt);setPending(attempts.current.size);},[]);
 useEffect(()=>{if(!previews)return;attempts.current.observe(previews);setPending(attempts.current.size);},[previews,pending]);
 return <PreviewAnalytics.Provider value={observe}>{children}</PreviewAnalytics.Provider>;
}
