import React, { useState } from "react";
import {
  Asterisk,
  ShieldCheck,
  Check,
  ArrowRight,
  RotateCcw,
  PackageCheck,
  Truck,
  Bell,
  Heart,
  LockKeyhole,
} from "lucide-react";
import "./visual-stories.css";

const situations = [
  {
    label: "Running late",
    icon: Truck,
    title: "A delay. A clear next step.",
    message:
      "Your delivery is delayed. Here’s the updated estimate and the next step to check.",
    detail: "An update, before another refresh.",
    action: "Delivery update",
    position: 45,
  },
  {
    label: "Wrong fit",
    icon: Heart,
    title: "Not your fit? Still your call.",
    message:
      "The fit isn’t right. Review the return window and choose whether to request a return.",
    detail: "Return options, without the hunt.",
    action: "Review return options",
    position: 82,
  },
  {
    label: "Return window",
    icon: Bell,
    title: "A little nudge. At the right time.",
    message:
      "Your return window is nearly over. Keep it, or review your options before it closes.",
    detail: "The deadline stays in view.",
    action: "Return reminder",
    position: 100,
  },
];

export default function VisualStories() {
  const [scenario, setScenario] = useState(0);
  const [approved, setApproved] = useState(false);
  const care = situations[scenario];
  const CareIcon = care.icon;
  return (
    <>
      <section className="care-story wrap" id="shopping-care">
        <div className="visual-story-copy">
          <h2>
            A little care.
            <br />
            After checkout, too.
          </h2>
          <p>
            Late parcel. Wrong fit. Almost-missed return. Chauffeur keeps the
            next step close.
          </p>
          <div
            className="care-scenarios"
            aria-label="Explore shopping care examples"
          >
            {situations.map((item, i) => (
              <button
                key={item.label}
                aria-pressed={scenario === i}
                onClick={() => setScenario(i)}
              >
                <item.icon size={17} />
                {item.label}
              </button>
            ))}
          </div>
          <p className="story-instruction">Pick a problem. See the care.</p>
        </div>
        <div className="care-stage">
          <div
            className="parcel-route"
            style={{ "--journey": `${care.position}%` }}
            aria-hidden="true"
          >
            <span className="route-start">
              <PackageCheck size={25} />
            </span>
            <div className="route-line">
              <span />
              <div className="route-parcel">
                <CareIcon size={25} />
              </div>
            </div>
            <span className="route-end">
              <Heart size={25} />
            </span>
          </div>
          <div className="care-message" key={scenario} aria-live="polite">
            <div className="care-message-top">
              <span>
                <Asterisk size={21} /> Chauffeur care
              </span>
              <CareIcon size={20} />
            </div>
            <h3>{care.title}</h3>
            <p>{care.message}</p>
            <div className="care-result">
              <Check size={16} />
              {care.action}
            </div>
          </div>
          <p className="care-detail" key={`detail-${scenario}`}>
            {care.detail}
          </p>
          <p className="preview-caption">
            Interactive illustration. No real deliveries or reminders are
            connected.
          </p>
        </div>
      </section>
      <section className="approval-story">
        <div className="wrap approval-layout">
          <div className={`approval-stage ${approved ? "is-approved" : ""}`}>
            <div className="approval-flow" aria-hidden="true">
              <ShoppingToken />
              <span className="approval-flow-line" />
              <ShieldCheck size={30} />
              <span className="approval-flow-line" />
              <PackageCheck size={28} />
            </div>
            <div className="approval-receipt">
              <div className="approval-receipt-top">
                <span>
                  <LockKeyhole size={17} /> Review before you approve
                </span>
                <span>EXAMPLE</span>
              </div>
              <div className="approval-item">
                <div className="approval-art" />
                <div>
                  <h3>Blue cotton kurta</h3>
                  <p>Size M · Cotton · Meesho</p>
                </div>
                <strong>₹609</strong>
              </div>
              <p className="approval-art-caption">
                Brand artwork · not a product photo
              </p>
              <dl className="approval-total">
                <div>
                  <dt>Item</dt>
                  <dd>₹549</dd>
                </div>
                <div>
                  <dt>Delivery</dt>
                  <dd>₹60</dd>
                </div>
                <div>
                  <dt>Total to review</dt>
                  <dd>₹609</dd>
                </div>
              </dl>
              <button
                className="approval-button"
                onClick={() => setApproved((v) => !v)}
              >
                {approved ? (
                  <>
                    <RotateCcw size={17} />
                    Replay approval
                  </>
                ) : (
                  <>
                    Approve this example <ArrowRight size={17} />
                  </>
                )}
              </button>
              <div className="approval-feedback" aria-live="polite">
                <span className="approval-seal">
                  <ShieldCheck size={approved ? 30 : 23} />
                </span>
                <div>
                  <strong>
                    {approved
                      ? "Your approval. Instantly acknowledged."
                      : "The final yes stays yours."}
                  </strong>
                  <p>
                    {approved
                      ? "Example approved. No charge. No purchase."
                      : "Check the item, size and total before any next step."}
                  </p>
                </div>
              </div>
            </div>
            <p className="preview-caption">
              Visual approval example. No payment details, payment processing or
              purchase.
            </p>
          </div>
          <div className="visual-story-copy">
            <h2>
              AI finds it.
              <br />
              You give the final yes.
            </h2>
            <p>
              A clear total. The right size. Your approval before a purchase.
              Less uncertainty at the moment that matters.
            </p>
            <div className="approval-promises">
              <span>
                <ShieldCheck size={20} />
                Approval comes first
              </span>
              <span>
                <Check size={20} />
                See the total upfront
              </span>
              <span>
                <LockKeyhole size={20} />
                No payment details in this preview
              </span>
            </div>
            <p className="story-instruction">
              Try the approval. Watch the handoff.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
function ShoppingToken() {
  return (
    <span className="shopping-token">
      <Asterisk size={27} />
    </span>
  );
}
