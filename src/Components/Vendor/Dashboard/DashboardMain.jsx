import React from 'react';
import { AlertTriangle } from 'lucide-react';
import FinancialOverview from './FinancialOverview';
import RecentActivities from './RecentActivities';

const DashboardMain = ({
  activeView,
  financialData,
  recentActivities,
  setShowNotifications,
  notifications,
  outOfStockNotifications,
  isLoading
}) => {
  // Count urgent out-of-stock notifications
  const urgentOutOfStockCount = outOfStockNotifications?.length || 0;

  if (activeView !== 'dashboard') {
    return <OtherView activeView={activeView} />;
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Out of Stock Alert Banner */}
      {urgentOutOfStockCount > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-800">Urgent: Out of Stock Products</h3>
              <p className="text-red-600 text-sm">
                You have {urgentOutOfStockCount} product(s) that are out of stock. 
                Please restock to continue sales.
              </p>
            </div>
            <button
              onClick={() => setShowNotifications(true)}
              className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
            >
              View Details
            </button>
          </div>
        </div>
      )}

      <div className="gap-6">
        <div className="lg:col-span-2 space-y-6">
          <FinancialOverview financialData={financialData} />
          <RecentActivities recentActivities={recentActivities} isLoading={isLoading} />
        </div>
      </div>
    </main>
  );
};

const OtherView = ({ activeView }) => (
  <main className="flex-1 overflow-y-auto p-6">
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        {activeView.charAt(0).toUpperCase() + activeView.slice(1)} View
      </h2>
      <p className="text-gray-600">
        This section is under development. Please check back later.
      </p>
    </div>
  </main>
);

export default DashboardMain;