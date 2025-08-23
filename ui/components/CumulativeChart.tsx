"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

type SeriesPoint = { date: string; value: number };

export default function CumulativeChart({ usdt, usdc }: { usdt: SeriesPoint[]; usdc: SeriesPoint[] }) {
    // Merge on date for a combined dataset
    const map = new Map<string, { date: string; usdt?: number; usdc?: number }>();
    for (const p of usdt) map.set(p.date, { ...(map.get(p.date) || { date: p.date }), usdt: p.value });
    for (const p of usdc) map.set(p.date, { ...(map.get(p.date) || { date: p.date }), usdc: p.value });
    const data = Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <XAxis dataKey="date" stroke="#ffffff" tick={{ fill: '#ffffff', fontSize: 12 }} />
                    <YAxis stroke="#ffffff" tick={{ fill: '#ffffff', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#0b0f12', border: '1px solid #6b7280', color: '#ffffff' }} />
                    <Legend />
                    <Line type="monotone" dataKey="usdt" name="USDT" stroke="#c7a9fc" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="usdc" name="USDC" stroke="#a4ecf9" dot={false} strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}


