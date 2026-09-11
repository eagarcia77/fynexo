import { ModulePage } from "@/components/module-page";
import { requireUser } from "@/lib/auth/session";

export default async function Page() {
  await requireUser();
  return <ModulePage title="FYNEXO Budget" description="Partidas, fondos, transferencias y disponibilidad presupuestaria." actionLabel="+ Nueva partida" />;
}
