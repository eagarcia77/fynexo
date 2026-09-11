import { ModulePage } from "@/components/module-page";
import { requireUser } from "@/lib/auth/session";

export default async function Page() {
  await requireUser();
  return <ModulePage title="Vendor 360°" description="Proveedores, contactos, documentos y desempeño." actionLabel="+ Nuevo proveedor" />;
}
