import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Asterisk,
  Search,
  Shirt,
  ShoppingBag,
  Plus,
} from "lucide-react";
import { search } from "./engine.js";
import Offerings, { BuildRoadmap } from "./Offerings.jsx";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
const prompts = [
  "Blue cotton kurta under 1000 size M",
  "Pink dress under 1200",
  "नीला कॉटन कुर्ता 1000 रुपये के अंदर साइज M",
];
const artLabels = [
  "Everyday, elevated",
  "A classic. With a twist.",
  "Main character energy",
  "A little desi detail",
  "Your kind of pretty",
];

function Brand({ onClick }) {
  return (
    <a className="brand" href="#" onClick={onClick} aria-label="Chauffeur home">
      <Asterisk strokeWidth={2.2} aria-hidden="true" />
      <span>chauffeur</span>
      <span className="brand-ai">AI</span>
    </a>
  );
}
function Art({ index, className = "", label }) {
  return (
    <div
      className={`art ${className}`}
      style={{ "--art-position": `${index * 25}%` }}
      role="img"
      aria-label={label || artLabels[index]}
    />
  );
}
function Landing({ start }) {
  const [query, setQuery] = useState("");
  const fan = useRef(null);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame;
    const update = () => {
      if (!reduced.matches && fan.current)
        fan.current.style.setProperty(
          "--spread",
          Math.min(window.scrollY / 750, 0.6),
        );
    };
    const scroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", scroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <>
      <header className="site-nav wrap">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="/app/">Sign in</a>
          <a href="#the-ai">The AI</a>
          <a href="#how-it-works">How it works</a>
          <a href="#whats-next">What’s next</a>
          <a href="#the-details">The details</a>
        </nav>
        <button className="button nav-cta" onClick={() => start()}>
          Try the demo <ArrowUpRight size={16} />
        </button>
      </header>
      <main id="main-content">
        <section className="hero">
          <div className="hero-copy wrap">
            <h1>
              Good taste.
              <br />
              Less tab-hopping.
            </h1>
            <p>
              Your AI shopping agent, with a little desi soul.
              <br className="desktop-break" /> Built around WhatsApp, voice, and
              getting to know you.
            </p>
            <button className="button primary" onClick={() => start()}>
              Try the shopping demo <ArrowUpRight size={18} />
            </button>
            <a className="mobile-account-link" href="/app/">Sign in to save your preferences</a>
            <span className="hero-note">
              Your taste. Your budget. Your AI shopping companion.
            </span>
          </div>
          <div className="art-stage" ref={fan}>
            <div className="floating-note note-left">
              <span className="note-dot" /> “Kuch mere type ka.”
            </div>
            <div
              className="art-fan"
              aria-label="Indian fashion meets Renaissance painting"
            >
              {[0, 1, 2, 3, 4].map((index) => (
                <figure className={`art-card art-card-${index}`} key={index}>
                  <Art index={index} />
                  <figcaption>{artLabels[index]}</figcaption>
                </figure>
              ))}
            </div>
            <div className="floating-note note-right">
              <Asterisk size={18} /> Very you. Very found.
            </div>
            <div className="gallery-foot">
              <span>Old-school charm. New-school shopping.</span>
              <span>Brand illustrations, not product photos.</span>
            </div>
          </div>
          <form
            className="hero-search"
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) start(query.trim());
            }}
          >
            <label className="sr-only" htmlFor="hero-query">
              What are you looking for?
            </label>
            <Search size={19} aria-hidden="true" />
            <input
              id="hero-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="A blue kurta. Under ₹1,000. Very me."
              maxLength={500}
              required
            />
            <button aria-label="Search the sample catalogue">
              <ArrowRight size={21} />
            </button>
          </form>
          <div className="language-note">
            <span>Say it your way.</span> English, हिंदी, or a little of both.
          </div>
        </section>
        <section className="stores wrap" aria-label="Sample stores">
          <p>
            Three stores.
            <br />
            <strong>One conversation.</strong>
          </p>
          <div className="store-wordmarks">
            <span className="amazon-word">
              amazon
              <span className="amazon-smile" />
            </span>
            <span className="flipkart-word">
              Flipkart
              <ShoppingBag size={25} />
            </span>
            <span className="meesho-word">meesho</span>
          </div>
          <span className="stores-note">
            Sample catalogue.
            <br />
            Store accounts aren’t connected yet.
          </span>
        </section>
        <Offerings />
        <section className="how-section wrap" id="how-it-works">
          <div className="section-copy">
            <h2>
              You bring the vibe.
              <br />
              We bring the shortlist.
            </h2>
            <p>
              Start with the first piece of the experience: a shopping request,
              a few options, and your approval. The separate web demo lets you
              walk through that flow using a fictional catalogue.
            </p>
            <div className="how-steps">
              <div>
                <span>1</span>
                <p>
                  <strong>Tell us what you’re after.</strong>Item, colour,
                  budget. No filter maze.
                </p>
              </div>
              <div>
                <span>2</span>
                <p>
                  <strong>Compare the little details.</strong>Price, delivery
                  and returns, together.
                </p>
              </div>
              <div>
                <span>3</span>
                <p>
                  <strong>You have the final say.</strong>Pick your size and
                  review before approving.
                </p>
              </div>
            </div>
            <button className="text-button" onClick={() => start(prompts[0])}>
              Take it for a spin <ArrowUpRight size={18} />
            </button>
          </div>
          <div className="conversation-example">
            <div className="example-top">
              <div>
                <Asterisk size={22} />
                <strong>Your shopping, together</strong>
              </div>
              <span>Sample conversation</span>
            </div>
            <div className="sample-message">
              <span>You</span>
              <p>
                Blue cotton kurta under ₹1,000.
                <br />
                Size M. Nothing too extra.
              </p>
            </div>
            <div className="sample-reply">
              <Asterisk size={21} />
              <div>
                <p>
                  Three sample options. A little blue, a little breezy, all
                  within budget.
                </p>
                <div className="sample-options">
                  {search(prompts[0]).results.map((p, i) => (
                    <div className="sample-option" key={p.id}>
                      <span className={`mini-swatch swatch-${i}`}>
                        <Shirt size={24} strokeWidth={1.3} />
                      </span>
                      <div>
                        <strong>{p.store}</strong>
                        <span>{p.name}</span>
                      </div>
                      <b>{money(p.price + p.fee)}</b>
                    </div>
                  ))}
                </div>
                <button className="button" onClick={() => start(prompts[0])}>
                  Explore these options <ArrowRight size={16} />
                </button>
              </div>
            </div>
            <p className="example-note">
              Fictional products and prices. No real purchases.
            </p>
          </div>
        </section>
        <section className="manifesto">
          <div className="wrap manifesto-inner">
            <Art
              index={1}
              className="manifesto-art"
              label="A classical marble bust in an embroidered Indian shawl and blue sunglasses"
            />
            <div>
              <h2>
                A bit of taste.
                <br />A bit of technology.
                <br />A lot less “where was that?”
              </h2>
              <p>
                For the way we actually shop: a little English, a little Hindi,
                a budget in mind, and seventeen tabs open.
              </p>
              <button className="button primary" onClick={() => start()}>
                Let’s make it three options <ArrowUpRight size={18} />
              </button>
            </div>
            <span className="manifesto-aside">
              Classics deserve
              <br />a modern twist.
            </span>
          </div>
        </section>
        <BuildRoadmap />
        <section className="details-section wrap" id="the-details">
          <div>
            <h2>
              Good questions.
              <br />
              Straight answers.
            </h2>
            <p>We’re early. Here’s what’s real right now.</p>
          </div>
          <div className="faq-list">
            {[
              [
                "Can I use Chauffeur on WhatsApp or by voice?",
                "Chauffeur is built around a WhatsApp-first, voice-first shopping experience. Neither WhatsApp nor voice is connected yet. You can try the separate text-based web demo today. The product includes a voice-led app concept.",
              ],
              [
                "What does Chauffeur’s memory include?",
                "Memory centres on preferences you choose to share, such as usual size, fabric, budget and style, across conversations. The experience gives you control to see, correct and clear that memory. Today, only the web demo’s usual-size preference works, and it clears when the page reloads.",
              ],
              [
                "Will it find offers and track my orders?",
                "Live price comparisons, coupon and bank-offer checks, automatic delivery updates and return-window reminders are planned. Offer eligibility and any action needing approval should be made clear. Today’s demo compares fictional totals and lets you simulate order changes; it does not monitor real orders.",
              ],
              [
                "Can I actually buy something here?",
                "Not yet. This is a working demo with fictional products and prices. You can search, compare and approve a sample order, but no payment is collected or purchase made.",
              ],
              [
                "Is this connected to Amazon, Flipkart and Meesho?",
                "Not yet. The demo uses a small sample catalogue inspired by those stores. Live product search and account connections are future work.",
              ],
              [
                "Can I search in Hindi or Hinglish?",
                "Yes. Try “नीला कॉटन कुर्ता 1000 रुपये के अंदर साइज M” or “neeli cotton kurti 1000 rupaye size M”. The demo recognises a limited set of shopping keywords; it is not yet a connected AI assistant.",
              ],
              [
                "Will it remember my size and orders?",
                "During your current session, yes. You can set a usual size in the demo and clear it whenever you want. Refreshing the page clears preferences and sample orders.",
              ],
              [
                "What does Chauffeur cost?",
                "The sample web demo is free to try. Pricing for the planned AI shopping service has not been set, and there is no subscription or paid checkout on this website.",
              ],
            ].map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <Plus size={20} />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="closing wrap">
          <Asterisk size={40} strokeWidth={1.4} />
          <h2>Shopping, with a little more you.</h2>
          <button className="button primary" onClick={() => start()}>
            Try the shopping demo <ArrowUpRight size={18} />
          </button>
          <p>No sign-up. No real purchases. Just a first look.</p>
        </section>
      </main>
      <footer className="site-footer wrap">
        <Brand />
        <span>Made for the “bas, yahi” moment.</span>
        <a href="#the-details">
          About this demo <ArrowUpRight size={14} />
        </a>
      </footer>
    </>
  );
}

export default function App() {
  const start = (query = "") => {
    window.location.href = query
      ? `/demo/?q=${encodeURIComponent(query)}`
      : "/demo/";
  };
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Landing start={start} />
    </>
  );
}
