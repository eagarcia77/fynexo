import { ModulePage } from "@/components/module-page";
import { requireUser } from "@/lib/auth/session";

export default async function Page() {
  await requireUser();
  return <ModulePage title="Facturas" description="Registro y Three-Way Match contra órdenes y recepción." actionLabel="+ Nueva factura" />;
}
