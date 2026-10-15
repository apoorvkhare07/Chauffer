import React from 'react';
import './brand-icon.css';
export default function BrandIcon({ size = 44, animated = true, className = '' }) {
  return <svg className={`chauffer-icon ${animated?'chauffer-icon-animated':''} ${className}`} width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
    <path className="chauffer-bag" d="M12 16H32L35 38H9L12 16ZM16 16V12A6 6 0 0 1 28 12V16"/>
    <path className="chauffer-spokes" d="M22 22V34M16.804 25L27.196 31M16.804 31L27.196 25"/>
  </svg>;
}
