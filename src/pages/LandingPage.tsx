// src/pages/LandingPage.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Award, Wallet, History, Truck, Bell, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext'; // <-- ADD THIS IMPORT

const LandingPage = () => {
  const [isRestaurantOpen, setIsRestaurantOpen] = useState<boolean | null>(null);
  const { language, setLanguage, t } = useLanguage(); // <-- ADD THIS LINE to get translation functions

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

  const OrderButton = () => {
    if (isRestaurantOpen === null) {
      return <button className="button" disabled>{t.hero_orderButton_checking}</button>;
    }
    if (isRestaurantOpen) {
      return <Link to="/order" className="button">{t.hero_orderButton_active}</Link>;
    }
    return (
      <div className="text-center">
        <button className="button" disabled style={{ backgroundColor: '#9CA3AF', cursor: 'not-allowed' }}>
          {t.hero_orderButton_active}
        </button>
        <p className="text-sm font-semibold text-red-500 mt-2">
          {t.hero_orderButton_closed}
        </p>
      </div>
    );
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <img src="/images/logo.png" alt="Saucer Burger Logo" className="logo-img" />
        <nav className="landing-nav">
          <a href="#story">{t.nav_story}</a>
          <a href="#benefits">{t.nav_benefits}</a>
          <a href="#sauces">{t.nav_sauces}</a>
        </nav>
        {/* --- LANGUAGE SWITCHER BUTTONS --- */}
        <div className="language-switcher" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => setLanguage('en')} style={{ background: language === 'en' ? '#f59e0b' : 'transparent', border: '1px solid #f59e0b', color: 'white', padding: '5px 10px', cursor: 'pointer', borderRadius: '5px' }}>EN</button>
          <button onClick={() => setLanguage('ka')} style={{ background: language === 'ka' ? '#f59e0b' : 'transparent', border: '1px solid #f59e0b', color: 'white', padding: '5px 10px', cursor: 'pointer', borderRadius: '5px' }}>GE</button>
        </div>
        <Link to="/login" className="button">{t.nav_signIn}</Link>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <h1>{t.hero_title}</h1>
            <p>{t.hero_subtitle}</p>
            <OrderButton />
          </div>
        </section>

        <div className="divider-text-container">
          <div className="divider-text">{t.divider_or}</div>
        </div>

        <section id="benefits" className="container benefits-section">
          <h2 className="section-title">{t.benefits_title}</h2>
          <p className="section-subtitle">{t.benefits_subtitle}</p>
          <div className="benefits-grid">
            <Link to="/register" className="benefit-card-cta">
              <h3>{t.benefits_createAccount_title}</h3>
              <ArrowRight className="cta-arrow" />
            </Link>
            <div className="benefit-card">
              <Award className="benefit-icon" />
              <h3>{t.benefits_rewards_title}</h3>
              <p>{t.benefits_rewards_text}</p>
            </div>
            <div className="benefit-card">
              <Wallet className="benefit-icon" />
              <h3>{t.benefits_wallet_title}</h3>
              <p>{t.benefits_wallet_text}</p>
            </div>
            <div className="benefit-card">
              <History className="benefit-icon" />
              <h3>{t.benefits_history_title}</h3>
              <p>{t.benefits_history_text}</p>
            </div>
            <div className="benefit-card">
              <Truck className="benefit-icon" />
              <h3>{t.benefits_delivery_title}</h3>
              <p>{t.benefits_delivery_text}</p>
            </div>
            <div className="benefit-card">
              <Bell className="benefit-icon" />
              <h3>{t.benefits_news_title}</h3>
              <p>{t.benefits_news_text}</p>
            </div>
          </div>
        </section>

        <section id="story" className="container story-section">
          <div className="text-content">
            <h2 className="section-title">{t.story_title}</h2>
            <p>{t.story_text_1}</p>
            <p>{t.story_text_2}</p>
          </div>
          <div className="image-content">
            <img src="/images/sauce-man.png" alt="Saucer Burger Character" />
          </div>
        </section>

        <section id="sauces" className="container sauce-section">
          <h2 className="section-title">{t.sauces_title}</h2>
          <div className="sauce-grid">
            <div className="sauce-card">
              <img src="/images/special-sauce.png" alt="Saucer Special Sauce" />
              <h3>{t.sauces_special}</h3>
            </div>
            <div className="sauce-card">
              <img src="/images/garlic-sauce.png" alt="Garlic Sauce" />
              <h3>{t.sauces_garlic}</h3>
            </div>
            <div className="sauce-card">
              <img src="/images/bbq-sauce.png" alt="Barbecue Sauce" />
              <h3>{t.sauces_bbq}</h3>
            </div>
            <div className="sauce-card">
              <img src="/images/chilli-sauce.png" alt="Hot Chili Sauce" />
              <h3>{t.sauces_chili}</h3>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-grid">
          <div>
            <h4>{t.footer_saucerBurger}</h4>
            <a href="https://maps.google.com/?cid=11266092328424134394&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQ" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white hover:underline">
              <p>{t.footer_address_line1}</p>
              <p>{t.footer_address_line2}</p>
            </a>
            <p><strong>{t.footer_hours}</strong> 12:00 PM - 2:00 AM</p>
          </div>
          <div>
            <h4>{t.footer_quickLinks}</h4>
            <a href="#">{t.footer_home}</a>
            <Link to="/order">{t.footer_fullMenu}</Link>
          </div>
          <div>
            <h4>{t.footer_contactUs}</h4>
            <p>{t.footer_phone} +995 591 22 96 58</p>
            <p>{t.footer_email} saucerburger@gmail.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;