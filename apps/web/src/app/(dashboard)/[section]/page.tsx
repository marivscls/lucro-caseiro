import { notFound } from "next/navigation";

import { ResourceBoard } from "@/features/marketing/resource-board";
import type { ResourceKind } from "@/shared/types";

const routes: Record<string, ResourceKind> = {
  content: "content",
  audiences: "audience",
  interviews: "interview",
  features: "feature",
  outreach: "outreach",
  campaigns: "campaign",
  results: "performance",
  topics: "topic",
};

export default async function SectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ edit?: string | string[] }>;
}) {
  const { section } = await params;
  const { edit } = await searchParams;
  const kind = routes[section];
  if (!kind) notFound();
  return (
    <ResourceBoard
      initialEditingId={typeof edit === "string" ? edit : undefined}
      kind={kind}
    />
  );
}
