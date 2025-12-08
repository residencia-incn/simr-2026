import React, { useState, useEffect } from 'react';

const Countdown = ({ targetDate, darkMode = false, showLabel = true }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    const timerComponents = [];

    Object.keys(timeLeft).forEach((interval) => {
        if (!timeLeft[interval] && timeLeft[interval] !== 0) {
            return;
        }

        // Translate labels
        const labels = {
            days: 'DÍAS',
            hours: 'HORAS',
            minutes: 'MINUTOS',
            seconds: 'SEGUNDOS'
        };

        const numberColor = darkMode ? 'text-white drop-shadow-md' : 'text-gray-900';
        const subLabelColor = darkMode ? 'text-blue-100 drop-shadow-sm' : 'text-gray-500';

        timerComponents.push(
            <div key={interval} className="flex flex-col items-center mx-2 md:mx-4">
                <span className={`text-4xl md:text-6xl font-bold ${numberColor} font-mono shadow-black/20`}>
                    {timeLeft[interval] < 10 ? `0${timeLeft[interval]}` : timeLeft[interval]}
                </span>
                <span className={`text-[10px] md:text-sm ${subLabelColor} mt-2 tracking-widest uppercase`}>
                    {labels[interval]}
                </span>
            </div>
        );
    });

    return (
        <div className={`flex flex-col items-center justify-center ${darkMode ? 'py-4' : 'py-12 bg-gray-50/50'}`}>
            {showLabel && (
                <h3 className={`${darkMode ? 'text-white/90 drop-shadow-md' : 'text-blue-600'} font-bold tracking-widest text-sm uppercase mb-6`}>
                    Tiempo restante para el evento
                </h3>
            )}
            <div className={`flex items-center justify-center divide-x ${darkMode ? 'divide-white/30' : 'divide-gray-200'}`}>
                {timerComponents.length ? timerComponents : <span className="text-2xl font-bold text-blue-700">¡El evento ha comenzado!</span>}
            </div>
        </div>
    );
};

export default Countdown;
