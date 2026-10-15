import React from 'react';
import BrandIcon from './BrandIcon.jsx';
export default function BrandLogo({ animated = true }) {
  return <a className="cs-brand" href="/" aria-label="Chauffer home"><span className="cs-logo-mark"><BrandIcon animated={animated}/></span><span className="cs-logo-name">chauffer<span className="cs-logo-dot">.</span></span></a>;
}
