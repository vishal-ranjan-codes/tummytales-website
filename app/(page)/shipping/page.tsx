

export default function ShippingPage() {

  return (
    <main className="site-content">
      <div className="container mx-auto px-6 py-12 max-sm:px-4 max-sm:py-8">
        <div className="container-max-tab my-8 p-8 theme-bg-color-dark theme-rounded">
            <h1
                className="lb-hero-heading theme-fc-heading w-full leading-6 text-2xl md:text-4xl lg:text-5xl font-medium"
                style={{ lineHeight: 1.2 }}
            >
                Delivery Policy
            </h1>

            <section className="mb-8 mt-8">
                <h2 className="text-2xl theme-fc-heading-light">1. Overview</h2>
                <p>
                BellyBox provides food delivery services for home-cooked meals and tiffin subscriptions. 
                We deliver fresh, authentic meals prepared by local home chefs directly to your doorstep.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl theme-fc-heading-light">2. Delivery Areas</h2>
                <ul className="list-disc pl-6">
                <li>We currently deliver to major cities across India</li>
                <li>Delivery radius varies by vendor location</li>
                <li>Check delivery availability in your area during checkout</li>
                <li>We are continuously expanding our delivery network</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl theme-fc-heading-light">3. Delivery Time</h2>
                <p>
                Meals are typically delivered within 30-45 minutes of ordering, depending on your location and vendor availability. 
                You can track your order in real-time through our app or website. 
                If your order is delayed beyond 60 minutes, contact support at <strong>hello@tummytales.com</strong>.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl theme-fc-heading-light">4. Order Confirmation and Tracking</h2>
                <p>
                We send a confirmation email and SMS to the contact information provided at checkout. 
                If you do not see it, check spam or promotions. Add <strong>hello@tummytales.com</strong> to your safe senders list.
                </p>
                <p className="mt-2">
                You can track your order in real-time through our app or website using your order number.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl theme-fc-heading-light">5. Delivery Instructions</h2>
                <p>
                You can provide specific delivery instructions when placing your order. 
                This includes gate codes, building access, preferred delivery time, and any special requirements.
                Our delivery partners will follow these instructions to ensure smooth delivery.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl theme-fc-heading-light">6. Payment and Delivery</h2>
                <p>
                Payments are processed by Razorpay and Stripe. Some banks may place a short hold for verification. 
                Orders are prepared and delivered after the payment gateway confirms success.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl theme-fc-heading-light">7. Delivery Fees</h2>
                <p>
                Delivery fees are calculated based on distance and location. 
                Fees are displayed during checkout before payment confirmation.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl theme-fc-heading-light">8. Special Delivery Requirements</h2>
                <p>
                For special dietary requirements or custom meal preparations, delivery timelines may vary. 
                We will inform you of any delays and provide updated delivery estimates.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl theme-fc-heading-light">9. Failed Deliveries</h2>
                <ul className="list-disc pl-6">
                <li>If delivery fails due to incorrect address, you may be charged for re-delivery.</li>
                <li>If delivery fails due to our error, we will re-deliver at no additional cost or provide a full refund.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl theme-fc-heading-light">10. Food Safety and Quality</h2>
                <p>
                All our vendor partners follow strict food safety guidelines. 
                Meals are prepared fresh and delivered in temperature-controlled packaging to ensure quality and safety.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl theme-fc-heading-light">11. Subscription Deliveries</h2>
                <p>
                For tiffin subscription services, meals are delivered according to your chosen schedule. 
                You can modify delivery times and frequency through your account settings.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl theme-fc-heading-light">12. Refunds</h2>
                <p>
                Refunds are governed by our Refund Policy. BellyBox offers satisfaction guarantee for all orders. 
                See the Refund Policy page for full details.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl theme-fc-heading-light">13. Need Help</h2>
                <address className="not-italic">
                <p>For delivery issues or order questions contact:</p>
                <p><strong>BellyBox</strong></p>
                <p>Food Tech Hub, Sector 25, Gurugram, Haryana, India</p>
                <p>hello@tummytales.com</p>
                </address>
            </section>
            </div>


        
      </div>
    </main>
  );
}