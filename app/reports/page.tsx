import { ModulePage } from "@/components/module-page";
import { requireUser } from "@/lib/auth/session";

export default async function Page() {
  await requireUser();
  return <ModulePage title="FYNEXO Analytics" description="Informes financieros, filtros y exportaciones." actionLabel="Crear informe" />;
}
