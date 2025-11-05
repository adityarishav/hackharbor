import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import AdminPageLayout from './AdminPageLayout';

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const { token } = useContext(AuthContext);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.put(`/admin/users/${userId}`, { role: newRole }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers(); // Refresh the user list
        } catch (error) {
            console.error('Error updating user role:', error);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await api.delete(`/admin/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchUsers(); // Refresh the user list
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    return (
        <AdminPageLayout title="User Management">
            <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-md">
                <table className="min-w-full text-white">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="py-3 px-6 text-left">ID</th>
                            <th className="py-3 px-6 text-left">Username</th>
                            <th className="py-3 px-6 text-left">Role</th>
                            <th className="py-3 px-6 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-700">
                                <td className="py-4 px-6">{user.id}</td>
                                <td className="py-4 px-6">{user.username}</td>
                                <td className="py-4 px-6">
                                    <select 
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        className="bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-purple-500 focus:border-purple-500 p-1"
                                    >
                                        <option value="user">user</option>
                                        <option value="admin">admin</option>
                                    </select>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <button 
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminPageLayout>
    );
};

export default UserManagementPage;