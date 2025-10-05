import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Filter, MoreVertical, Edit, Trash2, Users, Clock, MapPin } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { eventsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Events = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    stage: '',
    status: '',
    isPublic: '',
    isInviteOnly: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const queryClient = useQueryClient();

  // Fetch events
  const { data: eventsData, isLoading, error } = useQuery(
    ['events', searchTerm, filters],
    () => eventsAPI.getEvents({
      search: searchTerm || undefined,
      ...filters
    }),
    {
      keepPreviousData: true
    }
  );

  // Delete event mutation
  const deleteEventMutation = useMutation(
    (eventId) => eventsAPI.deleteEvent(eventId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('events');
        toast.success('Event deleted successfully');
        setShowDeleteModal(false);
        setSelectedEvent(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete event');
      }
    }
  );

  const handleDelete = () => {
    if (selectedEvent) {
      deleteEventMutation.mutate(selectedEvent.id);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'scouting': return 'bg-blue-100 text-blue-800';
      case 'deal_sourcing': return 'bg-green-100 text-green-800';
      case 'retreat': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
            <p className="text-sm text-gray-500">Manage all events across the three stages</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
            <p className="text-sm text-gray-500">Manage all events across the three stages</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Event</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filters.stage}
              onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
              className="input-field"
            >
              <option value="">All Stages</option>
              <option value="scouting">Scouting</option>
              <option value="deal_sourcing">Deal Sourcing</option>
              <option value="retreat">Retreat</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filters.isPublic}
              onChange={(e) => setFilters({ ...filters, isPublic: e.target.value })}
              className="input-field"
            >
              <option value="">All Visibility</option>
              <option value="true">Public</option>
              <option value="false">Private</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="grid gap-6">
        {eventsData?.data?.events?.map((event) => (
          <div key={event.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(event.stage)}`}>
                    {event.stage.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {event.status.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(event.start_date)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{event.venue}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{event.attendee_count || 0} / {event.max_capacity} attendees</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mt-3">
                  {event.is_public && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Public
                    </span>
                  )}
                  {event.is_invite_only && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Invite Only
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedEvent(event)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowDeleteModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {eventsData?.data?.events?.length === 0 && (
          <div className="card text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'Try adjusting your search or filters' 
                : 'Get started by creating your first event'
              }
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {eventsData?.data?.pagination && eventsData.data.pagination.pages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Previous
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              Page {eventsData.data.pagination.page} of {eventsData.data.pagination.pages}
            </span>
            <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Event</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete "{selectedEvent?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedEvent(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteEventMutation.isLoading}
                className="btn-danger"
              >
                {deleteEventMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
