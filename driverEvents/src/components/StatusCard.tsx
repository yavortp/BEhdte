import React, { ReactNode } from 'react';
import classNames from 'classnames';

interface StatusCardProps {
    title: string;
    value: number;
    icon: ReactNode;
    bgColor?: string;
    textColor?: string;
}

const StatusCard: React.FC<StatusCardProps> = ({
                                                   title,
                                                   value,
                                                   icon,
                                                   bgColor = 'bg-blue-50',
                                                   textColor = 'text-blue-700'
                                               }) => {
    return (
        <div className={classNames(
            'rounded-lg shadow overflow-hidden',
            bgColor
        )}>
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">{icon}</div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                            <dd>
                                <div className={classNames('text-lg font-semibold', textColor)}>{value}</div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
            <div className="bg-white px-5 py-3">
                <div className="text-sm">
                    <a href="#" className={classNames('font-medium', textColor.replace('700', '600'), 'hover:underline')}>
                        View all
                    </a>
                </div>
            </div>
        </div>
    );
};

export default StatusCard;