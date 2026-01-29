import { Decimal } from 'decimal.js';
import { RPD_LUONG_TO_OUNCE_RATIO } from './constants';
import { Fees, PricingConfig } from './types';

/**
 * Calculates the theoretical price of gold in VND/Luong based on World price and FX.
 * Formula: ((Gold_World + P) * 1.20565 * FX_Rate) + Tax_Fee
 * 
 * @param worldPriceUSD - Price of 1 Ounce of Gold in USD
 * @param config - Pricing configuration (FX, Fees)
 * @returns Theoretical price in VND/Luong
 */
export function calculateGoldPriceVN(
    worldPriceUSD: Decimal | number | string,
    config: PricingConfig
): Decimal {
    const worldPrice = new Decimal(worldPriceUSD);
    const p = config.fees.transportAndInsurance;
    const fx = config.fxRate;
    const tax = config.fees.tax;

    // ((Gold_World + P) * 1.20565 * FX_Rate) + Tax_Fee
    const adjustedWorldPrice = worldPrice.plus(p);
    const worldValueInOneLuong = adjustedWorldPrice.times(RPD_LUONG_TO_OUNCE_RATIO);
    const convertedToVND = worldValueInOneLuong.times(fx);
    const finalPrice = convertedToVND.plus(tax);

    return finalPrice;
}

/**
 * Calculates the premium of the Market price over the Theoretical price.
 * Formula: (Market_Price / Theoretical_Price) - 1
 * 
 * @param marketPriceVND - Actual market price in VND/Luong
 * @param theoreticalPriceVND - Calculated theoretical price in VND/Luong
 * @returns Premium as a decimal (e.g., 0.15 for 15%)
 */
export function calculatePremium(
    marketPriceVND: Decimal | number | string,
    theoreticalPriceVND: Decimal
): Decimal {
    const market = new Decimal(marketPriceVND);
    return market.dividedBy(theoreticalPriceVND).minus(1);
}
