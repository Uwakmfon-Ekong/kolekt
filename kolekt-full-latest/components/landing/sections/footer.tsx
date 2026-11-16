import Link from "next/link";
import { FOOTER, ROUTES } from "../content";
import { Logo } from "../ui/logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: ROUTES.login },
      { label: "Create an account", href: ROUTES.signup },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[#EFE4D4]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-[#6B6178]">{FOOTER.tagline}</p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-[14px] font-bold text-[#1A1028]">{col.title}</p>
            <ul className="mt-4 space-y-3 text-[14px] text-[#6B6178]">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("#") ? (
                    <a href={l.href} className="hover:text-[#1A1028]">{l.label}</a>
                  ) : (
                    <Link href={l.href} className="hover:text-[#1A1028]">{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      
    </footer>
  );
}
