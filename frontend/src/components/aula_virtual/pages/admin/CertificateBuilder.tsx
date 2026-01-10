import React from 'react';

const CertificateBuilder: React.FC = () => {
  return (
    <div className="flex-1 bg-slate-100/80 relative overflow-hidden flex flex-col h-full">
      {/* Toolbar */}
      <header className="bg-white border-b border-border-light px-6 py-3 flex justify-between items-center shadow-sm z-20">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Curso de Neurología Clínica</h2>
          <p className="text-xs text-slate-500">Plantilla de Certificado</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-white border border-border-light text-slate-700 text-sm font-medium shadow-sm">
            <span className="material-symbols-outlined text-[18px]">send</span> Enviar Prueba
          </button>
          <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25">
            <span className="material-symbols-outlined text-[18px]">save</span> Guardar
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tools */}
        <aside className="w-80 bg-white border-r border-border-light flex flex-col overflow-y-auto z-10">
          <div className="p-4 space-y-4">
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">data_object</span> Campos Dinámicos
              </h4>
              <div className="flex flex-wrap gap-2">
                {['{Alumno}', '{Curso}', '{Fecha}', '{Horas}', '{QR_Val}'].map(tag => (
                  <span key={tag} className="text-xs bg-slate-100 border border-slate-200 px-2 py-1 rounded cursor-move hover:border-primary hover:text-primary transition-colors">{tag}</span>
                ))}
              </div>
            </div>
            
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">ink_pen</span> Firmas
              </h4>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center"><span className="material-symbols-outlined text-xs">draw</span></div>
                  <div className="text-xs">
                    <p className="font-bold">Dr. Juan Pérez</p>
                    <p className="text-slate-500">Director</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400 cursor-pointer">visibility</span>
              </div>
              <button className="w-full text-xs border border-dashed border-slate-300 py-2 rounded text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5">+ Agregar Firmante</button>
            </div>
          </div>
        </aside>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] flex items-center justify-center p-8 overflow-auto">
          <div className="bg-white shadow-2xl w-[800px] h-[565px] relative group border border-slate-200">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000)]" style={{backgroundSize: '60px 60px'}}></div>
            <div className="absolute inset-4 border-[4px] border-[#2b6cee]/30 pointer-events-none"></div>

            {/* Content Mockup */}
            <div className="absolute top-12 left-12 w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs text-center p-1">Logo Inst.</div>
            <div className="absolute top-12 right-12 w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs text-center p-1">Logo Cong.</div>

            <div className="absolute top-32 left-0 right-0 text-center">
              <h1 className="text-5xl font-serif text-slate-800 mb-2 uppercase tracking-widest">Certificado</h1>
              <h2 className="text-xl font-light text-slate-500 mb-8 uppercase tracking-wide">De Finalización</h2>
              <p className="text-lg text-slate-600 mb-4">Se otorga el presente reconocimiento a:</p>
              
              <div className="inline-block relative group/field">
                <h3 className="text-4xl font-bold text-[#2b6cee] border-b-2 border-[#2b6cee]/20 px-4 py-1">{`{Nombre del Alumno}`}</h3>
                <div className="absolute inset-0 border-2 border-dashed border-primary opacity-0 group-hover/field:opacity-50 pointer-events-none rounded"></div>
              </div>

              <p className="text-lg text-slate-600 max-w-xl mx-auto mt-6 leading-relaxed">
                Por haber completado satisfactoriamente el <strong className="text-slate-800">{`{Nombre del Curso}`}</strong> con una carga horaria de <strong className="text-slate-800">{`{Carga Horaria}`}</strong> horas académicas.
              </p>
            </div>

            {/* Signatures */}
            <div className="absolute bottom-20 left-20 right-20 flex justify-around items-end">
               <div className="text-center">
                 <div className="w-40 h-12 mb-2 mx-auto flex items-end justify-center"><img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtTJqHSX2jj-jMStTVn5fAeS0aFiXA0qWOikEN4NrYaygYCEb80bHvRf6RbDVPcS1sRlY2GnkM3yOO07goTMRReg3KMdX3ofmD4SVcdqYn-Os_Wx1QH1YVHqywlfX_eZdtZ0bezmG39qtAqqXY9L-PV0Wg6US2Me111WWC_78QrLsDoZyKc5A25lLJW9nMdqFPSJGPELSz2sAlYlUOZu8sHkYNzR1EsmZzp2C80blqmIFjCVd78_PFfcuAQfO67LCyct1m4Y6KfA" alt="Sig" className="h-full object-contain opacity-70"/></div>
                 <div className="w-48 h-px bg-slate-400 mx-auto"></div>
                 <p className="text-sm font-bold text-slate-700 mt-1">Dr. Juan Pérez</p>
                 <p className="text-xs text-slate-500">Director Académico</p>
               </div>
               <div className="text-center opacity-50">
                 <div className="w-40 h-12 mb-2 mx-auto border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">Espacio Firma</div>
                 <div className="w-48 h-px bg-slate-400 mx-auto"></div>
                 <p className="text-sm font-bold text-slate-700 mt-1">Dra. Maria López</p>
                 <p className="text-xs text-slate-500">Coordinadora</p>
               </div>
            </div>

            <div className="absolute bottom-6 right-6 w-16 h-16 bg-slate-900"></div>
            <div className="absolute bottom-6 left-6 text-xs text-slate-400">Fecha de emisión: {`{Fecha de Emisión}`}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateBuilder;