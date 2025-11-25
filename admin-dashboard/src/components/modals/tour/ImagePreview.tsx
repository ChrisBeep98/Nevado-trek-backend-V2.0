import { useState } from 'react';

interface ImagePreviewProps {
    url: string;
    onError?: () => void;
}

export function ImagePreview({ url, onError }: ImagePreviewProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const handleLoad = () => {
        setLoading(false);
        setError(false);
    };

    const handleError = () => {
        setLoading(false);
        setError(true);
        onError?.();
    };

    if (!url || url === 'https://') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-800/50 rounded-lg">
                <p className="text-white/30 text-xs">No URL</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-white/60" />
                </div>
            )}
            {error ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800/50 rounded-lg">
                    <p className="text-rose-400 text-xs">Invalid URL</p>
                </div>
            ) : (
                <img
                    src={url}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                    onLoad={handleLoad}
                    onError={handleError}
                    style={{ display: loading ? 'none' : 'block' }}
                />
            )}
        </div>
    );
}
