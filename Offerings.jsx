import React, { useState, useEffect, useRef } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Asterisk,
  MessageCircle,
  Mic,
  Brain,
  Fingerprint,
  Tags,
  PackageCheck,
  Check,
  CheckCheck,
  Volume2,
  Bell,
  Truck,
  ShieldCheck,
  SlidersHorizontal,
  ShoppingBag,
  CalendarDays,
  CircleCheck,
  Heart,
  LockKeyhole,
} from "lucide-react";
import { search } from "./engine.js";
import "./offerings.css";
import VisualStories from "./VisualStories.jsx";

const languages = [
  {
    label: "English",
    request: "Find me a blue cotton kurta under ₹1,000. My usual size.",
    reply:
      "Blue, cotton, within budget. I’ll use your saved size and put the options together.",
  },
  {
    label: "हिंदी",
    request:
      "मेरे लिए नीला कॉटन कुर्ता ढूँढो। हज़ार रुपये के अंदर, मेरा वाला साइज़।",
    reply:
      "नीला, कॉटन और आपके बजट में। आपके सेव किए साइज़ के हिसाब से विकल्प तैयार करूँगा।",
  },
  {
    label: "Hinglish",
    request: "Ek blue cotton kurta chahiye, under thousand. Mera usual size.",
    reply:
      "Blue cotton, budget ke andar. Aapke saved size se options shortlist karunga.",
  },
];
const occasions = [
  {
    name: "Everyday",
    headline: "Easy days. Easy cotton.",
    brief:
      "Breathable fabrics, familiar fits and pieces you’ll reach for again.",
    details: ["Cotton first", "Relaxed fit", "Under ₹1,000"],
  },
  {
    name: "Wedding guest",
    headline: "A little festive. Still you.",
    brief:
      "A mehendi-ready look that fits your taste, budget and the occasion.",
    details: ["Festive detail", "Comfort matters", "Your budget"],
  },
  {
    name: "Work",
    headline: "Polished, without the fuss.",
    brief: "Comfortable workwear that follows your dress code and usual fit.",
    details: ["Clean silhouettes", "Usual size", "Easy to repeat"],
  },
];
const features = [
  ["whatsapp", "WhatsApp first", MessageCircle],
  ["voice", "Voice first", Mic],
  ["personalisation", "Personalisation", Fingerprint],
  ["memory", "Memory", Brain],
  ["better-deals", "Prices & offers", Tags],
  ["tracking", "Automatic tracking", PackageCheck],
];
function StatusNote({ children = "Explore the interactive example" }) {
  return (
    <p className="capability-status">
      <span />
      {children}
    </p>
  );
}
function Waveform({ playing }) {
  return (
    <div
      className={`voice-wave ${playing ? "is-playing" : ""}`}
      aria-hidden="true"
    >
      {Array.from({ length: 38 }, (_, i) => (
        <span
          key={i}
          style={{
            "--bar-delay": `${(i % 7) * 70}ms`,
            height: `${9 + ((i * 17 + i * i * 3) % 43)}px`,
          }}
        />
      ))}
    </div>
  );
}

export default function Offerings() {
  const [language, setLanguage] = useState(0);
  const [occasion, setOccasion] = useState(0);
  const voicePreview = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [chatReplay, setChatReplay] = useState(0);
  const [memorySize, setMemorySize] = useState("M");
  const [memoryFabric, setMemoryFabric] = useState("Cotton");
  const [includeDelivery, setIncludeDelivery] = useState(true);
  const [deliveryStep, setDeliveryStep] = useState(1);
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setPlaying(false), 8000);
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setPlaying(false);
    });
    if (voicePreview.current) observer.observe(voicePreview.current);
    const onVisibility = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [playing]);
  const voice = languages[language];
  const style = occasions[occasion];
  const options = search("blue cotton kurta under 1000 size M").results;
  return (
    <>
      <section className="offerings-intro wrap" id="the-ai">
        <div>
          <h2>
            Your AI shopping agent.
            <br />
            From first thought to front door.
          </h2>
          <p>
            Chauffeur is built around understanding your request, learning your
            preferences, finding the right options and staying with the order.
            One familiar conversation, all the way through.
          </p>
        </div>
        <div
          className="capability-directory"
          aria-label="Explore Chauffeur capabilities"
        >
          {features.map(([id, label, Icon]) => (
            <a href={`#${id}`} key={id}>
              <Icon size={19} strokeWidth={1.6} />
              <span>{label}</span>
              <ArrowUpRight size={14} />
            </a>
          ))}
        </div>
      </section>

      <section className="capability-row whatsapp-section wrap" id="whatsapp">
        <div className="capability-copy">
          <h2>
            Your shopping trip
            <br />
            starts in WhatsApp.
          </h2>
          <p>
            Send a message in the chat you already use. An item, a budget, a
            link, or “something like this.” Chauffeur brings the shortlist,
            approvals and next steps into one familiar conversation.
          </p>
          <ul>
            <li>
              <Check size={16} /> Ask in everyday language
            </li>
            <li>
              <Check size={16} /> Get options without switching stores
            </li>
            <li>
              <Check size={16} /> Keep approvals and updates in one chat
            </li>
          </ul>
          <StatusNote />
          <a className="text-button" href="#how-it-works">
            See the shopping flow <ArrowRight size={16} />
          </a>
        </div>
        <div
          className="whatsapp-preview"
          aria-label="Illustrative WhatsApp shopping conversation"
        >
          <div className="phone-header">
            <span className="agent-avatar">
              <Asterisk size={22} />
            </span>
            <div>
              <strong>Chauffeur AI</strong>
              <span>Your personal shopping agent</span>
            </div>
            <MessageCircle size={21} />
          </div>
          <div className="phone-chat" key={chatReplay}>
            <p className="chat-date">A conversation, your way</p>
            <div className="wa-bubble outgoing">
              <p>
                Mehendi next weekend. Something green, comfortable, under
                ₹1,500.
              </p>
              <span>
                10:42 <CheckCheck size={13} />
              </span>
            </div>
            <div className="wa-bubble incoming">
              <p>
                A little festive, a lot of comfort. Would you like a kurta set
                or a saree?
              </p>
              <span>10:42</span>
            </div>
            <div className="wa-bubble outgoing">
              <p>Kurta set. My usual size.</p>
              <span>
                10:43 <CheckCheck size={13} />
              </span>
            </div>
            <div className="wa-bubble incoming">
              <p>
                I’ll use your saved size, check the total with delivery, and
                bring you a few options to review.
              </p>
              <span>10:43</span>
            </div>
          </div>
          <div className="phone-composer">
            <button
              className="preview-action"
              onClick={() => setChatReplay((v) => v + 1)}
            >
              Replay the conversation <ArrowRight size={15} />
            </button>
            <Mic size={19} />
          </div>
          <p className="preview-caption">
            Illustration only. WhatsApp is not connected yet.
          </p>
        </div>
      </section>

      <section className="voice-section" id="voice">
        <div className="wrap voice-layout">
          <div className="capability-copy">
            <h2>
              Shopping should
              <br />
              sound like you.
            </h2>
            <p>
              Say it while you’re making chai. Send a voice note while you’re on
              the move. Chauffeur is built for voice: your words, your pace,
              your way of asking.
            </p>
            <p>
              WhatsApp voice notes. A voice-first app experience. English,
              Hindi, and the Hinglish in between.
            </p>
            <StatusNote>
              Choose a language. Play the visual voice preview.
            </StatusNote>
          </div>
          <div className="voice-preview" ref={voicePreview}>
            <div
              className="language-tabs"
              role="tablist"
              aria-label="Voice request language"
            >
              {languages.map((item, i) => (
                <button
                  role="tab"
                  id={`language-tab-${i}`}
                  aria-selected={language === i}
                  aria-controls="voice-preview-panel"
                  tabIndex={language === i ? 0 : -1}
                  key={item.label}
                  onClick={() => setLanguage(i)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                      e.preventDefault();
                      const next = (i + (e.key === "ArrowRight" ? 1 : 2)) % 3;
                      setLanguage(next);
                      document.getElementById(`language-tab-${next}`)?.focus();
                    }
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div
              role="tabpanel"
              id="voice-preview-panel"
              aria-labelledby={`language-tab-${language}`}
              className="voice-panel"
              key={language}
            >
              <div
                className={`voice-agent-graphic ${playing ? "is-listening" : ""}`}
                aria-hidden="true"
              >
                <div className="voice-orbit orbit-one" />
                <div className="voice-orbit orbit-two" />
                <div className="voice-core">
                  <Asterisk size={52} />
                </div>
                <span className="voice-orbit-label">
                  {playing
                    ? "Your words → your shortlist"
                    : "A little voice. A lot understood."}
                </span>
              </div>
              <div className="voice-note">
                <button
                  className="voice-icon"
                  aria-label={
                    playing
                      ? "Stop visual voice preview"
                      : "Play visual voice preview"
                  }
                  aria-pressed={playing}
                  onClick={() => setPlaying((v) => !v)}
                >
                  {playing ? <Volume2 size={24} /> : <Mic size={24} />}
                </button>
                <Waveform playing={playing} />
                <span className="voice-time">0:08</span>
              </div>
              <blockquote lang={language === 1 ? "hi" : "en"}>
                “{voice.request}”
              </blockquote>
              <div className="voice-response">
                <Asterisk size={19} />
                <p lang={language === 1 ? "hi" : "en"}>{voice.reply}</p>
              </div>
            </div>
            <p className="preview-caption">
              Sample transcript, not a recording or live AI response.
            </p>
          </div>
        </div>
      </section>

      <section
        className="capability-row personalisation-section wrap"
        id="personalisation"
      >
        <div className="personal-style-preview">
          <div
            className="style-art"
            role="img"
            aria-label="Painterly portrait of an Indian woman in an embroidered blue kurta, brand illustration"
          />
          <div className="style-brief">
            <div
              className="occasion-tabs"
              aria-label="Explore example occasions"
            >
              {occasions.map((item, i) => (
                <button
                  aria-pressed={occasion === i}
                  key={item.name}
                  onClick={() => setOccasion(i)}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <div className="changing-brief" key={occasion}>
              <h3>{style.headline}</h3>
              <p>{style.brief}</p>
              <div className="style-preferences">
                {style.details.map((detail) => (
                  <span key={detail}>{detail}</span>
                ))}
              </div>
            </div>
            <p className="preview-caption">
              Illustrative style brief. Artwork is not a product.
            </p>
          </div>
        </div>
        <div className="capability-copy">
          <h2>
            Good recommendations.
            <br />
            For your kind of good.
          </h2>
          <p>
            Your size is only the beginning. Personalisation brings your fit,
            favourite fabrics, budget, occasion and the things you’d never wear
            into the shortlist.
          </p>
          <p>
            A work wardrobe and a wedding look shouldn’t get the same shortlist.
            Neither should two people with completely different tastes.
          </p>
          <ul>
            <li>
              <Fingerprint size={16} /> Preferences that shape the shortlist
            </li>
            <li>
              <Heart size={16} /> Feedback that helps refine your taste
            </li>
            <li>
              <SlidersHorizontal size={16} /> You can change your mind, anytime
            </li>
          </ul>
          <StatusNote>
            Change the occasion. See the brief change with you.
          </StatusNote>
        </div>
      </section>

      <section className="memory-section" id="memory">
        <div className="wrap memory-layout">
          <div className="capability-copy">
            <h2>
              “You know my size.”
              <br />
              Less explaining. More you.
            </h2>
            <p>
              An AI shopping agent should get more useful with every
              conversation. Memory connects your preferences to the next
              request, so you spend less time explaining yourself.
            </p>
            <div className="memory-control">
              <ShieldCheck size={21} />
              <p>
                See what’s remembered, correct it, or ask Chauffeur to forget.
                Your preferences stay under your control.
              </p>
            </div>
            <StatusNote>
              Edit the example below. Nothing is saved beyond this page.
            </StatusNote>
          </div>
          <div className="memory-preview">
            <div className="memory-top">
              <Brain size={22} />
              <strong>A little context. A better starting point.</strong>
            </div>
            <dl>
              <div>
                <dt>Usual size</dt>
                <dd>
                  <select
                    aria-label="Example remembered size"
                    value={memorySize}
                    onChange={(e) => setMemorySize(e.target.value)}
                  >
                    {["S", "M", "L", "XL"].map((size) => (
                      <option key={size}>{size}</option>
                    ))}
                  </select>{" "}
                  <span>Confirm for each brand</span>
                </dd>
              </div>
              <div>
                <dt>Favourite fabric</dt>
                <dd>
                  <select
                    aria-label="Example favourite fabric"
                    value={memoryFabric}
                    onChange={(e) => setMemoryFabric(e.target.value)}
                  >
                    {["Cotton", "Linen", "Silk"].map((fabric) => (
                      <option key={fabric}>{fabric}</option>
                    ))}
                  </select>{" "}
                  <span>Comfort comes first</span>
                </dd>
              </div>
              <div>
                <dt>Everyday budget</dt>
                <dd>
                  Under ₹1,000 <span>You can change it per request</span>
                </dd>
              </div>
              <div>
                <dt>Style note</dt>
                <dd>
                  “Nothing too extra.” <span>In your own words</span>
                </dd>
              </div>
            </dl>
            <div className="memory-follow-up">
              <Asterisk size={17} />
              <p key={`${memorySize}-${memoryFabric}`} aria-live="polite">
                “Something in {memoryFabric.toLowerCase()}, size {memorySize}.
                You know my type.”
              </p>
            </div>
            <p className="preview-caption">
              Illustrative memory profile, not saved personal data.
            </p>
          </div>
        </div>
      </section>

      <section className="capability-row deals-section wrap" id="better-deals">
        <div className="capability-copy">
          <h2>
            A price tag isn’t
            <br />
            the whole price.
          </h2>
          <p>
            Delivery fees, coupon conditions, bank offers, return rules.
            Chauffeur is built around the details that turn a promising deal
            into an informed decision.
          </p>
          <ul>
            <li>
              <Tags size={16} /> Compare totals, including delivery
            </li>
            <li>
              <Check size={16} /> Check offer conditions and eligibility
            </li>
            <li>
              <ShieldCheck size={16} /> Weigh returns and fit alongside price
            </li>
          </ul>
          <StatusNote>Switch the view to see what delivery adds.</StatusNote>
          <a
            className="text-button"
            href="/demo/?q=blue%20cotton%20kurta%20under%201000%20size%20M"
          >
            Compare the sample options <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="deals-preview">
          <div className="deals-heading">
            <Tags size={23} />
            <div>
              <h3>The total, not just the tag.</h3>
              <p>Blue cotton kurta · sample alternatives</p>
            </div>
          </div>
          <div className="price-view-toggle" aria-label="Example price view">
            {[true, false].map((total) => (
              <button
                key={String(total)}
                aria-pressed={includeDelivery === total}
                onClick={() => setIncludeDelivery(total)}
              >
                {total ? "With delivery" : "Item only"}
              </button>
            ))}
          </div>
          <div className="price-table-wrap">
            <table>
              <caption className="sr-only">
                Sample product and delivery price comparison
              </caption>
              <thead>
                <tr>
                  <th scope="col">Store</th>
                  <th scope="col">Item</th>
                  <th scope="col">Delivery</th>
                  <th scope="col">{includeDelivery ? "Total" : "Item only"}</th>
                </tr>
              </thead>
              <tbody>
                {options.map((p) => (
                  <tr key={p.id}>
                    <th scope="row">{p.store}</th>
                    <td>₹{p.price}</td>
                    <td>₹{p.fee}</td>
                    <td>
                      <strong key={String(includeDelivery)}>
                        ₹{p.price + (includeDelivery ? p.fee : 0)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="offer-check">
            <span className="offer-symbol">
              <ShoppingBag size={19} />
            </span>
            <p>
              <strong>A little more than “lowest price.”</strong>Does the offer
              apply to you? Is delivery extra? Can you return it? Those checks
              matter too.
            </p>
          </div>
          <p className="preview-caption">
            Fictional prices. Similar alternatives, not verified identical
            products.
          </p>
        </div>
      </section>

      <section className="tracking-section" id="tracking">
        <div className="wrap tracking-layout">
          <div className="tracking-preview">
            <div className="tracking-head">
              <PackageCheck size={22} />
              <h3>From “ordered” to “it’s here.”</h3>
            </div>
            <ol className="delivery-timeline">
              {[
                [
                  CircleCheck,
                  "Order approved",
                  "Your choice, your confirmation",
                ],
                [Truck, "On its way", "An update in the same conversation"],
                [PackageCheck, "Delivered", "Keep the return window in view"],
              ].map(([Icon, title, detail], i) => (
                <li key={title} className={deliveryStep === i ? "current" : ""}>
                  <button
                    aria-pressed={deliveryStep === i}
                    onClick={() => setDeliveryStep(i)}
                  >
                    <Icon size={21} />
                    <span>
                      <strong>{title}</strong>
                      <span>{detail}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <p
              className="tracking-feedback"
              key={deliveryStep}
              aria-live="polite"
            >
              {
                [
                  "Confirmed. The choice stays yours.",
                  "On the move. No need to keep checking.",
                  "At your door. Your return window stays in view.",
                ][deliveryStep]
              }
            </p>
            <div className="return-reminder">
              <Bell size={21} />
              <p>
                <strong>Fit not quite right?</strong>A reminder before the
                return window closes.
              </p>
            </div>
            <p className="preview-caption">
              Illustrative timeline. No live tracking or alerts yet.
            </p>
          </div>
          <div className="capability-copy">
            <h2>
              The order is placed.
              <br />
              The help shouldn’t stop.
            </h2>
            <p>
              Automatic tracking brings delivery updates and return-window
              reminders together. So you don’t have to keep reopening apps just
              to find out what happened.
            </p>

            <ul>
              <li>
                <Truck size={16} /> Delivery updates in your conversation
              </li>
              <li>
                <Bell size={16} /> Reminders before return deadlines
              </li>
              <li>
                <Check size={16} /> Your approval for changes and returns
              </li>
            </ul>
            <StatusNote />
          </div>
        </div>
      </section>

      <VisualStories />

      <section className="agent-principles wrap">
        <div>
          <h2>
            AI does the legwork.
            <br />
            You make the call.
          </h2>
          <p>
            Understanding a request is the beginning. The bigger idea is an
            agent that can remember context, compare choices and follow through,
            with you approving what matters.
          </p>
        </div>
        <div className="agent-process">
          <div>
            <MessageCircle size={20} />
            <strong>Understand</strong>
            <p>Your words, budget and intent.</p>
          </div>
          <ArrowRight className="process-arrow" size={17} />
          <div>
            <Brain size={20} />
            <strong>Remember</strong>
            <p>The preferences you choose to share.</p>
          </div>
          <ArrowRight className="process-arrow" size={17} />
          <div>
            <Tags size={20} />
            <strong>Compare</strong>
            <p>Options and the details behind them.</p>
          </div>
          <ArrowRight className="process-arrow" size={17} />
          <div>
            <ShieldCheck size={20} />
            <strong>Ask & follow through</strong>
            <p>Your approval, then clear updates.</p>
          </div>
        </div>
        <p className="principles-note">
          Your preferences. Your choices. Your approval before a purchase.
        </p>
      </section>
    </>
  );
}

export function BuildRoadmap() {
  return (
    <section className="build-roadmap wrap" id="whats-next">
      <div className="roadmap-intro">
        <h2>
          One companion.
          <br />
          Every part of the shopping trip.
        </h2>
        <p>
          Start with a conversation. Keep your taste close. Stay in the loop all
          the way to your doorstep.
        </p>
      </div>
      <div className="roadmap-stages">
        <article>
          <span className="roadmap-status available">
            <Check size={14} /> Available to try
          </span>
          <h3>The shopping demo</h3>
          <p>
            Search a fictional catalogue, compare sample totals, choose a size,
            and walk through demo order actions.
          </p>
          <a href="/demo/" className="text-button">
            Open the separate demo <ArrowUpRight size={16} />
          </a>
        </article>
        <article>
          <span className="roadmap-status">The experience</span>
          <h3>The familiar conversation</h3>
          <p>
            WhatsApp, voice requests, an AI assistant, editable preferences and
            memory across conversations.
          </p>
        </article>
        <article>
          <span className="roadmap-status">The experience</span>
          <h3>The follow-through</h3>
          <p>
            Live store connections, offer checks, approved purchases, automatic
            tracking and return reminders.
          </p>
        </article>
      </div>
    </section>
  );
}
