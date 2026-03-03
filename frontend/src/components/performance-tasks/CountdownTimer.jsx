import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const CountdownTimer = ({ targetTime, mode = 'end', extendedTime = null, isPaused = false }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const finalTarget = extendedTime || targetTime;

    function calculateTimeLeft() {
        if (isPaused) return timeLeft;
        const difference = +new Date(finalTarget) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }

        return timeLeft;
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [finalTarget, isPaused]);

    const timerComponents = [];

    Object.keys(timeLeft).forEach((interval) => {
        if (!timeLeft[interval] && interval !== 'seconds' && interval !== 'minutes') {
            return;
        }

        timerComponents.push(
            <div key={interval} className="flex flex-col items-center">
                <span className="text-2xl font-bold bg-theme-tertiary text-theme-primary px-2 py-1 rounded min-w-[50px] text-center">
                    {timeLeft[interval].toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase font-semibold text-theme-muted mt-1">{interval}</span>
            </div>
        );
    });

    const isStarting = mode === 'start';

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-theme-muted">
                <Clock size={16} />
                {isStarting ? 'STARTS IN' : 'ENDS IN'}
                {extendedTime && <span className="text-accent-gold font-bold">(EXTENDED)</span>}
            </div>

            <div className="flex gap-3">
                {timerComponents.length > 0 ? timerComponents : (
                    <span className="text-red-500 dark:text-red-400 font-bold">
                        {isStarting ? 'READY TO START' : 'TIME EXPIRED'}
                    </span>
                )}
            </div>

            {isPaused && (
                <div className="px-3 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-full text-xs font-bold animate-pulse">
                    TIMER PAUSED
                </div>
            )}
        </div>
    );
};

export default CountdownTimer;
