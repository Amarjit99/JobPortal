import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from '@/utils/axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import PermissionMatrix from './PermissionMatrix';

const SUB_ADMIN_API_END_POINT = 'http://localhost:8000/api/v1/sub-admin';
const USER_API_END_POINT = 'http://localhost:8000/api/v1/user';

const SubAdminForm = ({ subAdmin, onSuccess, onCancel }) => {
    const isEditMode = !!subAdmin;

    const [formData, setFormData] = useState({
        userId: subAdmin?.userId?._id || '',
        permissions: subAdmin?.permissions || [],
        notes: subAdmin?.notes || ''
    });

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        if (!isEditMode) {
            fetchEligibleUsers();
        }
    }, [isEditMode]);

    const fetchEligibleUsers = async () => {
        try {
            setLoadingUsers(true);
            // This endpoint should return users who are not admin or sub-admin
            const response = await axios.get(`${USER_API_END_POINT}/all`, {
                withCredentials: true
            });

            console.log('Fetch users response:', response.data);

            if (response.data.success) {
                // Filter out admins and sub-admins
                const eligibleUsers = response.data.users.filter(
                    user => user.role !== 'admin' && user.role !== 'sub-admin'
                );
                console.log('Eligible users:', eligibleUsers);
                setUsers(eligibleUsers);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            console.error('Error response:', error.response?.data);
            toast.error(error.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handlePermissionsChange = (permissions) => {
        setFormData(prev => ({ ...prev, permissions }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!isEditMode && !formData.userId) {
            toast.error('Please select a user');
            return;
        }

        if (formData.permissions.length === 0) {
            toast.error('Please assign at least one permission');
            return;
        }

        try {
            setLoading(true);

            let response;
            if (isEditMode) {
                // Update existing sub-admin
                response = await axios.put(
                    `${SUB_ADMIN_API_END_POINT}/${subAdmin._id}`,
                    {
                        permissions: formData.permissions,
                        notes: formData.notes
                    },
                    { withCredentials: true }
                );
            } else {
                // Create new sub-admin
                response = await axios.post(
                    SUB_ADMIN_API_END_POINT,
                    formData,
                    { withCredentials: true }
                );
            }

            if (response.data.success) {
                toast.success(
                    isEditMode
                        ? 'Sub-admin updated successfully'
                        : 'Sub-admin created successfully'
                );
                onSuccess();
            }
        } catch (error) {
            console.error('Error saving sub-admin:', error);
            toast.error(error.response?.data?.message || 'Failed to save sub-admin');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Selection (only for create mode) */}
            {!isEditMode && (
                <div className="space-y-2">
                    <Label htmlFor="user">Select User *</Label>
                    {loadingUsers ? (
                        <div className="text-sm text-gray-500">Loading users...</div>
                    ) : (
                        <Select
                            value={formData.userId}
                            onValueChange={(value) =>
                                setFormData(prev => ({ ...prev, userId: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a user" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map(user => (
                                    <SelectItem key={user._id} value={user._id}>
                                        {user.fullname} ({user.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <p className="text-sm text-gray-500">
                        Only users with 'student' or 'recruiter' role are eligible
                    </p>
                </div>
            )}

            {/* Display user info in edit mode */}
            {isEditMode && (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">User Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Name:</span>
                            <span className="ml-2 font-medium">{subAdmin.userId?.fullname}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Email:</span>
                            <span className="ml-2 font-medium">{subAdmin.userId?.email}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Permissions */}
            <div className="space-y-2">
                <Label>Permissions *</Label>
                <p className="text-sm text-gray-500 mb-4">
                    Select modules and actions this sub-admin can access
                </p>
                <PermissionMatrix
                    permissions={formData.permissions}
                    onChange={handlePermissionsChange}
                />
            </div>

            {/* Notes */}
            <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <textarea
                    id="notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any notes about this sub-admin's responsibilities..."
                    value={formData.notes}
                    onChange={(e) =>
                        setFormData(prev => ({ ...prev, notes: e.target.value }))
                    }
                />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : isEditMode ? 'Update Sub-Admin' : 'Create Sub-Admin'}
                </Button>
            </div>
        </form>
    );
};

export default SubAdminForm;
