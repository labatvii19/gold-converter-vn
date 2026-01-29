import { Decimal } from 'decimal.js';

export const OUNCE_TO_GRAM = new Decimal('31.1034768');
export const LUONG_TO_GRAM = new Decimal('37.5');
// 1 Luong = 1.20565 Ounce (approximate, but we can derive it or use a fixed constant if preferred)
// Here we derive it to ensure consistency: 37.5 / 31.1034768
export const LUONG_TO_OUNCE = LUONG_TO_GRAM.dividedBy(OUNCE_TO_GRAM);

// Fixed constant for simple parity check if needed, but derived is better for precision.
// The RPD says "1 Lượng = 1.20565 Ounce" as a constant.
// Let's us the RPD constant for "Explanability" as per instructions, but keep the precise one for math if needed.
// Actually RPD Section 6.1 says "1 Lượng = 1.20565 Ounce". We should stick to the RPD for the formula.
export const RPD_LUONG_TO_OUNCE_RATIO = new Decimal('1.20565');
