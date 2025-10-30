// src/components/Footer.tsx

import { Link } from 'react-router-dom';
import { 
  MapPin, Clock, Phone, 
  Mail, MessageCircle 
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext'; // <-- 1. IMPORT THE HOOK

const Footer = () => {
  const { t } = useLanguage(); // <-- 2. USE THE HOOK (removed language and setLanguage)

  // 3. REMOVED THE LANGUAGE BUTTON COMPONENT

  return (
    <footer className="bg-gray-800 mt-auto border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* --- COLUMN 1: CONTACT (NOW TRANSLATED) --- */}
          <div>
            <h4 className="text-lg font-semibold text-amber-400 mb-4">{t.footer_contactLocation}</h4>
            <div className="space-y-2 text-gray-400 text-sm">
              <a
                href="https://maps.google.com/?cid=11266092328424134394&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQ" // Corrected link
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <MapPin className="w-4 h-4" /> {t.footer_address_line1}, {t.footer_address_line2}
              </a>
              <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> {t.footer_hours} 12:00 PM - 2:00 AM</p>
              
              {/* ===== START: UPDATED CONTACT LINKS (NOW TRANSLATED) ===== */}
              <a href="tel:+995591229658" className="flex items-center gap-2 hover:text-white transition-colors pt-1">
                <Phone className="w-4 h-4" />
                <span>{t.footer_callUs}</span>
              </a>
              <a href="mailto:saucerburger@gmail.com" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                <span>{t.footer_mailUs}</span>
              </a>
              <a href="https://wa.me/995591229658" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span>{t.footer_chatUs}</span>
              </a>
              {/* ===== END: UPDATED CONTACT LINKS ===== */}
              
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

          {/* --- COLUMN 3: BRAND (NOW TRANSLATED) --- */}
          <div>
            <h4 className="text-lg font-semibold text-amber-400 mb-4">{t.footer_saucerBurger}</h4>
            <p className="text-gray-400 text-sm">{t.footer_tagline}</p>
            
            {/* 4. REMOVED THE LANGUAGE BUTTONS */}
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
