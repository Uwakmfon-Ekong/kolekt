export default function AuthShell({ children, width = "max-w-[440px]" }: { children: React.ReactNode; width?: string }) {
  return (
    <div className="relative flex min-h-screen justify-center overflow-hidden">
      <div className="pointer-events-none fixed -right-28 -top-32 h-[340px] w-[340px] rounded-full bg-accent/35" />
      <div className="pointer-events-none fixed -bottom-20 -left-24 h-60 w-60 rounded-full bg-card" />
      <div className="pointer-events-none fixed -left-14 top-[38%] h-28 w-28 rounded-full border-[22px] border-accent/30" />
      <main className={`relative z-10 flex w-full ${width} items-start px-5 pb-10 pt-9 md:items-center md:py-14`}>
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
