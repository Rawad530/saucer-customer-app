// src/pages/LandingPage.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MenuItem } from '../types/order';
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const LandingPage = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    const fetchMenuItems = async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*');

      if (error) {
        console.error("Error fetching menu items:", error);
      } else if (data) {
        setMenuItems(data);
      }
    };
    fetchMenuItems();
  }, []);
  
  const chickenBurger = menuItems.find(i => i.name === 'Chicken Burger' && !i.is_combo);
  const chickenWrap = menuItems.find(i => i.name === 'Chicken Wrap' && !i.is_combo);
  const beefBurger = menuItems.find(i => i.name === 'Beef Burger' && !i.is_combo);
  const beefWrap = menuItems.find(i => i.name === 'Beef Wrap' && !i.is_combo);
  const chickenStrips = menuItems.find(i => i.name === 'Chicken Strips (6 Pieces)');
  const friesWrap = menuItems.find(i => i.name === 'Fries Wrap');
  
  const slides = [
    { item1: chickenBurger, item2: chickenWrap },
    { item1: beefBurger, item2: beefWrap },
    { item1: chickenStrips, item2: friesWrap },
  ];

  return (
    <div className="landing-page">
      <header className="landing-header">
        <img src="/images/logo.png" alt="Saucer Burger Logo" className="logo-img" />
        <nav className="landing-nav">
          <a href="#story">OUR STORY</a>
          <a href="#sauces">THE SAUCES</a>
        </nav>
        <Link to="/login" className="button">ORDER NOW</Link>
      </header>

      <main>
        <Carousel
          className="hero-carousel"
          plugins={[ Autoplay({ delay: 5000 }) ]}
          opts={{ loop: true }}
        >
          <CarouselContent>
            <CarouselItem>
              <div className="hero-slide-content hero-text-slide">
                <h1>More Sauce. Less Mess.</h1>
                <p>Your favorite burgers, your way. Choose a timeless Classic Bun or upgrade to the revolutionary <strong>Saucer Bun</strong> — perfectly sealed for zero drips. The future of flavor is in your hands.</p>
                <Link to="/login" className="button">ORDER ONLINE</Link>
              </div>
            </CarouselItem>
            
            {slides.map((slide, index) => (
              slide.item1 && slide.item2 && (
                <CarouselItem key={index}>
                  <div className="hero-slide-content hero-item-slide">
                    <div className="hero-item-card">
                      <img src={slide.item1.image_url} alt={slide.item1.name} />
                      <h3>{slide.item1.name}</h3>
                    </div>
                    <div className="hero-item-card">
                      <img src={slide.item2.image_url} alt={slide.item2.name} />
                      <h3>{slide.item2.name}</h3>
                    </div>
                  </div>
                </CarouselItem>
              )
            ))}
          </CarouselContent>
        </Carousel>

        {/* --- STORY SECTION RESTORED --- */}
        <section id="story" className="container story-section">
          <div className="text-content">
            <h2 className="section-title">The Future of Flavor is Here.</h2>
            <p>Ever wondered if you could enjoy a deliciously messy, sauce-filled burger without the actual mess? We did. Saucer Burger and Wrap was born from a simple mission: to revolutionize the way you eat. We've redesigned the burger into a unique, futuristic saucer shape, perfectly sealed at the edges. Our motto is "more sauce, less mess," allowing you to enjoy generous, authentic flavors on the go—in your car, on a walk, wherever your day takes you—without a single drip.</p>
            <p>But our innovation doesn't stop at convenience. We are committed to crafting every meal with fresh, high-quality ingredients and generous portions. By rethinking the burger, we also aim to create a more sustainable experience, reducing waste and paving the way for a tastier, cleaner future for generations to come. Welcome to Saucer Burger and Wrap, where convenience, flavor, and the future collide.</p>
          </div>
          <div className="image-content">
            <img src="/images/wrap-image.jpg" alt="Saucer Beef Wrap" />
          </div>
        </section>

        {/* --- SAUCES SECTION RESTORED --- */}
        <section id="sauces" className="container sauce-section">
          <h2 className="section-title">The Sauces Behind the Saucer.</h2>
          <div className="sauce-grid">
            <div className="sauce-card">
              <img src="/images/special-sauce.jpg" alt="Saucer Special Sauce" />
              <h3>Special Saucer Sauce</h3>
            </div>
            <div className="sauce-card">
              <img src="/images/garlic-sauce.jpg" alt="Garlic Sauce" />
              <h3>Garlic Sauce</h3>
            </div>
            <div className="sauce-card">
              <img src="/images/bbq-sauce.jpg" alt="Barbecue Sauce" />
              <h3>Barbecue Sauce</h3>
            </div>
            <div className="sauce-card">
              <img src="/images/chili-sauce.jpg" alt="Hot Chili Sauce" />
              <h3>Hot Chili Sauce</h3>
            </div>
          </div>
        </section>
      </main>

      {/* --- FOOTER SECTION RESTORED --- */}
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