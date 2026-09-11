import { ModulePage } from "@/components/module-page";
import { requireUser } from "@/lib/auth/session";

export default async function Page() {
  await requireUser();
  return <ModulePage title="FYNEXO Pay · Comprobantes" description="Obligaciones y comprobantes de pago." actionLabel="+ Nuevo comprobante" />;
}
