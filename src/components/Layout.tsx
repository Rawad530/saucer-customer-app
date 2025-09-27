// src/components/Layout.tsx
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />
      <main className="flex-grow">
        {/* Outlet renders the component matched by the current route */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;