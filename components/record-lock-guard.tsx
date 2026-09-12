"use client";

import { useEffect, useMemo, useState } from "react";
import { acquireRecordLock, heartbeatRecordLock, releaseRecordLock } from "@/lib/locks/record-lock";

export function RecordLockGuard({ organizationId, entityType, entityId, activity, children }: { organizationId: string; entityType: string; entityId: string; activity: string; children: React.ReactNode }) {
  const sessionId = useMemo(() => crypto.randomUUID(), []);
  const [lockId, setLockId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval> | null = null;
    let acquired: string | null = null;

    (async () => {
      const { data, error } = await acquireRecordLock({ organizationId, entityType, entityId, activity, sessionId });
      if (!alive) return;
      if (error) {
        setError(error.message || "Este registro está siendo utilizado por otro usuario.");
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      acquired = row?.id || row;
      if (!acquired) {
        setError("No fue posible obtener el bloqueo del registro.");
        return;
      }
      setLockId(acquired);
      timer = setInterval(() => heartbeatRecordLock(acquired!, sessionId), 30000);
    })();

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
      if (acquired) void releaseRecordLock(acquired, sessionId);
    };
  }, [organizationId, entityType, entityId, activity, sessionId]);

  if (error) return <div className="notice-box" role="status"><b>Registro en uso.</b><br />{error} Puede consultarlo, pero no editarlo hasta que se libere.</div>;
  if (!lockId) return <div className="notice-box">Obteniendo bloqueo seguro del registro…</div>;
  return <>{children}</>;
}
