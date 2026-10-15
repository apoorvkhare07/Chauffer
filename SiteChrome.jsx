import React from 'react';
import { MessageCircle } from 'lucide-react';
import Brand from './Brand.jsx';
export function SiteHeader() {
 return <header className="cs-nav cs-wrap"><Brand/><nav aria-label="Main navigation"><a href="/#shop-by-occasion">How it works</a><a href="/roadmap/">What’s next</a><a href="/faq/">Questions</a></nav><a className="cs-button cs-button-small" data-analytics="open_shopping_assistant" href="/app/">Chat to shop <MessageCircle size={16}/></a></header>;
}
export function SiteFooter() {
 return <footer className="cs-footer cs-wrap"><Brand/><span>Your AI partner for fashion, shopping and styling.</span><div><a data-analytics="open_shopping_assistant" href="/app/">Shopping assistant</a><a href="/roadmap/">Available & coming soon</a><a href="/faq/">FAQs</a><a href="/demo/">Sample demo</a></div></footer>;
}
