import React from 'react'
import { Check, Clock, X } from 'lucide-react'

const ApplicationStatusTimeline = ({ application }) => {
    const statusHistory = application.statusHistory || [];

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <Clock className='h-5 w-5 text-yellow-500' />;
            case 'accepted':
                return <Check className='h-5 w-5 text-green-500' />;
            case 'rejected':
                return <X className='h-5 w-5 text-red-500' />;
            default:
                return <Clock className='h-5 w-5 text-gray-500' />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'border-yellow-500 bg-yellow-50';
            case 'accepted':
                return 'border-green-500 bg-green-50';
            case 'rejected':
                return 'border-red-500 bg-red-50';
            default:
                return 'border-gray-300 bg-gray-50';
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className='mt-4'>
            <h3 className='font-semibold text-sm mb-3 text-gray-700'>Application Status Timeline</h3>
            <div className='space-y-3'>
                {statusHistory.map((historyItem, index) => (
                    <div key={index} className='flex gap-3'>
                        <div className='flex flex-col items-center'>
                            <div className={`p-2 rounded-full border-2 ${getStatusColor(historyItem.status)}`}>
                                {getStatusIcon(historyItem.status)}
                            </div>
                            {index !== statusHistory.length - 1 && (
                                <div className='w-0.5 h-8 bg-gray-300'></div>
                            )}
                        </div>
                        <div className='flex-1 pb-2'>
                            <p className='font-medium text-sm capitalize'>{historyItem.status}</p>
                            <p className='text-xs text-gray-500'>{formatDate(historyItem.changedAt)}</p>
                            {historyItem.note && (
                                <p className='text-xs text-gray-600 mt-1 italic'>"{historyItem.note}"</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ApplicationStatusTimeline
