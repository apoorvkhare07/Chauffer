import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Asterisk,
  Check,
  Search,
  Shirt,
  ShoppingBag,
  Package,
  X,
  Plus,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { search, makeOrder, transition, products } from "./engine.js";
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
const storeClass = (store) => store.toLowerCase();
function Brand({ onClick }) {
  return (
    <a className="brand" href="/" onClick={onClick} aria-label="Chauffeur home">
      <Asterisk strokeWidth={2.2} aria-hidden="true" />
      <span>chauffeur</span>
    </a>
  );
}
function Demo({
  goHome,
  initialQuery,
  preferences,
  setPreferences,
  orders,
  setOrders,
}) {
  const [query, setQuery] = useState(initialQuery || "");
  const [results, setResults] = useState(
    initialQuery ? search(initialQuery, preferences).results : [],
  );
  const [searched, setSearched] = useState(initialQuery || "");
  const [messages, setMessages] = useState(
    initialQuery
      ? [
          { who: "you", text: initialQuery },
          {
            who: "bot",
            text: `${search(initialQuery, preferences).results.length} sample options found. Compare the total price and details below.`,
          },
        ]
      : [],
  );
  const [selected, setSelected] = useState(null);
  const [size, setSize] = useState("");
  const [payment, setPayment] = useState("UPI");
  const [error, setError] = useState("");
  const [activity, setActivity] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);
  const [view, setView] = useState("shop");
  const reviewRef = useRef(null);
  const inputRef = useRef(null);
  const run = (text) => {
    const clean = text.trim();
    if (!clean) {
      inputRef.current?.focus();
      return;
    }
    const found = search(clean, preferences).results;
    setResults(found);
    setSearched(clean);
    setSelected(null);
    setError("");
    setQuery("");
    setMessages((previous) => [
      ...previous,
      { who: "you", text: clean },
      {
        who: "bot",
        text: found.length
          ? `${found.length} sample options found. Prices below include delivery.`
          : "No sample matches. Try “blue kurta under 1000”, or choose another colour or size.",
      },
    ]);
  };
  useEffect(() => {
    if (selected)
      reviewRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
  }, [selected]);
  const select = (p) => {
    setSelected(p);
    setSize(p.sizes.includes(preferences.size) ? preferences.size : "");
    setPayment("UPI");
    setError("");
  };
  const approve = (e) => {
    e.preventDefault();
    try {
      const order = makeOrder(selected, size, payment);
      setOrders((prev) => [order, ...prev]);
      setActivity((prev) => [
        `Demo order approved: ${order.product.name}, ${money(order.total)}.`,
        ...prev,
      ]);
      setSelected(null);
      setView("orders");
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch (err) {
      setError(err.message);
    }
  };
  const changeOrder = (order, action) => {
    try {
      const updated = transition(order, action);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      setActivity((prev) => [
        `${order.product.name}: ${updated.status}.`,
        ...prev,
      ]);
      setConfirmAction(null);
    } catch (err) {
      setError(err.message);
    }
  };
  const loadOrder = () => {
    if (orders.some((o) => o.source === "Existing account demo")) return;
    const product = products.find((p) => p.id === "a2");
    setOrders((prev) => [
      ...prev,
      {
        ...makeOrder(product, "M", "UPI"),
        status: "Delivered in demo",
        source: "Existing account demo",
      },
    ]);
    setActivity((prev) => [
      "Loaded one fictional existing order. No account was accessed.",
      ...prev,
    ]);
  };
  return (
    <div className="demo-shell">
      <header className="demo-header wrap">
        <Brand
          onClick={(e) => {
            e.preventDefault();
            goHome();
          }}
        />
        <button className="text-button" onClick={goHome}>
          <ArrowLeft size={16} /> Back to homepage
        </button>
      </header>
      <div className="demo-layout wrap">
        <aside className="demo-sidebar">
          <p className="sidebar-title">Your little shopping studio.</p>
          <button
            className={view === "shop" ? "side-link active" : "side-link"}
            onClick={() => setView("shop")}
          >
            <Search size={18} /> Find something
          </button>
          <button
            className={view === "orders" ? "side-link active" : "side-link"}
            onClick={() => setView("orders")}
          >
            <Package size={18} /> Demo orders <span>{orders.length}</span>
          </button>
          <div className="demo-stores">
            <h3>Your stores</h3>
            {["Amazon", "Flipkart", "Meesho"].map((store) => (
              <div key={store}>
                <strong>{store}</strong>
                <span>Not connected</span>
              </div>
            ))}
          </div>
          <p className="sidebar-caption">
            Session only.
            <br />
            Refresh to start fresh.
          </p>
        </aside>
        <main className="demo-main" id="main-content">
          <div className="demo-heading">
            <div>
              <h1>
                {view === "shop"
                  ? "What’s your kind of thing?"
                  : "Your shopping story."}
              </h1>
              <p>
                {view === "shop"
                  ? "A colour, a budget, a little context. Start there."
                  : "Try the journey, from approval to return."}
              </p>
            </div>
            <span className="demo-badge">Demo mode</span>
          </div>
          <div className="demo-notice">
            <Sparkles size={18} />
            <p>
              Fictional products and prices. No store accounts, AI service or
              real purchases are connected.
            </p>
          </div>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {view === "shop" ? (
            <>
              <section className="demo-chat" aria-label="Shopping conversation">
                <div className="chat-welcome">
                  <Asterisk size={27} />
                  <p>
                    Tell me what you’re looking for.
                    <br />
                    <span>
                      English, Hindi or Hinglish. I’ll search the sample
                      catalogue.
                    </span>
                  </p>
                </div>
                <div className="chat-messages" role="log" aria-live="polite">
                  {messages.slice(-4).map((m, i) => (
                    <div
                      className={`chat-message ${m.who}`}
                      key={`${i}-${m.text}`}
                    >
                      <span>{m.who === "you" ? "You" : "Chauffeur"}</span>
                      <p>{m.text}</p>
                    </div>
                  ))}
                </div>
                <form
                  className="demo-query"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(query);
                  }}
                >
                  <label className="sr-only" htmlFor="demo-query">
                    Shopping request
                  </label>
                  <input
                    ref={inputRef}
                    id="demo-query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Blue cotton kurta under ₹1,000, size M…"
                    required
                    maxLength={500}
                  />
                  <button
                    className="button primary"
                    aria-label="Search sample products"
                  >
                    <ArrowRight size={20} />
                  </button>
                </form>
                <div className="query-chips">
                  {prompts.map((prompt, i) => (
                    <button key={prompt} onClick={() => run(prompt)}>
                      {
                        [
                          "Blue kurta under ₹1,000",
                          "Pink dress",
                          "हिंदी में खोजें",
                        ][i]
                      }
                      <ArrowUpRight size={13} />
                    </button>
                  ))}
                </div>
              </section>
              <div className="size-preference">
                <SlidersHorizontal size={17} />
                <label htmlFor="usual-size">My usual size</label>
                <select
                  id="usual-size"
                  value={preferences.size || ""}
                  onChange={(e) =>
                    setPreferences({ size: e.target.value || undefined })
                  }
                >
                  <option value="">Ask each time</option>
                  {["S", "M", "L", "XL"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <span>Session only. Check each store’s size chart.</span>
                {preferences.size && (
                  <button onClick={() => setPreferences({})}>
                    Forget size
                  </button>
                )}
              </div>
              <section aria-labelledby="shortlist-title">
                <div className="shortlist-heading">
                  <h2 id="shortlist-title">Your shortlist</h2>
                  <span>
                    {searched
                      ? `${results.length} sample matches`
                      : "Waiting for your first request"}
                  </span>
                </div>
                {!searched ? (
                  <div className="empty-state">
                    <ShoppingBag size={35} strokeWidth={1.2} />
                    <h3>A little less scrolling starts here.</h3>
                    <p>
                      Search above, or pick a suggestion to find your first
                      sample options.
                    </p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="empty-state">
                    <Search size={32} />
                    <h3>No match in this little catalogue.</h3>
                    <p>
                      Try a blue kurta, a pink dress, or a green saree. There
                      are only eight sample products so far.
                    </p>
                    <button className="button" onClick={() => run(prompts[0])}>
                      Show blue kurtas
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="results-caption">
                      Similar alternatives, not verified identical products.
                      Totals include sample delivery.
                    </p>
                    <div className="product-grid">
                      {results.map((p) => (
                        <article
                          className={`product-card ${selected?.id === p.id ? "selected" : ""}`}
                          key={p.id}
                        >
                          <div className={`product-swatch ${p.color}`}>
                            <Shirt
                              size={65}
                              strokeWidth={0.9}
                              aria-hidden="true"
                            />
                            <span>Sample item · colour illustration</span>
                          </div>
                          <div className="product-content">
                            <span
                              className={`store-name ${storeClass(p.store)}`}
                            >
                              {p.store}
                            </span>
                            <h3>{p.name}</h3>
                            <p>
                              {p.color} · {p.fabric}
                            </p>
                            <p>Sizes {p.sizes.join(", ")}</p>
                            <strong className="product-price">
                              {money(p.price + p.fee)}
                            </strong>
                            <span className="price-breakdown">
                              {money(p.price)} + {money(p.fee)} delivery
                            </span>
                            <div className="product-facts">
                              <span>{p.delivery} delivery</span>
                              <span>{p.returns}</span>
                            </div>
                            <button
                              className="button"
                              onClick={() => select(p)}
                            >
                              Review this option <ArrowUpRight size={16} />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </section>
              {selected && (
                <section
                  className="order-review"
                  ref={reviewRef}
                  aria-labelledby="review-title"
                >
                  <div className="review-heading">
                    <h2 id="review-title">Your pick. Your final say.</h2>
                    <button
                      className="icon-button"
                      aria-label="Close order review"
                      onClick={() => setSelected(null)}
                    >
                      <X size={22} />
                    </button>
                  </div>
                  <p>
                    {selected.store} · {selected.name} · {selected.color}
                  </p>
                  <form onSubmit={approve}>
                    <div className="review-fields">
                      <label htmlFor="order-size">
                        Size
                        <select
                          id="order-size"
                          required
                          value={size}
                          onChange={(e) => setSize(e.target.value)}
                        >
                          <option value="">Choose your size</option>
                          {selected.sizes.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                      <label htmlFor="payment">
                        Payment preference
                        <select
                          id="payment"
                          value={payment}
                          onChange={(e) => setPayment(e.target.value)}
                        >
                          <option>UPI</option>
                          <option>Cash on delivery</option>
                        </select>
                      </label>
                      <div className="review-total">
                        <span>Sample total</span>
                        <strong>{money(selected.price + selected.fee)}</strong>
                      </div>
                    </div>
                    <p className="review-disclaimer">
                      Approval creates a demo order only. No money will be
                      collected.
                    </p>
                    <button className="button primary">
                      Approve demo order <Check size={18} />
                    </button>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => setSelected(null)}
                    >
                      Back to shortlist
                    </button>
                  </form>
                </section>
              )}
            </>
          ) : (
            <section className="orders-section">
              <div className="shortlist-heading">
                <h2>Demo orders</h2>
                <button
                  className="text-button"
                  disabled={orders.some(
                    (o) => o.source === "Existing account demo",
                  )}
                  onClick={loadOrder}
                >
                  <Plus size={16} /> Load sample existing order
                </button>
              </div>
              {orders.length === 0 ? (
                <div className="empty-state">
                  <Package size={35} strokeWidth={1.2} />
                  <h3>No sample orders yet.</h3>
                  <p>
                    Choose something from your shortlist and approve a demo
                    order.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => setView("shop")}
                  >
                    Find something <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="order-list">
                  {orders.map((order) => (
                    <article className="order-row" key={order.id}>
                      <div className={`order-swatch ${order.product.color}`}>
                        <Shirt size={27} strokeWidth={1.3} />
                      </div>
                      <div className="order-info">
                        <h3>{order.product.name}</h3>
                        <p>
                          {order.product.store} · Size {order.size} ·{" "}
                          {money(order.total)} · {order.method}
                        </p>
                        <span className="order-status">{order.status}</span>
                        <small>
                          {order.source === "Existing account demo"
                            ? "Fictional existing account order"
                            : "Created in this demo"}
                        </small>
                      </div>
                      <div className="order-actions">
                        {order.status === "Approved in demo" && (
                          <>
                            <button
                              className="button"
                              onClick={() => changeOrder(order, "deliver")}
                            >
                              Simulate delivery
                            </button>
                            <button
                              className="text-button"
                              onClick={() =>
                                setConfirmAction({ order, action: "cancel" })
                              }
                            >
                              Cancel order
                            </button>
                          </>
                        )}
                        {order.status === "Delivered in demo" && (
                          <button
                            className="button"
                            onClick={() =>
                              setConfirmAction({ order, action: "return" })
                            }
                          >
                            Request return
                          </button>
                        )}
                      </div>
                      {confirmAction?.order.id === order.id && (
                        <div className="action-confirmation">
                          <p>
                            {confirmAction.action === "cancel"
                              ? "Cancel this demo order?"
                              : "Request a return for this demo order?"}{" "}
                            No store will be contacted.
                          </p>
                          <button
                            className="button primary"
                            onClick={() =>
                              changeOrder(order, confirmAction.action)
                            }
                          >
                            Confirm{" "}
                            {confirmAction.action === "cancel"
                              ? "cancellation"
                              : "return"}
                          </button>
                          <button
                            className="text-button"
                            onClick={() => setConfirmAction(null)}
                          >
                            Keep as is
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
              <div className="activity">
                <h3>Activity</h3>
                <div role="log" aria-live="polite">
                  {activity.length ? (
                    activity.map((entry, i) => (
                      <p key={`${i}-${entry}`}>
                        <Check size={14} />
                        {entry}
                      </p>
                    ))
                  ) : (
                    <p>
                      Order changes will appear here. No WhatsApp notifications
                      are sent.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
      <footer className="demo-footer wrap">
        A working prototype. Your preferences and orders clear when the page
        refreshes.
      </footer>
    </div>
  );
}

export default function ShoppingDemo() {
  const [preferences, setPreferences] = useState({});
  const [orders, setOrders] = useState([]);
  const initialQuery =
    new URLSearchParams(window.location.search).get("q") || "";
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Demo
        goHome={() => {
          window.location.href = "/";
        }}
        initialQuery={initialQuery}
        preferences={preferences}
        setPreferences={setPreferences}
        orders={orders}
        setOrders={setOrders}
      />
    </>
  );
}
