import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Mohammed Jumaan Portfolio'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(to bottom right, #0f172a, #1e293b)',
                    color: 'white',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                    }}
                >
                    {/* Simple Terminal Icon simulation */}
                    <svg
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="4 17 10 11 4 5" />
                        <line x1="12" y1="19" x2="20" y2="19" />
                    </svg>
                </div>
                <div
                    style={{
                        fontSize: 72,
                        fontWeight: 'bold',
                        marginBottom: 20,
                        background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
                        backgroundClip: 'text',
                        color: 'transparent',
                    }}
                >
                    Mohammed Jumaan
                </div>
                <div
                    style={{
                        fontSize: 36,
                        color: '#94a3b8', // slate-400
                        marginBottom: 40,
                    }}
                >
                    Backend Developer & Cloud Architect
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: '20px',
                        fontSize: 24,
                        color: '#cbd5e1', // slate-300
                    }}
                >
                    <span>Node.js</span>
                    <span>•</span>
                    <span>Next.js</span>
                    <span>•</span>
                    <span>PostgreSQL</span>
                    <span>•</span>
                    <span>System Design</span>
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
