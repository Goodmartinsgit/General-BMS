export const CURRENCIES = {
  // ── Nigeria (default) ────────────────────────────────────────────────────
  NGN: { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira' },

  // ── African currencies (alphabetical by code) ────────────────────────────
  AOA: { code: 'AOA', symbol: 'Kz',  name: 'Angolan Kwanza' },
  BIF: { code: 'BIF', symbol: 'Fr',  name: 'Burundian Franc' },
  BWP: { code: 'BWP', symbol: 'P',   name: 'Botswanan Pula' },
  CDF: { code: 'CDF', symbol: 'Fr',  name: 'Congolese Franc (DRC)' },
  CVE: { code: 'CVE', symbol: '$',   name: 'Cape Verdean Escudo' },
  DJF: { code: 'DJF', symbol: 'Fr',  name: 'Djiboutian Franc' },
  DZD: { code: 'DZD', symbol: 'دج',  name: 'Algerian Dinar' },
  EGP: { code: 'EGP', symbol: 'E£',  name: 'Egyptian Pound' },
  ERN: { code: 'ERN', symbol: 'Nfk', name: 'Eritrean Nakfa' },
  ETB: { code: 'ETB', symbol: 'Br',  name: 'Ethiopian Birr' },
  GHS: { code: 'GHS', symbol: '₵',   name: 'Ghanaian Cedi' },
  GMD: { code: 'GMD', symbol: 'D',   name: 'Gambian Dalasi' },
  GNF: { code: 'GNF', symbol: 'Fr',  name: 'Guinean Franc' },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  KMF: { code: 'KMF', symbol: 'Fr',  name: 'Comorian Franc' },
  LRD: { code: 'LRD', symbol: 'L$',  name: 'Liberian Dollar' },
  LSL: { code: 'LSL', symbol: 'L',   name: 'Lesotho Loti' },
  LYD: { code: 'LYD', symbol: 'LD',  name: 'Libyan Dinar' },
  MAD: { code: 'MAD', symbol: 'DH',  name: 'Moroccan Dirham' },
  MGA: { code: 'MGA', symbol: 'Ar',  name: 'Malagasy Ariary' },
  MRU: { code: 'MRU', symbol: 'UM',  name: 'Mauritanian Ouguiya' },
  MUR: { code: 'MUR', symbol: '₨',   name: 'Mauritian Rupee' },
  MWK: { code: 'MWK', symbol: 'MK',  name: 'Malawian Kwacha' },
  MZN: { code: 'MZN', symbol: 'MT',  name: 'Mozambican Metical' },
  NAD: { code: 'NAD', symbol: 'N$',  name: 'Namibian Dollar' },
  RWF: { code: 'RWF', symbol: 'Fr',  name: 'Rwandan Franc' },
  SCR: { code: 'SCR', symbol: '₨',   name: 'Seychellois Rupee' },
  SDG: { code: 'SDG', symbol: 'ج.س', name: 'Sudanese Pound' },
  SLL: { code: 'SLL', symbol: 'Le',  name: 'Sierra Leonean Leone' },
  SOS: { code: 'SOS', symbol: 'Sh',  name: 'Somali Shilling' },
  SSP: { code: 'SSP', symbol: '£',   name: 'South Sudanese Pound' },
  STN: { code: 'STN', symbol: 'Db',  name: 'São Tomé & Príncipe Dobra' },
  SZL: { code: 'SZL', symbol: 'L',   name: 'Swazi Lilangeni' },
  TND: { code: 'TND', symbol: 'DT',  name: 'Tunisian Dinar' },
  TZS: { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
  UGX: { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
  XAF: { code: 'XAF', symbol: 'Fr',  name: 'Central African CFA Franc' },
  XOF: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc' },
  ZAR: { code: 'ZAR', symbol: 'R',   name: 'South African Rand' },
  ZMW: { code: 'ZMW', symbol: 'ZK',  name: 'Zambian Kwacha' },
  ZWG: { code: 'ZWG', symbol: 'ZiG', name: 'Zimbabwe Gold' },

  // ── Major world currencies ───────────────────────────────────────────────
  USD: { code: 'USD', symbol: '$',   name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€',   name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£',   name: 'British Pound' },
};

export const getCurrencySymbol = (currencyCode) => {
  return CURRENCIES[currencyCode]?.symbol || '$';
};

export const formatCurrency = (amount, currencyCode = 'USD') => {
  const symbol = getCurrencySymbol(currencyCode);
  const num = Number(amount);
  if (isNaN(num)) return `${symbol}0.00`;
  return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
