import React, { createContext, useState, useEffect, useContext } from 'react';

// Create Currency Context
export const CurrencyContext = createContext();

const CURRENCY_SYMBOLS = {
  USD: '$', INR: '₹', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$',
  AED: 'د.إ', CNY: '¥', RUB: '₽', KRW: '₩', NGN: '₦', ZAR: 'R', BRL: 'R$',
  SGD: 'S$', HKD: 'HK$', MYR: 'RM', THB: '฿', IDR: 'Rp', PKR: '₨',
  MXN: '$', CHF: 'CHF', SEK: 'kr', NOK: 'kr', DKK: 'kr', PLN: 'zł',
  TRY: '₺', SAR: 'ر.س', QAR: 'ر.ق', KWD: 'د.ك', BHD: 'د.ب', OMR: 'ر.ع',
  EGP: 'E£', ILS: '₪', PHP: '₱', VND: '₫', BDT: '৳', LKR: 'Rs',
};

const EXCHANGE_API_KEY = '826ff07c1ff2bd58031f27fa';

export const CurrencyProvider = ({ children }) => {
  const [userCurrency, setUserCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [isLoading, setIsLoading] = useState(true);
  const [userCountry, setUserCountry] = useState('US');

  // Detect user location and fetch exchange rate
  useEffect(() => {
    const detectCurrencyAndFetchRate = async () => {
      try {
        setIsLoading(true);

        // Step 1: Detect user location using ipwhois.app
        const locationResponse = await fetch('https://ipwhois.app/json/');
        const locationData = await locationResponse.json();
        
        const detectedCurrency = locationData.currency_code || 'USD';
        const detectedCountry = locationData.country_code || 'US';
        
        console.log('🌍 User Location Detected:', {
          country: locationData.country,
          countryCode: detectedCountry,
          currency: detectedCurrency,
          city: locationData.city
        });

        setUserCurrency(detectedCurrency);
        setUserCountry(detectedCountry);
        setCurrencySymbol(CURRENCY_SYMBOLS[detectedCurrency] || detectedCurrency);

        // Step 2: Fetch exchange rates from ExchangeRate-API
        const rateResponse = await fetch(
          `https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest/USD`
        );
        const rateData = await rateResponse.json();

        if (rateData.result === 'success') {
          const rate = rateData.conversion_rates[detectedCurrency] || 1;
          setExchangeRate(rate);
          
          console.log('💱 Exchange Rate Loaded:', {
            from: 'USD',
            to: detectedCurrency,
            rate: rate,
            symbol: CURRENCY_SYMBOLS[detectedCurrency]
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error('❌ Currency detection error:', error);
        // Fallback to USD
        setUserCurrency('USD');
        setExchangeRate(1);
        setCurrencySymbol('$');
        setUserCountry('US');
        setIsLoading(false);
      }
    };

    detectCurrencyAndFetchRate();
  }, []);

  // Convert price from USD to user currency
  const convertPrice = (priceInUSD) => {
    if (!priceInUSD || isNaN(priceInUSD) || priceInUSD === 0) {
      // Don't log warning for 0 prices, just return 0
      return 0;
    }
    const converted = Math.round(priceInUSD * exchangeRate);
    return converted;
  };

  // Format price with currency symbol (with space)
  const formatPrice = (priceInUSD) => {
    const convertedPrice = convertPrice(priceInUSD);
    return `${currencySymbol} ${convertedPrice.toLocaleString()}`;
  };

  const value = {
    userCurrency,
    exchangeRate,
    currencySymbol,
    userCountry,
    isLoading,
    convertPrice,
    formatPrice,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Custom hook to use currency context
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};
