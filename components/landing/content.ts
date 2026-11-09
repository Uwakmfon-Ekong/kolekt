/**
 * All landing-page copy and data in one place.
 * Edit words here; the components only handle layout.
 */

/* Routes: change these if your app uses different paths. */
export const ROUTES = {
  /** Where "Get started" and "Start a collection" go. */
  start: "/login",
  login: "/login",
  signup: "/signup",
} as const;

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Who it's for", href: "#who" },
  { label: "FAQ", href: "#faq" },
];

export const HERO = {
  badge: "Collect. Track. Stay Transparent.",
  titleLines: ["Group payments,", "minus the wahala."],
  subtitle:
    "Drop one link in the group chat. Everyone pays, Kolekt confirms every naira and ticks names off in real time. No screenshots. No spreadsheets. No “who never pay?”",
  primaryCta: "Start a collection",
  secondaryCta: "See how it works",
};

export const AUDIENCES = [
  "Course reps",
  "Departmental excos",
  "Church committees",
  "Ajo & esusu groups",
  "Cooperatives",
  "Wedding planners",
  "Alumni sets",
  "Estate associations",
  "Birthday squads",
  "Event organisers",
];

export const FEATURES = {
  title: "Everything your treasurer wished they had",
  subtitle: "You send the link. Kolekt handles the verification, the tracking, the receipts and the reports.",
  verified: {
    title: "Verified, not “I’ve sent it”",
    body: "A payment only counts once the money has actually landed. Screenshots who?",
  },
  flexible: {
    title: "Fixed or flex. Your call.",
    body: "Same amount for everyone, or let people give what they can towards a target.",
  },
  tracking: {
    title: ["See who’s paid.", "Instantly."],
    body: "Paste your list from Excel. Names tick off the second money lands, so you always know who’s in and who needs a gentle nudge.",
  },
  share: {
    title: "One link. One QR. Done.",
    body: "Share on WhatsApp, Telegram or IG, or print the QR for the notice board.",
  },
  receipts: {
    title: "Receipts & reports on tap",
    body: "Every contributor gets a receipt. You get a clean CSV for the exco meeting.",
  },
};

export const STEPS = {
  title: ["Three steps.", "That’s literally it."],
  subtitle: "From “we need to collect money” to a full list, without the stress.",
  items: [
    { title: "Create", body: "Name it, set a fixed amount or let people choose, add a deadline. Takes about two minutes, tops." },
    { title: "Share", body: "Drop the link in the group chat or print the QR code. Nobody needs an account to pay." },
    { title: "Relax", body: "Payments get verified and names tick off by themselves. Nudge the stragglers with one tap." },
  ],
};

export const COMPARISON = {
  title: "Be honest. This is your group chat right now \u{1F440}",
  oldLabel: "The group-chat way",
  newLabel: "The Kolekt way",
  oldWay: [
    "Drop account number in the group. Pray.",
    "47 screenshots. 12 of them blurry.",
    "“Abeg, who never pay?” on repeat.",
    "Excel at 2am trying to make it balance.",
    "Someone swears they paid. The bank disagrees.",
  ],
  kolektWay: [
    "One link, with a unique payment for every person",
    "Every naira verified automatically. Zero screenshots",
    "A live list of who’s paid and who hasn’t",
    "Totals that balance themselves",
    "Receipts that settle every argument",
  ],
};

export const USE_CASES = {
  title: "If your people chip in, Kolekt’s got you",
  subtitle: "From the department to the church to the squad’s birthday dinner.",
  items: [
    { emoji: "\u{1F393}", title: "Student associations", body: "Departmental dues, faculty levies, dinner and week contributions." },
    { emoji: "⛪", title: "Churches & faith groups", body: "Building funds, welfare, harvest and special programmes." },
    { emoji: "\u{1F91D}", title: "Communities & co-ops", body: "Projects, fundraisers, ajo and monthly contributions." },
    { emoji: "\u{1F389}", title: "Event organisers", body: "Registrations, aso-ebi, tickets and sponsorships." },
    { emoji: "\u{1F382}", title: "Just you & your people", body: "Birthdays, group gifts, trips and personal fundraisers." },
  ],
  extra: { title: "Something else?", cta: "It probably works too. Try it" },
};

export const FAQ = {
  title: "Questions? Asked & answered.",
  subtitle: "Still curious? Create a test collection and pay yourself. It’s the fastest way to get it.",
  items: [
    {
      q: "Do contributors need to create an account?",
      a: "Nope. They open your link, enter their name (and an ID if you ask for one), and pay by bank transfer. That's the whole thing.",
    },
    {
      q: "How do I know a payment is actually real?",
      a: "Kolekt verifies every payment automatically before it shows as paid. A screenshot can't fake that.",
    },
    {
      q: "Can people pay different amounts?",
      a: "Yes. Choose a fixed collection where everyone pays the same, or a flexible one where people give what they can towards a target.",
    },
    {
      q: "Who can see who has paid?",
      a: "Only you, the organiser. Your public page shows the collection's progress, never a list of who hasn't paid.",
    },
    {
      q: "Can I download records for my exco or committee?",
      a: "Anytime. Export a CSV with every contributor, amount, reference and date. Every contributor also gets their own receipt.",
    },
  ],
};

export const FINAL_CTA = {
  title: "Your next collection deserves better than a WhatsApp poll.",
  subtitle: "Set it up in two minutes. Share one link. Watch it fill up.",
  cta: "Start your first collection",
};

export const FOOTER = {
  tagline: "Collect. Track. Stay Transparent.",
  madeIn: "Made in Akwa Ibom.",
};

/* ---------- Example data shown inside the mockups ---------- */

export const PHONE_DEMO = {
  collection: "Final Year Dinner \u{1F393}",
  collectedValue: 284500,
  target: "₦400,000",
  progress: 71,
  paid: "71 of 100 paid",
  recent: [
    { initials: "IE", name: "Ini Etim", time: "just now", amount: "₦3,000" },
    { initials: "MU", name: "Mfon Udo", time: "2 min ago", amount: "₦3,000" },
    { initials: "EA", name: "Edidiong Akpan", time: "6 min ago", amount: "₦3,000" },
  ],
};

export const ROSTER_DEMO = [
  { name: "Aniekan Udoh", id: "CSC/21/001", paid: true },
  { name: "Blessing Etim", id: "CSC/21/002", paid: true },
  { name: "Emem Bassey", id: "CSC/21/003", paid: false },
  { name: "Idara Akpan", id: "CSC/21/004", paid: true },
  { name: "Nsikak Ekpo", id: "CSC/21/005", paid: false },
];
