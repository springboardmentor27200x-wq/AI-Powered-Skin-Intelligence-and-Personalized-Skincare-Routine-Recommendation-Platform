import React, { useState, useEffect } from 'react';
import { api } from './api';
import { Users, LayoutDashboard, Settings, Activity } from 'lucide-react';
import './App.css';

const AdminDashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers()
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Admin Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col h-full">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <Activity className="h-8 w-8 text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-800">Admin Portal</h1>
        </div>
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button className="flex w-full items-center gap-3 rounded-xl bg-indigo-50 text-indigo-700 px-4 py-3 font-medium transition-colors">
            <LayoutDashboard className="h-5 w-5" /> Overview
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl text-gray-600 hover:bg-gray-50 px-4 py-3 font-medium transition-colors">
            <Users className="h-5 w-5" /> Users
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl text-gray-600 hover:bg-gray-50 px-4 py-3 font-medium transition-colors">
            <Settings className="h-5 w-5" /> Settings
          </button>
        </div>
        <div className="p-4 border-t border-gray-100">
          <div className="mb-4 px-2">
            <p className="text-sm font-semibold text-gray-800">{user.full_name}</p>
            <p className="text-xs text-gray-500">{user.role}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">Platform Overview</h2>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-red-700 border border-red-100">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-50 p-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-3xl font-bold text-gray-800">{stats?.total_users || 0}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-50 p-4">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Assessments</p>
                <p className="text-3xl font-bold text-gray-800">{stats?.total_assessments || 0}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-50 p-4">
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Products in DB</p>
                <p className="text-3xl font-bold text-gray-800">{stats?.total_products || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800">Recent Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-medium">ID</th>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">#{u.id}</td>
                    <td className="px-6 py-4">{u.full_name}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'DERMATOLOGIST' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
