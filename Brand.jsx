import React from 'react';
import { Asterisk } from 'lucide-react';
export default function Brand({ orbit = false }) {
  return <a className={`cs-brand${orbit ? ' cs-brand-orbit' : ''}`} href="/" aria-label="Chauffer home">
    <span className="cs-logo-mark" aria-hidden="true">
      {orbit ? <svg className="cs-bag-morph" viewBox="0 0 44 44" fill="none"><g className="cs-bag-turn"><path className="cs-bag-body" d="M12 16 L9 38 M9 38 L35 38 M35 38 L32 16"/><path className="cs-bag-handle" d="M12 16 H32 M16 16 V12 A6 6 0 0 1 28 12 V16"/><path className="cs-bag-spark" d="M22 23 V33 M17.67 25.5 L26.33 30.5 M17.67 30.5 L26.33 25.5"/></g></svg> : <Asterisk className="cs-logo-star" size={44} strokeWidth={1.8}/>}
    </span>
    <span className="cs-logo-name">chauffer<span className="cs-logo-dot">.</span></span>
  </a>;
}
