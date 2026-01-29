'use server';

import { Decimal } from 'decimal.js';

export interface DomesticPrice {
    source: string;
    buy: number;
    sell: number;
}

export interface MarketData {
    goldPriceUSD: number | null;
    fxRateVND: number | null;
    domesticPrices: DomesticPrice[];
    lastUpdated: string;
}

export async function fetchMarketData(): Promise<MarketData> {
    const data: MarketData = {
        goldPriceUSD: null,
        fxRateVND: null,
        domesticPrices: [],
        lastUpdated: new Date().toISOString(),
    };

    try {
        // 1. Fetch Gold Prices (International + Domestic)
        // Source: vang.today
        const goldRes = await fetch('https://www.vang.today/api/prices', { next: { revalidate: 300 } });
        if (goldRes.ok) {
            const goldJson = await goldRes.json();
            const prices = goldJson.prices;

            if (prices) {
                // International
                if (prices['XAUUSD']) {
                    data.goldPriceUSD = prices['XAUUSD'].buy; // Convention: Spot Price is often 'buy'/mid
                }

                // Domestic
                const sources = [
                    { key: 'VNGSJC', label: 'SJC' },
                    { key: 'DOHNL', label: 'DOJI' },
                    { key: 'PQHNVM', label: 'PNJ' }
                ];

                for (const src of sources) {
                    const item = prices[src.key];
                    if (item) {
                        data.domesticPrices.push({
                            source: src.label,
                            buy: item.buy,
                            sell: item.sell
                        });
                    }
                }
            }
        }
    } catch (e) {
        console.error("Failed to fetch Gold Price", e);
    }

    try {
        // 2. Fetch FX Rate
        const fxRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD', { next: { revalidate: 3600 } });
        if (fxRes.ok) {
            const fxJson = await fxRes.json();
            if (fxJson.rates && fxJson.rates.VND) {
                data.fxRateVND = fxJson.rates.VND;
            }
        }
    } catch (e) {
        console.error("Failed to fetch FX Rate", e);
    }

    return data;
}

// ============================================
// Historical Gold Price Data (Chart Feature)
// ============================================

export interface HistoricalDataPoint {
    timestamp: string; // ISO format
    goldPriceUSD: number;
    domesticAvgVND: number;
}

/**
 * Fetches historical gold price data for chart visualization
 * Phase 2.1: Hybrid approach for extended historical data
 * - ≤30 days: Real data from vang.today (both international and domestic)
 * - >30 days: Hybrid (FreeGoldAPI international + extrapolated domestic)
 */
export async function fetchHistoricalGoldData(range: string = '1M'): Promise<HistoricalDataPoint[]> {
    'use server';

    const daysMap: Record<string, number> = {
        '1W': 7,
        '1M': 30,
        '3M': 90,
        '6M': 180,
        '1Y': 365,
    };

    const days = daysMap[range] || 30;

    // Phase 2.1: For ranges >30 days, use hybrid approach
    if (days > 30) {
        console.log(`Range ${range} (${days} days) - using hybrid FreeGoldAPI + extrapolation`);

        try {
            // Fetch international data from FreeGoldAPI + domestic 30d from vang.today
            const [internationalData, domestic30dData] = await Promise.all([
                fetchFreeGoldAPIData(days),
                // Fetch 30 days of domestic data for ratio calculation
                (async () => {
                    try {
                        const result = await fetchRecentDomesticData(30);
                        return result;
                    } catch (error) {
                        console.warn('Failed to fetch 30d domestic data for extrapolation:', error);
                        return [];
                    }
                })()
            ]);

            // If we got valid international data, extrapolate domestic
            if (internationalData.length > 0 && domestic30dData.length > 0) {
                const mergedData = extrapolateDomesticPrices(internationalData, domestic30dData);
                console.log(`Phase 2.1: Successfully fetched ${mergedData.length} days of hybrid data`);
                return mergedData;
            }

            // If hybrid failed, fall back to demo
            console.warn('Phase 2.1: Hybrid approach failed, falling back to demo data');
            throw new Error('Hybrid approach failed');

        } catch (error) {
            console.error('Phase 2.1: Error in hybrid approach, using demo data:', error);
            return generateDemoData(range, days);
        }
    }

    // Phase 2: For ranges ≤30 days, use real vang.today API
    try {
        // Fetch historical data from vang.today API
        const [goldResponse, domesticResponse] = await Promise.all([
            fetch(`https://www.vang.today/api/prices?type=XAUUSD&days=${days}`, {
                next: { revalidate: 3600 } // Cache for 1 hour
            }),
            fetch(`https://www.vang.today/api/prices?type=VNGSJC&days=${days}`, {
                next: { revalidate: 3600 }
            })
        ]);

        if (!goldResponse.ok || !domesticResponse.ok) {
            throw new Error('API response not ok');
        }

        const goldData = await goldResponse.json();
        const domesticData = await domesticResponse.json();

        // Transform API response to HistoricalDataPoint[]
        const data: HistoricalDataPoint[] = [];

        if (goldData.success && goldData.history && Array.isArray(goldData.history)) {
            // Create a map of domestic prices by date for easy lookup
            const domesticMap = new Map<string, number>();
            if (domesticData.success && domesticData.history && Array.isArray(domesticData.history)) {
                for (const entry of domesticData.history) {
                    const price = entry.prices?.VNGSJC?.buy || entry.prices?.VNGSJC?.sell;
                    if (price) {
                        domesticMap.set(entry.date, price);
                    }
                }
            }

            // Process gold data and merge with domestic
            for (const entry of goldData.history) {
                const goldPrice = entry.prices?.XAUUSD?.buy || entry.prices?.XAUUSD?.sell;
                const domesticPrice = domesticMap.get(entry.date);

                if (goldPrice && domesticPrice) {
                    // Convert date string to ISO timestamp
                    const timestamp = new Date(entry.date).toISOString();

                    data.push({
                        timestamp,
                        goldPriceUSD: goldPrice,
                        domesticAvgVND: domesticPrice
                    });
                }
            }
        }

        // If we got valid data, return it (newest first)
        if (data.length > 0) {
            return data.reverse(); // API returns newest first, we want oldest first
        }

        // If no valid data, fall back to demo
        throw new Error('No valid data from API');

    } catch (error) {
        console.error('Failed to fetch historical data from vang.today, using demo data:', error);
        return generateDemoData(range, days);
    }
}

/**
 * Generates demo data for fallback or ranges >30 days
 * Kept from Phase 1 for graceful degradation
 */
function generateDemoData(range: string, days: number): HistoricalDataPoint[] {
    const data: HistoricalDataPoint[] = [];
    const now = new Date();

    // Base values with realistic trends
    const baseGoldUSD = 2650;
    const baseDomesticVND = 88000000;

    for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Add realistic volatility
        const goldNoise = (Math.sin(i * 0.3) * 50) + (Math.random() * 40 - 20);
        const domesticNoise = (Math.sin(i * 0.25) * 1500000) + (Math.random() * 800000 - 400000);

        // Slight upward trend
        const trend = (days - i) * 2;

        data.push({
            timestamp: date.toISOString(),
            goldPriceUSD: Math.round((baseGoldUSD + goldNoise + trend) * 100) / 100,
            domesticAvgVND: Math.round(baseDomesticVND + domesticNoise + (trend * 30000)),
        });
    }

    return data;
}

/**
 * Helper function to fetch recent 30 days of domestic data for ratio calculation
 */
async function fetchRecentDomesticData(days: number): Promise<HistoricalDataPoint[]> {
    const [goldResponse, domesticResponse] = await Promise.all([
        fetch(`https://www.vang.today/api/prices?type=XAUUSD&days=${days}`, {
            next: { revalidate: 3600 }
        }),
        fetch(`https://www.vang.today/api/prices?type=VNGSJC&days=${days}`, {
            next: { revalidate: 3600 }
        })
    ]);

    if (!goldResponse.ok || !domesticResponse.ok) {
        throw new Error('Failed to fetch recent domestic data');
    }

    const goldData = await goldResponse.json();
    const domesticData = await domesticResponse.json();

    const data: HistoricalDataPoint[] = [];

    if (goldData.success && goldData.history && Array.isArray(goldData.history)) {
        const domesticMap = new Map<string, number>();
        if (domesticData.success && domesticData.history && Array.isArray(domesticData.history)) {
            for (const entry of domesticData.history) {
                const price = entry.prices?.VNGSJC?.buy || entry.prices?.VNGSJC?.sell;
                if (price) {
                    domesticMap.set(entry.date, price);
                }
            }
        }

        for (const entry of goldData.history) {
            const goldPrice = entry.prices?.XAUUSD?.buy || entry.prices?.XAUUSD?.sell;
            const domesticPrice = domesticMap.get(entry.date);

            if (goldPrice && domesticPrice) {
                data.push({
                    timestamp: new Date(entry.date).toISOString(),
                    goldPriceUSD: goldPrice,
                    domesticAvgVND: domesticPrice
                });
            }
        }
    }

    return data.reverse();
}

// ============================================
// Phase 2.1: Extended Historical Data (>30 days)
// ============================================

interface FreeGoldAPIResponse {
    date: string;
    gold_usd_oz?: number;
    usd?: number;
}

/**
 * Fetches historical gold data from FreeGoldAPI for extended ranges (>30 days)
 * Data source: https://www.freegoldapi.com (768 years of data)
 */
async function fetchFreeGoldAPIData(days: number): Promise<{ date: string; priceUSD: number }[]> {
    try {
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // FreeGoldAPI uses the JSON endpoint
        const response = await fetch('https://www.freegoldapi.com/api/v1/latest.json', {
            next: { revalidate: 86400 } // Cache for 24 hours (historical data doesn't change)
        });

        if (!response.ok) {
            throw new Error(`FreeGoldAPI returned ${response.status}`);
        }

        const data: FreeGoldAPIResponse[] = await response.json();

        // Filter and transform data for our date range
        const result: { date: string; priceUSD: number }[] = [];
        const startTime = startDate.getTime();
        const endTime = endDate.getTime();

        for (const entry of data) {
            const entryDate = new Date(entry.date);
            const entryTime = entryDate.getTime();

            // Check if date is in range and has gold price
            if (entryTime >= startTime && entryTime <= endTime) {
                const price = entry.gold_usd_oz || entry.usd;
                if (price) {
                    result.push({
                        date: entry.date,
                        priceUSD: price
                    });
                }
            }
        }

        // Sort by date (oldest first)
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return result;
    } catch (error) {
        console.error('FreeGoldAPI fetch failed:', error);
        throw error; // Propagate to trigger fallback
    }
}

/**
 * Extrapolates domestic prices based on international price trend
 * Uses the 30-day domestic/international ratio to estimate historical domestic prices
 */
function extrapolateDomesticPrices(
    internationalData: { date: string; priceUSD: number }[],
    domestic30d: HistoricalDataPoint[]
): HistoricalDataPoint[] {
    // Calculate average VND/USD ratio from recent 30 days
    const ratios: number[] = [];
    for (const point of domestic30d) {
        if (point.goldPriceUSD > 0) {
            const ratio = point.domesticAvgVND / point.goldPriceUSD;
            ratios.push(ratio);
        }
    }

    if (ratios.length === 0) {
        throw new Error('Cannot calculate price ratio from 30-day data');
    }

    // Use average ratio
    const avgRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;

    // Calculate standard deviation for adding realistic volatility
    const variance = ratios.reduce((sum, r) => sum + Math.pow(r - avgRatio, 2), 0) / ratios.length;
    const stdDev = Math.sqrt(variance);

    // Transform international data to full historical data
    const result: HistoricalDataPoint[] = [];
    for (const entry of internationalData) {
        // Add small random variation based on historical volatility
        const randomFactor = (Math.random() - 0.5) * stdDev * 0.5; // ±25% of std dev
        const estimatedDomestic = entry.priceUSD * (avgRatio + randomFactor);

        result.push({
            timestamp: new Date(entry.date).toISOString(),
            goldPriceUSD: entry.priceUSD,
            domesticAvgVND: Math.round(estimatedDomestic)
        });
    }

    return result;
}

/**
 * Updated fetchHistoricalGoldData with Phase 2.1: Extended historical support
 * - ≤30 days: Real data from vang.today (both international and domestic)
 * - >30 days: Hybrid (FreeGoldAPI international + extrapolated domestic)
 */

