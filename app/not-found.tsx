import Link from "next/link";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-bg px-5">
      <div className="w-full max-w-sm rounded-[30px] border border-accent/30 bg-white p-8 text-center shadow-soft">
        <div className="flex justify-center"><Logo size={40} /></div>
        <span className="mx-auto mt-6 grid h-14 w-14 place-items-center rounded-2xl bg-card text-primary"><Icon name="inbox" className="h-7 w-7" /></span>
        <h1 className="mt-4 text-xl font-extrabold">We couldn’t find that page</h1>
        <p className="mt-2 text-sm text-muted">The link may be wrong, or the collection or receipt no longer exists.</p>
        <Link href="/" className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-bold text-white shadow-cta">Go to Kolekt</Link>
      </div>
    </main>
  );
}
