"use client";

import { useEffect, useMemo, useState } from "react";
import { naira } from "@/lib/format";

type Example = {
  tab: string;
  name: string;
  amount: number;
  total: number;
  who: string;
};

const EXAMPLES: Example[] = [
  { tab: "Department", name: "Departmental Dues", amount: 3000, total: 100, who: "students" },
  { tab: "Church", name: "Building Fund Round", amount: 10000, total: 150, who: "members" },
  { tab: "Office", name: "Farewell Gift", amount: 5000, total: 40, who: "colleagues" },
  { tab: "School", name: "Excursion Fee", amount: 8000, total: 60, who: "parents" },
];

/** Fixed shuffle so server and client render the same grid. */
function payOrder(size: number): number[] {
  const order = Array.from({ length: size }, (_, i) => i);
  let seed = 7;
  for (let i = order.length - 1; i > 0; i--) {
    seed = (seed * 16807) % 2147483647;
    const j = seed % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export default function HeroLedger() {
  const [active, setActive] = useState(0);
  const [count, setCount] = useState(0);

  const ex = EXAMPLES[active];
  const target = Math.round(ex.total * 0.72);

  const rank = useMemo(() => {
    const r: number[] = new Array(ex.total).fill(0);
    payOrder(ex.total).forEach((cell, position) => {
      r[cell] = position;
    });
    return r;
  }, [ex.total]);

  useEffect(() => {
    setCount(0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(target);
      return;
    }
    const step = Math.max(40, Math.round(5000 / ex.total));
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        setCount((c) => {
          if (c >= target) {
            if (interval) clearInterval(interval);
            return c;
          }
          return c + 1;
        });
      }, step);
    }, 400);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [active, target, ex.total]);

  return (
    <figure className="ledger" aria-label={`Example collection: ${target} of ${ex.total} ${ex.who} have paid`}>
      <div className="ledger-tabs" role="group" aria-label="Choose an example collection">
        {EXAMPLES.map((e, i) => (
          <button
            key={e.tab}
            type="button"
            className={i === active ? "tab tab--on" : "tab"}
            aria-pressed={i === active}
            onClick={() => setActive(i)}
          >
            {e.tab}
          </button>
        ))}
      </div>

      <figcaption className="ledger-head">
        <strong>{ex.name}</strong>
        <span>{naira(ex.amount)} from each of {ex.total} {ex.who}</span>
      </figcaption>

      <div className="ledger-grid" aria-hidden="true">
        {rank.map((r, i) => (
          <span key={i} className={r < count ? "cell cell--paid" : "cell"} />
        ))}
      </div>

      <div className="ledger-legend" aria-hidden="true">
        <span><i className="dot dot--paid" /> PAID</span>
        <span><i className="dot" /> Not paid yet</span>
      </div>

      <div className="ledger-foot">
        <p className="ledger-total">{naira(count * ex.amount)}</p>
        <p className="ledger-sub">
          of {naira(ex.total * ex.amount)} collected. {count} paid, {ex.total - count} to go.
        </p>
      </div>
    </figure>
  );
}
