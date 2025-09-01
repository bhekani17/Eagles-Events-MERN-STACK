import { useState } from 'react';
import { Users, Briefcase, Home, Heart, HardHat, ChevronDown, ChevronUp } from 'lucide-react';

function EventCard({ eventType }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = eventType.icon;
  
  return (
    <div 
      className={`group bg-white/95 hover:bg-white backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-white/20 hover:border-gold-500/50 overflow-hidden ${
        isExpanded ? 'ring-2 ring-gold-500' : ''
      }`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-5 sm:p-6 focus:outline-none"
        aria-expanded={isExpanded}
        aria-controls={`event-details-${eventType.title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold-100/90 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 text-left">{eventType.title}</h3>
              <p className="text-sm text-gray-600 mt-1 text-left line-clamp-1">{eventType.description}</p>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 text-gray-400 group-hover:text-gold-600 transition-colors">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </button>
      
      <div 
        id={`event-details-${eventType.title.toLowerCase().replace(/\s+/g, '-')}`}
        className={`px-5 sm:px-6 overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-96 pb-5 sm:pb-6' : 'max-h-0'
        }`}
      >
        <p className="text-gray-700 text-sm sm:text-base mb-4">{eventType.description}</p>
        <ul className="space-y-2 sm:space-y-2.5">
          {eventType.events.map((event, i) => (
            <li key={i} className="flex items-start text-sm sm:text-base text-gray-800">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gold-600 rounded-full mr-2 mt-1.5 sm:mt-2 flex-shrink-0"></div>
              <span className="leading-tight">{event}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function EventTypes() {
  const eventTypes = [
    {
      icon: HardHat,
      title: 'Construction Sites',
      description: 'Professional sanitation and welfare solutions for construction sites, industrial zones, and temporary work environments.',
      events: ['Temporary Toilets', 'Hand Wash Stations', 'Shower Units', 'Welfare Units', 'Deck Units', 'Construction Camps', 'Industrial Sites', 'Road Works', 'Building Sites', 'Mining Operations']
    },
    {
      icon: Users,
      title: 'Social Events',
      description: 'Perfect for weddings, birthdays, family reunions, and other social gatherings.',
      events: ['Weddings', 'Birthdays', 'Family Reunions', 'Anniversaries', 'Graduations']
    },
    {
      icon: Briefcase,
      title: 'Corporate Events',
      description: 'Professional solutions for business meetings, conferences, and corporate functions.',
      events: ['Conferences', 'Seminars', 'Product Launches', 'Team Building', 'Award Ceremonies']
    },
    {
      icon: Home,
      title: 'Community Events',
      description: 'Supporting local communities with reliable event solutions.',
      events: ['Festivals', 'Fundraisers', 'Charity Events', 'Church Functions', 'Community Fairs']
    },
    {
      icon: Heart,
      title: 'Special Occasions',
      description: 'Making your special moments even more memorable.',
      events: ['Baby Showers', 'Bridal Showers', 'Engagement Parties', 'Retirement Parties', 'Milestone Celebrations']
    }
  ];

  return (
    <section id="event-types" className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: 'url(/images/t4.jpg)',
            backgroundAttachment: 'fixed',
            filter: 'brightness(0.5)'
          }}
          aria-hidden="true"
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/40"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 sm:mb-4 uppercase tracking-wider">
            Event Types We Serve
          </h2>
          <p className="text-base sm:text-lg text-gray-200 max-w-3xl mx-auto px-2 sm:px-0">
            From intimate gatherings to large-scale events, we provide comprehensive solutions for all types of occasions.
          </p>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          {eventTypes.map((eventType, index) => (
            <EventCard key={index} eventType={eventType} />
          ))}
        </div>
      </div>
    </section>
  );
}
