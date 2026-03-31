'use client'

import React from 'react';
import dynamic from 'next/dynamic';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';

/**
 * Museum-Grade Chart for Partner Performance.
 * Re-engineered for production build stability.
 */
const PartnerStatsChartBase = ({ data }: { data: any[] }) => {
    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FBBC04" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#FBBC04" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid 
                        strokeDasharray="3 3" 
                        vertical={false} 
                        stroke="#ffffff05" 
                    />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#444444', fontSize: 9, fontWeight: 900, style: { textTransform: 'uppercase', letterSpacing: '0.1em' } } as any}
                        dy={15}
                    />
                    <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#444444', fontSize: 9, fontWeight: 900, letterSpacing: '0.1em' }}
                        dx={-10}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#0a0a0a', 
                            border: '1px solid #ffffff10', 
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '900',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                        }}
                        itemStyle={{ color: '#FBBC04' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="clicks" 
                        stroke="#FBBC04" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                        activeDot={{ r: 4, stroke: '#FBBC04', strokeWidth: 0, fill: '#FBBC04' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#ffffff30" 
                        strokeWidth={1}
                        fill="transparent"
                        activeDot={{ r: 3, stroke: '#ffffff30', strokeWidth: 0, fill: '#ffffff' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

// Export as a dynamically loaded component with no SSR to support Server Component parent pages
export default dynamic(() => Promise.resolve(PartnerStatsChartBase), { ssr: false });
