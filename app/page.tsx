import HeroLedger from "@/components/HeroLedger";
import DuesCalculator from "@/components/DuesCalculator";
import EarlyAccess from "@/components/EarlyAccess";
import QrMock from "@/components/QrMock";

const pains = [
  "The organiser shares an account number in the WhatsApp group.",
  "Members transfer and send screenshots as proof of payment.",
  "Some forget to pay. Some transfer without a name or registration details.",
  "The organiser checks transactions by hand and updates a list.",
  "People keep asking whether their payment has been received.",
  "Disagreements start over who has paid and who hasn’t.",
];

const steps = [
  {
    title: "Create a collection",
    body: "Name it (dues, building fund, farewell gift, school levy), set the amount and the deadline, enter how many contributors you expect and add your payment instructions.",
  },
  {
    title: "Share the payment link",
    body: "Kolekt generates a unique link and QR code. Post it once in your group chat, or print the code on a flyer or notice board.",
  },
  {
    title: "Members make payments",
    body: "Members open the page, enter their details and pay with any of the supported payment methods.",
  },
  {
    title: "Payment confirmation",
    body: "When a payment is verified, that member’s status changes to PAID automatically. No screenshots to compare.",
  },
  {
    title: "Track contributions",
    body: "Your dashboard shows who has paid, who hasn’t and the total amount collected.",
  },
];

const rows: { name: string; reg: string; status: "PAID" | "NOT PAID"; time: string }[] = [
  { name: "Ekaette Udoh", reg: "REG/2022/0147", status: "PAID", time: "Today, 9:14 am" },
  { name: "Nsikak Bassey", reg: "REG/2022/0212", status: "PAID", time: "Today, 8:51 am" },
  { name: "Ima Akpan", reg: "REG/2022/0098", status: "NOT PAID", time: "No payment yet" },
  { name: "Utibe Etim", reg: "REG/2022/0305", status: "PAID", time: "Yesterday, 6:30 pm" },
  { name: "Mfon Ekpo", reg: "REG/2022/0173", status: "NOT PAID", time: "No payment yet" },
  { name: "Aniekan Okon", reg: "REG/2022/0261", status: "PAID", time: "Yesterday, 2:05 pm" },
];

const features = [
  {
    title: "One link for the whole group",
    body: "Every collection gets its own payment page, link and QR code. Share it once instead of repeating account details.",
  },
  {
    title: "Every payment has a name on it",
    body: "Members identify themselves before they pay, so you never have to ask who sent ₦5,000 at 4:12 pm.",
  },
  {
    title: "Automatic PAID status",
    body: "Verified payments update the member’s status on their own. You stop updating a list by hand.",
  },
  {
    title: "Amount, deadline and instructions together",
    body: "The payment page carries the details members need, so questions in the group chat drop away.",
  },
  {
    title: "See who still owes",
    body: "Your dashboard separates paid from not paid and totals the money collected so far.",
  },
  {
    title: "A record both sides can trust",
    body: "When two people disagree about who paid, you open the dashboard and the answer is there.",
  },
];

const audiences = [
  ["Churches and fellowships", "Building funds, thanksgiving offerings, harvest, welfare and special projects."],
  ["Offices and workplaces", "Farewell gifts, birthday rounds, staff welfare and end-of-year parties."],
  ["Schools", "Excursions, PTA levies, class projects and event fees collected from parents."],
  ["Departments and student associations", "Dues, levies, handouts and events, collected every session."],
  ["Any other group", "Cooperatives, alumni sets, estate associations and family contributions."],
];

const faqs = [
  {
    q: "Do members need to create an account?",
    a: "No. Members open the payment link, enter their details and pay.",
  },
  {
    q: "How does a payment become PAID?",
    a: "Once a payment is verified, the member’s status changes to PAID automatically. You do not need to mark anyone by hand.",
  },
  {
    q: "Is it for one-off or regular contributions?",
    a: "Both. Create a collection for a single event like a farewell gift, or set up a new one each session or month for recurring dues.",
  },
  {
    q: "What if someone pays without putting their name?",
    a: "Members enter their details on the payment page before they pay, so each contribution is tied to a person from the start.",
  },
  {
    q: "Is Kolekt only for student groups?",
    a: "No. We use a UNIUYO department as our main example because the problem is familiar there, but Kolekt works for churches, offices, schools, associations and any group that collects contributions.",
  },
  {
    q: "How much does it cost?",
    a: "We are still finalising pricing. Join the early access list and we will share it before launch.",
  },
];

export default function Home() {
  return (
    <>
      <header className="nav">
        <div className="wrap nav-inner">
          <a href="#top" className="logo" aria-label="Kolekt home">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
              <rect width="28" height="28" rx="8" fill="#7743DB" />
              <path d="M7 15l4.5 4.5L21 9" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Kolekt
          </a>
          <nav aria-label="Main" className="nav-links">
            <a href="#problem">The problem</a>
            <a href="#how">How it works</a>
            <a href="#dashboard">Dashboard</a>
            <a href="#faq">FAQ</a>
          </nav>
          <a href="#start" className="btn btn--solid btn--sm">Get early access</a>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <h1>Collect contributions without chasing screenshots.</h1>
              <p className="lede">
                Kolekt gives your church, office, school or association one payment link for every
                contribution round. Members pay, their status turns to PAID on its own, and you
                see who has paid and who hasn’t at a glance.
              </p>
              <div className="actions">
                <a href="#start" className="btn btn--solid">Get early access</a>
                <a href="#how" className="btn btn--line">See how it works</a>
              </div>
              <p className="hero-note">
                Pictured: sample collections. Our main example is a UNIUYO department collecting ₦3,000 from each of 100 students.
              </p>
            </div>
            <HeroLedger />
          </div>
        </section>

        {/* Problem */}
        <section id="problem" className="section section--ink">
          <div className="wrap">
            <h2 className="narrow">Paying isn’t the hard part. Keeping track is.</h2>
            <p className="lead-text">
              It happens in churches, offices, schools and student groups alike. Take a UNIUYO
              department that needs ₦3,000 from each of its 100 students. Collecting that money
              should take a day. Instead it takes weeks of messages.
            </p>
            <div className="split">
              <ol className="pains">
                {pains.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>
              <div className="chat" role="img" aria-label="A WhatsApp group where members ask whether their payments were received">
                <p className="bubble bubble--out">
                  Contribution is ₦3,000. Account number: 0123456789. Send your screenshot after paying.
                  <small>Organiser</small>
                </p>
                <p className="bubble">Sent! <small>screenshot_0412.jpg</small></p>
                <p className="bubble">Please did you receive mine?</p>
                <p className="bubble">Who sent ₦3,000 at 4:12 pm? There’s no name on it.</p>
                <p className="bubble">I paid last week. Why am I not on the list?</p>
                <p className="bubble bubble--out">Let me check my bank app again.<small>Organiser</small></p>
              </div>
            </div>
            <p className="closer">
              The problem isn’t that people cannot make payments. Collecting, confirming and
              keeping track of payments from a large group is stressful and disorganised.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="section">
          <div className="wrap">
            <h2 className="narrow">One page per collection. Five steps from request to record.</h2>
            <div className="split split--top">
              <ol className="steps">
                {steps.map((s, i) => (
                  <li key={s.title}>
                    <span className="step-n">{i + 1}</span>
                    <div>
                      <h3>{s.title}</h3>
                      <p>{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="stack">
                <div className="panel">
                  <h3 className="panel-title">New collection</h3>
                  <dl className="fields">
                    <div><dt>Collection name</dt><dd>Departmental Dues</dd></div>
                    <div><dt>Amount</dt><dd>₦3,000 per student</dd></div>
                    <div><dt>Expected contributors</dt><dd>100</dd></div>
                    <div><dt>Payment deadline</dt><dd>Friday, 5:00 pm</dd></div>
                    <div><dt>Payment instructions</dt><dd>Enter your full name and registration number.</dd></div>
                  </dl>
                </div>
                <div className="panel panel--share">
                  <div>
                    <h3 className="panel-title">Ready to share</h3>
                    <p className="link-chip">kolekt.com/pay/departmental-dues</p>
                    <p className="small">Paste it in the WhatsApp group, or let members scan the code.</p>
                  </div>
                  <QrMock />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard */}
        <section id="dashboard" className="section section--white">
          <div className="wrap">
            <h2 className="narrow">Open one screen and know where every naira stands.</h2>
            <div className="dash">
              <div className="dash-head">
                <div>
                  <h3>Departmental Dues</h3>
                  <p className="small">Sample data from a department collection</p>
                </div>
                <div className="stats">
                  <div><span className="stat-n">₦216,000</span><span>collected</span></div>
                  <div><span className="stat-n">72</span><span>paid</span></div>
                  <div><span className="stat-n">28</span><span>not paid</span></div>
                </div>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Details</th><th>Status</th><th>Last activity</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.reg}>
                        <td>{r.name}</td>
                        <td>{r.reg}</td>
                        <td>
                          <span className={r.status === "PAID" ? "pill pill--paid" : "pill pill--wait"}>
                            {r.status}
                          </span>
                        </td>
                        <td>{r.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Calculator */}
        <section className="section">
          <div className="wrap">
            <h2 className="narrow">Run the numbers for your own group.</h2>
            <p className="lead-text">
              Change the amount, the headcount and how many have paid to see what a collection
              page would show you.
            </p>
            <DuesCalculator />
          </div>
        </section>

        {/* Features */}
        <section className="section section--white">
          <div className="wrap">
            <h2 className="narrow">What organisers get</h2>
            <div className="features">
              {features.map((f) => (
                <article key={f.title}>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Audiences */}
        <section className="section">
          <div className="wrap split split--top">
            <h2>Built for any group that contributes together.</h2>
            <dl className="audience">
              {audiences.map(([t, d]) => (
                <div key={t}>
                  <dt>{t}</dt>
                  <dd>{d}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="section section--white">
          <div className="wrap faq">
            <h2>Questions organisers ask</h2>
            <div>
              {faqs.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="start" className="section section--ink cta">
          <div className="wrap cta-inner">
            <h2>Your next collection can run itself.</h2>
            <p className="lead-text">
              Join the early access list. We will tell you when you can create your first
              collection.
            </p>
            <EarlyAccess />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-inner">
          <span className="logo">Kolekt</span>
          <p>Payment collection and tracking for churches, offices, schools, student associations and other groups.</p>
        </div>
      </footer>
    </>
  );
}
