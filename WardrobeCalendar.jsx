import React from 'react';
import {CalendarDays, History, ArrowUpRight, Wallet, Bookmark} from 'lucide-react';
import './wardrobe-calendar.css';

const outfits={
  3:[0,1],5:[3,1],6:[0,2],8:[3,2],11:[0,1],13:[3,1],15:[3,2],16:[0,2],18:[0,1],20:[0,2],21:[3,1],22:[3,2],24:[0,1],26:[3,2],28:[0,2],30:[3,1],
};
const pieces=['wardrobe-slate-overshirt.jpg','wardrobe-sand-trousers.jpg','wardrobe-brown-loafers.jpg','wardrobe-indigo-blouse.jpg'];
export default function WardrobeCalendar(){
  return <div className="wardrobe-calendar-feature cs-wrap">
    <div className="wardrobe-calendar-copy">
      <span className="wardrobe-calendar-eyebrow"><CalendarDays size={15}/> THE OUTFIT CALENDAR</span>
      <h3>Your wardrobe,<br/><span>day by day.</span></h3>
      <p>Your worn looks, future fits, and saved pieces to buy—all with a monthly budget in view.</p>
      <ul><li><History size={19}/><div><h4>Remember what you wore</h4><p>Look back at each day’s outfit and rediscover your favourites.</p></div></li><li><CalendarDays size={19}/><div><h4>Plan future fits & purchases</h4><p>Add upcoming outfits and the saved pieces you want to buy to your calendar.</p></div></li><li><Wallet size={19}/><div><h4>Make room in your monthly budget</h4><p>See how planned purchases add up, then use price insights to decide what to buy and when.</p></div></li></ul>
      <span className="wardrobe-calendar-status">Planned wardrobe feature</span>
    </div>
    <figure className="wardrobe-calendar-preview" aria-labelledby="wardrobe-calendar-caption">
      <div className="wardrobe-calendar-top"><div><span>YOUR OUTFIT CALENDAR</span><strong>October <span>2026</span></strong></div><span className="wardrobe-calendar-preview-tag">Preview</span></div>
      <div className="wardrobe-calendar-week" aria-hidden="true">{['S','M','T','W','T','F','S'].map((day,i)=><span key={i}>{day}</span>)}</div>
      <div className="wardrobe-calendar-grid" aria-hidden="true">
        {Array.from({length:35},(_,index)=>{const day=index-3,look=outfits[day],planned=day>23;return <div key={index} className={`wardrobe-calendar-day ${day<1?'is-empty':''} ${planned?'is-planned':''} ${day===23?'is-today':''} ${[26,30].includes(day)?'is-shopping':''}`}>
          {day>0&&<><span className="wardrobe-calendar-date">{day}</span>{look&&<><div className="wardrobe-calendar-outfit">{look.map(piece=><img key={piece} src={`/images/${pieces[piece]}`} alt="" loading="lazy"/>)}</div><span className="wardrobe-calendar-dot"/></>}</>}
        </div>;})}
      </div>
      <figcaption id="wardrobe-calendar-caption"><span><i/> Worn</span><span><i/> Planned</span><span className="calendar-buy-legend"><i/> To buy</span><small>Illustrative plans</small></figcaption>
      <div className="wardrobe-budget-preview"><div><span>MONTHLY SHOPPING PLAN</span><strong>₹6,500 <small>of ₹10,000</small></strong></div><span>₹3,500 left</span><div className="wardrobe-budget-bar"><i/></div><p><Bookmark size={11}/> 3 saved pieces to buy <span>Example budget</span></p></div>
      <div className="wardrobe-calendar-next"><img src="/images/wardrobe-slate-overshirt.jpg" alt="" loading="lazy"/><div><span>UP NEXT · SAT, 24 OCT</span><strong>A relaxed weekend look</strong></div><ArrowUpRight size={17}/></div>
    </figure>
  </div>;
}
