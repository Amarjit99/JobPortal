import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from '@/utils/axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import SubAdminForm from './SubAdminForm';
import PermissionMatrix from './PermissionMatrix';
import { Pencil, Trash2, Eye, ShieldCheck, ShieldOff, Plus, Search } from 'lucide-react';

const SUB_ADMIN_API_END_POINT = 'http://localhost:8000/api/v1/sub-admin';

const SubAdminManagement = () => {
    const navigate = useNavigate();
    const [subAdmins, setSubAdmins] = useState([]);
    const [filteredSubAdmins, setFilteredSubAdmins] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActive, setFilterActive] = useState('all'); // all, active, inactive

    // Dialog states
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [selectedSubAdmin, setSelectedSubAdmin] = useState(null);

    useEffect(() => {
        fetchSubAdmins();
    }, []);

    useEffect(() => {
        filterSubAdmins();
    }, [searchTerm, filterActive, subAdmins]);

    const fetchSubAdmins = async () => {
        try {
            setLoading(true);
            const response = await axios.get(SUB_ADMIN_API_END_POINT, {
                withCredentials: true
            });
            
            if (response.data.success) {
                setSubAdmins(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching sub-admins:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch sub-admins');
        } finally {
            setLoading(false);
        }
    };

    const filterSubAdmins = () => {
        let filtered = [...subAdmins];

        // Filter by status
        if (filterActive === 'active') {
            filtered = filtered.filter(sa => sa.isActive);
        } else if (filterActive === 'inactive') {
            filtered = filtered.filter(sa => !sa.isActive);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(sa =>
                sa.userId?.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sa.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredSubAdmins(filtered);
    };

    const handleDelete = async (subAdminId) => {
        if (!confirm('Are you sure you want to remove this sub-admin? Their role will be reverted.')) {
            return;
        }

        try {
            const response = await axios.delete(`${SUB_ADMIN_API_END_POINT}/${subAdminId}`, {
                withCredentials: true
            });

            if (response.data.success) {
                toast.success('Sub-admin removed successfully');
                fetchSubAdmins();
            }
        } catch (error) {
            console.error('Error deleting sub-admin:', error);
            toast.error(error.response?.data?.message || 'Failed to remove sub-admin');
        }
    };

    const handleToggleStatus = async (subAdminId, currentStatus) => {
        try {
            const response = await axios.put(
                `${SUB_ADMIN_API_END_POINT}/${subAdminId}`,
                { isActive: !currentStatus },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success(`Sub-admin ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
                fetchSubAdmins();
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleEdit = (subAdmin) => {
        setSelectedSubAdmin(subAdmin);
        setShowEditDialog(true);
    };

    const handleView = (subAdmin) => {
        setSelectedSubAdmin(subAdmin);
        setShowViewDialog(true);
    };

    const handleFormSuccess = () => {
        setShowCreateDialog(false);
        setShowEditDialog(false);
        setSelectedSubAdmin(null);
        fetchSubAdmins();
    };

    const getModuleCount = (permissions) => {
        return permissions?.length || 0;
    };

    const getTotalActionsCount = (permissions) => {
        return permissions?.reduce((sum, perm) => sum + (perm.actions?.length || 0), 0) || 0;
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Sub-Admin Management</h1>
                    <p className="text-gray-600 mt-1">Manage sub-admins and their permissions</p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
                    <Plus size={18} />
                    Create Sub-Admin
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2">
                        <Button
                            variant={filterActive === 'all' ? 'default' : 'outline'}
                            onClick={() => setFilterActive('all')}
                        >
                            All ({subAdmins.length})
                        </Button>
                        <Button
                            variant={filterActive === 'active' ? 'default' : 'outline'}
                            onClick={() => setFilterActive('active')}
                        >
                            Active ({subAdmins.filter(sa => sa.isActive).length})
                        </Button>
                        <Button
                            variant={filterActive === 'inactive' ? 'default' : 'outline'}
                            onClick={() => setFilterActive('inactive')}
                        >
                            Inactive ({subAdmins.filter(sa => !sa.isActive).length})
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading sub-admins...</p>
                    </div>
                ) : filteredSubAdmins.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-600">No sub-admins found</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Modules</TableHead>
                                <TableHead>Permissions</TableHead>
                                <TableHead>Assigned By</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSubAdmins.map((subAdmin) => (
                                <TableRow key={subAdmin._id}>
                                    <TableCell className="font-medium">
                                        {subAdmin.userId?.fullname || 'N/A'}
                                    </TableCell>
                                    <TableCell>{subAdmin.userId?.email || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={subAdmin.isActive ? 'default' : 'secondary'}>
                                            {subAdmin.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-semibold">{getModuleCount(subAdmin.permissions)}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-gray-600">
                                            {getTotalActionsCount(subAdmin.permissions)} actions
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {subAdmin.assignedBy?.fullname || 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {new Date(subAdmin.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleView(subAdmin)}
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(subAdmin)}
                                                title="Edit Permissions"
                                            >
                                                <Pencil size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleStatus(subAdmin._id, subAdmin.isActive)}
                                                title={subAdmin.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                {subAdmin.isActive ? (
                                                    <ShieldOff size={16} className="text-orange-500" />
                                                ) : (
                                                    <ShieldCheck size={16} className="text-green-500" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(subAdmin._id)}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} className="text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Create Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Sub-Admin</DialogTitle>
                    </DialogHeader>
                    <SubAdminForm onSuccess={handleFormSuccess} onCancel={() => setShowCreateDialog(false)} />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Sub-Admin Permissions</DialogTitle>
                    </DialogHeader>
                    <SubAdminForm
                        subAdmin={selectedSubAdmin}
                        onSuccess={handleFormSuccess}
                        onCancel={() => {
                            setShowEditDialog(false);
                            setSelectedSubAdmin(null);
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Sub-Admin Details</DialogTitle>
                    </DialogHeader>
                    {selectedSubAdmin && (
                        <div className="space-y-6">
                            {/* User Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Name</label>
                                    <p className="text-lg font-semibold">{selectedSubAdmin.userId?.fullname}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Email</label>
                                    <p className="text-lg">{selectedSubAdmin.userId?.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Status</label>
                                    <div className="mt-1">
                                        <Badge variant={selectedSubAdmin.isActive ? 'default' : 'secondary'}>
                                            {selectedSubAdmin.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Assigned By</label>
                                    <p className="text-lg">{selectedSubAdmin.assignedBy?.fullname}</p>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedSubAdmin.notes && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Notes</label>
                                    <p className="text-gray-700 mt-1">{selectedSubAdmin.notes}</p>
                                </div>
                            )}

                            {/* Permissions */}
                            <div>
                                <label className="text-sm font-medium text-gray-600 mb-2 block">Permissions</label>
                                <PermissionMatrix permissions={selectedSubAdmin.permissions} readOnly={true} />
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SubAdminManagement;
