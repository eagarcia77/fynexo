import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function when(value:string){return new Intl.DateTimeFormat("es-PR",{dateStyle:"medium",timeStyle:"short",timeZone:"America/Puerto_Rico"}).format(new Date(value))}
function safeMetadata(value:any){
 if(!value||typeof value!=="object") return "—";
 const blocked=/token|secret|password|credential|authorization|cookie|session|key/i;
 const entries=Object.entries(value).filter(([key])=>!blocked.test(key)).slice(0,6);
 if(!entries.length) return "Detalles protegidos";
 return entries.map(([key,val])=>`${key}: ${typeof val==="object"?"[detalle]":String(val).slice(0,80)}`).join(" · ");
}

export default async function Page(){
 const {userId}=await requireUser(); const supabase=await createClient();
 const {data:m}=await supabase.from("organization_memberships").select("organization_id").eq("user_id",userId).eq("is_active",true).limit(1).maybeSingle(); const org=m?.organization_id;
 let events:any[]=[]; let profiles:any[]=[]; if(org){
  const [{data:e},{data:p}]=await Promise.all([
   supabase.from("audit_events").select("id,user_id,event_type,entity_type,entity_id,metadata,created_at").eq("organization_id",org).order("created_at",{ascending:false}).limit(250),
   supabase.from("profiles").select("id,full_name,email")
  ]); events=e||[]; profiles=p||[];
 }
 const pmap=new Map(profiles.map((p:any)=>[p.id,p]));
 const counts=new Map<string,number>(); for(const e of events) counts.set(e.event_type,(counts.get(e.event_type)||0)+1);
 const common=[...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6);
 return <AppShell title="FYNEXO Audit" subtitle="Bitácora inmutable de operaciones, seguridad y cambios financieros.">
  <section className="dashboard-grid">
   <article className="panel"><p className="eyebrow">Eventos</p><h2>{events.length}</h2><p className="muted">Últimos eventos disponibles para la organización.</p></article>
   <article className="panel span-2"><p className="eyebrow">Actividad principal</p><h2>Tipos de evento</h2>{common.length?<div className="mini-stats">{common.map(([name,count])=><span key={name}>{name}<b>{count}</b></span>)}</div>:<p className="muted">Aún no hay actividad registrada.</p>}</article>
  </section>
  <section className="panel top-gap">
   <div className="panel-header"><div><p className="eyebrow">Audit trail</p><h2>Últimos movimientos</h2></div><span className="status-pill">Solo lectura</span></div>
   {events.length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Fecha</th><th>Usuario</th><th>Evento</th><th>Entidad</th><th>ID</th><th>Metadata</th></tr></thead><tbody>{events.map((e:any)=>{const p=pmap.get(e.user_id);return <tr key={e.id}><td>{when(e.created_at)}</td><td><b>{p?.full_name||"Sistema"}</b><small>{p?.email||e.user_id||"—"}</small></td><td><span className="status-pill">{e.event_type}</span></td><td>{e.entity_type||"—"}</td><td><small>{e.entity_id||"—"}</small></td><td><small>{safeMetadata(e.metadata)}</small></td></tr>})}</tbody></table></div>:<p className="muted">Aún no hay eventos de auditoría.</p>}
  </section>
 </AppShell>
}
