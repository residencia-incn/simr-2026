import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';
import { es } from 'date-fns/locale';

// Register Spanish locale
registerLocale('es', es);

export const StyledDatePicker = ({ label, value, onChange, name, readOnly = false }) => {
    // Convert YYYY-MM-DD string to Date object, validate it
    let dateValue = null;
    if (value) {
        const tempDate = new Date(value + 'T00:00:00');
        if (!isNaN(tempDate.getTime())) {
            dateValue = tempDate;
        }
    }

    const handleChange = (date) => {
        if (date && !isNaN(date.getTime())) {
            // Validate year range (1900 - Current Year + 5)
            const year = date.getFullYear();
            const currentYear = new Date().getFullYear();

            if (year < 1900 || year > currentYear + 5) {
                return; // Ignore invalid years
            }

            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            onChange({ target: { name, value: dateString } });
        } else if (date === null) {
            onChange({ target: { name, value: '' } });
        }
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>
            <div className="relative">
                <DatePicker
                    selected={dateValue}
                    onChange={handleChange}
                    dateFormat="dd/MM/yyyy"
                    disabled={readOnly}
                    placeholderText="dd/mm/aaaa"
                    locale="es"
                    strictParsing
                    minDate={new Date(1900, 0, 1)}
                    maxDate={new Date(new Date().getFullYear() + 5, 11, 31)}
                    className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none transition-all
                        ${!readOnly ? 'bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : 'bg-gray-50 cursor-not-allowed text-gray-500'}
                    `}
                    calendarClassName="styled-calendar"
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    yearDropdownItemNumber={100}
                    scrollableYearDropdown
                />
                <div className="absolute left-0 top-0 bottom-0 px-3 flex items-center justify-center text-gray-500 pointer-events-none">
                    <Calendar size={18} />
                </div>
            </div>
        </div>
    );
};
