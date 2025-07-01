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
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(600);
  const [thresholds, setThresholds] = useState({
    'BTC/USD': 0.3,
    'XAU/USD': 0.25,
    'USD/JPY': 0.2,
    'GBP/CAD': 0.2,
  });

  const apiKey = import.meta.env.VITE_TWELVE_API_KEY;

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchVolatility();
          return 600;
        }
        return prev - 1;
      });
    }, 1000);

    fetchVolatility();

    return () => clearInterval(interval);
  }, []);

  const fetchVolatility = async () => {
    setLoading(true);
    const results = [];

    for (const { symbol } of symbols) {
      try {
        const res = await axios.get(
          `https://api.twelvedata.com/time_series?symbol=${symbol.replace('/', '')}&interval=15min&outputsize=5&apikey=${apiKey}`
        );

        const candles = res.data?.values || [];
        const closes = candles.map(c => parseFloat(c.close)).reverse();

        let atr = 0;
        for (let i = 1; i < closes.length; i++) {
          atr += Math.abs(closes[i] - closes[i - 1]);
        }
        atr = atr / (closes.length - 1);

        const base = closes[closes.length - 1];
        const vol = ((atr / base) * 100).toFixed(2);

        results.push({
          symbol,
          price: base.toFixed(4),
          volatility: vol,
          alert: parseFloat(vol) >= thresholds[symbol]
        });

      } catch (error) {
        console.error('Error fetching data for', symbol, error);
      }
    }

    setData(results);
    setLoading(false);
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}m ${sec}s`;
  };

  return (
    <div className="max-w-3xl mx-auto p-4 text-white font-sans">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-green-400 mb-2">Forex + BTC Volatility Monitor</h1>
        <div className="text-sm text-gray-400">Next auto-refresh in: {formatTime(countdown)}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {symbols.map(({ symbol }) => (
          <div key={symbol} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg shadow-md">
            <label className="text-sm text-gray-300">{symbol} Threshold (%)</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.01"
              value={thresholds[symbol]}
              onChange={e => {
                const val = parseFloat(e.target.value);
                setThresholds(prev => ({ ...prev, [symbol]: isNaN(val) ? 0.2 : val }));
              }}
              className="w-20 p-1 bg-gray-700 text-white rounded border border-green-400"
            />
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto bg-gray-900 rounded-lg overflow-hidden shadow">
          <thead>
            <tr className="bg-green-400 text-black text-left">
              <th className="px-4 py-2">Symbol</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Volatility (%)</th>
              <th className="px-4 py-2">Alert</th>
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.symbol} className={`border-b border-gray-700 ${row.alert ? 'bg-yellow-700/30 animate-pulse' : ''}`}>
                <td className="px-4 py-2">{row.symbol}</td>
                <td className="px-4 py-2">{row.price}</td>
                <td className="px-4 py-2">{row.volatility}</td>
                <td className="px-4 py-2">{row.alert ? '⚠️' : '✅'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="text-center mt-4 text-green-300">Refreshing data...</div>}
      </div>
    </div>
  );
}
