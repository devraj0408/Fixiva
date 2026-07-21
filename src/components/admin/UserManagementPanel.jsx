import { useMemo, useState } from 'react';
import { useApp } from '../../context/AuthContext';

const UserManagementPanel = () => {
  const { profiles, updateUserRole, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const filteredUsers = useMemo(() => {
    return (profiles || []).filter((user) => {
      const text = `${user.name || ''} ${user.email || ''}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [profiles, search, roleFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">User Management</h2>
          <p className="text-sm text-slate-500">Manage customer, worker, and contractor accounts from one place.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email"
          className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
        >
          <option value="All">All roles</option>
          <option value="customer">Customers</option>
          <option value="worker">Workers</option>
          <option value="contractor">Contractors</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No users available.</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((person) => (
                <tr key={person.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-800">{person.name || 'Unnamed'}</td>
                  <td className="px-4 py-3 text-slate-600">{person.email || '-'}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{person.role || 'customer'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={person.role || 'customer'}
                      onChange={async (e) => {
                        await updateUserRole(person.id, e.target.value);
                        showToast('Role updated.', 'success');
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                    >
                      <option value="customer">Customer</option>
                      <option value="worker">Worker</option>
                      <option value="contractor">Contractor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserManagementPanel;
