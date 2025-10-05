import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <SettingsIcon className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Configure platform settings and preferences</p>
        </div>
      </div>
      
      <div className="card">
        <div className="text-center py-12">
          <SettingsIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Settings Management</h3>
          <p className="mt-1 text-sm text-gray-500">Coming soon - Full settings management interface</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
