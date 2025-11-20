import React from 'react';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    isLoading?: boolean;
    variant?: 'primary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export function LiquidButton({
    children,
    className,
    isLoading,
    variant = 'primary',
    size = 'md',
    disabled,
    ...props
}: LiquidButtonProps) {

    const variants = {
        primary: "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-indigo-500/20 hover:shadow-indigo-500/40",
        danger: "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-500/20 hover:shadow-rose-500/40",
        ghost: "bg-white/5 text-white hover:bg-white/10 border border-white/10"
    };

    const sizes = {
        sm: "py-1 px-3 text-xs",
        md: "py-2 px-6 text-sm",
        lg: "py-3 px-8 text-base"
    };

    return (
        <button
            className={twMerge(
                "relative overflow-hidden font-medium rounded-lg shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2",
                variants[variant],
                sizes[size],
                (disabled || isLoading) && "opacity-50 cursor-not-allowed hover:scale-100",
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} />}
            {children}
        </button>
    );
}
