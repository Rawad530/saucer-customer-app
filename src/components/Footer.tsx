// src/components/Footer.tsx

import { Link } from 'react-router-dom';
import { 
  MapPin, Clock, Phone, 
  Mail, MessageCircle // <-- ADDED NEW ICONS
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 mt-auto border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-lg font-semibold text-amber-400 mb-4">Contact & Location</h4>
            <div className="space-y-2 text-gray-400 text-sm">
              <a
                href="http://googleusercontent.com/maps/google.com/0"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <MapPin className="w-4 h-4" /> 45 Petre Kavtaradze St, Tbilisi, Georgia
              </a>
              <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> Open Daily: 12:00 PM - 2:00 AM</p>
              
              {/* ===== START: UPDATED CONTACT LINKS ===== */}
              <a href="tel:+995591229658" className="flex items-center gap-2 hover:text-white transition-colors pt-1">
                <Phone className="w-4 h-4" />
                <span>Call Us</span>
              </a>
              <a href="mailto:saucerburger@gmail.com" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                <span>Mail Us</span>
              </a>
              <a href="https://wa.me/995591229658" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span>Chat with Us</span>
              </a>
              {/* ===== END: UPDATED CONTACT LINKS ===== */}
              
            </div>
          </div>
          
          {/* --- UPDATED QUICK LINKS SECTION --- */}
          <div>
            <h4 className="text-lg font-semibold text-amber-400 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/account" className="hover:text-white transition-colors">My Account</Link></li>
              <li><Link to="/order" className="hover:text-white transition-colors">Order Now</Link></li>
                {/* Added Policy Links for BOG Compliance */}
              <li><Link to="/terms-of-use" className="hover:text-white transition-colors">Terms and Conditions</Link></li>
                <li><Link to="/shipping-return-policy" className="hover:text-white transition-colors">Shipping and Return Policy</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          {/* ------------------------------------ */}

          <div>
            <h4 className="text-lg font-semibold text-amber-400 mb-4">Saucer Burger</h4>
            <p className="text-gray-400 text-sm">The best burgers in the galaxy.</p>
          </div>
        </div>
        <div className="mt-8 text-center text-gray-500 text-xs border-t border-gray-700 pt-6">
          {/* We use the current year dynamically */}
          © {new Date().getFullYear()} Saucer Burger. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;