// src/pages/LandingPage.tsx (Rewritten with Tailwind CSS)

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
// Import Menu and X for the mobile hamburger icon
import { Award, Wallet, History, Truck, Bell, ArrowRight, Menu, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const LandingPage = () => {
  const [isRestaurantOpen, setIsRestaurantOpen] = useState<boolean | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-restaurant-status');
        if (error) throw error;
        setIsRestaurantOpen(data.isOpen);
      } catch (error) {
        console.error("Error checking restaurant status:", error);
        setIsRestaurantOpen(false);
      }
    };
    checkStatus();
  }, []);

  // Helper component for consistent button styling
  const StyledButton = ({ children, disabled, className = '' }: { children: React.ReactNode, disabled?: boolean, className?: string }) => (
    <button
      className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
        disabled
          ? 'bg-gray-500 cursor-not-allowed'
          : 'bg-amber-600 hover:bg-amber-700 shadow-md hover:shadow-lg'
      } ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );

  const OrderButton = () => {
    if (isRestaurantOpen === null) {
      return <StyledButton disabled>{t.hero_orderButton_checking}</StyledButton>;
    }
    if (isRestaurantOpen) {
      // Use Link styled as a button
      return <Link to="/order" className="px-6 py-3 rounded-lg font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-md hover:shadow-lg transition-colors">{t.hero_orderButton_active}</Link>;
    }
    return (
      <div className="text-center">
        <StyledButton disabled>
          {t.hero_orderButton_active}
        </StyledButton>
        <p className="text-sm font-semibold text-red-500 mt-2">
          {t.hero_orderButton_closed}
        </p>
      </div>
    );
  };

  // Language Switcher Button Component
  const LanguageButton = ({ langCode, label }: { langCode: 'en' | 'ka', label: string }) => (
    <button
      onClick={() => setLanguage(langCode)}
      className={`px-3 py-1 border border-amber-500 rounded-md text-sm transition-colors ${
        language === langCode ? 'bg-amber-500 text-white' : 'text-gray-300 hover:bg-amber-700/20'
      }`}
    >
      {label}
    </button>
  );

  return (
    // Set the overall page background and text color
    <div className="min-h-screen bg-gray-900 text-white">
      
      {/* Header Section */}
      <header className="bg-gray-800/95 backdrop-blur-sm shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          
          {/* 1. Logo (Left side) */}
          <Link to="/">
            <img src="/images/logo.png" alt="Saucer Burger Logo" className="h-10 lg:h-12" />
          </Link>

          {/* 2. Desktop Navigation (Center) */}
          {/* Hidden on small screens (lg:flex) */}
          <nav className="hidden lg:flex gap-8">
            <a href="#story" className="text-gray-300 hover:text-amber-400 transition-colors font-medium">{t.nav_story}</a>
            <a href="#benefits" className="text-gray-300 hover:text-amber-400 transition-colors font-medium">{t.nav_benefits}</a>
            <a href="#sauces" className="text-gray-300 hover:text-amber-400 transition-colors font-medium">{t.nav_sauces}</a>
          </nav>

          {/* 3. Actions (Right side) */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex gap-2">
                <LanguageButton langCode="en" label="EN" />
                <LanguageButton langCode="ka" label="GE" />
            </div>

            {/* Sign In Button (Hidden on very small screens) */}
            <Link to="/login" className="hidden sm:block px-4 py-2 rounded-md text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors">
              {t.nav_signIn}
            </Link>

            {/* Mobile Menu Button (Visible on mobile/tablet) */}
            <button className="lg:hidden text-gray-300 hover:text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-gray-800 px-4 pb-4 pt-2 space-y-2 shadow-lg">
            <a href="#story" className="block py-2 text-gray-300 hover:text-amber-400" onClick={() => setIsMobileMenuOpen(false)}>{t.nav_story}</a>
            <a href="#benefits" className="block py-2 text-gray-300 hover:text-amber-400" onClick={() => setIsMobileMenuOpen(false)}>{t.nav_benefits}</a>
            <a href="#sauces" className="block py-2 text-gray-300 hover:text-amber-400" onClick={() => setIsMobileMenuOpen(false)}>{t.nav_sauces}</a>
            {/* Ensure Sign-in button is visible on mobile menu if hidden in header */}
            <Link to="/login" className="block sm:hidden py-3 mt-3 text-center rounded-md font-semibold text-white bg-amber-600 hover:bg-amber-700" onClick={() => setIsMobileMenuOpen(false)}>
              {t.nav_signIn}
            </Link>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-gray-900 pt-20 lg:pt-32 pb-10 lg:pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-amber-400 mb-6">{t.hero_title}</h1>
            <p className="text-lg lg:text-xl text-gray-300 mb-10 max-w-3xl mx-auto">{t.hero_subtitle}</p>
            <OrderButton />
          </div>
        </section>

        {/* Divider */}
        <div className="relative container mx-auto px-4 my-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center">
                <span className="px-4 bg-gray-900 text-lg font-medium text-gray-400">{t.divider_or}</span>
            </div>
        </div>

        {/* Benefits Section */}
        <section id="benefits" className="container mx-auto px-4 pt-8 lg:pt-12 pb-16 lg:pb-24">
          <h2 className="text-3xl lg:text-4xl font-bold text-center text-amber-400 mb-4">{t.benefits_title}</h2>
          <p className="text-center text-gray-300 mb-12 lg:mb-16">{t.benefits_subtitle}</p>
          
          {/* Responsive Grid: 1 column on mobile, 2 on tablet, 3 on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* CTA Card (Special styling) */}
            <Link to="/register" className="bg-amber-600 p-6 rounded-xl shadow-xl flex justify-between items-center hover:bg-amber-700 transition-transform transform hover:scale-105">
              <h3 className="text-xl font-bold text-white">{t.benefits_createAccount_title}</h3>
              <ArrowRight className="text-white w-6 h-6" />
            </Link>

            {/* Standard Benefit Cards */}
            {/* (Mapping over data for cleaner code) */}
            {[
              { icon: Award, title: t.benefits_rewards_title, text: t.benefits_rewards_text },
              { icon: Wallet, title: t.benefits_wallet_title, text: t.benefits_wallet_text },
              { icon: History, title: t.benefits_history_title, text: t.benefits_history_text },
              { icon: Truck, title: t.benefits_delivery_title, text: t.benefits_delivery_text },
              { icon: Bell, title: t.benefits_news_title, text: t.benefits_news_text },
            ].map((benefit, index) => (
              <div key={index} className="bg-gray-800 p-6 rounded-xl shadow-lg transition-transform transform hover:scale-105">
                <benefit.icon className="text-amber-400 w-8 h-8 mb-4" />
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-400">{benefit.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Story Section */}
        <section id="story" className="bg-gray-800 py-16 lg:py-24">
          {/* Flex container: Stacks vertically on mobile (flex-col), side-by-side on tablet+ (md:flex-row) */}
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
            {/* Text Content */}
            <div className="md:w-1/2">
              <h2 className="text-3xl lg:text-4xl font-bold text-amber-400 mb-6">{t.story_title}</h2>
              <p className="text-gray-300 mb-4">{t.story_text_1}</p>
              <p className="text-gray-300">{t.story_text_2}</p>
            </div>
            {/* Image Content */}
            <div className="md:w-1/2 mt-8 md:mt-0">
              <img src="/images/sauce-man.png" alt="Saucer Burger Character" className="max-w-xs mx-auto md:max-w-sm" />
            </div>
          </div>
        </section>

        {/* Sauces Section */}
        <section id="sauces" className="container mx-auto px-4 py-16 lg:py-24">
          <h2 className="text-3xl lg:text-4xl font-bold text-center text-amber-400 mb-12 lg:mb-16">{t.sauces_title}</h2>
          {/* Responsive Grid: 2 columns on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Sauce Cards */}
            <div className="text-center">
              <img src="/images/special-sauce.png" alt="Saucer Special Sauce" className="mx-auto mb-4 h-24 w-24 object-contain transition-transform transform hover:scale-110" />
              <h3 className="text-lg font-semibold">{t.sauces_special}</h3>
            </div>
            <div className="text-center">
              <img src="/images/garlic-sauce.png" alt="Garlic Sauce" className="mx-auto mb-4 h-24 w-24 object-contain transition-transform transform hover:scale-110" />
              <h3 className="text-lg font-semibold">{t.sauces_garlic}</h3>
            </div>
            <div className="text-center">
              <img src="/images/bbq-sauce.png" alt="Barbecue Sauce" className="mx-auto mb-4 h-24 w-24 object-contain transition-transform transform hover:scale-110" />
              <h3 className="text-lg font-semibold">{t.sauces_bbq}</h3>
            </div>
            <div className="text-center">
              <img src="/images/chilli-sauce.png" alt="Hot Chili Sauce" className="mx-auto mb-4 h-24 w-24 object-contain transition-transform transform hover:scale-110" />
              <h3 className="text-lg font-semibold">{t.sauces_chili}</h3>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="bg-gray-800 py-12 mt-16 border-t border-gray-700">
        <div className="container mx-auto px-4">
          {/* Responsive Grid: 1 column on mobile, 3 on desktop. Centered text on mobile. */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
            
            {/* Column 1: Location/Hours */}
            <div>
              <h4 className="text-xl font-bold text-amber-400 mb-4">{t.footer_saucerBurger}</h4>
              <a href="https://maps.google.com/?cid=11266092328424134394&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQ" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white hover:underline mb-4 block">
                <p>{t.footer_address_line1}</p>
                <p>{t.footer_address_line2}</p>
              </a>
              <p className="text-gray-400"><strong>{t.footer_hours}</strong> 12:00 PM - 2:00 AM</p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-xl font-bold text-amber-400 mb-4">{t.footer_quickLinks}</h4>
              <div className="flex flex-col space-y-2">
                <a href="#" className="text-gray-400 hover:text-white hover:underline">{t.footer_home}</a>
                <Link to="/order" className="text-gray-400 hover:text-white hover:underline">{t.footer_fullMenu}</Link>
              </div>
            </div>

            {/* Column 3: Contact Us */}
            <div>
              <h4 className="text-xl font-bold text-amber-400 mb-4">{t.footer_contactUs}</h4>
              <p className="text-gray-400 mb-2"><strong>{t.footer_phone}</strong> +995 591 22 96 58</p>
              <p className="text-gray-400"><strong>{t.footer_email}</strong> saucerburger@gmail.com</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;