import React, { useEffect, useState } from 'react';
import axios from 'axios';

const symbols = [
  { symbol: 'BTC/USD', key: 'BTC/USD', display: 'BTC/USD' },
  { symbol: 'XAU/USD', key: 'XAU/USD', display: 'XAU/USD' },
  { symbol: 'USD/JPY', key: 'USD/JPY', display: 'USD/JPY' },
  { symbol: 'GBP/CAD', key: 'GBP/CAD', display: 'GBP/CAD' }
];

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [countdown, setCountdown] = useState(600);
  const [error, setError] = useState(null); // New error state
  const [thresholds, setThresholds] = useState({
    'BTC/USD': 0.3,
    'XAU/USD': 0.25,
    'USD/JPY': 0.2,
    'GBP/CAD': 0.2,
  });

  const apiKey = import.meta.env.VITE_TWELVE_API_KEY;

  // Add debug log
  useEffect(() => {
    console.log('API Key:', apiKey ? 'Exists' : 'MISSING!');
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchVolatility();
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchData();
          return 600;
        }
        return prev - 1;
      });
    }, 1000);

    fetchData();
    return () => clearInterval(interval);
  }, []);

  const fetchVolatility = async () => {
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    setLoading(true);
    setError(null);
    
    try {
      const results = await Promise.all(
        symbols.map(async ({ symbol }) => {
          try {
            const res = await axios.get(
              `https://api.twelvedata.com/time_series?symbol=${symbol.replace('/', '')}&interval=15min&outputsize=5&apikey=${apiKey}`
            );

            // Add null checks
            if (!res.data?.values) throw new Error('No data returned');

            const candles = res.data.values;
            const closes = candles.map(c => parseFloat(c.close)).reverse();

            let atr = 0;
            for (let i = 1; i < closes.length; i++) {
              atr += Math.abs(closes[i] - closes[i - 1]);
            }
            atr = atr / (closes.length - 1);

            const base = closes[closes.length - 1];
            const vol = ((atr / base) * 100).toFixed(2);

            return {
              symbol,
              price: base.toFixed(4),
              volatility: vol,
              alert: parseFloat(vol) >= thresholds[symbol]
            };
          } catch (err) {
            console.error(`Error fetching ${symbol}:`, err);
            return {
              symbol,
              price: 'N/A',
              volatility: 'Error',
              alert: false
            };
          }
        })
      );

      setData(results);
    } catch (err) {
      console.error('Global fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}m ${sec}s`;
  };

  // Render error state first
  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-white">
        <h1 className="text-red-500 text-2xl mb-4">Error</h1>
        <p>{error}</p>
        {!apiKey && (
          <p className="mt-4">
            Please configure your API key in Netlify environment variables
          </p>
        )}
        <button 
          onClick={fetchVolatility}
          className="mt-4 px-4 py-2 bg-blue-500 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-white text-center">
        <h1>Loading market data...</h1>
        <p>Countdown: {formatTime(countdown)}</p>
      </div>
    );
  }

  // Main render
  return (
    // ... (keep your existing return JSX)
  );
}
