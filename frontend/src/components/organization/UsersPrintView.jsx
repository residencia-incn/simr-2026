import React from 'react';

const UsersPrintView = ({ users, totalCount }) => {
    // Fecha actual para el pie de página
    const printDate = new Date().toLocaleDateString('es-PE', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div id="printable-area" className="hidden">

            {/* === ENCABEZADO INSTITUCIONAL === */}
            <div className="flex justify-between items-center mb-8 border-b-2 border-slate-800 pb-4">
                <div className="flex items-center gap-4">
                    {/* Aquí irían tus logos reales */}
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center font-bold text-xs text-center border border-slate-400">
                        LOGO<br />INCN
                    </div>
                    <div>
                        <h1 className="text-xl font-bold uppercase text-slate-900 leading-tight">
                            Instituto Nacional de Ciencias Neurológicas
                        </h1>
                        <h2 className="text-sm text-slate-600 font-semibold tracking-wide uppercase">
                            XXXI Semana de Investigación del Médico Residente (SIMR 2026)
                        </h2>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-slate-200">2026</div>
                    <div className="text-xs font-mono text-slate-500">REPORTE OFICIAL</div>
                </div>
            </div>

            {/* === TÍTULO DEL REPORTE === */}
            <div className="mb-6">
                <h3 className="text-lg font-bold text-center underline decoration-2 underline-offset-4">
                    LISTADO GENERAL DE INSCRITOS
                </h3>
            </div>

            {/* === TABLA DE DATOS (LIMPIA) === */}
            <table className="w-full text-sm border-collapse mb-8">
                <thead>
                    <tr className="bg-slate-100">
                        <th className="border border-slate-300 px-3 py-2 w-12 text-center">#</th>
                        <th className="border border-slate-300 px-3 py-2">Apellidos y Nombres</th>
                        <th className="border border-slate-300 px-3 py-2">DNI / Documento</th>
                        <th className="border border-slate-300 px-3 py-2">Correo Electrónico</th>
                        <th className="border border-slate-300 px-3 py-2">Estado</th>
                        <th className="border border-slate-300 px-3 py-2 text-center">Firma</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user, index) => (
                        <tr key={user.id || index} className="border-b border-slate-200">
                            <td className="border border-slate-300 px-3 py-2 text-center text-slate-500">
                                {index + 1}
                            </td>
                            <td className="border border-slate-300 px-3 py-2 font-medium uppercase">
                                {user.lastName ? `${user.lastName}, ${user.firstName}` : user.name}
                            </td>
                            <td className="border border-slate-300 px-3 py-2 font-mono">
                                {user.dni}
                            </td>
                            <td className="border border-slate-300 px-3 py-2 text-slate-600">
                                {user.email}
                            </td>
                            <td className="border border-slate-300 px-3 py-2 text-xs">
                                {/* Texto simple, sin badges de colores */}
                                {user.isActive !== false ? 'ACTIVO' : 'INACTIVO'}
                            </td>
                            <td className="border border-slate-300 px-3 py-2 w-32">
                                {/* Espacio vacío para firmar en asistencia presencial */}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* === RESUMEN Y PIE DE PÁGINA === */}
            <div className="flex justify-end mb-12">
                <div className="bg-slate-50 border border-slate-300 p-4 w-64 rounded-sm">
                    <div className="flex justify-between text-sm mb-2">
                        <span>Total Registros:</span>
                        <span className="font-bold">{totalCount}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                        <span>Activos:</span>
                        <span className="font-bold">{users.filter(u => u.isActive !== false).length}</span>
                    </div>
                </div>
            </div>

            {/* === FIRMAS (Opcional, da mucho estilo profesional) === */}
            <div className="mt-20 grid grid-cols-3 gap-8 text-center text-xs text-slate-500 uppercase">
                <div className="pt-2 border-t border-slate-400">
                    Jefe de Residentes
                </div>
                <div className="pt-2 border-t border-slate-400">
                    Comité Organizador
                </div>
                <div className="pt-2 border-t border-slate-400">
                    Visto Bueno
                </div>
            </div>

            <div className="mt-10 text-[10px] text-slate-400 text-center font-mono border-t border-slate-100 pt-2">
                Reporte generado automáticamente por SIMRapp v2.0 el {printDate}.
                <br />Uso interno exclusivo - Instituto Nacional de Ciencias Neurológicas.
            </div>
        </div>
    );
};

export default UsersPrintView;
