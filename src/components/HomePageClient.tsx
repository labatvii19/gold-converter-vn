'use client';

import React, { useState, useEffect } from 'react';
import { Decimal } from 'decimal.js';
import { fetchMarketDataV3 } from '@/app/actions';
import { calculateGoldPriceVN, calculatePremium } from '@/domain/pricing-engine';
import { PricingConfig } from '@/domain/types';
import { InputPanel } from '@/components/InputPanel';
import { ResultCard } from '@/components/ResultCard';
import { GoldPriceChart } from '@/components/GoldPriceChart';
import { ThemeToggle } from '@/components/ThemeToggle';
// Rename export to avoid confusion
export interface HomePageProps {
  initialData: {
    goldPriceUSD: string;
    fxRateVND: string;
    marketPriceVND: string;
  }
}

export default function HomePageClient({ initialData }: HomePageProps) {
  // Initialize state with props from server (SSR hydration)
  const [worldPrice, setWorldPrice] = useState<string>(initialData.goldPriceUSD);
  const [fxRate, setFxRate] = useState<string>(initialData.fxRateVND);
  const [transportFee, setTransportFee] = useState<string>('1.0');
  const [tax, setTax] = useState<string>('100000');
  const [marketPrice, setMarketPrice] = useState<string>(initialData.marketPriceVND);

  // Derived State
  const [theoreticalPrice, setTheoreticalPrice] = useState<Decimal>(new Decimal(0));
  const [premium, setPremium] = useState<Decimal>(new Decimal(0));
  const [premiumPercent, setPremiumPercent] = useState<Decimal>(new Decimal(0));
  const [showChart, setShowChart] = useState<boolean>(false);

  // Client-side fallback: If data looks like defaults (stale cache), fetch fresh data
  useEffect(() => {
    const checkAndFetch = async () => {
      // Check if we are showing default values
      const isDefaultWorld = worldPrice === '2000';
      const isDefaultMarket = marketPrice === '65000000';

      if (isDefaultWorld || isDefaultMarket) {
        console.log('[CLIENT] Defaults detected, attempting to fetch fresh data...');
        try {
          const data = await fetchMarketDataV3();

          if (data.goldPriceUSD) {
            setWorldPrice(data.goldPriceUSD.toString());
          }
          if (data.fxRateVND) {
            setFxRate(data.fxRateVND.toString());
          }
          if (data.domesticPrices && data.domesticPrices.length > 0) {
            const total = data.domesticPrices.reduce((sum, item) => sum + item.sell, 0);
            const avg = total / data.domesticPrices.length;
            setMarketPrice(avg.toString());
          }
        } catch (error) {
          console.error('[CLIENT] Failed to fetch fresh data:', error);
        }
      }
    };

    checkAndFetch();
  }, []); // Run once on mount

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
          {/* Legal Disclaimer */}
          <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg transition-colors">
            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed transition-colors">
              <span className="font-semibold">⚠️ Lưu ý quan trọng:</span> Thông tin giá vàng trên ứng dụng này chỉ mang tính chất <strong>tham khảo</strong> và được cung cấp qua các API bên thứ ba (
              <a href="https://vang.today" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-700 dark:hover:text-amber-300">vang.today</a>,{' '}
              <a href="https://www.freeGoldAPI.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-700 dark:hover:text-amber-300">FreeGoldAPI.com</a>,{' '}
              <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-700 dark:hover:text-amber-300">ExchangeRate-API.com</a>
              ). Chúng tôi <strong>không đảm bảo tính chính xác 100%</strong> của dữ liệu và <strong>không chịu trách nhiệm</strong> về bất kỳ quyết định tài chính hoặc giao dịch nào dựa trên thông tin từ ứng dụng này. Vui lòng tham khảo thêm từ các nguồn chính thức trước khi đưa ra quyết định đầu tư.
            </p>
          </div>

          {/* Author Credit */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors">
              Phát triển bởi <span className="font-semibold text-slate-700 dark:text-slate-300">NTTrung</span> | © 2026 |{' '}
              <a
                href="https://github.com/labatvii19/gold-converter-vn"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                GitHub
              </a>
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
