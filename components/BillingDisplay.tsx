
import React from 'react';
import { CURRENCY_SYMBOL } from '../constants';

interface BillingDisplayProps {
  currentBill: number;
  totalLaughs: number;
  isMaxed: boolean;
}

const BillingDisplay: React.FC<BillingDisplayProps> = ({ currentBill, totalLaughs, isMaxed }) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 w-full max-w-4xl mx-auto mb-8">
      <div className="flex-1 bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl shadow-2xl backdrop-blur-md">
        <h3 className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-1">Current Bill</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-white">
            {CURRENCY_SYMBOL}{currentBill.toFixed(2)}
          </span>
          {isMaxed && (
            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full font-bold uppercase">
              Season Ticket Active
            </span>
          )}
        </div>
        <p className="text-zinc-400 text-xs mt-2">Maximum cap: {CURRENCY_SYMBOL}24.00</p>
      </div>

      <div className="flex-1 bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl shadow-2xl backdrop-blur-md">
        <h3 className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-1">Total Laughs</h3>
        <div className="text-5xl font-bold text-white">
          {totalLaughs}
        </div>
        <p className="text-zinc-400 text-xs mt-2">Detection sensitivity: 70%</p>
      </div>
    </div>
  );
};

export default BillingDisplay;
