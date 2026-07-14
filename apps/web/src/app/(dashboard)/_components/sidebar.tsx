"use client";

import {
  Bot,
  CalendarDays,
  ChartNoAxesCombined,
  FileText,
  House,
  Layers3,
  Library,
  LogOut,
  Megaphone,
  PackageSearch,
  Route,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { getSupabase } from "@/shared/lib/supabase";
import { clearApiCache } from "@/shared/lib/api-client";

const links = [
  ["/", "Hoje", House],
  ["/calendar", "Calendário", CalendarDays],
  ["/content", "Conteúdo", Megaphone],
  ["/documents", "Documentos", FileText],
  ["/audiences", "Públicos", Users],
  ["/features", "Funcionalidades", PackageSearch],
  ["/outreach", "Onde chegar", Route],
  ["/campaigns", "Campanhas", Layers3],
  ["/results", "Resultados", ChartNoAxesCombined],
  ["/ai", "Consultoria IA", Bot],
  ["/ai/training", "Treinamento", Sparkles],
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  async function logout() {
    clearApiCache();
    await getSupabase().auth.signOut();
    router.replace("/login");
  }
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark small">LC</div>
        <div>
          <strong>Lucro Caseiro</strong>
          <span>Central de marketing</span>
        </div>
      </div>
      <nav>
        {links.map(([href, label, Icon]) => (
          <Link key={href} href={href} className={pathname === href ? "active" : ""}>
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-note">
        <Library size={18} />
        <p>
          <strong>Uma única fonte de verdade.</strong>
          <br />
          Ideias, decisões e aprendizados conectados.
        </p>
      </div>
      <button className="sidebar-logout" onClick={() => void logout()}>
        <LogOut size={17} />
        Sair
      </button>
    </aside>
  );
}
