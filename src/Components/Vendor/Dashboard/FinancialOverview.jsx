import React from 'react';

const FinancialOverview = ({ financialData }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {financialData.map((item, idx) => (
          <FinancialCard key={idx} item={item} />
        ))}
      </div>
    </div>
  );
};

const FinancialCard = ({ item }) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600'
  };

  const trendColor = item.trend?.startsWith('+') ? 'text-green-600' : 
                     item.trend?.startsWith('-') ? 'text-red-600' : 
                     'text-gray-600';

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-10 h-10 ${colorClasses[item.color] || 'bg-gray-100 text-gray-600'} rounded-full flex items-center justify-center text-xl`}>
              {item.icon || '💰'}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{item.title}</p>
              <p className="text-2xl font-bold text-gray-800 mb-1">{item.value}</p>
            </div>
          </div>
          
          {item.subtitle && (
            <p className="text-xs text-gray-500 mb-1">{item.subtitle}</p>
          )}
          
          {item.trend && (
            <p className={`text-xs font-medium ${trendColor}`}>
              {item.trend}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialOverview;