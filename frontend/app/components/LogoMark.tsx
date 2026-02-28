type LogoMarkProps = {
    size?: number;
};

export default function LogoMark({ size = 44 }: LogoMarkProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Logo MonPiedTonPied"
        >
            <defs>
                <linearGradient id="footGradient" x1="8" y1="8" x2="56" y2="56">
                    <stop offset="0%" stopColor="#c7a46a" />
                    <stop offset="100%" stopColor="#8f6b39" />
                </linearGradient>
            </defs>
            <rect x="2" y="2" width="60" height="60" rx="16" fill="rgba(20,19,26,0.9)" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
            <ellipse cx="30" cy="40" rx="14" ry="18" fill="url(#footGradient)" />
            <circle cx="20" cy="20" r="4" fill="url(#footGradient)" />
            <circle cx="30" cy="16" r="4.5" fill="url(#footGradient)" />
            <circle cx="40" cy="20" r="4" fill="url(#footGradient)" />
            <circle cx="47" cy="26" r="3.4" fill="url(#footGradient)" />
            <circle cx="16" cy="26" r="3.4" fill="url(#footGradient)" />
        </svg>
    );
}
