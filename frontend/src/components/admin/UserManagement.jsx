import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Ban, CheckCircle, UserX, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import axios from '@/utils/axios';
import { toast } from 'sonner';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUsers, setSelectedUsers] = useState([]);
    
    // Dialog states
    const [blockDialogOpen, setBlockDialogOpen] = useState(false);
    const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
    
    const [selectedUser, setSelectedUser] = useState(null);
    const [blockReason, setBlockReason] = useState('');
    const [newRole, setNewRole] = useState('');
    const [roleChangeReason, setRoleChangeReason] = useState('');
    const [bulkAction, setBulkAction] = useState('');

    useEffect(() => {
        fetchUsers();
    }, [search, roleFilter, page]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page,
                limit: 20
            });
            
            if (search) params.append('search', search);
            if (roleFilter) params.append('role', roleFilter);

            const response = await axios.get(
                `http://localhost:8000/api/v1/admin/users?${params}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                setUsers(response.data.users);
                setTotalPages(response.data.pagination.pages);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleBlockUser = async () => {
        if (!blockReason.trim()) {
            toast.error('Please provide a reason for blocking');
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:8000/api/v1/admin/users/${selectedUser._id}/block`,
                { reason: blockReason },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('User blocked successfully');
                fetchUsers();
                setBlockDialogOpen(false);
                setBlockReason('');
                setSelectedUser(null);
            }
        } catch (error) {
            console.error('Error blocking user:', error);
            toast.error(error.response?.data?.message || 'Failed to block user');
        }
    };

    const handleUnblockUser = async () => {
        try {
            const response = await axios.post(
                `http://localhost:8000/api/v1/admin/users/${selectedUser._id}/unblock`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('User unblocked successfully');
                fetchUsers();
                setUnblockDialogOpen(false);
                setSelectedUser(null);
            }
        } catch (error) {
            console.error('Error unblocking user:', error);
            toast.error(error.response?.data?.message || 'Failed to unblock user');
        }
    };

    const handleChangeRole = async () => {
        if (!newRole) {
            toast.error('Please select a role');
            return;
        }

        try {
            const response = await axios.put(
                `http://localhost:8000/api/v1/admin/users/${selectedUser._id}/role`,
                { role: newRole, reason: roleChangeReason },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('User role updated successfully');
                fetchUsers();
                setRoleDialogOpen(false);
                setNewRole('');
                setRoleChangeReason('');
                setSelectedUser(null);
            }
        } catch (error) {
            console.error('Error changing role:', error);
            toast.error(error.response?.data?.message || 'Failed to change role');
        }
    };

    const handleBulkAction = async () => {
        if (selectedUsers.length === 0) {
            toast.error('No users selected');
            return;
        }

        if (bulkAction === 'block' && !blockReason.trim()) {
            toast.error('Please provide a reason for blocking');
            return;
        }

        try {
            const endpoint = bulkAction === 'block' 
                ? '/api/v1/admin/users/bulk-block'
                : '/api/v1/admin/users/bulk-unblock';

            const response = await axios.post(
                `http://localhost:8000${endpoint}`,
                bulkAction === 'block' 
                    ? { userIds: selectedUsers, reason: blockReason }
                    : { userIds: selectedUsers },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success(`Successfully ${bulkAction}ed ${response.data[bulkAction === 'block' ? 'blockedCount' : 'unblockedCount']} users`);
                fetchUsers();
                setBulkActionDialogOpen(false);
                setSelectedUsers([]);
                setBlockReason('');
                setBulkAction('');
            }
        } catch (error) {
            console.error(`Error bulk ${bulkAction}ing users:`, error);
            toast.error(error.response?.data?.message || `Failed to ${bulkAction} users`);
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(u => u._id));
        }
    };

    const getRoleBadge = (role) => {
        const colors = {
            admin: 'bg-red-100 text-red-800',
            'sub-admin': 'bg-orange-100 text-orange-800',
            recruiter: 'bg-blue-100 text-blue-800',
            student: 'bg-green-100 text-green-800'
        };
        return <Badge className={colors[role] || 'bg-gray-100 text-gray-800'}>{role}</Badge>;
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                        <p className="text-gray-500">Manage all users on the platform</p>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Roles</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="recruiter">Recruiter</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="sub-admin">Sub-Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Bulk Actions */}
                {selectedUsers.length > 0 && (
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg mb-4">
                        <span className="text-sm font-medium">{selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected</span>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setBulkAction('block');
                                setBulkActionDialogOpen(true);
                            }}
                        >
                            <Ban className="w-4 h-4 mr-2" />
                            Block Selected
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setBulkAction('unblock');
                                setBulkActionDialogOpen(true);
                            }}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Unblock Selected
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedUsers([])}
                        >
                            Clear Selection
                        </Button>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
            )}

            {/* Users Table */}
            {!loading && (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <Table>
                        <TableCaption>Total users: {users.length}</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.length === users.length && users.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4"
                                    />
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user._id}>
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user._id)}
                                            onChange={() => toggleUserSelection(user._id)}
                                            className="w-4 h-4"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{user.fullname}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                                    <TableCell>
                                        {user.isBlocked ? (
                                            <Badge className="bg-red-100 text-red-800">
                                                <UserX className="w-3 h-3 mr-1" />
                                                Blocked
                                            </Badge>
                                        ) : user.isVerified ? (
                                            <Badge className="bg-green-100 text-green-800">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">Unverified</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setNewRole(user.role);
                                                    setRoleDialogOpen(true);
                                                }}
                                            >
                                                <Shield className="w-4 h-4" />
                                            </Button>
                                            {user.isBlocked ? (
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setUnblockDialogOpen(true);
                                                    }}
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setBlockDialogOpen(true);
                                                    }}
                                                    disabled={user.role === 'admin'}
                                                >
                                                    <Ban className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-gray-600">
                            Page {page} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Block Dialog */}
            <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Block User</DialogTitle>
                        <DialogDescription>
                            Provide a reason for blocking {selectedUser?.fullname}. They will not be able to log in.
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        <Label htmlFor="blockReason">Reason</Label>
                        <Input
                            id="blockReason"
                            placeholder="e.g., Violation of terms of service"
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setBlockDialogOpen(false);
                            setBlockReason('');
                        }}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleBlockUser}>
                            Block User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Unblock Dialog */}
            <Dialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Unblock User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to unblock {selectedUser?.fullname}? They will be able to log in again.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUnblockDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUnblockUser}>
                            Unblock User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Role Dialog */}
            <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change User Role</DialogTitle>
                        <DialogDescription>
                            Change role for {selectedUser?.fullname}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="newRole">New Role</Label>
                            <Select value={newRole} onValueChange={setNewRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="recruiter">Recruiter</SelectItem>
                                    <SelectItem value="sub-admin">Sub-Admin</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="roleReason">Reason (Optional)</Label>
                            <Input
                                id="roleReason"
                                placeholder="Reason for role change"
                                value={roleChangeReason}
                                onChange={(e) => setRoleChangeReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setRoleDialogOpen(false);
                            setRoleChangeReason('');
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleChangeRole}>
                            Change Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Action Dialog */}
            <Dialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {bulkAction === 'block' ? 'Block Users' : 'Unblock Users'}
                        </DialogTitle>
                        <DialogDescription>
                            {bulkAction === 'block' 
                                ? `You are about to block ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''}. Provide a reason.`
                                : `You are about to unblock ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''}.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    {bulkAction === 'block' && (
                        <div>
                            <Label htmlFor="bulkBlockReason">Reason</Label>
                            <Input
                                id="bulkBlockReason"
                                placeholder="Reason for blocking users"
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                            />
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setBulkActionDialogOpen(false);
                            setBlockReason('');
                            setBulkAction('');
                        }}>
                            Cancel
                        </Button>
                        <Button 
                            variant={bulkAction === 'block' ? 'destructive' : 'default'}
                            onClick={handleBulkAction}
                        >
                            {bulkAction === 'block' ? 'Block Users' : 'Unblock Users'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserManagement;
