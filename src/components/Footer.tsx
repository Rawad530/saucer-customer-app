// src/components/Footer.tsx
import { Link } from 'react-router-dom';
import { MapPin, Clock, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 mt-auto border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-lg font-semibold text-amber-400 mb-4">Contact & Location</h4>
            <div className="space-y-2 text-gray-400 text-sm">
              {/* Update these details as necessary */}
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Tamar Mepe Ave 32, Tbilisi, Georgia</p>
              <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> Open Daily: 12:00 PM - 11:00 PM</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> +995 555 123 456</p>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-amber-400 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/account" className="hover:text-white transition-colors">My Account</Link></li>
              <li><Link to="/order" className="hover:text-white transition-colors">Order Now</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-amber-400 mb-4">Saucer Burger</h4>
            <p className="text-gray-400 text-sm">The best burgers in the galaxy.</p>
          </div>
        </div>
        <div className="mt-8 text-center text-gray-500 text-xs border-t border-gray-700 pt-6">
          &copy; {new Date().getFullYear()} Saucer Burger. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;