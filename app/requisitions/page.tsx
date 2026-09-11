import { ModulePage } from "@/components/module-page";
import { requireUser } from "@/lib/auth/session";

export default async function Page() {
  await requireUser();
  return <ModulePage title="FYNEXO Procure" description="Requisiciones, cotizaciones y aprobaciones." actionLabel="+ Nueva requisición" />;
}
