import React from 'react';
import { Users as UsersIcon } from 'lucide-react';

const Users = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <UsersIcon className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-sm text-gray-500">Manage founders, investors, and admin users</p>
        </div>
      </div>
      
      <div className="card">
        <div className="text-center py-12">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Users Management</h3>
          <p className="mt-1 text-sm text-gray-500">Coming soon - Full user management interface</p>
        </div>
      </div>
    </div>
  );
};

export default Users;
