import React, { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { Button } from '../ui';
import { salesAPI } from '../../api/sales';
import { toast } from 'react-toastify';

const SaleCommentForm = ({ saleId, onCommentAdded }) => {
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        setSubmitting(true);
        try {
            await salesAPI.addComment(saleId, { comment: comment.trim() });
            setComment('');
            toast.success('Comment added');
            if (onCommentAdded) onCommentAdded();
        } catch (error) {
            console.error('Error adding comment:', error);
            toast.error('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add an internal note or update..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm min-h-[100px] transition-all resize-none"
                />
                <div className="absolute top-3 right-3 text-gray-300">
                    <MessageSquare className="w-5 h-5" />
                </div>
            </div>
            <div className="flex justify-end">
                <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={submitting || !comment.trim()}
                    className="gap-2"
                >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Posting...' : 'Post Comment'}
                </Button>
            </div>
        </form>
    );
};

export default SaleCommentForm;
