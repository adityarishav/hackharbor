import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaFlagCheckered, FaServer } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await api.get('/admin/analytics', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const analyticsData = response.data;

        const newActivities = [];

        // Process user registration trends
        if (analyticsData.user_registration_trends) {
          analyticsData.user_registration_trends.forEach(item => {
            newActivities.push({
              id: `user_reg_${item.date}`,
              type: 'new_user',
              user: `User(s) registered: ${item.count}`,
              timestamp: new Date(item.date),
            });
          });
        }

        // Process submission trends
        if (analyticsData.submission_trends) {
          analyticsData.submission_trends.forEach(item => {
            newActivities.push({
              id: `submission_${item.date}`,
              type: 'machine_solved',
              user: `Submissions: ${item.count}`,
              machine: '', // Machine name not available in this trend
              timestamp: new Date(item.date),
            });
          });
        }

        // Sort activities by timestamp (most recent first)
        newActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        setActivities(newActivities);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      }
    };

    fetchActivities();
  }, []);

  const renderActivity = (activity) => {
    switch (activity.type) {
      case 'new_user':
        return (
          <>
            <FaUserPlus className="mr-3 text-blue-400" />
            <span>User '<strong>{activity.user}</strong>' just registered.</span>
          </>
        );
      case 'machine_solved':
        return (
          <>
            <FaFlagCheckered className="mr-3 text-green-400" />
            <span>User '<strong>{activity.user}</strong>' solved machine '<strong>{activity.machine}</strong>'.</span>
          </>
        );
      case 'new_machine':
        return (
          <>
            <FaServer className="mr-3 text-purple-400" />
            <span>New machine '<strong>{activity.machine}</strong>' was added.</span>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-lg bg-gray-800 p-6">
      <h3 className="mb-4 text-xl font-bold text-white">Recent Activity</h3>
      <ul className="divide-y divide-gray-700">
        {activities.map((activity) => (
          <li key={activity.id} className="flex items-center py-4">
            <div className="flex-grow">{renderActivity(activity)}</div>
            <div className="text-sm text-gray-400">{formatDistanceToNow(activity.timestamp, { addSuffix: true })}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityFeed;