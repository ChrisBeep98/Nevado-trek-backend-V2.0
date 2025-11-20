import React from 'react';

import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = true, ...props }: GlassCardProps) {
    return (
        <div
            className={twMerge(
                "bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg transition-all duration-300",
                hoverEffect && "hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:-translate-y-1",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
