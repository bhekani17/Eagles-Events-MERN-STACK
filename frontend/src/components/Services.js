import React from 'react';
import { Truck, Gift, Utensils, Settings, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

export function Services({ onQuoteClick }) {
  const navigate = useNavigate();

  const services = [
    {
      id: 'mobile-hire',
      icon: Truck,
      title: 'Mobile Hire Services',
      description: 'Comprehensive mobile solutions for all types of events including VIP toilets, tents, and other essential facilities.',
      features: ['VIP Mobile Toilets', 'Tents & Marquees', 'Event Equipment', 'Professional Setup'],
      image: '/images/f1.jpg',
      gradient: 'from-blue-500 to-purple-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      navigateTo: '/hire',
      buttonText: 'View Equipment'
    },
    {
      id: 'event-packages',
      icon: Gift,
      title: 'Event Packages',
      description: 'Tailored packages for weddings, funerals, birthdays, and corporate events to suit your specific needs.',
      features: ['Customizable Options', 'All-inclusive Deals', 'Professional Planning', 'Budget Friendly'],
      image: '/images/pack1.webp',
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      navigateTo: '/packages',
      buttonText: 'View Packages'
    },
    {
      id: 'slaughtering-services',
      icon: Utensils,
      title: 'Slaughtering Services',
      description: 'Professional and hygienic mobile slaughtering services for all your event requirements.',
      features: ['Mobile Units', 'Health Compliant', 'Professional Staff', 'Quality Assurance'],
      image: '/images/slaughter2.jpg',
      gradient: 'from-red-500 to-orange-600',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      navigateTo: '/hire',
      buttonText: 'Hire Service'
    },
    {
      id: 'auxiliary-services',
      icon: Settings,
      title: 'Auxiliary Services',
      description: 'Additional services to ensure your event runs smoothly from start to finish.',
      features: ['Waste Management', 'Water Supply', 'Power Solutions', 'Event Cleanup'],
      image: '/images/aux2.webp',
      gradient: 'from-purple-500 to-pink-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      navigateTo: '/hire',
      buttonText: 'Hire Service'
    }
  ];

  return (
    <section id="services" className="relative py-8 sm:py-12 lg:py-16 overflow-hidden">
      {/* Background Images and Patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100"></div>
      
      {/* Top Background Pattern */}
      <div 
        className="absolute top-0 left-0 w-full h-1/3 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: "url('/images/HOME1.jpg')" }}
      ></div>
      
      {/* Bottom Background Pattern */}
      <div 
        className="absolute bottom-0 right-0 w-full h-1/3 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: "url('/images/HOME2.webp')" }}
      ></div>
      
      {/* Additional Background Images */}
      <div 
        className="absolute top-1/4 right-1/4 w-64 h-64 bg-cover bg-center bg-no-repeat opacity-20 bg-float-1"
        style={{ backgroundImage: "url('/images/s1.webp')" }}
      ></div>
      <div 
        className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-cover bg-center bg-no-repeat opacity-25 bg-float-2"
        style={{ backgroundImage: "url('/images/s2.jpg')" }}
      ></div>
      
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-amber-400/20 to-amber-600/20 rounded-full blur-xl bg-float-1"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-blue-400/20 to-purple-600/20 rounded-full blur-xl bg-float-2"></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-r from-emerald-400/20 to-teal-600/20 rounded-full blur-xl bg-float-3"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="relative text-center mb-8 sm:mb-12 lg:mb-16">
          {/* Header Background */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 rounded-3xl"
            style={{ backgroundImage: "url('/images/weddings.jpg')" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-amber-600/10 rounded-3xl"></div>
          
          <div className="relative p-8 sm:p-12 lg:p-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full mb-6 floating-animation shadow-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 drop-shadow-lg">
              Our <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">Premium Services</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed drop-shadow-md">
              We ensure your event is seamless with our comprehensive mobile services, offering perfect hospitality and hygiene for your guests.
            </p>
            <div className="mt-8 flex items-center justify-center space-x-8 text-sm text-gray-600 drop-shadow-sm">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                <span className="font-semibold">500+</span>
                <span className="ml-1">Events</span>
              </div>
              <div className="flex items-center">
                <Truck className="w-4 h-4 text-blue-500 mr-1" />
                <span className="font-semibold">24/7</span>
                <span className="ml-1">Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="services-grid-mobile mb-12 sm:mb-16">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            
            return (
              <div
                key={service.id}
                id={service.id}
                className={`group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 service-card-mobile service-card-enter service-card-stagger-${index + 1} ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                {/* Service-specific background pattern */}
                <div className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity duration-500">
                  {service.id === 'mobile-hire' && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: "url('/images/f1.jpg')" }}
                    ></div>
                  )}
                  {service.id === 'event-packages' && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: "url('/images/pack1.webp')" }}
                    ></div>
                  )}
                  {service.id === 'slaughtering-services' && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: "url('/images/slaughter2.jpg')" }}
                    ></div>
                  )}
                  {service.id === 'auxiliary-services' && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: "url('/images/aux2.webp')" }}
                    ></div>
                  )}
                </div>
                
                {/* Image */}
                <div className="relative w-full h-48 sm:h-56 lg:h-64 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 service-image-mobile"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`w-14 h-14 ${service.iconBg} rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className={`w-7 h-7 ${service.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors duration-300">
                          {service.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {service.description}
                  </p>
                  
                  <ul className="space-y-3 mb-8">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-sm sm:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={() => navigate(service.navigateTo)}
                      className={`flex-1 bg-gradient-to-r ${service.gradient} hover:shadow-lg text-white font-semibold text-sm sm:text-base px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 group-hover:shadow-xl service-button-mobile`}
                    >
                      <span className="flex items-center justify-center">
                        {service.buttonText}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </span>
                    </Button>
                    <Button
                      onClick={() => onQuoteClick({
                        preSelectedService: {
                          id: service.id,
                          name: service.title,
                          description: service.description,
                          features: service.features,
                          image: service.image,
                          category: service.id
                        }
                      })}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm sm:text-base px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 group-hover:shadow-xl"
                    >
                      <span className="flex items-center justify-center">
                        Hire Now
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 sm:p-12 lg:p-16">
          {/* Background Images */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
            style={{ backgroundImage: "url('/images/HOME3.webp')" }}
          ></div>
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
            style={{ backgroundImage: "url('/images/HOME4.webp')" }}
          ></div>
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-amber-600/20"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.1),transparent_50%)]"></div>
          </div>
          
          {/* Decorative Overlays */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-20 h-20 bg-amber-500/10 rounded-full blur-xl bg-pulse-slow"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-amber-400/10 rounded-full blur-xl bg-float-1"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-r from-amber-500/5 to-amber-600/5 rounded-full blur-2xl bg-rotate-slow"></div>
          </div>
          
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full mb-8 floating-animation">
              <Gift className="w-10 h-10 text-white" />
            </div>
            
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Need a <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Custom Solution?</span>
            </h3>
            
            <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Don't see exactly what you need? Our team can create custom solutions tailored to your specific requirements. 
              Contact us for a personalized consultation and let's bring your vision to life.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate('/hire')}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-base sm:text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900 pulse-glow"
              >
                <span className="flex items-center">
                  View All Services
                  <ArrowRight className="w-5 h-5 ml-2" />
                </span>
              </Button>
              
              <Button
                onClick={onQuoteClick}
                className="bg-white/10 hover:bg-white/20 text-white font-semibold text-base sm:text-lg px-8 py-4 rounded-xl border border-white/20 hover:border-white/30 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                <span className="flex items-center">
                  Get Custom Quote
                  <ArrowRight className="w-5 h-5 ml-2" />
                </span>
              </Button>
              
              <div className="flex items-center space-x-6 text-gray-400">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  <span className="text-sm font-medium">Free Consultation</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  <span className="text-sm font-medium">24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

