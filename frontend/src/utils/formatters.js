export const formatDateLabel = (dateString) => {
    if (!dateString) return '';
    try {
        // Handle "YYYY-MM-DD" explicitly to avoid timezone shifts
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        if (isNaN(date.getTime())) return dateString;

        const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(date);
        const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);

        return `${dayNameCapitalized} ${day}`;
    } catch (e) {
        return dateString;
    }
};
