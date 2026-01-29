'use client';

import React from 'react';
import { Decimal } from 'decimal.js';

interface ResultCardProps {
    theoreticalPrice: Decimal;
    marketPrice: Decimal;
    premium: Decimal;
    premiumPercent: Decimal;
}

export function ResultCard({
    theoreticalPrice,
    marketPrice,
    premium,
    premiumPercent
}: ResultCardProps) {
    const formatCurrency = (val: Decimal) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val.toNumber());
    };

    const isPremiumPositive = premium.isPositive();
    const premiumColor = isPremiumPositive ? 'text-red-500' : 'text-green-500'; // High premium is usually "bad" for buyers? Or just neutral. Let's use Red for high, Green for low/discount.
    // Actually, Green for positive premium might be better for sellers, Red for buyers.
    // Let's stick to neutral colors or just Semantic:
    // Gap > 0: Market is higher than Theoretical (Premium)
    // Gap < 0: Market is lower than Theoretical (Discount)

    return (
        <div className="space-y-6">
            {/* Main Result: Theoretical Price */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 p-6 rounded-2xl shadow-sm border border-amber-200 dark:border-amber-700/50 transition-colors duration-300">
                <h3 className="text-sm uppercase tracking-wide text-amber-800 dark:text-amber-300 font-semibold mb-2 transition-colors">Giá Vàng Quy Đổi (Lý thuyết)</h3>
                <div className="text-3xl sm:text-4xl font-extrabold text-amber-900 dark:text-amber-100 transition-colors">
                    {formatCurrency(theoreticalPrice)}
                    <span className="text-lg font-medium text-amber-700 dark:text-amber-400 ml-2 transition-colors">/ Lượng</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 opacity-80 transition-colors">
                    Công thức: ((Giá TG + Phí) * 1.20565 * Tỷ giá ) + Thuế
                </p>
            </div>

            {/* Comparison Logic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1 transition-colors">Giá Thị trường Hiện tại</div>
                    <div className="text-xl font-bold text-slate-800 dark:text-slate-100 transition-colors">{formatCurrency(marketPrice)}</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden transition-colors duration-300">
                    <div className="relative z-10">
                        <div className="text-sm text-slate-500 dark:text-slate-400 mb-1 transition-colors">Chênh lệch (Premium/Discount)</div>
                        <div className={`text-xl font-bold ${premium.isPositive() ? 'text-orange-600' : 'text-green-600'}`}>
                            {premium.isPositive() ? '+' : ''}{formatCurrency(premium)}
                        </div>
                        <div className={`text-sm font-medium ${premium.isPositive() ? 'text-orange-500' : 'text-green-500'}`}>
                            {premiumPercent.times(100).toFixed(2)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Explanation / Insight */}
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50 text-sm text-blue-800 dark:text-blue-200 transition-colors duration-300">
                <strong>Nhận xét:</strong> Giá thị trường đang <span className="font-bold">{premium.isPositive() ? 'CAO' : 'THẤP'} hơn {premiumPercent.times(100).abs().toFixed(1)}%</span> so với giá quy đổi lý thuyết.
            </div>
        </div>
    );
}
