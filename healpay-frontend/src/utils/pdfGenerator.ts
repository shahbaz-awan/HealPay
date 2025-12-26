import jsPDF from 'jspdf'

interface BillData {
    billNumber: string
    patientName: string
    patientEmail?: string
    patientPhone?: string
    patientAddress?: string
    date: string
    dueDate: string
    items: Array<{
        description: string
        quantity: number
        unitPrice: number
        total: number
    }>
    subtotal: number
    tax?: number
    insuranceCoverage?: number
    total: number
    patientResponsibility: number
    insurance?: {
        provider: string
        policyNumber: string
    }
}

export const generateBillPDF = (billData: BillData) => {
    const doc = new jsPDF()

    // Colors
    const primaryColor: [number, number, number] = [37, 99, 235] // Blue
    const darkGray: [number, number, number] = [55, 65, 81]
    const lightGray: [number, number, number] = [156, 163, 175]

    let yPosition = 20

    // Header - Company Logo/Name
    doc.setFontSize(24)
    doc.setTextColor(...primaryColor)
    doc.text('HealPay', 20, yPosition)

    doc.setFontSize(10)
    doc.setTextColor(...lightGray)
    doc.text('AI-Powered Medical Billing', 20, yPosition + 6)

    // Invoice Title
    doc.setFontSize(20)
    doc.setTextColor(...darkGray)
    doc.text('INVOICE', 150, yPosition)

    yPosition += 20

    // Bill Details Box
    doc.setFillColor(249, 250, 251)
    doc.rect(20, yPosition, 170, 25, 'F')

    doc.setFontSize(10)
    doc.setTextColor(...darkGray)
    doc.text(`Bill #: ${billData.billNumber}`, 25, yPosition + 8)
    doc.text(`Date: ${billData.date}`, 25, yPosition + 14)
    doc.text(`Due Date: ${billData.dueDate}`, 25, yPosition + 20)

    yPosition += 35

    // Patient Information
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('BILL TO:', 20, yPosition)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    yPosition += 7
    doc.text(billData.patientName, 20, yPosition)

    if (billData.patientEmail) {
        yPosition += 5
        doc.text(billData.patientEmail, 20, yPosition)
    }

    if (billData.patientPhone) {
        yPosition += 5
        doc.text(billData.patientPhone, 20, yPosition)
    }

    if (billData.patientAddress) {
        yPosition += 5
        doc.text(billData.patientAddress, 20, yPosition)
    }

    // Insurance Info (if available)
    if (billData.insurance) {
        yPosition += 10
        doc.setFont('helvetica', 'bold')
        doc.text('INSURANCE:', 20, yPosition)
        doc.setFont('helvetica', 'normal')
        yPosition += 7
        doc.text(billData.insurance.provider, 20, yPosition)
        yPosition += 5
        doc.text(`Policy: ${billData.insurance.policyNumber}`, 20, yPosition)
    }

    yPosition += 15

    // Items Table Header
    doc.setFillColor(...primaryColor)
    doc.rect(20, yPosition, 170, 8, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('DESCRIPTION', 25, yPosition + 5)
    doc.text('QTY', 130, yPosition + 5)
    doc.text('UNIT PRICE', 145, yPosition + 5)
    doc.text('TOTAL', 175, yPosition + 5)

    yPosition += 10

    // Items
    doc.setTextColor(...darkGray)
    doc.setFont('helvetica', 'normal')

    billData.items.forEach((item, index) => {
        if (index % 2 === 0) {
            doc.setFillColor(249, 250, 251)
            doc.rect(20, yPosition - 3, 170, 7, 'F')
        }

        doc.text(item.description, 25, yPosition + 2)
        doc.text(item.quantity.toString(), 133, yPosition + 2)
        doc.text(`$${item.unitPrice.toFixed(2)}`, 150, yPosition + 2)
        doc.text(`$${item.total.toFixed(2)}`, 175, yPosition + 2)

        yPosition += 8
    })

    yPosition += 10

    // Totals Section
    const totalsX = 130
    doc.setFont('helvetica', 'normal')

    doc.text('Subtotal:', totalsX, yPosition)
    doc.text(`$${billData.subtotal.toFixed(2)}`, 175, yPosition)
    yPosition += 6

    if (billData.tax) {
        doc.text('Tax:', totalsX, yPosition)
        doc.text(`$${billData.tax.toFixed(2)}`, 175, yPosition)
        yPosition += 6
    }

    if (billData.insuranceCoverage) {
        doc.text('Insurance Coverage:', totalsX, yPosition)
        doc.setTextColor(16, 185, 129) // Green
        doc.text(`-$${billData.insuranceCoverage.toFixed(2)}`, 175, yPosition)
        doc.setTextColor(...darkGray)
        yPosition += 6
    }

    // Total Line
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(0.5)
    doc.line(totalsX, yPosition, 185, yPosition)
    yPosition += 6

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Total:', totalsX, yPosition)
    doc.text(`$${billData.total.toFixed(2)}`, 175, yPosition)
    yPosition += 8

    // Patient Responsibility
    doc.setFontSize(12)
    doc.setTextColor(...primaryColor)
    doc.text('Patient Responsibility:', totalsX, yPosition)
    doc.text(`$${billData.patientResponsibility.toFixed(2)}`, 175, yPosition)

    // Footer
    yPosition = 270
    doc.setFontSize(8)
    doc.setTextColor(...lightGray)
    doc.text('Thank you for choosing HealPay for your healthcare needs.', 20, yPosition)
    doc.text('For questions, contact us at billing@healpay.com or (555) 123-4567', 20, yPosition + 4)

    // Save PDF
    doc.save(`HealPay-Invoice-${billData.billNumber}.pdf`)
}

// Example usage:
export const generateSampleInvoice = () => {
    const sampleBill: BillData = {
        billNumber: 'INV-2024-001',
        patientName: 'John Doe',
        patientEmail: 'john.doe@email.com',
        patientPhone: '(555) 123-4567',
        patientAddress: '123 Main St, New York, NY 10001',
        date: '2024-12-08',
        dueDate: '2024-12-22',
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

    generateBillPDF(sampleBill)
}
