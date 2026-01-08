
import React from 'react';

const Breadcrumbs = ({ current }) => {
    return (
        <div className="flex flex-wrap gap-2 text-sm">
            <a className="text-slate-500 dark:text-slate-400 hover:text-primary" href="#">Inicio</a>
            <span className="text-slate-400">/</span>
            <a className="text-slate-500 dark:text-slate-400 hover:text-primary" href="#">Congreso 2024</a>
            <span className="text-slate-400">/</span>
            <span className="text-slate-900 dark:text-white font-medium">{current}</span>
        </div>
    );
};

export default Breadcrumbs;
