import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
    const [key, setKey] = useState('');
    const [error, setError] = useState('');
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(key);
            navigate('/');
        } catch (err) {
            setError('Invalid Admin Key');
        }
    };

    return (
        <div className="h-screen w-full flex items-center justify-center relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[20%] left-[20%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[100px]" />
            </div>

            <div className="glass-card p-8 w-full max-w-md flex flex-col gap-6 relative z-10">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-2">
                        <KeyRound className="text-white" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
                    <p className="text-white/60 text-sm">Enter your secret key to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <input
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="X-Admin-Secret-Key"
                            className="glass-input w-full text-center tracking-widest"
                            autoFocus
                        />
                        {error && <span className="text-rose-400 text-xs text-center">{error}</span>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !key}
                        className="liquid-button w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                <span>Enter Dashboard</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
