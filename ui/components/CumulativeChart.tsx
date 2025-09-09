"use client";

import { useMemo, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

type SeriesPoint = { date: string; value: number };
type Visible = 'all' | 'usdt' | 'usdc' | 'usd1' | 'rlusd';

export default function CumulativeChart({ usdt, usdc, usd1 = [], rlusd = [] }: { usdt: SeriesPoint[]; usdc: SeriesPoint[]; usd1?: SeriesPoint[]; rlusd?: SeriesPoint[] }) {
    const [visible, setVisible] = useState<Visible>('all');

    const dataAll = useMemo(() => {
        const map = new Map<string, { date: string; usdt?: number; usdc?: number; usd1?: number; rlusd?: number }>();
        for (const p of usdt) map.set(p.date, { ...(map.get(p.date) || { date: p.date }), usdt: p.value });
        for (const p of usdc) map.set(p.date, { ...(map.get(p.date) || { date: p.date }), usdc: p.value });
        for (const p of usd1) map.set(p.date, { ...(map.get(p.date) || { date: p.date }), usd1: p.value });
        for (const p of rlusd) map.set(p.date, { ...(map.get(p.date) || { date: p.date }), rlusd: p.value });
        return Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [usdt, usdc, usd1, rlusd]);

    const dataUsdt = useMemo(() => usdt.map(p => ({ date: p.date, usdt: p.value })), [usdt]);
    const dataUsdc = useMemo(() => usdc.map(p => ({ date: p.date, usdc: p.value })), [usdc]);
    const dataUsd1 = useMemo(() => usd1.map(p => ({ date: p.date, usd1: p.value })), [usd1]);
    const dataRlusd = useMemo(() => rlusd.map(p => ({ date: p.date, rlusd: p.value })), [rlusd]);

    const chartData = visible === 'all' ? dataAll : visible === 'usdt' ? dataUsdt : visible === 'usdc' ? dataUsdc : visible === 'usd1' ? dataUsd1 : dataRlusd;

    const formatCurrency = (v?: number) =>
        typeof v === 'number' && Number.isFinite(v) ? `$${Math.round(v).toLocaleString('en-US')}` : '';

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || payload.length === 0) return null;
        const entries = payload
            .filter((p: any) => p && typeof p.value === 'number')
            .map((p: any) => ({ name: String(p.name || p.dataKey).toUpperCase(), value: formatCurrency(p.value), color: p.stroke }));
        return (
            <div className="border border-terminal-border bg-terminal-panel px-3 py-2 text-terminal-text" style={{ minWidth: 180 }}>
                <div className="text-sm mb-1">{label}</div>
                {entries.map((e: any) => (
                    <div key={e.name} className="text-xs" style={{ color: e.color }}>
                        {e.name}: {e.value}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="border border-white p-2" style={{ width: '100%', height: 520 }}>
            <div className="mb-2 flex items-center justify-center gap-6 text-xs">
                <button onClick={() => setVisible('all')} className={visible === 'all' ? 'text-white' : 'text-terminal-text hover:opacity-80'}>ALL</button>
                <button onClick={() => setVisible('usdt')} className={visible === 'usdt' ? 'text-terminal-value' : 'text-terminal-text hover:opacity-80'}>USDT</button>
                <button onClick={() => setVisible('usdc')} className={visible === 'usdc' ? 'text-terminal-blue' : 'text-terminal-text hover:opacity-80'}>USDC</button>
                <button onClick={() => setVisible('usd1')} className={visible === 'usd1' ? 'text-terminal-green' : 'text-terminal-text hover:opacity-80'}>USD1</button>
                <button onClick={() => setVisible('rlusd')} className={visible === 'rlusd' ? 'text-terminal-orange' : 'text-terminal-text hover:opacity-80'}>RLUSD</button>
            </div>
            <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 50 }}>
                    <XAxis
                        dataKey="date"
                        stroke="#ffffff"
                        tick={{ fill: '#ffffff', fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        interval={Math.ceil((chartData?.length || 0) / 12)}
                        label={{ value: 'date', position: 'insideBottom', offset: -30, fill: '#ffffff', fontSize: 12 }}
                    />
                    <YAxis
                        stroke="#ffffff"
                        tick={{ fill: '#ffffff', fontSize: 12 }}
                        tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`}
                        label={{ value: 'USD (M)', angle: -90, position: 'insideLeft', fill: '#ffffff', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {(visible === 'all' || visible === 'usdt') && (
                        <Line type="monotone" dataKey="usdt" name="USDT" stroke="#c7a9fc" dot={false} strokeWidth={2} />
                    )}
                    {(visible === 'all' || visible === 'usdc') && (
                        <Line type="monotone" dataKey="usdc" name="USDC" stroke="#a4ecf9" dot={false} strokeWidth={2} />
                    )}
                    {(visible === 'all' || visible === 'usd1') && (
                        <Line type="monotone" dataKey="usd1" name="USD1" stroke="#34d399" dot={false} strokeWidth={2} />
                    )}
                    {(visible === 'all' || visible === 'rlusd') && (
                        <Line type="monotone" dataKey="rlusd" name="RLUSD" stroke="#fb923c" dot={false} strokeWidth={2} />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}


