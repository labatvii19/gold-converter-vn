'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchHistoricalGoldData, HistoricalDataPoint } from '@/app/actions';

type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y';

interface GoldPriceChartProps {
    visible?: boolean;
}

export function GoldPriceChart({ visible = true }: GoldPriceChartProps) {
    const [data, setData] = useState<HistoricalDataPoint[]>([]);
    const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (visible) {
            loadData(selectedRange);
        }
    }, [visible, selectedRange]);

    const loadData = (range: TimeRange) => {
        startTransition(async () => {
            const historicalData = await fetchHistoricalGoldData(range);
            setData(historicalData);
        });
    };

    const handleRangeChange = (range: TimeRange) => {
        setSelectedRange(range);
    };

    if (!visible) return null;

    // Format data for Recharts
    const chartData = data.map(point => ({
        date: new Date(point.timestamp).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
        'Giá Thế giới (USD)': point.goldPriceUSD,
        'Giá Trong nước (tr.VND)': Math.round(point.domesticAvgVND / 1000000),
        timestamp: point.timestamp,
    }));

    const timeRanges: { label: string; value: TimeRange }[] = [
        { label: '1 Tuần', value: '1W' },
        { label: '1 Tháng', value: '1M' },
        { label: '3 Tháng', value: '3M' },
        { label: '6 Tháng', value: '6M' },
        { label: '1 Năm', value: '1Y' },
    ];

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 transition-colors">
                    📊 Biểu đồ Giá Vàng
                </h3>

                {/* Time Range Selector */}
                <div className="flex gap-2 flex-wrap">
                    {timeRanges.map(({ label, value }) => (
                        <button
                            key={value}
                            onClick={() => handleRangeChange(value)}
                            disabled={isPending}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${selectedRange === value
                                    ? 'bg-amber-500 dark:bg-amber-600 text-white shadow-md'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading State */}
            {isPending && (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">Đang tải dữ liệu...</p>
                    </div>
                </div>
            )}

            {/* Chart */}
            {!isPending && chartData.length > 0 && (
                <div className="w-full" style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                stroke="#64748b"
                            />
                            <YAxis
                                yAxisId="left"
                                tick={{ fontSize: 12 }}
                                stroke="#f59e0b"
                                label={{ value: 'USD/oz', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tick={{ fontSize: 12 }}
                                stroke="#3b82f6"
                                label={{ value: 'triệu VND', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.96)',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}
                                labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: '10px' }}
                                iconType="line"
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="Giá Thế giới (USD)"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                dot={{ r: 2 }}
                                activeDot={{ r: 5 }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="Giá Trong nước (tr.VND)"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ r: 2 }}
                                activeDot={{ r: 5 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Data Source Indicator - Phase 2.1 */}
            <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors duration-300">
                <div className="flex items-start gap-2">
                    <span className="font-semibold">Nguồn dữ liệu:</span>
                    <div className="flex-1">
                        {(selectedRange === '1W' || selectedRange === '1M') ? (
                            <span className="inline-flex items-center gap-1">
                                <span className="text-green-600">✅</span>
                                <span>Real-time API (vang.today) - Dữ liệu thực tế 100%</span>
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1">
                                <span className="text-blue-600">⚡</span>
                                <span>Hybrid Data - Giá quốc tế (FreeGoldAPI) + Giá trong nước ước lượng</span>
                            </span>
                        )}
                    </div>
                </div>
                <div className="mt-2 text-xs">
                    Giá thế giới (màu vàng) tính theo USD/ounce, giá trong nước (màu xanh) là giá trung bình SJC/DOJI/PNJ tính theo triệu VND/lượng.
                </div>
            </div>
        </div>
    );
}
