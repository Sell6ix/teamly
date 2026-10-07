import { JoinDeepLink } from "@/components/game-lobby";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <JoinDeepLink code={code} />;
}
