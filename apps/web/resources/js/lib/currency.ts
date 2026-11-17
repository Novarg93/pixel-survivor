import type { Currency } from '../types/currency';

// Display arithmetic only. Settlement amounts always come from the server quote.
function rate(value: string): bigint {
    if (!/^\d{1,12}(\.\d{1,8})?$/.test(value)) throw new Error('Invalid exchange rate');
    const [whole, fraction = ''] = value.split('.');
    const result = BigInt(whole + fraction.padEnd(8, '0'));
    if (result <= 0n) throw new Error('Invalid exchange rate');
    return result;
}
export function convertMinor(amount: string, source: Currency, target: Currency, originalExponent = source.decimal_places): string {
    if (!/^-?\d{1,24}$/.test(amount) || source.code === 'XTS' || target.code === 'XTS') throw new Error('Invalid display amount');
    if (![originalExponent, target.decimal_places].every(v => Number.isInteger(v) && v >= 0 && v <= 4)) throw new Error('Invalid precision');
    const numerator = BigInt(amount) * rate(target.exchange_rate) * 10n ** BigInt(target.decimal_places);
    const denominator = rate(source.exchange_rate) * 10n ** BigInt(originalExponent);
    const absolute = numerator < 0n ? -numerator : numerator;
    const rounded = (absolute * 2n + denominator) / (denominator * 2n);
    return String(numerator < 0n ? -rounded : rounded);
}
export function formatMinor(amount: string, exponent: number, code: string, symbol = ''): string {
    if (!/^-?\d{1,64}$/.test(amount) || !Number.isInteger(exponent) || exponent < 0 || exponent > 4) throw new Error('Invalid monetary value');
    const value = BigInt(amount), negative = value < 0n, digits = String(negative ? -value : value).padStart(exponent + 1, '0');
    const decimal = exponent ? `${digits.slice(0, -exponent)}.${digits.slice(-exponent)}` : digits;
    return `${negative ? '-' : ''}${decimal} ${code}${symbol ? ` ${symbol}` : ''}`;
}
