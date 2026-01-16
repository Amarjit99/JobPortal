import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

const MODULES = [
    { value: 'users', label: 'User Management', description: 'Manage user accounts and profiles' },
    { value: 'jobs', label: 'Job Management', description: 'Manage job postings and listings' },
    { value: 'companies', label: 'Company Management', description: 'Manage company profiles' },
    { value: 'applications', label: 'Application Management', description: 'Manage job applications' },
    { value: 'analytics', label: 'Analytics', description: 'View system analytics and reports' }
];

const ACTIONS = [
    { value: 'view', label: 'View', color: 'bg-blue-100 text-blue-800', description: 'Read-only access' },
    { value: 'create', label: 'Create', color: 'bg-green-100 text-green-800', description: 'Can create new items' },
    { value: 'edit', label: 'Edit', color: 'bg-yellow-100 text-yellow-800', description: 'Can modify existing items' },
    { value: 'delete', label: 'Delete', color: 'bg-red-100 text-red-800', description: 'Can delete items' },
    { value: 'approve', label: 'Approve', color: 'bg-purple-100 text-purple-800', description: 'Can approve/reject' },
    { value: 'reject', label: 'Reject', color: 'bg-orange-100 text-orange-800', description: 'Can reject items' }
];

const PermissionMatrix = ({ permissions = [], onChange, readOnly = false }) => {
    const [localPermissions, setLocalPermissions] = useState(permissions);

    useEffect(() => {
        setLocalPermissions(permissions);
    }, [permissions]);

    const hasPermission = (module, action) => {
        const modulePermission = localPermissions.find(p => p.module === module);
        return modulePermission?.actions?.includes(action) || false;
    };

    const togglePermission = (module, action) => {
        if (readOnly) return;

        let updatedPermissions = [...localPermissions];
        const moduleIndex = updatedPermissions.findIndex(p => p.module === module);

        if (moduleIndex === -1) {
            // Module doesn't exist, add it with the action
            updatedPermissions.push({
                module,
                actions: [action]
            });
        } else {
            // Module exists, toggle the action
            const modulePermission = updatedPermissions[moduleIndex];
            const actionIndex = modulePermission.actions.indexOf(action);

            if (actionIndex === -1) {
                // Action doesn't exist, add it
                modulePermission.actions.push(action);
            } else {
                // Action exists, remove it
                modulePermission.actions.splice(actionIndex, 1);

                // If no actions left, remove the module
                if (modulePermission.actions.length === 0) {
                    updatedPermissions.splice(moduleIndex, 1);
                }
            }
        }

        setLocalPermissions(updatedPermissions);
        if (onChange) {
            onChange(updatedPermissions);
        }
    };

    const toggleAllActionsForModule = (module) => {
        if (readOnly) return;

        let updatedPermissions = [...localPermissions];
        const moduleIndex = updatedPermissions.findIndex(p => p.module === module);

        // Check if all actions are currently enabled
        const allEnabled = ACTIONS.every(action => hasPermission(module, action.value));

        if (allEnabled) {
            // Remove all actions (remove the module)
            if (moduleIndex !== -1) {
                updatedPermissions.splice(moduleIndex, 1);
            }
        } else {
            // Add all actions
            if (moduleIndex === -1) {
                updatedPermissions.push({
                    module,
                    actions: ACTIONS.map(a => a.value)
                });
            } else {
                updatedPermissions[moduleIndex].actions = ACTIONS.map(a => a.value);
            }
        }

        setLocalPermissions(updatedPermissions);
        if (onChange) {
            onChange(updatedPermissions);
        }
    };

    const getModuleActionCount = (module) => {
        const modulePermission = localPermissions.find(p => p.module === module);
        return modulePermission?.actions?.length || 0;
    };

    return (
        <div className="space-y-4">
            {/* Legend */}
            {!readOnly && (
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Permission Actions:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {ACTIONS.map(action => (
                            <div key={action.value} className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded ${action.color}`}>
                                    {action.label}
                                </span>
                                <span className="text-gray-600">{action.description}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Permission Grid */}
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                Module
                            </th>
                            {ACTIONS.map(action => (
                                <th
                                    key={action.value}
                                    className="px-2 py-3 text-center text-sm font-semibold text-gray-700 border-b"
                                    title={action.description}
                                >
                                    {action.label}
                                </th>
                            ))}
                            {!readOnly && (
                                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">
                                    All
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {MODULES.map((module, idx) => (
                            <tr
                                key={module.value}
                                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                            >
                                <td className="px-4 py-3 border-b">
                                    <div>
                                        <div className="font-medium text-gray-900">{module.label}</div>
                                        <div className="text-xs text-gray-500">{module.description}</div>
                                        {readOnly && getModuleActionCount(module.value) > 0 && (
                                            <div className="text-xs text-blue-600 mt-1">
                                                {getModuleActionCount(module.value)} action(s) enabled
                                            </div>
                                        )}
                                    </div>
                                </td>
                                {ACTIONS.map(action => (
                                    <td
                                        key={action.value}
                                        className="px-2 py-3 text-center border-b"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => togglePermission(module.value, action.value)}
                                            disabled={readOnly}
                                            className={`
                                                w-8 h-8 rounded flex items-center justify-center transition-all
                                                ${hasPermission(module.value, action.value)
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                                                }
                                                ${readOnly ? 'cursor-default' : 'cursor-pointer'}
                                            `}
                                            title={
                                                hasPermission(module.value, action.value)
                                                    ? `${action.label} enabled`
                                                    : `${action.label} disabled`
                                            }
                                        >
                                            {hasPermission(module.value, action.value) ? (
                                                <Check size={16} />
                                            ) : (
                                                <X size={16} />
                                            )}
                                        </button>
                                    </td>
                                ))}
                                {!readOnly && (
                                    <td className="px-4 py-3 text-center border-b">
                                        <button
                                            type="button"
                                            onClick={() => toggleAllActionsForModule(module.value)}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            {ACTIONS.every(action => hasPermission(module.value, action.value))
                                                ? 'Deselect All'
                                                : 'Select All'}
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            {localPermissions.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Permission Summary:</h4>
                    <div className="space-y-1">
                        {localPermissions.map(perm => {
                            const module = MODULES.find(m => m.value === perm.module);
                            return (
                                <div key={perm.module} className="text-sm">
                                    <span className="font-medium">{module?.label || perm.module}:</span>{' '}
                                    <span className="text-gray-600">
                                        {perm.actions.map(action => {
                                            const actionInfo = ACTIONS.find(a => a.value === action);
                                            return actionInfo?.label || action;
                                        }).join(', ')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {!readOnly && localPermissions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No permissions selected yet.</p>
                    <p className="text-xs mt-1">Click on the checkboxes above to assign permissions.</p>
                </div>
            )}
        </div>
    );
};

export default PermissionMatrix;
