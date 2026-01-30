import { fetchMarketDataV3 } from '@/app/actions';
import HomePageClient from '@/components/HomePageClient';

// Ensure dynamic rendering to fetch fresh data on every request
export const dynamic = 'force-dynamic';

export default async function Page() {
    console.log('[SSR PAGE] Rendering Home Page...');
    // Fetch data on the server
    const data = await fetchMarketDataV3();
    console.log('[SSR PAGE] Data fetched:', JSON.stringify(data));

    // Prepare initial props with sensible defaults if fetch fails
    // Default values: 2000 USD, 25000 VND, 65M VND
    const initialData = {
        goldPriceUSD: data.goldPriceUSD ? data.goldPriceUSD.toString() : '2000',
        fxRateVND: data.fxRateVND ? data.fxRateVND.toString() : '25000',
        marketPriceVND: (data.domesticPrices && data.domesticPrices.length > 0)
            ? (data.domesticPrices.reduce((sum, item) => sum + item.sell, 0) / data.domesticPrices.length).toString()
            : '65000000'
    };

    return <HomePageClient initialData={initialData} />;
}
