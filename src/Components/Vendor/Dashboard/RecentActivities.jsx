import React from 'react';
import { Package, Truck, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const RecentActivities = ({ recentActivities, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#586330]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
        {recentActivities.length > 0 && (
          <span className="text-sm text-gray-500">
            {recentActivities.length} activities
          </span>
        )}
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {recentActivities.length > 0 ? (
          recentActivities.map((activity, idx) => (
            <ActivityItem key={activity.id || idx} activity={activity} />
          ))
        ) : (
          <EmptyActivities />
        )}
      </div>
    </div>
  );
};

const ActivityItem = ({ activity }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'order_pending':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'order_shipped':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'order_completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'order_cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'order_pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'order_shipped':
        return 'bg-blue-50 border-blue-200';
      case 'order_completed':
        return 'bg-green-50 border-green-200';
      case 'order_cancelled':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div 
      className={`flex items-start space-x-3 p-4 rounded-lg border transition-all hover:shadow-sm ${getActivityColor(activity.type)}`}
    >
      <div className="flex-shrink-0 mt-1">
        {getActivityIcon(activity.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {activity.description}
        </p>
      </div>
      
      <div className="flex-shrink-0 text-right">
        <p className="text-xs text-gray-500 whitespace-nowrap">
          {activity.date}
        </p>
      </div>
    </div>
  );
};

const EmptyActivities = () => (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
      <Package className="w-8 h-8 text-gray-400" />
    </div>
    <h4 className="text-sm font-medium text-gray-600 mb-1">No Recent Activities</h4>
    <p className="text-xs text-gray-500">
      Order activities will appear here
    </p>
  </div>
);

export default RecentActivities;