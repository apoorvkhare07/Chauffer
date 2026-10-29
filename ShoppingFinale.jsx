import React, {useState} from 'react';
import {ArrowRight, Search} from 'lucide-react';
import SearchPromptInput from './SearchPromptInput.jsx';
import {SiteFooter} from './SiteChrome.jsx';
import './shopping-finale.css';

export default function ShoppingFinale({liveLink}) {
  const [text,setText]=useState('');
  return <div className="shopping-finale"><div className="finale-viewport">
    <section className="finale-content" aria-labelledby="finale-title"><div className="finale-copy">
      <h2 id="finale-title">Get the best of<br/><em>your wardrobe.</em></h2>
      <form data-analytics="landing_search" className="fashion-entry-search finale-search" onSubmit={event=>{event.preventDefault();if(text.trim())window.location.href=liveLink(text.trim());}}>
        <Search size={21} aria-hidden="true"/><label className="sr-only" htmlFor="finale-query">What would you like to shop for?</label><SearchPromptInput id="finale-query" value={text} onChange={event=>setText(event.target.value)} maxLength={1000} required/><button aria-label="Find with your shopping assistant" disabled={!text.trim()}><ArrowRight size={22}/></button>
      </form>
    </div></section><SiteFooter/>
  </div></div>;
}
