import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { BaziChart } from '../types';

interface Props {
  wuxing: BaziChart['wuxing'];
}

export const ElementalChart: React.FC<Props> = ({ wuxing }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-64">
      {/* Radar Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2">
        <h3 className="text-xs text-gray-400 uppercase text-center mb-1">五行旺衰</h3>
        <ResponsiveContainer width="100%" height="90%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={wuxing.scores}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
            <Radar
              name="得分"
              dataKey="value"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2">
        <h3 className="text-xs text-gray-400 uppercase text-center mb-1">五行分布</h3>
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie
              data={wuxing.scores}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={5}
              dataKey="value"
            >
              {wuxing.scores.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <p className="text-xs text-center text-gray-600 mt-[-10px]">{wuxing.summary}</p>
      </div>
    </div>
  );
};
