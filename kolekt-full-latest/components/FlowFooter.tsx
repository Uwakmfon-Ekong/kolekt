export default function FlowFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-bg via-bg/95 to-transparent px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-8">
      <div className={`mx-auto grid max-w-xl gap-3 ${className}`}>{children}</div>
    </div>
  );
}
