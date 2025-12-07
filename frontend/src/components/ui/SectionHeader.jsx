import React from 'react';

const SectionHeader = ({ title, subtitle }) => (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900 leading-none">{title}</h2>
        </div>
        <p className="text-sm text-gray-600 md:max-w-xl md:text-right leading-snug">{subtitle}</p>
    </div>
);

export default SectionHeader;
