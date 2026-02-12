import React from 'react';
import { User, Clock } from 'lucide-react';
import { format } from 'date-fns';

const SaleCommentList = ({ comments = [] }) => {
    if (comments.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 italic text-sm">
                No internal notes or comments yet.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {comments.map((comment, idx) => (
                <div key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {comment.commenter_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-grow space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-900">{comment.commenter_name}</span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(comment.created_at), 'MMM dd, HH:mm')}
                            </span>
                        </div>
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl rounded-tl-none inline-block border border-gray-100">
                            {comment.comment}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SaleCommentList;
