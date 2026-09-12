import { createClient } from "@/lib/supabase/client";

export type RecordLock = {
  id: string;
  entity_type: string;
  entity_id: string;
  activity: string;
  user_id: string;
  expires_at: string;
};

export async function acquireRecordLock(params: {
  organizationId: string;
  entityType: string;
  entityId: string;
  activity: string;
  sessionId: string;
}) {
  const supabase = createClient();
  return supabase.rpc("acquire_record_lock", {
    p_org: params.organizationId,
    p_entity_type: params.entityType,
    p_entity_id: params.entityId,
    p_activity: params.activity,
    p_session_id: params.sessionId,
    p_ttl_seconds: 120,
  });
}

export async function heartbeatRecordLock(lockId: string, sessionId: string) {
  const supabase = createClient();
  return supabase.rpc("heartbeat_record_lock", {
    p_lock_id: lockId,
    p_session_id: sessionId,
    p_ttl_seconds: 120,
  });
}

export async function releaseRecordLock(lockId: string, sessionId: string) {
  const supabase = createClient();
  return supabase.rpc("release_record_lock", {
    p_lock_id: lockId,
    p_session_id: sessionId,
  });
}
