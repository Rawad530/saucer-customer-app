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
  
  // Find the specific items for our slides
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
        {/* --- THIS ENTIRE HERO SECTION IS REPLACED WITH THE CAROUSEL --- */}
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

        <section id="story" className="container story-section">
          { /* ... your existing story section ... */ }
        </section>

        <section id="sauces" className="container sauce-section">
          { /* ... your existing sauces section ... */ }
        </section>
      </main>

      <footer className="landing-footer">
        { /* ... your existing footer ... */ }
      </footer>
    </div>
  );
};

export default LandingPage;