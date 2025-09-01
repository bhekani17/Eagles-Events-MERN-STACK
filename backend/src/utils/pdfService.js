import PDFDocument from 'pdfkit';

// Generates a PDF for a quote and returns it as a Buffer
export async function generateQuotePDF(quote) {
  return new Promise((resolve, reject) => {
    try {
      console.log('PDF generation started for quote:', quote._id);
      
      // Validate quote data
      if (!quote || !quote._id) {
        throw new Error('Invalid quote data provided');
      }
      
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        layout: 'portrait',
        autoFirstPage: true,
        bufferPages: true
      });
      const chunks = [];

      doc.on('data', (chunk) => {
        console.log('PDF chunk received, size:', chunk.length);
        chunks.push(chunk);
      });
      doc.on('end', () => {
        const finalBuffer = Buffer.concat(chunks);
        console.log('PDF generation completed, final buffer size:', finalBuffer.length);
        resolve(finalBuffer);
      });
      doc.on('error', (err) => {
        console.error('PDF generation error:', err);
        reject(err);
      });

      const pageWidth = doc.page.width - 100;
      let currentY = 50;

      // Helper function to add section header
      const addSectionHeader = (text) => {
        doc.fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text(text, 50, currentY);
        currentY += 20;
      };

      // Helper function to add label-value pair
      const addLabelValue = (label, value, x, y, labelWidth = 80) => {
        doc.fontSize(10)
          .font('Helvetica')
          .fillColor('#666666')
          .text(label, x, y, { width: labelWidth });
        doc.fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text(value || 'N/A', x + labelWidth + 10, y, { width: 200 });
      };

      // PAGE 1: Header and Company Information
      // Company header
      doc.fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('EAGLES EVENTS', 50, currentY, { 
          width: pageWidth, 
          align: 'center'
        });
      
      currentY += 40;
      
      // Company tagline
      doc.fontSize(14)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Creating Unforgettable Moments', 50, currentY, { 
          width: pageWidth, 
          align: 'center'
        });
      
      currentY += 30;
      
      // Contact info
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Phiva St, Protea Glen, Soweto, 1819', 50, currentY, { align: 'center' });
      
      currentY += 15;
      doc.text('083-989-4082 / 068-078-0301', 50, currentY, { align: 'center' });
      
      currentY += 15;
      doc.text('eaglesevents581@gmail.com', 50, currentY, { align: 'center' });
      
      currentY += 30;
      
      // Main title
      doc.fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('QUOTATION', 50, currentY, { 
          width: pageWidth, 
          align: 'center'
        });
      
      currentY += 25;
      
      // Quote details
      addSectionHeader('Quote Details:');
      
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text(`Reference: ${quote.reference || quote._id}`, 70, currentY);
      
      currentY += 15;
      
      const eventDate = new Date(quote.eventDate);
      doc.text(`Event Date: ${eventDate.toLocaleDateString('en-ZA')}`, 70, currentY);
      
      currentY += 30;
      
      // Customer information
      addSectionHeader('Customer Information:');
      
      const leftCol = 70;
      const rightCol = 300;
      
      addLabelValue('Name:', quote.customerName, leftCol, currentY);
      addLabelValue('Phone:', quote.phone, rightCol, currentY);
      
      currentY += 12;
      
      addLabelValue('Company:', quote.company, leftCol, currentY);
      addLabelValue('Location:', quote.location, rightCol, currentY);
      
      currentY += 12;
      
      addLabelValue('Email:', quote.email, leftCol, currentY);
      const eventTypeText = quote.eventType === 'other' && quote.eventTypeOther ? 
        `${quote.eventType} (${quote.eventTypeOther})` : quote.eventType;
      addLabelValue('Event Type:', eventTypeText, rightCol, currentY);
      
      currentY += 20;
      
      // Event details
      addSectionHeader('Event Details:');
      
      addLabelValue('Services:', (quote.services || []).join(', ') || 'N/A', 70, currentY);
      
      currentY += 12;
      
      addLabelValue('Guest Count:', quote.guestCount.toString(), 70, currentY);
      
      currentY += 20;
      
      // Items table
      addSectionHeader('Selected Items & Services:');
      
      const items = Array.isArray(quote.items) ? quote.items : [];
      console.log('Processing items:', items.length);
      
      if (items.length > 0) {

        
        // Table header
        doc.rect(50, currentY, pageWidth, 20)
          .fillColor('#f5f5f5')
          .fill();
        
        doc.fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Item/Service', 70, currentY + 6)
          .text('Qty', 300, currentY + 6)
          .text('Unit Price', 350, currentY + 6)
          .text('Total', 450, currentY + 6);
        
        currentY += 25;
        
        // Table rows
        items.forEach((item, index) => {
          if (!item) return;
          
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price) || 0;
          const total = qty * price;
          
          console.log(`Item ${index + 1}: ${item.name}, Qty: ${qty}, Price: ${price}, Total: ${total}`);
          

          
          // Simple row border
          doc.rect(50, currentY, pageWidth, 18)
            .strokeColor('#e0e0e0')
            .lineWidth(0.5)
            .stroke();
          
          doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#000000')
            .text(item.name || 'Unknown Item', 70, currentY + 5, { width: 200 })
            .text(qty.toString(), 300, currentY + 5)
            .text(`R${price.toFixed(2)}`, 350, currentY + 5)
            .text(`R${total.toFixed(2)}`, 450, currentY + 5);
          
          currentY += 18;
        });
        
        currentY += 20;
      } else {
        doc.fontSize(10).text('No items selected').moveDown(0.5);
        currentY += 20;
      }

      // Cost summary
      addSectionHeader('Cost Summary:');
      
      const totalAmount = Number(quote.totalAmount) || 0;
      console.log('Total amount calculated:', totalAmount);
      
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(`Total Amount: R${totalAmount.toFixed(2)}`, 70, currentY);
      
      currentY += 25;
      
      // Payment information
      addSectionHeader('Payment Information:');
      
      const methodMap = { 
        card: 'Credit/Debit Card', 
        bank_transfer: 'EFT/Bank Transfer', 
        cash: 'Cash', 
        mobile: 'Mobile Payment' 
      };
      
      addLabelValue('Payment Method:', methodMap[quote.paymentMethod] || quote.paymentMethod, 70, currentY);
      
      currentY += 12;
      
      addLabelValue('Payment Status:', (quote.paymentStatus || 'pending').toUpperCase(), 70, currentY);
      
      currentY += 20;
      
      // Banking details
      addSectionHeader('Banking Details:');
      
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#666666');
      
      doc.text('Bank:', leftCol, currentY);
      doc.text('Account Name:', leftCol, currentY + 12);
      doc.text('Account Number:', leftCol, currentY + 24);
      doc.text('Branch Code:', leftCol, currentY + 36);
      doc.text('Reference:', leftCol, currentY + 48);
      doc.text('Swift Code:', leftCol, currentY + 60);
      
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#000000');
      
      doc.text('First National Bank (FNB)', leftCol + 80, currentY);
      doc.text('Eagles Events', leftCol + 80, currentY + 12);
      doc.text('628 123 456 78', leftCol + 80, currentY + 24);
      doc.text('250 655', leftCol + 80, currentY + 36);
      doc.text('Use Quote Reference or Customer Name', leftCol + 80, currentY + 48);
      doc.text('FIRNZAJJ (for international transfers)', leftCol + 80, currentY + 60);
      
      currentY += 75;
      


      // Notes Section if applicable
      if (quote.notes) {
        currentY += 15;
        
        addSectionHeader('Special Notes & Requirements:');
        
        doc.fontSize(10)
          .font('Helvetica')
          .fillColor('#000000')
          .text(String(quote.notes), 70, currentY, { width: pageWidth - 40 });
      }

      // Footer
      currentY += 30;
      
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Thank you for choosing Eagles Events', 50, currentY, { 
          width: pageWidth, 
          align: 'center'
        });
      
      currentY += 12;
      doc.text('This quotation is valid for 14 days unless otherwise stated', 50, currentY, { 
        width: pageWidth, 
        align: 'center'
      });
      
      currentY += 12;
      doc.text('For any questions or modifications, please contact us immediately', 50, currentY, { 
        width: pageWidth, 
        align: 'center'
      });

      doc.end();
    } catch (err) {
      console.error('PDF generation error in try-catch:', err);
      reject(err);
    }
  });
}
