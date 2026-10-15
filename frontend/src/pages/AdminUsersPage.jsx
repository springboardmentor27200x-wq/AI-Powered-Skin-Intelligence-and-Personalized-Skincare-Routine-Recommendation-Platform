import React, { useState, useEffect } from 'react';
import { Shield, Users, CheckCircle2, XCircle } from 'lucide-react';
import { adminService } from '../services/adminService';
import { useNotification } from '../hooks/useNotification';
import { formatDate, formatRoleName } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function AdminUsersPage() {
  const { notifyError } = useNotification();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await adminService.getUsers(0, 100);
        setUsers(data.users || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error('Failed to load users for admin:', err);
        notifyError('Failed to fetch administrator user directory.');
      } finally {
        setIsLoading(false);
      }
    }
    loadUsers();
  }, [notifyError]);

  if (isLoading) {
    return <LoadingSpinner message="Loading user directory..." />;
  }

  const roleVariants = {
    ADMINISTRATOR: 'purple',
    DERMATOLOGIST: 'info',
    SKINCARE_CONSULTANT: 'wellness',
    USER: 'default',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-purple-600" />
            User Management & Role Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            System administration view for monitoring registered accounts and assigned access roles.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 px-3.5 py-1.5 rounded-xl text-purple-900 text-xs font-semibold">
          <Users className="w-4 h-4 text-purple-600" />
          <span>{total} Total Registered Users</span>
        </div>
      </div>

      {/* Users Table */}
      <Card
        title="Registered System Users"
        subtitle="Full directory of all accounts registered on the platform"
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/80 text-[11px] uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">System Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                        {u.full_name?.charAt(0) || 'U'}
                      </div>
                      <span className="font-semibold text-slate-900">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={roleVariants[u.role] || 'default'} size="sm">
                      {formatRoleName(u.role)}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                        <XCircle className="w-3.5 h-3.5" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
