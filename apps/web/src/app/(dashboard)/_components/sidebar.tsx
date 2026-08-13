"use client";

import { Bot, ChartNoAxesCombined, House, Library, LogOut, PenTool } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { getSupabase } from "@/shared/lib/supabase";
import { clearLocalUserData } from "@/shared/lib/api-client";
import { useBrand } from "@/app/brand-provider";

const links = [
  ["/", "Hoje", House, ["/"]],
  [
    "/produce",
    "Produzir",
    PenTool,
    [
      "/produce",
      "/content",
      "/campaigns",
      "/calendar",
      "/video-prompts",
      "/video-editor",
    ],
  ],
  [
    "/library",
    "Biblioteca",
    Library,
    [
      "/library",
      "/documents",
      "/audiences",
      "/features",
      "/topics",
      "/interviews",
      "/outreach",
    ],
  ],
  ["/results", "Resultados", ChartNoAxesCombined, ["/results"]],
  ["/ai", "Selenita", Bot, ["/ai", "/ai/training"]],
] as const;

export function Sidebar() {
  const brand = useBrand();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  async function logout() {
    clearLocalUserData();
    queryClient.clear();
    await getSupabase().auth.signOut();
    router.replace("/login");
  }
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark small">
          {brand.appName
            .split(/\s+/)
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div>
          <strong>{brand.appName}</strong>
          <span>Central de marketing</span>
        </div>
      </div>
      <nav>
        {links.map(([href, label, Icon, paths]) => (
          <Link
            key={href}
            href={href}
            className={paths.some((path) => path === pathname) ? "active" : ""}
          >
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
