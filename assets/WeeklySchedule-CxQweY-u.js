import{j as t,r as _,a as y,S as v,R as P,w as A}from"./index-DT5lBi1O.js";import{f as S}from"./formatters-D8wubVEq.js";import{S as M,M as F,U as O}from"./utensils-CWqqtiB1.js";const J=({schedule:x,onBack:u})=>t.jsxs("div",{className:"flex flex-col gap-0 font-display min-h-0 print:gap-0",children:[t.jsxs("div",{className:"print-container bg-white w-full max-w-[297mm] mx-auto p-8 md:p-12 shadow-2xl border border-slate-200 rounded-2xl overflow-hidden mb-0 print:mb-0 print:p-0",children:[t.jsxs("div",{className:"relative flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b-2 border-slate-100 gap-6",children:[t.jsxs("div",{className:"flex items-center gap-4",children:[t.jsx("img",{src:"/icono.svg",alt:"INCN Logo",className:"h-16 w-auto print:h-20 object-contain"}),t.jsxs("div",{className:"flex flex-col",children:[t.jsx("h1",{className:"text-3xl print:text-4xl font-black text-slate-900 tracking-tight uppercase leading-none mb-1",children:"Programa de Actividades"}),t.jsx("p",{className:"text-slate-500 print:text-sm font-medium leading-none mt-1 uppercase tracking-widest",children:"Semana de Investigación del Medico Residente 2026"})]})]}),t.jsxs("div",{className:"flex flex-col items-end gap-1 print:absolute print:top-0 print:right-0",children:[t.jsx("span",{className:"text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none",children:"Nombre del Asistente"}),t.jsx("div",{className:"w-72 h-8 bg-slate-50 border-b-2 border-slate-200 border-dashed rounded-t-lg"})]})]}),!x||x.length===0?t.jsx("div",{className:"flex items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-slate-500 font-bold text-xl uppercase tracking-widest",children:"No hay actividades programadas para mostrar."}):t.jsx("div",{className:"grid grid-cols-1 md:grid-cols-5 print:grid-cols-5 gap-0 divide-x divide-slate-100 h-full border border-slate-200",children:x.map((b,C)=>t.jsxs("div",{className:"flex flex-col p-3 first:pl-2 last:pr-2 border-r last:border-r-0 border-slate-200 h-full print:pt-3",children:[t.jsxs("div",{className:"mb-4 pb-2 border-b-2 border-slate-100 shrink-0 h-[60px] flex flex-col justify-end",children:[t.jsx("span",{className:`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider mb-1 w-fit ${R(b.dayNumber)}`,children:S(b.date)}),t.jsx("h3",{className:`text-sm print:text-[10px] font-black uppercase tracking-tight leading-snug line-clamp-2 pb-0.5 ${U(b.dayNumber)}`,children:b.label})]}),t.jsx("div",{className:"flex flex-col gap-3 flex-grow overflow-visible",children:b.sessions.map(r=>t.jsxs("div",{className:"flex gap-2 group cursor-pointer break-inside-avoid",children:[t.jsx("div",{className:"size-5 print:size-4 rounded-full border-2 border-slate-400 group-hover:border-primary shrink-0 mt-0.5 transition-all flex items-center justify-center bg-white shadow-sm print:shadow-none print:border-black",children:t.jsx("div",{className:"size-2 rounded-full bg-primary opacity-0 group-active:opacity-100 transition-opacity print:hidden"})}),t.jsxs("div",{className:"flex flex-col min-w-0",children:[t.jsx("span",{className:`text-[10px] font-black mb-0 ${q(b.dayNumber)} print:text-black`,children:r.timeStart}),t.jsx("p",{className:"text-[11px] print:text-[10px] font-bold text-slate-800 leading-tight mb-0.5 line-clamp-2 print:text-black print:line-clamp-none",children:r.title}),r.speakers.length>0&&t.jsx("p",{className:"text-[9px] text-slate-500 italic truncate print:text-gray-600 print:whitespace-normal",children:r.speakers[0].name})]})]},r.id))})]},b.dayNumber||C))}),t.jsx("div",{className:"mt-8 pt-4 border-t border-slate-100 flex flex-row justify-start items-center text-[9px] text-slate-400 gap-4",children:t.jsxs("div",{className:"flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-200/50",children:[t.jsx("span",{className:"material-symbols-outlined text-primary text-sm",children:"info"}),t.jsx("span",{className:"font-medium text-slate-500",children:"Checklist de las ponencias del evento!."})]})})]}),t.jsx("style",{children:`
        @media print {
          @page { 
            size: landscape; 
            margin: 0; 
          }
          
          /* Force hide everything not inside printable-area */
          html, body {
            background-color: white !important;
            background-image: none !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 100% !important;
          }

          /* Force hide everything not inside printable-area */
          body > *:not(#printable-area) {
              display: none !important;
          }

          .fixed:not(#printable-area), 
          .no-print, 
          footer, 
          nav, 
          header,
          .bg-black/40 {
            display: none !important;
          }
 
          /* Reset body/html for print context */
          html, body {
            visibility: visible !important;
            display: block !important;
            background: white !important;
            color: black !important;
            height: auto !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
 
          #printable-area { 
            display: block !important; 
            width: 297mm !important;
            height: 210mm !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            background: white !important;
            z-index: 99999 !important;
            overflow: visible !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
          }
 
          /* Ensure root div within printable-area fills the space */
          #printable-area > div {
            min-height: 100% !important;
            width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
          }

          .print-container { 
            /* Main Content Wrapper */
            box-shadow: none !important; 
            border: none !important; 
            margin: 0 !important; 
            padding: 10mm !important;
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            background: white !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            flex: 1 !important;
          }

          /* Header Styling - Force visibility */
          .print-container > div:first-child {
             margin-bottom: 5mm !important;
             flex-shrink: 0 !important;
          }

          /* Grid Layout Fixes */
          .grid { 
            display: grid !important;
            grid-template-columns: repeat(5, 1fr) !important;
            gap: 2mm !important;
            flex: 1 !important;
            width: 100% !important;
            align-content: stretch !important;
            margin-bottom: 2mm !important;
          }

          /* Ensure grid items are visible */
          .grid > div {
             border-right: 1px solid #e2e8f0 !important;
             padding: 3mm 4mm 0 4mm !important;
             height: auto !important;
             display: flex !important;
             flex-direction: column !important;
          }
          .grid > div:last-child {
             border-right: none !important;
          }

          /* Font Size Increases */
          h1 { font-size: 28pt !important; line-height: 1.2 !important; color: black !important; }
          h3 { font-size: 10pt !important; margin-bottom: 2mm !important; color: black !important; line-height: 1.2 !important; }
          span { color: black !important; }
          p { color: black !important; }
          
          /* Specific Text Adjustments */
          .text-[9px] { font-size: 9pt !important; }
          .text-[10px] { font-size: 10pt !important; }
          .text-[11px] { font-size: 11pt !important; line-height: 1.3 !important; }
          
          /* Force colors for day badges (optional, but good for clarity) */
          .bg-blue-50 { background-color: #eff6ff !important; color: #2563eb !important; }
          /* Add other colors if needed, or rely on !important above */

          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            color-adjust: exact !important;
          }
        }
      `})]}),R=x=>{switch(x){case 1:return"bg-blue-50 text-blue-600";case 2:return"bg-indigo-50 text-indigo-600";case 3:return"bg-teal-50 text-teal-600";case 4:return"bg-violet-50 text-violet-600";default:return"bg-rose-50 text-rose-600"}},U=x=>{switch(x){case 1:return"text-blue-900";case 2:return"text-indigo-900";case 3:return"text-teal-900";case 4:return"text-violet-900";default:return"text-rose-900"}},q=x=>{switch(x){case 1:return"text-blue-600";case 2:return"text-indigo-600";case 3:return"text-teal-600";case 4:return"text-violet-600";default:return"text-rose-600"}},K=()=>{const[x,u]=_.useState([]),[b,C]=_.useState([]),[r,w]=_.useState(!0),[o,n]=_.useState(null),k=_.useCallback(async()=>{w(!0);try{const[h,e]=await Promise.all([y.program.getConfig(),y.program.getActivities()]),s=h.days||[];if(C(s),s.length>0){const g=s.map((p,l)=>{const c=l+1,d=p.date,i=e.filter(a=>a.startTime&&a.startTime.startsWith(d)).map(a=>{const m=new Date(a.startTime),N=new Date(a.endTime),I=m.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:!1}),W=N.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:!1}),L=[];(a.speaker_id||a.speaker_name)&&L.push({id:a.speaker_id||"spk-unknown",name:a.speaker_name||"Desconocido",role:"Ponente",imageUrl:a.speaker_photo});let z="blue";const T=a.type?.toLowerCase()||"ponencia";return T==="general"&&(z="slate"),T==="ceremonia"&&(z="amber"),{id:a.id,is_live:a.is_live,timeStart:I,timeEnd:W,title:a.title,category:a.classification_label||(T==="ponencia"?"Conferencia":T.charAt(0).toUpperCase()+T.slice(1)),categoryColor:z,speakers:L,location:a.location?.name||"Por definir",virtualLocation:a.location?.urlLink||"",status:a.status?a.status.charAt(0).toUpperCase()+a.status.slice(1):"Borrador",description:a.description||"",rawEndTime:a.endTime,show_description:a.show_description,blockId:a.block_id,locationId:a.location_id,linkedWorkId:a.external_paper_id}});return i.sort((a,m)=>a.timeStart.localeCompare(m.timeStart)),{dayNumber:c,date:p.date,label:p.label||`Día ${c}`,dayId:p.date,sessions:i,shifts:p.shifts||[]}});u(g);const j=g.map(p=>{const c=h.blocks.filter(d=>d.date===p.date).map(d=>{const f=p.sessions.filter(i=>i.blockId===d.id);return{...d,activities:f}});return c.sort((d,f)=>d.startTime.localeCompare(f.startTime)),{dayNumber:p.dayNumber,blocks:c}});u(p=>p.map(l=>{const c=j.find(d=>d.dayNumber===l.dayNumber);return{...l,blocks:c?c.blocks:[]}}))}else u([])}catch(h){console.error("Error loading program data",h),n(h)}finally{w(!1)}},[]);return _.useEffect(()=>{k()},[k]),{scheduleData:x,loading:r,error:o,refresh:k,days:b,updateSession:async(h,e,s={})=>{try{const g=b.find((a,m)=>m+1===h);if(!g)return;const j=g.date,p=`${j}T${e.timeStart}:00`,l=`${j}T${e.timeEnd}:00`,c={title:e.title,description:e.description,startTime:p,endTime:l,status:e.status?e.status.toLowerCase():"borrador",show_description:e.show_description},f=(await y.program.getConfig()).blocks.filter(a=>a.date===j);let i=e.blockId;if(i){const a=f.find(m=>m.id===i);if(a){const m=a.startTime.slice(0,5),N=a.endTime.slice(0,5);(e.timeStart<m||e.timeEnd>N)&&(i=null)}}if(!i){const a=f.find(m=>{const N=m.startTime.slice(0,5),I=m.endTime.slice(0,5);return e.timeStart>=N&&e.timeEnd<=I});a&&(i=a.id)}i&&(c.block_id=i),e.locationId&&(c.location_id=e.locationId),e.type&&(c.type=e.type),e.category&&(c.classification_label=e.category),e.speakers&&e.speakers.length>0&&(c.speaker_id=e.speakers[0].id),e.linkedWorkId&&(c.external_paper_id=e.linkedWorkId),await y.program.updateActivity(e.id,c),s.silent||(await v.fire({icon:"success",title:"Actividad Actualizada",timer:1500,showConfirmButton:!1,toast:!0,position:"top-end"}),await k())}catch(g){console.error("Update failed",g),v.fire({icon:"error",title:"Error al actualizar",text:g.response?.data?.detail||g.message})}},addSession:async(h,e)=>{try{const s=b.find((i,a)=>a+1===h);if(!s)return;const g=s.date,j=`${g}T${e.timeStart}:00`,p=`${g}T${e.timeEnd}:00`;let l=e.blockId||null;const d=(await y.program.getConfig()).blocks.filter(i=>i.date===g);if(l){const i=d.find(a=>a.id===l);if(i){const a=i.startTime.slice(0,5),m=i.endTime.slice(0,5);(e.timeStart<a||e.timeEnd>m)&&(console.warn("Hora fuera del bloque seleccionado, el backend asignara automaticamente."),l=null)}else l=null}if(!l){const i=d.find(a=>{const m=a.startTime.slice(0,5),N=a.endTime.slice(0,5);return e.timeStart>=m&&e.timeEnd<=N});i&&(l=i.id)}if(!l&&d.length>0&&(l=d[0].id),!l){await v.fire({icon:"warning",title:"Sin Bloques Configurados",text:"No hay Bloques Horarios para este dia. Crea al menos un bloque desde Configuracion > Programa para poder agregar actividades."});return}const f={title:e.title,description:e.description,startTime:j,endTime:p,status:e.status?.toLowerCase()||"borrador",type:e.type||"ponencia",block_id:l,location_id:e.locationId||null,show_description:e.show_description};e.speakers&&e.speakers.length>0&&(f.speaker_id=e.speakers[0].id),e.category&&(f.classification_label=e.category),e.linkedWorkId&&(f.external_paper_id=e.linkedWorkId),await y.program.createActivity(f),await v.fire({icon:"success",title:"Actividad Creada",timer:1500,showConfirmButton:!1,toast:!0,position:"top-end"}),await k()}catch(s){console.error("Create failed",s),v.fire({icon:"error",title:"Error al crear",text:s.response?.data?.detail||s.message})}},deleteSession:async(h,e)=>{try{await y.program.deleteActivity(e),await v.fire({icon:"success",title:"Eliminado",text:"La actividad ha sido eliminada correctamente.",timer:1500,showConfirmButton:!1}),k()}catch(s){console.error(s),v.fire({icon:"error",title:"Error al eliminar",text:s.message})}},moveActivity:async(h,e)=>{try{await y.program.moveActivity(h,e),await v.fire({icon:"success",title:"Actividad Movida",timer:1200,showConfirmButton:!1,toast:!0,position:"top-end"}),await k()}catch(s){console.error("Move failed",s),v.fire({icon:"error",title:"Error al mover",text:s.response?.data?.detail||s.message})}}}},Q=({schedule:x,shiftFilter:u="all"})=>{const b=r=>{switch(r){case 1:return{accent:"bg-blue-600",border:"border-blue-200",text:"text-blue-700",light:"bg-blue-50",header:"bg-blue-600"};case 2:return{accent:"bg-indigo-600",border:"border-indigo-200",text:"text-indigo-700",light:"bg-indigo-50",header:"bg-indigo-600"};case 3:return{accent:"bg-teal-600",border:"border-teal-200",text:"text-teal-700",light:"bg-teal-50",header:"bg-teal-600"};case 4:return{accent:"bg-violet-600",border:"border-violet-200",text:"text-violet-700",light:"bg-violet-50",header:"bg-violet-600"};default:return{accent:"bg-rose-600",border:"border-rose-200",text:"text-rose-700",light:"bg-rose-50",header:"bg-rose-600"}}},C=(r,w,o)=>r.length===0?t.jsxs("div",{className:"text-center py-6 opacity-60 flex flex-col items-center gap-1 text-white",children:[t.jsx(A,{size:14}),t.jsx("span",{className:"text-[9px] uppercase tracking-tighter",children:"Sin programar"})]}):t.jsx("div",{className:"space-y-3",children:r.map(n=>t.jsxs("div",{className:"p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all relative group shadow-md flex flex-col gap-1 overflow-hidden",children:[t.jsx("div",{className:`absolute left-0 top-0 bottom-0 w-1 ${o.accent} opacity-70 group-hover:opacity-100 transition-opacity`}),n.is_live&&t.jsxs("div",{className:"flex items-center gap-1 mb-1 animate-pulse",children:[t.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_red]"}),t.jsx("span",{className:"text-[8px] font-bold text-red-500 uppercase tracking-widest",children:"En Vivo"})]}),t.jsx("div",{className:"flex justify-between items-start gap-2",children:t.jsxs("span",{className:`text-[10px] font-black tracking-tighter ${o.light} ${o.text} px-2 py-0.5 rounded font-manrope border border-current/10`,children:[n.timeStart," — ",n.timeEnd||"..."]})}),t.jsx("h4",{className:"font-manrope font-extrabold text-[11px] mt-1 leading-tight text-slate-800 group-hover:text-black transition-all line-clamp-3 uppercase",children:n.title}),n.speakers&&n.speakers.length>0&&t.jsx("p",{className:"text-[9px] text-slate-400 mt-1 font-bold truncate italic opacity-90 font-manrope uppercase tracking-tighter",children:n.speakers[0].name})]},n.id))});return t.jsx("div",{className:"space-y-8",children:t.jsx("div",{className:"grid grid-cols-1 md:grid-cols-5 gap-px bg-white/10 rounded-xl overflow-hidden shadow-2xl border border-white/10",children:x.map(r=>{const w=b(r.dayNumber);return t.jsxs("div",{className:"bg-[#050505]/95 flex flex-col min-h-[500px]",children:[t.jsxs("div",{className:`p-6 ${w.header} border-b border-white/10 shadow-lg relative overflow-hidden group`,children:[t.jsx("div",{className:"absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"}),t.jsx("h3",{className:"font-manrope text-xl text-white font-black uppercase tracking-tight mb-1 relative z-10",children:r.label}),t.jsx("p",{className:"font-manrope text-[10px] text-white/90 tracking-[0.2em] uppercase font-bold relative z-10",children:S(r.date)})]}),t.jsxs("div",{className:"flex-grow flex flex-col",children:[(r.shifts||[]).map((o,n)=>{if(u!=="all"&&u!==`shift-${o.name}`)return null;const B=r.sessions.filter(E=>E.timeStart>=o.open&&E.timeStart<(o.close||"23:59")),D=o.name.toLowerCase().includes("mañana"),$=o.name.toLowerCase().includes("tarde");return t.jsxs(P.Fragment,{children:[t.jsxs("div",{className:"p-4 flex-1",children:[t.jsxs("div",{className:"flex flex-col mb-3 border-b border-white/5",children:[t.jsxs("div",{className:"flex items-center gap-2 py-2",children:[D?t.jsx(M,{size:14,className:"text-incn-gold opacity-70"}):$?t.jsx(F,{size:14,className:"text-blue-400 opacity-70"}):t.jsx(A,{size:14,className:"text-white/40"}),t.jsx("span",{className:"text-[10px] uppercase tracking-[0.2em] text-white font-black font-manrope",children:o.name})]}),o.topic&&t.jsx("div",{className:"pb-2 text-[10px] font-bold text-incn-gold uppercase tracking-widest leading-tight",children:o.topic})]}),C(B,"shift",w)]}),u==="all"&&n<r.shifts.length-1&&t.jsxs("div",{className:"py-2 px-4 bg-white/10 border-y border-white/10 flex items-center justify-between opacity-60",children:[t.jsx("span",{className:"text-[9px] uppercase tracking-widest font-bold text-white font-manrope",children:"Receso"}),t.jsx(O,{size:12,className:"text-white"})]})]},o.id||n)}),u==="all"&&r.sessions.some(o=>!(r.shifts||[]).some(n=>o.timeStart>=n.open&&o.timeStart<(n.close||"23:59")))&&t.jsxs("div",{className:"p-4 border-t border-white/5 bg-red-500/5",children:[t.jsxs("div",{className:"flex items-center gap-2 py-2 mb-3 opacity-40",children:[t.jsx(A,{size:14}),t.jsx("span",{className:"text-[9px] uppercase tracking-[0.2em] font-bold text-white/40",children:"Sin Turno"})]}),C(r.sessions.filter(o=>!(r.shifts||[]).some(n=>o.timeStart>=n.open&&o.timeStart<(n.close||"23:59"))),"extra",w)]})]})]},r.dayNumber)})})})};export{J as C,Q as W,K as u};
