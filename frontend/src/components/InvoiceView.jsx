import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { INVOICE_API_END_POINT } from '../utils/constant';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

const InvoiceView = () => {
    const { invoiceId } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInvoice();
    }, [invoiceId]);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${INVOICE_API_END_POINT}/${invoiceId}`, {
                withCredentials: true
            });
            setInvoice(res.data.invoice);
        } catch (error) {
            console.error('Fetch invoice error:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        try {
            const res = await axios.get(
                `${INVOICE_API_END_POINT}/${invoiceId}/download`,
                {
                    responseType: 'blob',
                    withCredentials: true
                }
            );

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${invoice.invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    if (loading) {
        return <div className="p-6 text-center">Loading...</div>;
    }

    if (!invoice) {
        return <div className="p-6 text-center">Invoice not found</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Invoice</h1>
                <Button onClick={downloadPDF}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </Button>
            </div>

            <div className="border rounded-lg p-8 bg-white">
                {/* Header */}
                <div className="flex justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">JobPortal Inc.</h2>
                        <p className="text-gray-600">123 Business Street</p>
                        <p className="text-gray-600">City, State 12345</p>
                        <p className="text-gray-600">contact@jobportal.com</p>
                    </div>
                    <div className="text-right">
                        <h3 className="text-lg font-semibold">
                            Invoice #{invoice.invoiceNumber}
                        </h3>
                        <p className="text-gray-600">
                            Date: {new Date(invoice.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600">
                            Status: <span className="font-semibold uppercase">{invoice.status}</span>
                        </p>
                    </div>
                </div>

                {/* Bill To */}
                <div className="mb-8">
                    <h3 className="font-semibold mb-2">Bill To:</h3>
                    <p>{invoice.userId?.fullname}</p>
                    <p className="text-gray-600">{invoice.userId?.email}</p>
                </div>

                {/* Items */}
                <table className="w-full mb-8">
                    <thead className="border-b-2">
                        <tr>
                            <th className="text-left py-2">Description</th>
                            <th className="text-center py-2">Qty</th>
                            <th className="text-right py-2">Unit Price</th>
                            <th className="text-right py-2">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items.map((item, idx) => (
                            <tr key={idx} className="border-b">
                                <td className="py-3">{item.description}</td>
                                <td className="text-center py-3">{item.quantity}</td>
                                <td className="text-right py-3">
                                    {invoice.currency} {item.unitPrice.toFixed(2)}
                                </td>
                                <td className="text-right py-3">
                                    {invoice.currency} {item.amount.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Summary */}
                <div className="flex justify-end">
                    <div className="w-64">
                        <div className="flex justify-between py-2">
                            <span>Subtotal:</span>
                            <span>{invoice.currency} {invoice.subtotal.toFixed(2)}</span>
                        </div>
                        {invoice.tax.amount > 0 && (
                            <div className="flex justify-between py-2">
                                <span>Tax ({invoice.tax.rate}%):</span>
                                <span>{invoice.currency} {invoice.tax.amount.toFixed(2)}</span>
                            </div>
                        )}
                        {invoice.discount && invoice.discount.amount > 0 && (
                            <div className="flex justify-between py-2 text-green-600">
                                <span>Discount:</span>
                                <span>-{invoice.currency} {invoice.discount.amount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-2 border-t-2 font-bold text-lg">
                            <span>Total:</span>
                            <span>{invoice.currency} {invoice.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-8 border-t text-center text-sm text-gray-500">
                    <p>Thank you for your business!</p>
                    <p>For any queries, contact us at support@jobportal.com</p>
                </div>
            </div>
        </div>
    );
};

export default InvoiceView;
