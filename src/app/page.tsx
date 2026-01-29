'use client';

import React, { useState, useEffect } from 'react';
import { Decimal } from 'decimal.js';
import { calculateGoldPriceVN, calculatePremium } from '@/domain/pricing-engine';
import { PricingConfig } from '@/domain/types';
import { InputPanel } from '@/components/InputPanel';
import { ResultCard } from '@/components/ResultCard';
import { GoldPriceChart } from '@/components/GoldPriceChart';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  // State for inputs (String to avoid float issues before processing)
  const [worldPrice, setWorldPrice] = useState<string>('2000');
  const [fxRate, setFxRate] = useState<string>('25000');
  const [transportFee, setTransportFee] = useState<string>('1.0');
  const [tax, setTax] = useState<string>('100000'); // Default tax guess
  const [marketPrice, setMarketPrice] = useState<string>('65000000');

  // Derived State
  const [theoreticalPrice, setTheoreticalPrice] = useState<Decimal>(new Decimal(0));
  const [premium, setPremium] = useState<Decimal>(new Decimal(0));
  const [premiumPercent, setPremiumPercent] = useState<Decimal>(new Decimal(0));
  const [showChart, setShowChart] = useState<boolean>(false);

  useEffect(() => {
    try {
      // Validate and parse
      const safeWorld = worldPrice || '0';
      const safeFx = fxRate || '0';
      const safeTransport = transportFee || '0';
      const safeTax = tax || '0';
      const safeMarket = marketPrice || '0';

      const config: PricingConfig = {
        fxRate: new Decimal(safeFx),
        fees: {
          transportAndInsurance: new Decimal(safeTransport),
          tax: new Decimal(safeTax),
        }
      };

      const calculatedPrice = calculateGoldPriceVN(safeWorld, config);
      setTheoreticalPrice(calculatedPrice);

      const marketDecimal = new Decimal(safeMarket);
      const gap = marketDecimal.minus(calculatedPrice);
      const premPct = calculatePremium(marketDecimal, calculatedPrice);

      setPremium(gap);
      setPremiumPercent(premPct);

    } catch (e) {
      console.error("Calculation Error", e);
    }
  }, [worldPrice, fxRate, transportFee, tax, marketPrice]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header with Theme Toggle */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2 transition-colors">
              Công cụ Chuyển đổi Giá Vàng
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
              Tính toán Giá Vàng dựa trên Giá Real-time (QUỐC TẾ và VIỆT NAM)
            </p>
          </div>
          <ThemeToggle />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Input */}
          <div className="lg:col-span-5">
            <InputPanel
              worldPrice={worldPrice} setWorldPrice={setWorldPrice}
              fxRate={fxRate} setFxRate={setFxRate}
              transportFee={transportFee} setTransportFee={setTransportFee}
              tax={tax} setTax={setTax}
              marketPrice={marketPrice} setMarketPrice={setMarketPrice}
            />
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7">
            <ResultCard
              theoreticalPrice={theoreticalPrice}
              marketPrice={new Decimal(marketPrice || 0)}
              premium={premium}
              premiumPercent={premiumPercent}
            />
          </div>
        </div>

        {/* Chart Section */}
        <div className="mt-8">
          <button
            onClick={() => setShowChart(!showChart)}
            className="w-full sm:w-auto mb-4 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
          >
            📊 {showChart ? 'Ẩn' : 'Xem'} biểu đồ giá vàng
          </button>

          {showChart && <GoldPriceChart visible={showChart} />}
        </div>

        {/* Legal Disclaimer - Stage 6.5 Governance Requirement */}
        <footer className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4">
            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong className="font-semibold">⚠️ Lưu ý quan trọng:</strong> Thông tin giá vàng trên ứng dụng này chỉ mang tính chất <strong>tham khảo</strong> và được cung cấp qua các API bên thứ ba.
              Chúng tôi <strong>không đảm bảo tính chính xác 100%</strong> của dữ liệu và <strong>không chịu trách nhiệm</strong> về bất kỳ quyết định tài chính hoặc giao dịch nào dựa trên thông tin từ ứng dụng này.
              Vui lòng <strong>kiểm tra giá chính thức</strong> từ các nguồn đáng tin cậy (ngân hàng, đại lý vàng) trước khi thực hiện giao dịch.
            </p>
            <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-2">
              Dữ liệu từ: vang.today, FreeGoldAPI.com, ExchangeRate-API.com
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
