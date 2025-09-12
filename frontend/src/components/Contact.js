import React, { useState } from 'react';
import { publicAPI } from '../services/api';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { CONTACT } from '../config/contact';
import { Button } from './ui/button';

export function Contact({ onQuoteClick }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const data = await publicAPI.submitContact(formData);
      if (data?.success) {
        setSubmitMessage('Thank you for your message! We will get back to you soon.');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        const errMsg = data?.message || 'Failed to send message. Please check your details and try again.';
        setSubmitMessage(errMsg);
      }
    } catch (error) {
      const errMsg = error?.errors
        ? (error.errors[Object.keys(error.errors)[0]] || 'Please check your details and try again.')
        : (error?.message || 'Sorry, there was an error sending your message. Please try again.');
      setSubmitMessage(errMsg);
    }

    setIsSubmitting(false);
    setTimeout(() => setSubmitMessage(''), 5000);
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone',
      details: `${CONTACT.phones[0].display} / ${CONTACT.phones[1]?.display || ''}`.trim(),
      description: 'Call or WhatsApp us for bookings and inquiries'
    },
    {
      icon: Mail,
      title: 'Email',
      details: CONTACT.email,
      description: 'Email us for inquiries and bookings'
    },
    {
      icon: MapPin,
      title: 'Address',
      details: CONTACT.address.lines.join(', '),
      description: 'Our location in Soweto'
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: '24/7 Emergency Services',
      description: 'Available for bookings and inquiries at any time'
    }
  ];

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="container-responsive">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Contact Us
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get in touch with Eagles Events for all your mobile hire and slaughtering service needs. 
            We're available 24/7 to assist with your event requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Contact Form */}
          <div className="bg-gray-50 rounded-xl p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Send Us a Message</h3>
            
            {submitMessage && (
              <div className={`mb-6 p-4 rounded-lg ${
                submitMessage.includes('Thank you') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {submitMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="form-label-touch">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-input-touch"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="form-label-touch">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input-touch"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="form-label-touch">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input-touch"
                  placeholder="+27 123 456 789"
                />
              </div>

              <div>
                <label htmlFor="message" className="form-label-touch">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="form-input-touch"
                  placeholder="Tell us about your event and requirements..."
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                size="touch"
                className="w-full bg-gold-600 hover:bg-gold-700 text-black font-semibold text-sm sm:text-base"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Need a quotation right away?</p>
              <Button
                onClick={onQuoteClick}
                variant="outline"
                size="touch"
                className="border-gold-600 text-gold-600 hover:bg-gold-50 text-sm sm:text-base"
              >
                Get Instant Quotation
              </Button>
            </div>
            {/* Quick Contact Actions */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/${CONTACT.whatsapp.number}?text=${encodeURIComponent(CONTACT.whatsapp.text)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold min-h-[44px] min-w-[44px] rounded-lg"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat on WhatsApp
              </a>
              <a
                href={`tel:${CONTACT.phones[0].tel}`}
                className="w-full inline-flex items-center justify-center border border-gray-300 hover:bg-gray-50 text-gray-900 font-semibold min-h-[44px] min-w-[44px] rounded-lg"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Us
              </a>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Contact Information</h3>
            
            <div className="space-y-6 mb-8">
              {contactInfo.map((info, index) => {
                const IconComponent = info.icon;
                return (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center mr-4">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">{info.title}</h4>
                      <p className="text-gray-900 mb-1">{info.details}</p>
                      <p className="text-gray-600 text-sm">{info.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive Map */}
            <div className="space-y-4">
              <div className="relative w-full h-64 rounded-xl overflow-hidden">
                <iframe
                  title="Eagles Events Location"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(CONTACT.address.mapsQuery)}&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(CONTACT.address.mapsQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-lg border border-gold-600 text-gold-600 hover:bg-gold-50"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
