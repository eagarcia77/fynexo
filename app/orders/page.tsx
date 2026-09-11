import { ModulePage } from "@/components/module-page";
import { requireUser } from "@/lib/auth/session";

export default async function Page() {
  await requireUser();
  return <ModulePage title="FYNEXO Orders" description="Órdenes de compra y control de emisión." actionLabel="+ Nueva orden" />;
}
