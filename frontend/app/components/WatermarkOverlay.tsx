'use client';

export default function WatermarkOverlay({ text = 'MonPiedTonPied' }: { text?: string }) {
    return (
        <div className="pointer-events-none absolute inset-0">
            <span className="absolute left-6 top-6 rotate-[-18deg] text-xs font-semibold text-white/20">
                {text}
            </span>
            <span className="absolute right-6 top-1/2 -translate-y-1/2 rotate-[-18deg] text-xs font-semibold text-white/15">
                {text}
            </span>
            <span className="absolute left-1/2 bottom-6 -translate-x-1/2 rotate-[-18deg] text-xs font-semibold text-white/20">
                {text}
            </span>
        </div>
    );
}
