
const StatusBadge = ({ type, text }) => {
    const styles = {
        active: "bg-emerald-100 text-emerald-700 border-emerald-200",
        inactive: "bg-slate-100 text-slate-500 border-slate-200",
        organizador: "bg-purple-100 text-purple-700 border-purple-200",
        jurado: "bg-amber-100 text-amber-800 border-amber-200",
        asistente: "bg-blue-50 text-blue-700 border-blue-200",
        participante: "bg-blue-50 text-blue-700 border-blue-200",
        ponente: "bg-indigo-100 text-indigo-700 border-indigo-200",
        virtual: "bg-cyan-50 text-cyan-700 border-cyan-200",
        presencial: "bg-green-50 text-green-700 border-green-200",
        híbrido: "bg-violet-50 text-violet-700 border-violet-200",
        hibirido: "bg-violet-50 text-violet-700 border-violet-200",
    };

    // Fallback por si llega un tipo desconocido
    const styleClass = styles[(type || 'inactive').toLowerCase()] || styles.inactive;
    const isDotVisible = ['active', 'inactive', 'organizador', 'jurado', 'asistente', 'participante', 'ponente'].includes((type || '').toLowerCase());

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styleClass} inline-flex items-center gap-1.5 whitespace-nowrap`}>
            {isDotVisible && (
                <span className={`w-1.5 h-1.5 rounded-full ${type === 'active' ? 'bg-emerald-500' : 'bg-current'} opacity-60`}></span>
            )}
            {text}
        </span>
    );
};

export default StatusBadge;
