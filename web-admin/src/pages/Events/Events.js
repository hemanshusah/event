import React from 'react';
import { Calendar } from 'lucide-react';

const Events = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Calendar className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
          <p className="text-sm text-gray-500">Manage all events across the three stages</p>
        </div>
      </div>
      
      <div className="card">
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Events Management</h3>
          <p className="mt-1 text-sm text-gray-500">Coming soon - Full event management interface</p>
        </div>
      </div>
    </div>
  );
};

export default Events;
