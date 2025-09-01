export function PaymentDetails() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Payment Details</h1>
        <p className="text-gray-600 mb-8">
          You can make secure payments via EFT using the banking details below. Please include your reference and send proof of payment (POP) via WhatsApp or Email.
        </p>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">EFT Banking Details</h2>
          <div className="text-blue-900 space-y-1">
            <p><strong>Bank:</strong> FNB</p>
            <p><strong>Account Type:</strong> Cheque Account</p>
            <p><strong>Account Name:</strong> Eyezintombi Zakwethu Projects</p>
            <p><strong>Account Number:</strong> 62824648218</p>
            <p className="pt-1"><strong>Reference:</strong> Please WhatsApp or email the Proof of Payment (POP) and update</p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Need help?</h3>
          <p className="text-gray-700 text-sm">
            If you need assistance with payments or invoicing, please contact us on WhatsApp or email and we will assist you.
          </p>
        </div>
      </div>
    </section>
  );
}
