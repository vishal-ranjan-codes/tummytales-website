"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Mail, Send, MessageSquare } from "lucide-react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('subject', formData.subject)
      formDataToSend.append('message', formData.message)
      formDataToSend.append('source', 'Contact Page')
      
      const response = await fetch('https://getform.io/f/bqoekjvb', {
        method: 'POST',
        body: formDataToSend,
      })
      
      if (response.ok) {
        setSubmitted(true)
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        throw new Error('Form submission failed')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('There was an error submitting your form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
    
    setTimeout(() => {
      setSubmitted(false)
    }, 5000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <main className="site-content">
      {/* Hero Section */}
      <div className="hero-section relative overflow-hidden border-b theme-border-color bg-[#cd2555]">
        <div className="hero-overlay">
          <div className="hero-gradient-circle absolute top-[-200px] w-[600px] opacity-40">
            <div className="w-full h-[600px] bg-gradient-radial from-primary-25 to-transparent rounded-full blur-3xl"></div>
          </div>
        </div>

        <div className="relative z-2">
          <div className="container dark">
            <div className="flex flex-col gap-6 pt-20 pb-20 text-center justify-center max-w-3xl mx-auto">
              <h1 className="theme-fc-heading text-3xl md:text-5xl lg:text-6xl font-medium leading-tight">
                Get in Touch
              </h1>
                             <p className="theme-fc-light text-lg md:text-xl max-w-2xl mx-auto">
                 Have a question about our tiffin subscription service or want to join as a vendor? 
                 We&apos;d love to hear from you and help you get started with BellyBox.
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-20 theme-bg-color">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
            
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold theme-fc-heading mb-4">
                    Contact Information
                  </h2>
                  <p className="theme-fc-light">
                    Ready to start your food journey? Reach out to us through any of these channels.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-12 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary-100" />
                    </div>
                    <div>
                      <h3 className="font-medium theme-fc-heading mb-1">Office Address</h3>
                      <p className="theme-fc-light">
                        BellyBox Headquarters,<br />
                        Food Tech Hub, Sector 25,<br />
                        Gurugram, Haryana, 122001
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 ">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-12 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary-100" />
                    </div>
                    <div>
                      <h3 className="font-medium theme-fc-heading mb-1">Email Address</h3>
                      <p className="theme-fc-light">
                        hello@tummytales.com
                      </p>
                    </div>
                  </div>

                </div>

                                 {/* Quick Links */}
                 <div className="pt-8 border-t theme-border-color">
                   <h3 className="font-medium theme-fc-heading mb-4">Quick Links</h3>
                   <div className="space-y-2">
                     <Link href="/about" className="block theme-fc-light hover:text-primary-100 transition-colors">
                       About Us
                     </Link>
                     <Link href="/privacy-policy" className="block theme-fc-light hover:text-primary-100 transition-colors">
                       Privacy Policy
                     </Link>
                     <Link href="/terms-and-conditions" className="block theme-fc-light hover:text-primary-100 transition-colors">
                       Terms & Conditions
                     </Link>
                    <Link href="/cancellation-refunds" className="block theme-fc-light hover:text-primary-100 transition-colors">
                      Cancellation & Refunds
                     </Link>
                   </div>
                 </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="theme-bg-foreground border theme-border-color">
                <CardHeader>
                  <CardTitle className="text-2xl theme-fc-heading flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-primary-100" />
                    Send us a Message
                  </CardTitle>
                                     <CardDescription className="theme-fc-light">
                     Fill out the form below and we&apos;ll get back to you within 24 hours.
                   </CardDescription>
                </CardHeader>
                <CardContent>
                  {submitted ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold theme-fc-heading mb-2">
                        Message Sent Successfully!
                      </h3>
                      <p className="theme-fc-light">
                        Thank you for reaching out. We&apos;ll get back to you soon.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="theme-fc-heading">
                            Full Name *
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Your full name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="theme-bg-color border theme-border-color focus:border-primary-100"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="theme-fc-heading">
                            Email Address *
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="theme-bg-color border theme-border-color focus:border-primary-100"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject" className="theme-fc-heading">
                          Subject *
                        </Label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                                                     placeholder="What&apos;s this about?"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="theme-bg-color border theme-border-color focus:border-primary-100"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="theme-fc-heading">
                          Message *
                        </Label>
                        <textarea
                          id="message"
                          name="message"
                          rows={6}
                          placeholder="Tell us more about your food preferences or questions..."
                          value={formData.message}
                          onChange={handleChange}
                          required
                          className="w-full theme-bg-color border theme-border-color focus:border-primary-100 rounded-md"
                        />
                      </div>

                      <div className="pt-4">
                        <Button 
                          type="submit" 
                          size="lg" 
                          className="w-full md:w-auto"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </div>

                                             <div className="text-sm theme-fc-light">
                         <p>
                           By submitting this form, you agree to our{' '}
                           <Link href="/privacy-policy" className="text-primary-100 hover:underline">
                             Privacy Policy
                           </Link>{' '}
                           and{' '}
                           <Link href="/terms-and-conditions" className="text-primary-100 hover:underline">
                             Terms of Service
                           </Link>
                           .
                         </p>
                       </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20 theme-bg-foreground border-t theme-border-color">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold theme-fc-heading mb-4">
              Frequently Asked Questions
            </h2>
            <p className="theme-fc-light text-lg max-w-2xl mx-auto">
              Find quick answers to common questions about our tiffin subscription service.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold theme-fc-heading mb-2">
                  How quickly will my meals be delivered?
                </h3>
                <p className="theme-fc-light">
                  Meals are typically delivered within 30-45 minutes of ordering, depending on your location and vendor availability.
                </p>
              </div>
              <div>
                <h3 className="font-semibold theme-fc-heading mb-2">
                  Can I customize my meal preferences?
                </h3>
                <p className="theme-fc-light">
                  Yes! You can specify dietary restrictions, spice levels, and ingredient preferences when placing your order.
                </p>
              </div>
              <div>
                                 <h3 className="font-semibold theme-fc-heading mb-2">
                   What areas do you deliver to?
                 </h3>
                <p className="theme-fc-light">
                  We currently deliver to major cities across India. Check our delivery areas during the ordering process.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold theme-fc-heading mb-2">
                  Do you provide customer support?
                </h3>
                <p className="theme-fc-light">
                  Yes, we offer 24/7 customer support for all your food delivery and subscription needs.
                </p>
              </div>
              <div>
                <h3 className="font-semibold theme-fc-heading mb-2">
                  How do I become a vendor on your platform?
                </h3>
                <p className="theme-fc-light">
                  Simply fill out our vendor registration form and our team will guide you through the onboarding process.
                </p>
              </div>
              <div>
                                 <h3 className="font-semibold theme-fc-heading mb-2">
                   What if I&apos;m not satisfied with my meal?
                 </h3>
                                 <p className="theme-fc-light">
                   We offer a satisfaction guarantee. If you&apos;re not happy with your meal, we&apos;ll provide a full refund or replacement.
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
