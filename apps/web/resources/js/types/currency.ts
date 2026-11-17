export interface Currency { code: string; name: string; symbol: string; exchange_rate: string; decimal_places: number }
export interface CurrencySnapshot { active: Currency[]; default: string; selected: string; base: 'EUR' }
