// Fade-in wrapper used by each route group's template.tsx (templates remount on every navigation).
export default function PageEnter({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
