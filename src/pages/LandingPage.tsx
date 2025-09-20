import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const LandingPage = () => {
  const [isRestaurantOpen, setIsRestaurantOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-restaurant-status');
        if (error) {
          throw error;
        }
        setIsRestaurantOpen(data.isOpen);
      } catch (error) {
        console.error("Error checking restaurant status:", error);
        // Default to closed if we can't verify
        setIsRestaurantOpen(false);
      }
    };
    checkStatus();
  }, []);

  const OrderButton = ({ to, text }: { to: string, text: string }) => {
    if (isRestaurantOpen === null) {
      return (
        <button className="button" disabled>
          Checking Hours...
        </button>
      );
    }

    if (isRestaurantOpen) {
      return (
        <Link to={to} className="button">
          {text}
        </Link>
      );
    }

    return (
      <div className="text-center">
        <button className="button" disabled style={{ backgroundColor: '#9CA3AF', cursor: 'not-allowed' }}>
          {text}
        </button>
        <p className="text-sm text-gray-400 mt-2">
          We're currently closed. Open daily 12:00 PM - 2:00 AM.
        </p>
      </div>
    );
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <img src="/images/logo.png" alt="Saucer Burger Logo" className="logo-img" />
        <nav className="landing-nav">
          <a href="#story">OUR STORY</a>
          <a href="#sauces">THE SAUCES</a>
        </nav>
        <OrderButton to="/login" text="ORDER NOW" />
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <h1>More Sauce. Less Mess.</h1>
            <p>Your favorite burgers, your way. Choose a timeless Classic Bun or upgrade to the revolutionary <strong>Saucer Bun</strong> — perfectly sealed for zero drips. The future of flavor is in your hands.</p>
            <OrderButton to="/login" text="ORDER ONLINE" />
          </div>
        </section>

        <section id="story" className="container story-section">
          <div className="text-content">
            <h2 className="section-title">The Future of Flavor is Here.</h2>
            <p>Ever wondered if you could enjoy a deliciously messy, sauce-filled burger without the actual mess? We did. Saucer Burger and Wrap was born from a simple mission: to revolutionize the way you eat. We've redesigned the burger into a unique, futuristic saucer shape, perfectly sealed at the edges. Our motto is "more sauce, less mess," allowing you to enjoy generous, authentic flavors on the go—in your car, on a walk, wherever your day takes you—without a single drip.</p>
            <p>But our innovation doesn't stop at convenience. We are committed to crafting every meal with fresh, high-quality ingredients and generous portions. By rethinking the burger, we also aim to create a more sustainable experience, reducing waste and paving the way for a tastier, cleaner future for generations to come. Welcome to Saucer Burger and Wrap, where convenience, flavor, and the future collide.</p>
          </div>
          <div className="image-content">
            <img src="/images/sauce-man.png" alt="Saucer Beef Wrap" />
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
            <h4>Saucer Burger & Wrap</h4>
            <p>45 Petre Kavtaradze St<br />Tbilisi, Georgia</p>
            <p><strong>Hours:</strong> 12:00 PM - 2:00 AM</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <a href="#">Home</a>
            <Link to="/login">Full Menu / Order</Link>
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
