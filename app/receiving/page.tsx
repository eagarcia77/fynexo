import { ModulePage } from "@/components/module-page";
import { requireUser } from "@/lib/auth/session";

export default async function Page() {
  await requireUser();
  return <ModulePage title="FYNEXO Receive" description="Recepción total y parcial de bienes y servicios." actionLabel="+ Registrar recepción" />;
}
