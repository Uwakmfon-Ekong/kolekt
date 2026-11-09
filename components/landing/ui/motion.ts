import type { CSSProperties } from "react";

/** Delay (ms) for one-off load animations: <div className="k-enter" style={delay(200)} /> */
export const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Position in a .k-stagger list: <li style={stagger(i)} /> */
export const stagger = (i: number) => ({ "--i": i }) as CSSProperties;
