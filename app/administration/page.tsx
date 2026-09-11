import { ModulePage } from "@/components/module-page";
import { requireUser } from "@/lib/auth/session";

export default async function Page() {
  await requireUser();
  return <ModulePage title="FYNEXO Control Center" description="Usuarios, roles, permisos, workflows, locks y configuración." actionLabel="Administrar" />;
}
