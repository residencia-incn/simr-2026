
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const DAYS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const DatePicker = ({ label, value, onChange, name, readOnly = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    // View state: 'day', 'month', 'year'
    const [viewMode, setViewMode] = useState('day');

    const [selectedDate, setSelectedDate] = useState(null);
    // viewDate controls which month/year is currently visible (but not necessarily selected)
    const [viewDate, setViewDate] = useState(new Date());
    const [inputValue, setInputValue] = useState('');
    const modalRef = useRef(null);

    // Initialize state from value prop
    useEffect(() => {
        if (value) {
            const [y, m, d] = value.split('-').map(Number);
            const date = new Date(y, m - 1, d);
            setSelectedDate(date);
            setViewDate(date);
            // Format for display: DD/MM/YYYY
            setInputValue(`${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`);
        } else {
            setSelectedDate(null);
            setViewDate(new Date());
            setInputValue(''); // Keep empty if no value
        }
    }, [value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setIsOpen(false);
                setViewMode('day'); // Reset view on close
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Input Masking Logic
    const handleInputChange = (e) => {
        let val = e.target.value;

        // Remove strictly non-numeric characters
        val = val.replace(/\D/g, '');

        // Limit length
        if (val.length > 8) val = val.slice(0, 8);

        // Add slashes for visual formatting
        let formatted = val;
        if (val.length >= 3) {
            formatted = val.slice(0, 2) + '/' + val.slice(2);
        }
        if (val.length >= 5) {
            formatted = formatted.slice(0, 5) + '/' + val.slice(4);
        }

        setInputValue(formatted);

        // Attempt validation if full date is present
        if (val.length === 8) {
            const d = parseInt(val.slice(0, 2), 10);
            const m = parseInt(val.slice(2, 4), 10);
            const y = parseInt(val.slice(4, 8), 10);

            // Basic logic check
            const date = new Date(y, m - 1, d);
            if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) {
                // Valid date
                setSelectedDate(date);
                setViewDate(date);
                const dateString = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                onChange({ target: { name, value: dateString } });
            }
        } else if (val.length === 0) {
            setSelectedDate(null);
            onChange({ target: { name, value: '' } });
        }
    };

    // --- NAVIGATION LOGIC ---

    const handleHeaderClick = () => {
        if (viewMode === 'day') setViewMode('month');
        else if (viewMode === 'month') setViewMode('year');
    };

    const handlePrev = () => {
        const newDate = new Date(viewDate);
        if (viewMode === 'day') {
            newDate.setMonth(viewDate.getMonth() - 1);
        } else if (viewMode === 'month') {
            newDate.setFullYear(viewDate.getFullYear() - 1);
        } else if (viewMode === 'year') {
            newDate.setFullYear(viewDate.getFullYear() - 12);
        }
        setViewDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(viewDate);
        if (viewMode === 'day') {
            newDate.setMonth(viewDate.getMonth() + 1);
        } else if (viewMode === 'month') {
            newDate.setFullYear(viewDate.getFullYear() + 1);
        } else if (viewMode === 'year') {
            newDate.setFullYear(viewDate.getFullYear() + 12);
        }
        setViewDate(newDate);
    };

    // --- SELECTION LOGIC ---

    const handleDaySelect = (day) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        setSelectedDate(newDate);
        // Do NOT close immediately per Material spec usually, but user might prefer it.
        // We'll require OK for now as per previous behavior, or just keep it selected.
    };

    const handleMonthSelect = (monthIndex) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(monthIndex);
        setViewDate(newDate);
        setViewMode('day'); // Go back to day view
    };

    const handleYearSelect = (year) => {
        const newDate = new Date(viewDate);
        newDate.setFullYear(year);
        setViewDate(newDate);
        setViewMode('month'); // Go back to month view
    };

    const handleOk = () => {
        if (selectedDate) {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            setInputValue(`${day}/${month}/${year}`);
            onChange({ target: { name, value: dateString } });
        }
        setIsOpen(false);
        setViewMode('day');
    };

    const handleClear = () => {
        setSelectedDate(null);
        setInputValue('');
        onChange({ target: { name, value: '' } });
        setIsOpen(false);
    };

    // --- RENDERERS ---

    const renderDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday

        const days = [];
        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
        }
        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const isSelected = selectedDate &&
                selectedDate.getDate() === d &&
                selectedDate.getMonth() === month &&
                selectedDate.getFullYear() === year;

            const isToday = new Date().getDate() === d &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

            days.push(
                <button
                    key={d}
                    onClick={(e) => handleDaySelect(d, e)}
                    type="button"
                    className={`h-10 w-10 text-sm rounded-full flex items-center justify-center transition-colors
                        ${isSelected ? 'bg-teal-600 text-white font-bold shadow-md'
                            : isToday ? 'text-teal-600 font-bold border border-teal-200'
                                : 'text-gray-700 hover:bg-teal-50'}
                    `}
                >
                    {d}
                </button>
            );
        }
        return (
            <>
                <div className="grid grid-cols-7 mb-2 text-center">
                    {DAYS_SHORT.map((d, i) => (
                        <div key={i} className="text-xs text-gray-400 font-medium h-8 flex items-center justify-center">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 place-items-center mb-4 gap-y-1">
                    {days}
                </div>
            </>
        );
    };

    const renderMonths = () => {
        return (
            <div className="grid grid-cols-3 gap-4 py-4">
                {MONTHS.map((m, i) => (
                    <button
                        key={m}
                        onClick={(e) => handleMonthSelect(i, e)}
                        type="button"
                        className={`py-2 rounded-lg text-sm font-medium transition-colors
                            ${viewDate.getMonth() === i
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : 'text-gray-700 hover:bg-gray-100'
                            }
                        `}
                    >
                        {m}
                    </button>
                ))}
            </div>
        );
    };

    const renderYears = () => {
        const currentYear = viewDate.getFullYear();
        const startYear = currentYear - 6;
        const years = [];
        for (let i = 0; i < 12; i++) {
            const y = startYear + i;
            years.push(
                <button
                    key={y}
                    onClick={(e) => handleYearSelect(y, e)}
                    type="button"
                    className={`py-3 rounded-lg text-sm font-medium transition-colors
                        ${y === currentYear
                            ? 'bg-teal-600 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                        }
                    `}
                >
                    {y}
                </button>
            );
        }
        return (
            <div className="grid grid-cols-4 gap-2 py-4">
                {years}
            </div>
        );
    };

    // Header Text Logic
    let headerTitle = '';
    if (viewMode === 'day') headerTitle = `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
    else if (viewMode === 'month') headerTitle = `${viewDate.getFullYear()}`;
    else if (viewMode === 'year') {
        const start = viewDate.getFullYear() - 6;
        headerTitle = `${start} - ${start + 11}`;
    }

    return (
        <div className="relative w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>

            <div className="relative">
                <button
                    type="button"
                    onClick={() => !readOnly && setIsOpen(true)}
                    disabled={readOnly}
                    className={`absolute left-0 top-0 bottom-0 px-3 flex items-center justify-center text-gray-500 hover:text-teal-600 transition-colors ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                    <CalendarIcon size={18} />
                </button>

                <input
                    type="text"
                    name={name}
                    value={inputValue}
                    onChange={handleInputChange}
                    readOnly={readOnly}
                    placeholder="dd/mm/aaaa"
                    maxLength={10}
                    className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none transition-all
                        ${!readOnly ? 'bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : 'bg-gray-50 cursor-not-allowed text-gray-500'}
                    `}
                />
            </div>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn" style={{ backdropFilter: 'blur(2px)' }}>
                    <div ref={modalRef} className="bg-white rounded-lg shadow-2xl overflow-hidden w-[320px] max-w-full animate-scaleIn flex flex-col h-[480px]">

                        {/* Material Header */}
                        <div className="bg-teal-600 p-6 text-white shrink-0">
                            <div className="text-sm font-medium opacity-80 mb-1">
                                {viewDate.getFullYear()}
                            </div>
                            <div className="text-3xl font-bold capitalize">
                                {selectedDate ? (
                                    <>
                                        {DAYS_FULL[selectedDate.getDay()].slice(0, 3)}, {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()].slice(0, 3)}
                                    </>
                                ) : 'Seleccionar'}
                            </div>
                        </div>

                        {/* Calendar Controls */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                            <button type="button" onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                                <ChevronLeft size={20} />
                            </button>

                            <button
                                type="button"
                                onClick={handleHeaderClick}
                                className="font-semibold text-gray-800 hover:bg-gray-100 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                            >
                                {headerTitle}
                                {viewMode !== 'year' && <ChevronDown size={14} className="opacity-50" />}
                            </button>

                            <button type="button" onClick={handleNext} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* Calendar Body (Scrollable if needed, but fitting constrained) */}
                        <div className="p-4 flex-1 overflow-y-auto">
                            {viewMode === 'day' && renderDays()}
                            {viewMode === 'month' && renderMonths()}
                            {viewMode === 'year' && renderYears()}
                        </div>

                        {/* Footer Actions */}
                        <div className="flex justify-between items-center p-4 border-t border-gray-100 shrink-0">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="text-sm font-bold text-teal-600 hover:bg-teal-50 px-4 py-2 rounded uppercase transition-colors"
                            >
                                Limpiar
                            </button>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsOpen(false); setViewMode('day'); }}
                                    className="text-sm font-bold text-teal-600 hover:bg-teal-50 px-4 py-2 rounded uppercase transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleOk}
                                    className="text-sm font-bold text-teal-600 hover:bg-teal-50 px-4 py-2 rounded uppercase transition-colors"
                                >
                                    Aceptar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
