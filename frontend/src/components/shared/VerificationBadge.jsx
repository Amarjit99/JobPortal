import React from 'react';
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';
import { Badge } from '../ui/badge';

/**
 * VerificationBadge Component
 * Displays company verification status with appropriate icon and color
 * 
 * @param {Object} props
 * @param {string} props.status - Verification status: 'approved', 'pending', 'rejected', 'resubmitted'
 * @param {boolean} props.showText - Whether to show status text (default: true)
 * @param {string} props.size - Size variant: 'sm', 'md', 'lg' (default: 'md')
 * @param {string} props.className - Additional CSS classes
 */
const VerificationBadge = ({ 
    status, 
    showText = true, 
    size = 'md',
    className = '' 
}) => {
    if (!status || status === 'pending') {
        return null; // Don't show badge for pending status by default
    }

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5'
    };

    const iconSizes = {
        sm: 12,
        md: 16,
        lg: 20
    };

    const getStatusConfig = () => {
        switch (status) {
            case 'approved':
                return {
                    icon: CheckCircle2,
                    text: 'Verified',
                    variant: 'default',
                    bgColor: 'bg-green-100 hover:bg-green-200',
                    textColor: 'text-green-800',
                    iconColor: 'text-green-600',
                    tooltip: 'This company has been verified by our team'
                };
            case 'pending':
                return {
                    icon: Clock,
                    text: 'Verification Pending',
                    variant: 'secondary',
                    bgColor: 'bg-yellow-100 hover:bg-yellow-200',
                    textColor: 'text-yellow-800',
                    iconColor: 'text-yellow-600',
                    tooltip: 'Verification documents are under review'
                };
            case 'resubmitted':
                return {
                    icon: Clock,
                    text: 'Resubmitted',
                    variant: 'secondary',
                    bgColor: 'bg-blue-100 hover:bg-blue-200',
                    textColor: 'text-blue-800',
                    iconColor: 'text-blue-600',
                    tooltip: 'Updated verification documents are under review'
                };
            case 'rejected':
                return {
                    icon: XCircle,
                    text: 'Not Verified',
                    variant: 'destructive',
                    bgColor: 'bg-red-100 hover:bg-red-200',
                    textColor: 'text-red-800',
                    iconColor: 'text-red-600',
                    tooltip: 'Verification was rejected. Please resubmit documents.'
                };
            default:
                return null;
        }
    };

    const config = getStatusConfig();
    if (!config) return null;

    const Icon = config.icon;

    return (
        <div 
            className={`inline-flex items-center gap-1.5 rounded-full ${config.bgColor} ${config.textColor} ${sizeClasses[size]} font-medium transition-colors ${className}`}
            title={config.tooltip}
        >
            <Icon 
                className={config.iconColor} 
                size={iconSizes[size]} 
                strokeWidth={2.5}
            />
            {showText && <span>{config.text}</span>}
        </div>
    );
};

/**
 * CompanyVerificationStatus Component
 * Full verification status display with more details
 */
export const CompanyVerificationStatus = ({ company, showDetails = false }) => {
    if (!company?.verification) return null;

    const { status, rejectionReason, submittedAt } = company.verification;

    return (
        <div className="space-y-2">
            <VerificationBadge status={status} />
            
            {showDetails && (
                <div className="text-sm text-gray-600">
                    {status === 'pending' && submittedAt && (
                        <p className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>Submitted on {new Date(submittedAt).toLocaleDateString()}</span>
                        </p>
                    )}
                    
                    {status === 'rejected' && rejectionReason && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="flex items-center gap-2 font-medium text-red-800 mb-1">
                                <AlertCircle size={16} />
                                Rejection Reason:
                            </p>
                            <p className="text-red-700 ml-6">{rejectionReason}</p>
                        </div>
                    )}
                    
                    {status === 'resubmitted' && (
                        <p className="text-blue-700 mt-1">
                            Your updated documents are being reviewed. We'll notify you soon.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

/**
 * JobVerificationIndicator Component
 * Shows verification status on job listings
 */
export const JobVerificationIndicator = ({ company, compact = false }) => {
    if (!company?.verification || company.verification.status !== 'approved') {
        return null;
    }

    if (compact) {
        return (
            <div className="inline-flex items-center gap-1 text-green-600" title="Verified Company">
                <CheckCircle2 size={14} strokeWidth={2.5} />
                <span className="text-xs font-medium">Verified</span>
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="text-green-600" size={16} strokeWidth={2.5} />
            <div className="flex flex-col">
                <span className="text-xs font-semibold text-green-800">Verified Company</span>
                <span className="text-xs text-green-600">Trusted employer</span>
            </div>
        </div>
    );
};

export default VerificationBadge;
