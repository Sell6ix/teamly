import { PersonPage } from "@/components/person-page";

export default async function PersonRoute({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  const { personId } = await params;
  return <PersonPage personId={personId} />;
}
