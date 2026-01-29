import { Decimal } from 'decimal.js';
import { calculateGoldPriceVN, calculatePremium } from './pricing-engine';
import { PricingConfig } from './types';

function runTests() {
    console.log('Running Pricing Engine Tests...');

    // Scenario 1: Parity
    // World: $2000, FX: 25000, Fee: 0, Tax: 0
    // Formula: 2000 * 1.20565 * 25000 = 60,282,500
    const config1: PricingConfig = {
        fxRate: new Decimal('25000'),
        fees: {
            transportAndInsurance: new Decimal('0'),
            tax: new Decimal('0'),
        },
    };
    const price1 = calculateGoldPriceVN('2000', config1);
    const expected1 = new Decimal('2000').times('1.20565').times('25000');

    if (price1.equals(expected1)) {
        console.log('✅ Scenario 1 Passed: ', price1.toString());
    } else {
        console.error('❌ Scenario 1 Failed: Expected', expected1.toString(), 'Got', price1.toString());
    }

    // Scenario 2: With Fees and Tax
    // World: $2000, P: $2, FX: 25000, Tax: 500,000
    // Formula: ((2000 + 2) * 1.20565 * 25000) + 500,000
    // (2002 * 1.20565 * 25000) + 500,000
    // (2413.7113 * 25000) + 500,000
    // 60,342,782.5 + 500,000 = 60,842,782.5
    const config2: PricingConfig = {
        fxRate: new Decimal('25000'),
        fees: {
            transportAndInsurance: new Decimal('2'),
            tax: new Decimal('500000'),
        },
    };
    const price2 = calculateGoldPriceVN('2000', config2);
    const expected2 = new Decimal('60842782.5');

    if (price2.equals(expected2)) {
        console.log('✅ Scenario 2 Passed: ', price2.toString());
    } else {
        console.error('❌ Scenario 2 Failed: Expected', expected2.toString(), 'Got', price2.toString());
    }

    // Scenario 3: Premium Calculation
    // Market: 70,000,000, Theoretical: 60,000,000
    // Premium: (70/60) - 1 = 0.1666...
    const premium = calculatePremium('70000000', new Decimal('60000000'));
    const expectedPremium = new Decimal('70000000').dividedBy('60000000').minus(1);

    if (premium.equals(expectedPremium)) {
        console.log('✅ Scenario 3 Passed: Premium', premium.toFixed(4));
    } else {
        console.error('❌ Scenario 3 Failed');
    }
}

try {
    runTests();
} catch (e) {
    console.error('Failed to run tests:', e);
}
