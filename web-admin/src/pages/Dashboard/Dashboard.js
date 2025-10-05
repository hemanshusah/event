import React from 'react';
import { 
  Users, 
  Calendar, 
  Building2, 
  TrendingUp, 
  UserCheck, 
  Bell,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const Dashboard = () => {
  // Mock data - in real app, this would come from API
  const stats = [
    {
      name: 'Total Users',
      value: '1,234',
      change: '+12%',
      changeType: 'positive',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      name: 'Active Events',
      value: '8',
      change: '+2',
      changeType: 'positive',
      icon: Calendar,
      color: 'bg-green-500'
    },
    {
      name: 'Registered Startups',
      value: '456',
      change: '+23%',
      changeType: 'positive',
      icon: Building2,
      color: 'bg-purple-500'
    },
    {
      name: 'Verified Investors',
      value: '89',
      change: '+5',
      changeType: 'positive',
      icon: UserCheck,
      color: 'bg-orange-500'
    },
    {
      name: 'Pending Requests',
      value: '23',
      change: '-3',
      changeType: 'negative',
      icon: Bell,
      color: 'bg-red-500'
    },
    {
      name: 'Conversion Rate',
      value: '12.5%',
      change: '+1.2%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'bg-indigo-500'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'user_registered',
      message: 'New founder registered: John Doe',
      time: '2 minutes ago',
      icon: Users,
      color: 'text-blue-500'
    },
    {
      id: 2,
      type: 'event_created',
      message: 'New event created: Catalyst Connect - Mumbai',
      time: '15 minutes ago',
      icon: Calendar,
      color: 'text-green-500'
    },
    {
      id: 3,
      type: 'startup_verified',
      message: 'Startup verified: TechCorp Solutions',
      time: '1 hour ago',
      icon: Building2,
      color: 'text-purple-500'
    },
    {
      id: 4,
      type: 'investor_verified',
      message: 'Investor verified: Sarah Wilson',
      time: '2 hours ago',
      icon: UserCheck,
      color: 'text-orange-500'
    },
    {
      id: 5,
      type: 'access_request',
      message: 'New access request from investor',
      time: '3 hours ago',
      icon: Bell,
      color: 'text-red-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.changeType === 'positive' ? (
                          <ArrowUpRight className="self-center flex-shrink-0 h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="self-center flex-shrink-0 h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {stat.changeType === 'positive' ? 'Increased' : 'Decreased'} by
                        </span>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activities */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivities.map((activity, activityIdx) => {
                const Icon = activity.icon;
                return (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {activityIdx !== recentActivities.length - 1 ? (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${activity.color}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">{activity.message}</p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {activity.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Create New Event</span>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">View All Users</span>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium">Send Broadcast</span>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium">View Analytics</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
