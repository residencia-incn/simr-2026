
import React from 'react';

const Header = () => {
    return (
        <header className="sticky top-0 z-50 bg-white/90 dark:bg-card-dark/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-10 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="size-8 text-primary">
                        <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"></path>
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">Neurología Virtual 2024</h2>
                </div>
            </div>
        </header>
    );
};

export default Header;
