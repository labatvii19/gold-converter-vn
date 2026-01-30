import { Decimal } from 'decimal.js';

export type CurrencyCode = 'USD' | 'VND';
export type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'All';

export interface GoldPriceWorld {
    amount: Decimal;
    currency: 'USD';
    unit: 'Ounce';
}

export interface GoldPriceVN {
    amount: Decimal;
    currency: 'VND';
    unit: 'Luong';
}

export interface Fees {
    transportAndInsurance: Decimal; // USD/Ounce
    tax: Decimal; // VND/Luong (Import tax + Fabrication)
}

export interface PricingConfig {
    fxRate: Decimal; // USD/VND
    fees: Fees;
}
