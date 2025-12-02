import React from 'react';

const FinancialOverview = ({ financialData }) => {
  // Filter to only show the three specific cards (removed Total Payments)
  const filteredFinancialData = financialData.filter(item => 
    item.title === 'Total Revenue' || 
    item.title === 'Total Refunded' || 
    item.title === 'Overdue Bills'
  );

  return (
    <div className="bg-white rounded-xl  shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFinancialData.map((item, idx) => (
          <FinancialCard key={idx} item={item} />
        ))}
      </div>
    </div>
  );
};

const FinancialCard = ({ item }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-100">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{item.title}</p>
        <p className="text-2xl font-bold text-gray-800 mb-1">{item.value}</p>
        {item.subtitle && (
          <p className="text-xs mt-1 text-gray-600">
            {item.subtitle}
          </p>
        )}
        {item.trend && (
          <p className={`text-xs font-medium ${
            item.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
          }`}>
            {item.trend}
          </p>
        )}
      </div>
    </div>
  );
};

export default FinancialOverview;