import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/badge';

const VerifiedBadge = ({ size = 'default', showText = true }) => {
    const iconSizes = {
        small: 'w-3 h-3',
        default: 'w-4 h-4',
        large: 'w-5 h-5'
    };

    const textSizes = {
        small: 'text-xs',
        default: 'text-sm',
        large: 'text-base'
    };

    return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">
            <ShieldCheck className={`${iconSizes[size]} ${showText ? 'mr-1' : ''}`} />
            {showText && <span className={textSizes[size]}>Verified</span>}
        </Badge>
    );
};

export default VerifiedBadge;
