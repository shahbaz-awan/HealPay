import { Download, Printer } from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { generateBillPDF } from '@/utils/pdfGenerator'

const BillDetailDemo = () => {
    const billData = {
        billNumber: 'INV-2024-001',
        patientName: 'Sarah Mitchell',
        patientEmail: 'sarah.mitchell@email.com',
        patientPhone: '(555) 123-4567',
        patientAddress: '123 Main Street, New York, NY 10001',
        date: '2024-12-08',
        dueDate: '2024-12-22',
        status: 'pending',
        items: [
            {
                description: 'Office Visit - Annual Checkup',
                quantity: 1,
                unitPrice: 200,
                total: 200
            },
            {
                description: 'Blood Test - Comprehensive Panel',
                quantity: 1,
                unitPrice: 150,
                total: 150
            },
            {
                description: 'X-Ray - Chest',
                quantity: 1,
                unitPrice: 100,
                total: 100
            }
        ],
        subtotal: 450,
        tax: 0,
        insuranceCoverage: 360,
        total: 450,
        patientResponsibility: 90,
        insurance: {
            provider: 'Blue Cross Blue Shield',
            policyNumber: 'BCBS-123456789'
        }
    }

    const handleDownloadPDF = () => {
        generateBillPDF(billData)
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Bill Details</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Invoice #{billData.billNumber}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
                        <Printer className="w-4 h-4" />
                        Print
                    </Button>
                    <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Download PDF
                    </Button>
                </div>
            </div>

            {/* Bill Info Card */}
            <Card>
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-primary-600">HealPay</h2>
                        <p className="text-sm text-gray-500">AI-Powered Medical Billing</p>
                    </div>
                    <div className="text-right">
                        <Badge variant={billData.status === 'paid' ? 'success' : 'warning'}>
                            {billData.status.toUpperCase()}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-2">Date: {billData.date}</p>
                        <p className="text-sm text-gray-600">Due: {billData.dueDate}</p>
                    </div>
                </div>

                {/* Patient & Insurance */}
                <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b dark:border-gray-700">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">BILL TO:</h3>
                        <p className="text-gray-900 dark:text-gray-100">{billData.patientName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{billData.patientEmail}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{billData.patientPhone}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{billData.patientAddress}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">INSURANCE:</h3>
                        <p className="text-gray-900 dark:text-gray-100">{billData.insurance.provider}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Policy: {billData.insurance.policyNumber}</p>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-6">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-primary-600 text-white">
                                <th className="text-left p-3">Description</th>
                                <th className="text-center p-3">Qty</th>
                                <th className="text-right p-3">Unit Price</th>
                                <th className="text-right p-3">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {billData.items.map((item, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                                    <td className="p-3 text-gray-900 dark:text-gray-100">{item.description}</td>
                                    <td className="p-3 text-center text-gray-900 dark:text-gray-100">{item.quantity}</td>
                                    <td className="p-3 text-right text-gray-900 dark:text-gray-100">${item.unitPrice.toFixed(2)}</td>
                                    <td className="p-3 text-right text-gray-900 dark:text-gray-100">${item.total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Subtotal:</span>
                            <span>${billData.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Tax:</span>
                            <span>${billData.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                            <span>Insurance Coverage:</span>
                            <span>-${billData.insuranceCoverage.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-semibold border-t dark:border-gray-700 pt-2">
                            <span>Total:</span>
                            <span>${billData.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-primary-600 border-t-2 border-primary-600 pt-2">
                            <span>Patient Responsibility:</span>
                            <span>${billData.patientResponsibility.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t dark:border-gray-700 text-center text-sm text-gray-500">
                    <p>Thank you for choosing HealPay for your healthcare needs.</p>
                    <p>For questions, contact us at billing@healpay.com or (555) 123-4567</p>
                </div>
            </Card>

            {/* Payment Section */}
            <Card>
                <CardHeader title="Payment Options" />
                <div className="flex gap-4">
                    <Button className="flex-1">Pay Now - ${billData.patientResponsibility}</Button>
                    <Button variant="outline" className="flex-1">Set Up Payment Plan</Button>
                </div>
            </Card>

            {/* Print Styles */}
            <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section, .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
        </div>
    )
}

export default BillDetailDemo
