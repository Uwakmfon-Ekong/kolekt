"use client";

import { useState, type FormEvent } from "react";

export default function EarlyAccess() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: send `email` to your waitlist endpoint or mailing provider.
    setDone(true);
  }

  if (done) {
    return (
      <p className="ea-done" role="status">
        Thank you. We will write to {email} when Kolekt opens.
      </p>
    );
  }

  return (
    <form className="ea" onSubmit={onSubmit}>
      <label htmlFor="ea-email">Email address</label>
      <div className="ea-row">
        <input
          id="ea-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn btn--light" type="submit">Get early access</button>
      </div>
    </form>
  );
}
