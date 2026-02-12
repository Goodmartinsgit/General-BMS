import React, { useRef } from 'react';
import { Printer, Download, Mail, X } from 'lucide-react';
import { Modal, Button } from '../ui';
import ReceiptTemplate from './ReceiptTemplate';

/**
 * ReceiptPreviewModal Component
 * Preview and print/download receipts
 */
const ReceiptPreviewModal = ({
    isOpen,
    onClose,
    sale,
    company,
    settings,
    onEmail
}) => {
    const receiptRef = useRef(null);

    const handlePrint = () => {
        if (!receiptRef.current) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print the receipt');
            return;
        }

        const styles = `
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Courier New', monospace;
                    padding: 10px;
                }
                .receipt {
                    max-width: 300px;
                    margin: 0 auto;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    padding: 4px;
                    text-align: left;
                }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .border-dashed {
                    border-bottom: 1px dashed #ccc;
                    padding-bottom: 10px;
                    margin-bottom: 10px;
                }
                .text-sm { font-size: 12px; }
                .text-xs { font-size: 10px; }
                .text-lg { font-size: 16px; }
                .text-2xl { font-size: 20px; }
                .mb-1 { margin-bottom: 4px; }
                .mb-2 { margin-bottom: 8px; }
                .mb-3 { margin-bottom: 12px; }
                .mt-2 { margin-top: 8px; }
                .pt-2 { padding-top: 8px; }
                .py-1 { padding-top: 4px; padding-bottom: 4px; }
                .py-3 { padding-top: 12px; padding-bottom: 12px; }
                .pb-3 { padding-bottom: 12px; }
                .pr-2 { padding-right: 8px; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .justify-center { justify-content: center; }
                .capitalize { text-transform: capitalize; }
                .truncate {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .text-gray-500 { color: #6b7280; }
                .text-gray-600 { color: #4b5563; }
                .text-green-600 { color: #059669; }
                .border-gray-200 { border-color: #e5e7eb; }
                .border-gray-300 { border-color: #d1d5db; }
                .border-gray-400 { border-color: #9ca3af; }
                .border-b { border-bottom: 1px solid; }
                .border-t { border-top: 1px solid; }
                @media print {
                    body { padding: 0; }
                    @page { margin: 10mm; }
                }
            </style>
        `;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${sale?.sale_number || 'Print'}</title>
                ${styles}
            </head>
            <body>
                <div class="receipt">
                    ${receiptRef.current.innerHTML}
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDownload = async () => {
        if (!receiptRef.current) return;

        try {
            // Create a canvas from the receipt
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                backgroundColor: '#ffffff'
            });

            // Convert to image and download
            const link = document.createElement('a');
            link.download = `receipt-${sale?.sale_number || 'download'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            // Fallback: download as HTML
            const blob = new Blob([receiptRef.current.outerHTML], { type: 'text/html' });
            const link = document.createElement('a');
            link.download = `receipt-${sale?.sale_number || 'download'}.html`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
        }
    };

    const handleEmail = () => {
        if (onEmail) {
            onEmail(sale);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Receipt Preview"
            size="md"
        >
            <div className="p-4">
                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-3 mb-4 pb-4 border-b border-gray-200">
                    <Button variant="primary" icon={Printer} onClick={handlePrint}>
                        Print
                    </Button>
                    <Button variant="outline" icon={Download} onClick={handleDownload}>
                        Download
                    </Button>
                    {onEmail && (
                        <Button variant="outline" icon={Mail} onClick={handleEmail}>
                            Email
                        </Button>
                    )}
                </div>

                {/* Receipt Preview */}
                <div className="flex justify-center bg-gray-100 p-4 rounded-lg overflow-auto max-h-[60vh]">
                    <div className="bg-white shadow-lg">
                        <ReceiptTemplate
                            ref={receiptRef}
                            sale={sale}
                            company={company}
                            settings={settings}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ReceiptPreviewModal;
