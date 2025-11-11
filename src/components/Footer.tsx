// src/components/Footer.tsx

import { Link } from 'react-router-dom';
import {
  MapPin, Clock, Phone,
  Mail, MessageCircle,
  Instagram, Facebook // <-- ADDED ICONS
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  // --- ADDED SOCIAL LINKS CONSTANT ---
  const socialLinks = [
    { name: 'Instagram', href: 'https://www.instagram.com/saucerburger.ge/', icon: Instagram },
    { name: 'Facebook', href: 'https://www.facebook.com/saucerburger.ge/', icon: Facebook },
  ];
  // ------------------------------------

  return (
    <footer className="bg-gray-800 mt-auto border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* --- COLUMN 1: CONTACT (NOW TRANSLATED) --- */}
          <div>
            <h4 className="text-lg font-semibold text-amber-400 mb-4">{t.footer_contactLocation}</h4>
            <div className="space-y-2 text-gray-400 text-sm">
              <a
                href="https://maps.google.com/?cid=11266092328424134394&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQ"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <MapPin className="w-4 h-4" /> {t.footer_address_line1}, {t.footer_address_line2}
              </a>
              <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> {t.footer_hours} 02:00 PM - 12:00 AM</p>

              <a href="tel:+995591229658" className="flex items-center gap-2 hover:text-white transition-colors pt-1">
                <Phone className="w-4 h-4" />
                <span>{t.footer_callUs}</span>
              </a>
              <a href="mailto:saucerburger@gmail.com" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                <span>{t.footer_mailUs}</span>
              </a>
              <a href="httpsInd://wa.me/995591229658" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span>{t.footer_chatUs}</span>
              </a>
            </div>
          </div>

          {/* --- COLUMN 2: QUICK LINKS (NOW TRANSLATED) --- */}
          <div>
            <h4 className="text-lg font-semibold text-amber-400 mb-4">{t.footer_quickLinks}</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/account" className="hover:text-white transition-colors">{t.footer_myAccount}</Link></li>
              <li><Link to="/order" className="hover:text-white transition-colors">{t.footer_fullMenu}</Link></li>
              <li><Link to="/terms-of-use" className="hover:text-white transition-colors">{t.footer_terms}</Link></li>
              <li><Link to="/shipping-return-policy" className="hover:text-white transition-colors">{t.footer_shipping}</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-white transition-colors">{t.footer_privacy}</Link></li>
            </ul>
          </div>

          {/* --- COLUMN 3: BRAND (NOW TRANSLATED & WITH SOCIALS) --- */}
          <div>
            <h4 className="text-lg font-semibold text-amber-400 mb-4">{t.footer_saucerBurger}</h4>
            <p className="text-gray-400 text-sm">{t.footer_tagline}</p>

            {/* ===== NEW SOCIAL MEDIA SECTION (FIXED) ===== */}
            <h4 className="text-lg font-semibold text-amber-400 mb-4 mt-6">
              {t.footer_followUs}
            </h4>
            <div className="flex gap-4">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={`Follow us on ${item.name}`}
                >
                  <item.icon className="h-6 w-6" />
                </a>
              ))}
            </div>
            {/* ===== END OF NEW SECTION ===== */}
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-xs border-t border-gray-700 pt-6">
          © {new Date().getFullYear()} Saucer Burger. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;