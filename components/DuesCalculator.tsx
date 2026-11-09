"use client";

import { useState } from "react";
import { naira } from "@/lib/format";

export default function DuesCalculator() {
  const [amount, setAmount] = useState(3000);
  const [people, setPeople] = useState(100);
  const [paid, setPaid] = useState(72);

  const paidCount = Math.min(paid, people);
  const expected = amount * people;
  const collected = amount * paidCount;
  const percent = people > 0 ? Math.round((paidCount / people) * 100) : 0;

  return (
    <div className="calc">
      <div className="calc-inputs">
        <label>
          Amount per person (₦)
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
          />
        </label>
        <label>
          Expected contributors
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={people}
            onChange={(e) => setPeople(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>
        <label>
          Members who have paid: {paidCount}
          <input
            type="range"
            min={0}
            max={people}
            value={paidCount}
            onChange={(e) => setPaid(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="calc-out" aria-live="polite">
        <p className="calc-label">Target for this collection</p>
        <p className="calc-big">{naira(expected)}</p>
        <div className="bar" role="presentation">
          <div className="bar-fill" style={{ width: `${percent}%` }} />
        </div>
        <dl className="calc-grid">
          <div><dt>Collected</dt><dd>{naira(collected)}</dd></div>
          <div><dt>Still to collect</dt><dd>{naira(expected - collected)}</dd></div>
          <div><dt>Not paid yet</dt><dd>{people - paidCount} members</dd></div>
        </dl>
      </div>
    </div>
  );
}
