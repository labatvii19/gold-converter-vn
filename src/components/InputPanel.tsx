'use client';

import React, { useState, useTransition } from 'react';
import { fetchMarketDataV3, MarketData } from '@/app/actions';

interface InputPanelProps {
    worldPrice: string;
    setWorldPrice: (val: string) => void;
    fxRate: string;
    setFxRate: (val: string) => void;
    transportFee: string;
    setTransportFee: (val: string) => void;
    tax: string;
    setTax: (val: string) => void;
    marketPrice: string;
    setMarketPrice: (val: string) => void;
}

export function InputPanel({
    worldPrice, setWorldPrice,
    fxRate, setFxRate,
    transportFee, setTransportFee,
    tax, setTax,
    marketPrice, setMarketPrice
}: InputPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [liveData, setLiveData] = useState<MarketData | null>(null);

    const handleFetchData = () => {
        startTransition(async () => {
            const data = await fetchMarketDataV3();
            setLiveData(data);
        });
    };

    const applyGold = () => {
        if (liveData?.goldPriceUSD) {
            setWorldPrice(liveData.goldPriceUSD.toString());
        }
    };

    const applyFx = () => {
        if (liveData?.fxRateVND) {
            setFxRate(liveData.fxRateVND.toString());
        }
    };

    const applyAverageDomestic = () => {
        if (liveData?.domesticPrices && liveData.domesticPrices.length > 0) {
            const total = liveData.domesticPrices.reduce((sum, item) => sum + item.sell, 0);
            const avg = total / liveData.domesticPrices.length;
            setMarketPrice(avg.toString());
        }
    };

    const handleAutoFill = () => {
        startTransition(async () => {
            const data = await fetchMarketDataV3();
            setLiveData(data);

            // Auto Apply Logic
            if (data.goldPriceUSD) setWorldPrice(data.goldPriceUSD.toString());
            if (data.fxRateVND) setFxRate(data.fxRateVND.toString());
            if (data.domesticPrices && data.domesticPrices.length > 0) {
                const total = data.domesticPrices.reduce((sum: number, item: any) => sum + item.sell, 0);
                const avg = total / data.domesticPrices.length;
                setMarketPrice(avg.toString());
            }
        });
    };

    const handleManualCalc = () => {
        // Visual feedback only, as effect is reactive.
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    // Number formatting utilities
    const formatNumber = (value: string): string => {
        if (!value) return '';
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(num);
    };

    const parseNumber = (formatted: string): string => {
        return formatted.replace(/\./g, '').replace(/,/g, '.');
    };

    const isValidNumber = (value: string): boolean => {
        if (!value) return true; // Empty is valid (will use defaults)
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0;
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-6 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={handleManualCalc}
                    className="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-sm active:scale-95 text-center"
                >
                    ✍️ Tính theo giá nhập
                </button>
                <button
                    onClick={handleAutoFill}
                    disabled={isPending}
                    className="flex-1 bg-amber-500 dark:bg-amber-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-amber-600 dark:hover:bg-amber-700 transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {isPending ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Đang lấy dữ liệu...
                        </>
                    ) : (
                        <>⚡ Lấy giá hiện tại</>
                    )}
                </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 transition-colors">
                    ⚙️ Chi tiết Cấu hình
                </h2>
                <button
                    onClick={handleFetchData}
                    className="text-xs text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 underline transition-colors"
                >
                    Chỉ cập nhật số liệu (Không điền)
                </button>
            </div>

            <div className="space-y-4">
                {/* World Gold Price */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors">Giá Vàng Thế giới (USD/Ounce)</label>
                        {liveData?.goldPriceUSD && (
                            <button
                                onClick={applyGold}
                                className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded hover:bg-amber-100 transition-colors"
                                title="Click để áp dụng"
                            >
                                Live: ${liveData.goldPriceUSD.toLocaleString()}
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                            type="text"
                            value={formatNumber(worldPrice)}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setWorldPrice(parseNumber(e.target.value))}
                            className={`w-full pl-8 pr-4 py-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all ${isValidNumber(worldPrice) ? 'border-slate-300' : 'border-red-500'
                                }`}
                            placeholder="ví dụ 2000"
                        />
                    </div>
                </div>

                {/* FX Rate */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors">Tỷ giá USD/VND</label>
                        {liveData?.fxRateVND && (
                            <button
                                onClick={applyFx}
                                className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded hover:bg-green-100 transition-colors"
                                title="Click để áp dụng"
                            >
                                Live: {liveData.fxRateVND.toLocaleString()} ₫
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₫</span>
                        <input
                            type="text"
                            value={formatNumber(fxRate)}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setFxRate(parseNumber(e.target.value))}
                            className={`w-full pl-8 pr-4 py-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all ${isValidNumber(fxRate) ? 'border-slate-300' : 'border-red-500'
                                }`}
                            placeholder="ví dụ 25.000"
                        />
                    </div>
                </div>

                {/* Market Price */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-slate-800 dark:text-slate-100 mb-1 transition-colors">Giá Thị trường Trong nước (VND/Lượng)</label>
                        {liveData?.domesticPrices && liveData.domesticPrices.length > 0 && (
                            <button
                                onClick={applyAverageDomestic}
                                className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
                                title="Click để áp dụng giá trung bình"
                            >
                                TB: {Math.round(liveData.domesticPrices.reduce((sum, item) => sum + item.sell, 0) / liveData.domesticPrices.length).toLocaleString()} ₫
                            </button>
                        )}
                    </div>

                    {/* Domestic Sources List */}
                    {liveData?.domesticPrices && liveData.domesticPrices.length > 0 && (
                        <div className="mb-2 grid grid-cols-3 gap-2">
                            {liveData.domesticPrices.map((item) => (
                                <div key={item.source} className="text-center p-1 bg-slate-50 dark:bg-slate-700 rounded border border-slate-100 dark:border-slate-600 transition-colors">
                                    <div className="text-[10px] text-slate-500 font-bold">{item.source}</div>
                                    <div className="text-[10px] text-slate-800 dark:text-slate-200 transition-colors">{item.sell.toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₫</span>
                        <input
                            type="text"
                            value={formatNumber(marketPrice)}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setMarketPrice(parseNumber(e.target.value))}
                            className={`w-full pl-8 pr-4 py-2 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${isValidNumber(marketPrice) ? 'border-slate-300' : 'border-red-500'
                                }`}
                            placeholder="ví dụ 70.000.000"
                        />
                    </div>
                </div>

                {/* Advanced Config */}
                <details className="group pt-2">
                    <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 select-none">
                        <span>Phí & Thuế (Nâng cao)</span>
                        <span className="transition group-open:rotate-180">▼</span>
                    </summary>
                    <div className="mt-3 grid grid-cols-1 gap-4 pl-2 border-l-2 border-slate-100">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Vận chuyển & Bảo hiểm (USD/Ounce)</label>
                            <input
                                type="text"
                                value={formatNumber(transportFee)}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setTransportFee(parseNumber(e.target.value))}
                                className={`w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-slate-400 outline-none ${isValidNumber(transportFee) ? 'border-slate-300' : 'border-red-500'
                                    }`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Thuế & Gia công (VND/Lượng)</label>
                            <input
                                type="text"
                                value={formatNumber(tax)}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setTax(parseNumber(e.target.value))}
                                className={`w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-slate-400 outline-none ${isValidNumber(tax) ? 'border-slate-300' : 'border-red-500'
                                    }`}
                            />
                        </div>
                    </div>
                </details>
            </div>
        </div>
    );
}
