import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function money(value:number){return new Intl.NumberFormat("es-PR",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value||0)}

export default async function Page(){
 const {userId}=await requireUser(); const supabase=await createClient();
 const {data:m}=await supabase.from("organization_memberships").select("organization_id").eq("user_id",userId).eq("is_active",true).limit(1).maybeSingle(); const org=m?.organization_id;
 let fy:any=null; if(org){const {data}=await supabase.from("fiscal_years").select("id,code,name").eq("organization_id",org).eq("status","OPEN").order("starts_on",{ascending:false}).limit(1).maybeSingle(); fy=data;}
 let execution:any[]=[]; let integrity:any[]=[]; let pipeline:any=null; let accounts:any[]=[];
 if(org&&fy?.id){
  const [e,i,p,a]=await Promise.all([
   supabase.from("v_budget_execution_report").select("budget_line_id,account_id,original_budget,net_transfers,committed,obligated,expended,available").eq("organization_id",org).eq("fiscal_year_id",fy.id),
   supabase.from("v_financial_integrity").select("budget_line_id,integrity_status,ledger_revised_budget,available,expected_available").eq("organization_id",org).eq("fiscal_year_id",fy.id),
   supabase.from("v_document_pipeline_summary").select("requisitions,purchase_orders,receipts,invoices,vouchers,payments,matched_invoices,match_exceptions").eq("organization_id",org).maybeSingle(),
   supabase.from("accounts").select("id,code,name").eq("organization_id",org)
  ]); execution=e.data||[]; integrity=i.data||[]; pipeline=p.data; accounts=a.data||[];
 }
 const amap=new Map(accounts.map((a:any)=>[a.id,a]));
 const totals=execution.reduce((s:any,r:any)=>({original:s.original+Number(r.original_budget||0),transfers:s.transfers+Number(r.net_transfers||0),committed:s.committed+Number(r.committed||0),obligated:s.obligated+Number(r.obligated||0),expended:s.expended+Number(r.expended||0),available:s.available+Number(r.available||0)}),{original:0,transfers:0,committed:0,obligated:0,expended:0,available:0});
 const revised=totals.original+totals.transfers; const pass=integrity.filter((r:any)=>r.integrity_status==="PASS").length; const review=integrity.length-pass;
 return <AppShell title="FYNEXO Analytics" subtitle="Informes financieros y controles de integridad basados en el ledger." fiscalYearLabel={fy?`FY ${fy.code}`:"Sin año fiscal abierto"}>
  <section className="kpi-grid">
   <KpiCard label="Presupuesto vigente" value={money(revised)} detail={`${execution.length} partidas`} />
   <KpiCard label="Disponible" value={money(totals.available)} detail={`${revised?((totals.available/revised)*100).toFixed(1):"0.0"}% restante`} tone="success" />
   <KpiCard label="Comprometido + obligado" value={money(totals.committed+totals.obligated)} detail={`Comp. ${money(totals.committed)} · Obl. ${money(totals.obligated)}`} />
   <KpiCard label="Ejecutado" value={money(totals.expended)} detail={`${revised?((totals.expended/revised)*100).toFixed(1):"0.0"}% del vigente`} />
  </section>

  <div className="dashboard-grid">
   <section className="panel span-2">
    <p className="eyebrow">Integridad financiera</p><h2>Control del Budget Ledger</h2>
    <div className={review?"error-box":"success-box"}>{review?`${review} partida(s) requieren revisión.`:`PASS · ${pass} partida(s) reconciliadas correctamente.`}</div>
    <p className="muted">FYNEXO compara presupuesto original/revisado, compromisos, obligaciones, gastos y disponible contra el valor esperado derivado del ledger.</p>
   </section>
   <section className="panel">
    <p className="eyebrow">Pipeline</p><h2>Documentos</h2>
    <ul className="task-list">
     <li><span>Requisiciones</span><b>{pipeline?.requisitions||0}</b></li><li><span>Órdenes</span><b>{pipeline?.purchase_orders||0}</b></li><li><span>Recepciones</span><b>{pipeline?.receipts||0}</b></li><li><span>Facturas</span><b>{pipeline?.invoices||0}</b></li><li><span>Comprobantes</span><b>{pipeline?.vouchers||0}</b></li><li><span>Pagos</span><b>{pipeline?.payments||0}</b></li>
    </ul>
   </section>
  </div>

  <section className="panel top-gap">
   <div className="panel-header"><div><p className="eyebrow">Ejecución por partida</p><h2>{fy?.name||"Presupuesto"}</h2></div><span className="status-pill">Three-Way Match: {pipeline?.matched_invoices||0} matched · {pipeline?.match_exceptions||0} excepciones</span></div>
   {execution.length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Cuenta</th><th className="num">Original</th><th className="num">Transferencias</th><th className="num">Comprometido</th><th className="num">Obligado</th><th className="num">Ejecutado</th><th className="num">Disponible</th><th>Integridad</th></tr></thead><tbody>{execution.map((r:any)=>{const a=amap.get(r.account_id);const c=integrity.find((x:any)=>x.budget_line_id===r.budget_line_id);return <tr key={r.budget_line_id}><td><b>{a?.code||"—"}</b><small>{a?.name||"Sin cuenta"}</small></td><td className="num">{money(Number(r.original_budget))}</td><td className="num">{money(Number(r.net_transfers))}</td><td className="num">{money(Number(r.committed))}</td><td className="num">{money(Number(r.obligated))}</td><td className="num">{money(Number(r.expended))}</td><td className="num"><b>{money(Number(r.available))}</b></td><td><span className="status-pill">{c?.integrity_status||"—"}</span></td></tr>})}</tbody></table></div>:<p className="muted">No hay partidas para el año fiscal abierto.</p>}
  </section>
 </AppShell>
}
