// src/pages/LandingPage.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Award, Wallet, History, Truck, Bell, ArrowRight } from 'lucide-react';
// REMOVED: No longer need the GuestOrderDialog here as it's moved to the OrderPage

const LandingPage = () => {
  const [isRestaurantOpen, setIsRestaurantOpen] = useState<boolean | null>(null);
  // REMOVED: The state for the dialog is no longer needed on this page

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

  // MODIFIED: This component is now much simpler
  const OrderButton = () => {
    if (isRestaurantOpen === null) {
      return <button className="button" disabled>Checking Hours...</button>;
    }
    if (isRestaurantOpen) {
      // This is now a <Link> that goes directly to the order page
      return <Link to="/order" className="button">View Menu & Order as a Guest</Link>;
    }
    return (
      <div className="text-center">
        <button className="button" disabled style={{ backgroundColor: '#9CA3AF', cursor: 'not-allowed' }}>
          View Menu & Order as a Guest
        </button>
        <p className="text-sm font-semibold text-red-500 mt-2">
          We're currently closed for online orders.
        </p>
      </div>
    );
  };

  return (
    // REMOVED: The outer <> fragment and the GuestOrderDialog component call
    <div className="landing-page">
      <header className="landing-header">
        <img src="/images/logo.png" alt="Saucer Burger Logo" className="logo-img" />
        <nav className="landing-nav">
          <a href="#story">OUR STORY</a>
          <a href="#benefits">BENEFITS</a>
          <a href="#sauces">THE SAUCES</a>
        </nav>
        <Link to="/login" className="button">Sign In</Link>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <h1>More Sauce. Less Mess.</h1>
            <p>Your favorite burgers, your way. Choose a timeless Classic Bun or upgrade to the revolutionary <strong>Saucer Bun</strong> — perfectly sealed for zero drips. The future of flavor is in your hands.</p>
            <OrderButton />
          </div>
        </section>

        <div className="divider-text-container">
          <div className="divider-text">OR</div>
        </div>

        <section id="benefits" className="container benefits-section">
          <h2 className="section-title">Unlock Exclusive Benefits</h2>
          <p className="section-subtitle">Create an account to get the full Saucer experience.</p>
          <div className="benefits-grid">
            <Link to="/register" className="benefit-card-cta">
              <h3>Create an Account</h3>
              <ArrowRight className="cta-arrow" />
            </Link>
            <div className="benefit-card">
              <Award className="benefit-icon" />
              <h3>Loyalty & Rewards</h3>
              <p>Earn royalty points (points) for your purchases and redeem them for free food and drinks.</p>
            </div>
            <div className="benefit-card">
              <Wallet className="benefit-icon" />
              <h3>Wallet & Cashback</h3>
              <p>Get 5% cashback on dine-in orders and pay for future meals with your secure wallet balance.</p>
            </div>
            <div className="benefit-card">
              <History className="benefit-icon" />
              <h3>Order History</h3>
              <p>Easily track your past orders and see your favorite, most-ordered items at a glance.</p>
            </div>
            <div className="benefit-card">
              <Truck className="benefit-icon" />
              <h3>Delivery Partners</h3>
              <p>Quickly access our official partners (Wolt, Bolt Food, Glovo) for delivery options.</p>
            </div>
            <div className="benefit-card">
              <Bell className="benefit-icon" />
              <h3>Latest News</h3>
              <p>Be the first to know about our newest menu items, special offers, and updates.</p>
            </div>
          </div>
        </section>

        <section id="story" className="container story-section">
          <div className="text-content">
            <h2 className="section-title">The Future of Flavor is Here.</h2>
            <p>Ever wondered if you could enjoy a deliciously messy, sauce-filled burger without the actual mess? We did. Saucer Burger and Wrap was born from a simple mission: to revolutionize the way you eat. We've redesigned the burger into a unique, futuristic saucer shape, perfectly sealed at the edges. Our motto is "more sauce, less mess," allowing you to enjoy generous, authentic flavors on the go—in your car, on a walk, wherever your day takes you—without a single drip.</p>
            <p>But our innovation doesn't stop at convenience. We are committed to crafting every meal with fresh, high-quality ingredients and generous portions. By rethinking the burger, we also aim to create a more sustainable experience, reducing waste and paving the way for a tastier, cleaner future for generations to come. Welcome to Saucer Burger and Wrap, where convenience, flavor, and the future collide.</p>
          </div>
          <div className="image-content">
            <img src="/images/sauce-man.png" alt="Saucer Burger Character" />
          </div>
        </section>

        <section id="sauces" className="container sauce-section">
          <h2 className="section-title">The Sauces Behind the Saucer.</h2>
          <div className="sauce-grid">
            <div className="sauce-card">
              <img src="/images/special-sauce.png" alt="Saucer Special Sauce" />
              <h3>Special Saucer Sauce</h3>
            </div>
            <div className="sauce-card">
              <img src="/images/garlic-sauce.png" alt="Garlic Sauce" />
              <h3>Garlic Sauce</h3>
            </div>
            <div className="sauce-card">
              <img src="/images/bbq-sauce.png" alt="Barbecue Sauce" />
              <h3>Barbecue Sauce</h3>
            </div>
            <div className="sauce-card">
              <img src="/images/chilli-sauce.png" alt="Hot Chili Sauce" />
              <h3>Hot Chili Sauce</h3>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-grid">
          <div>
            <h4>Saucer Burger </h4>
            <a 
    href="https://maps.google.com/?cid=11266092328424134394&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQ" 
    target="_blank" 
    rel="noopener noreferrer" 
    className="text-gray-400 hover:text-white hover:underline"
  ></a>
            <p>45 Petre Kavtaradze St<br />Tbilisi, Georgia</p>
            <p><strong>Hours:</strong> 12:00 PM - 2:00 AM</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <a href="#">Home</a>
            <Link to="/order">Full Menu / Order</Link>
          </div>
          <div>
            <h4>Contact Us</h4>
            <p>Phone: +995 591 22 96 58</p>
            <p>Email: saucerburger@gmail.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;