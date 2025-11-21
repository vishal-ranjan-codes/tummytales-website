

export default function CancellationRefundsPage() {

  return (
    <main className="site-content">
      <div className="container mx-auto px-6 py-12 max-sm:px-4 max-sm:py-8">
        <div className="container-max-tab my-8 p-8 theme-bg-color-dark theme-rounded">
            <h1 className="lb-hero-heading theme-fc-heading w-full leading-6 text-2xl md:text-4xl lg:text-5xl font-medium" style={{ lineHeight: 1.2 }}>Cancellation & Refunds</h1>

            <section className="mb-8 mt-8">
                <h2 className="text-2xl theme-fc-heading-light">1. Overview</h2>
                <p>
                PortoBox provides premium digital products, including portfolio templates and related services. Because our products are delivered digitally and accessible immediately after purchase, they cannot be physically returned.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl theme-fc-heading-light">2. Eligibility for Refunds</h2>
                <p>We offer refunds only within <strong>48 hours (2 days)</strong> of purchase if all of the following are true.</p>
                <ul className="list-disc pl-6">
                <li>You contact us within the 48 hour window at <strong>info@portobox.com</strong>.</li>
                <li>You have not substantially downloaded, duplicated, or used the digital product in a way that makes it non returnable.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl theme-fc-heading-light">3. Why We Have a Limited Refund Window</h2>
                <p>
                Our templates and other digital products are delivered instantly after payment. Once you have access to a product, it is not possible for us to take it back in the same way as a physical item. This approach is standard across businesses that sell digital goods, because the buyer retains a usable copy of the product even after a refund request.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl theme-fc-heading-light">4. Non Refundable Situations</h2>
                <ul className="list-disc pl-6">
                <li>More than 48 hours have passed since your purchase.</li>
                <li>You have downloaded, copied, or otherwise made substantial use of the product.</li>
                <li>You purchased by mistake or changed your mind after access was granted.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl theme-fc-heading-light">5. Refund Process</h2>
                <ol className="list-decimal pl-6">
                <li>Email <strong>info@portobox.com</strong> within 48 hours of purchase.</li>
                <li>Include your order details and the reason for the refund request.</li>
                <li>If eligible, your refund will be processed to your original payment method within 5 to 7 business days.</li>
                </ol>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl theme-fc-heading-light">6. Contact Us</h2>
                <address className="not-italic">
                <p><strong>PortoBox</strong></p>
                <p>Gurugram, Haryana, India</p>
                <p>info@portobox.com</p>
                </address>
            </section>
            </div>

        
      </div>
    </main>
  );
}