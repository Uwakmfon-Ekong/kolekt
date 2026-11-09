import {
  ArrowLeft, BarChart3, Bell, Calendar, Camera, Check, ChevronRight, Church, Copy, Eye, EyeOff, GraduationCap,
  Hash, HeartHandshake, Home, Inbox, Layers, Link2, Lock, LogOut, Mail, MoreVertical, Phone, Plus, Search,
  Share2, ShieldCheck, TrendingUp, User, Users, Wallet, X, Globe2, Pencil, type LucideIcon,
} from "lucide-react";

const icons = {
  home: Home, layers: Layers, plus: Plus, chart: BarChart3, user: User, bell: Bell, trend: TrendingUp,
  wallet: Wallet, church: Church, school: GraduationCap, heart: HeartHandshake, more: MoreVertical,
  chevron: ChevronRight, back: ArrowLeft, search: Search, x: X, camera: Camera, check: Check,
  calendar: Calendar, lock: Lock, mail: Mail, phone: Phone, hash: Hash, eye: Eye, eyeOff: EyeOff,
  copy: Copy, share: Share2, logout: LogOut, link: Link2, users: Users, inbox: Inbox, shield: ShieldCheck, globe: Globe2, edit: Pencil,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

export default function Icon({ name, className = "h-5 w-5", width = 2 }: { name: IconName; className?: string; width?: number }) {
  const Cmp = icons[name];
  return <Cmp className={className} strokeWidth={width} aria-hidden="true" />;
}
