import { notFound } from "next/navigation";

import { ResourceBoard } from "@/features/marketing/resource-board";
import type { ResourceKind } from "@/shared/types";

const routes: Record<string, ResourceKind> = {
  content: "content",
  audiences: "audience",
  features: "feature",
  outreach: "outreach",
  campaigns: "campaign",
  results: "performance",
  topics: "topic",
};

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const kind = routes[section];
  if (!kind) notFound();
  return <ResourceBoard kind={kind} />;
}
