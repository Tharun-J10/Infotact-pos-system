import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const InventoryChart = ({ products }) => {
  // Prepare data for the chart (showing product names and their stock levels)
  const chartData = products.map(p => ({
    name: p.name,
    Stock: p.stock
  }));

  return (
    <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white/80 shadow-[0_8px_32px_rgba(31,38,135,0.05)] mt-8">
      <h3 className="text-xl font-black text-gray-800 mb-6 tracking-tight">Real-Time Inventory Levels</h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{fill: '#6b7280', fontSize: 12, fontWeight: 600}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill: '#6b7280', fontSize: 12, fontWeight: 600}} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{fill: '#f3f4f6'}}
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
            />
            <Bar dataKey="Stock" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default InventoryChart;