// src/pages/ShippingReturnPolicyPage.tsx
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header'; // <-- 1. IMPORT HEADER
import Footer from '../components/Footer'; // <-- 2. IMPORT FOOTER
import { useLanguage } from '../contexts/LanguageContext'; // <-- 3. IMPORT LANGUAGE HOOK

const ShippingReturnPolicyPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage(); // <-- 4. USE LANGUAGE HOOK

  const goBack = () => {
    navigate(-1); // <-- 5. SMART BACK BUTTON LOGIC
  };

  return (
    <>
      <Header /> {/* <-- 6. ADD HEADER */}
      <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">

          <div className="mb-8">
            <button onClick={goBack} className="text-sm text-gray-400 hover:text-amber-400 transition">&larr; {t.shipping_back_button}</button>
            <h1 className="text-4xl font-bold text-amber-400 mt-2">{t.shipping_title}</h1>
            <p className="text-gray-400">{t.shipping_last_updated}</p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none space-y-8">

            {/* --- SHIPPING POLICY --- */}
            <h2 className="text-3xl font-semibold text-amber-400 border-b border-gray-700 pb-2">{t.shipping_h_main_1}</h2>

            <h3 className="text-2xl font-semibold text-gray-200">{t.shipping_h_1_1}</h3>
            <p dangerouslySetInnerHTML={{ __html: t.shipping_p_1_1 }} />

            <h3 className="text-2xl font-semibold text-gray-200">{t.shipping_h_1_2}</h3>
            <p dangerouslySetInnerHTML={{ __html: t.shipping_p_1_2 }} />
            <ul className="list-disc pl-5 space-y-2">
              <li dangerouslySetInnerHTML={{ __html: t.shipping_li_1_1 }} />
              <li dangerouslySetInnerHTML={{ __html: t.shipping_li_1_2 }} />
            </ul>
            <p dangerouslySetInnerHTML={{ __html: t.shipping_p_1_3 }} />

            <h3 className="text-2xl font-semibold text-gray-200">{t.shipping_h_1_3}</h3>
            <p dangerouslySetInnerHTML={{ __html: t.shipping_p_1_4 }} />

            <h3 className="text-2xl font-semibold text-gray-200">{t.shipping_h_1_4}</h3>
            <p dangerouslySetInnerHTML={{ __html: t.shipping_p_1_5 }} />

            <h3 className="text-2xl font-semibold text-gray-200">{t.shipping_h_1_5}</h3>
            <p dangerouslySetInnerHTML={{ __html: t.shipping_p_1_6 }} />

            {/* --- RETURN POLICY --- */}
            <h2 className="text-3xl font-semibold text-amber-400 border-b border-gray-700 pb-2 mt-12">{t.shipping_h_main_2}</h2>

            <h3 className="text-2xl font-semibold text-gray-200">{t.shipping_h_2_1}</h3>
            <p dangerouslySetInnerHTML={{ __html: t.shipping_p_2_1 }} />

            <h3 className="text-2xl font-semibold text-gray-200">{t.shipping_h_2_2}</h3>
            <p dangerouslySetInnerHTML={{ __html: t.shipping_p_2_2 }} />

            <h3 className="text-2xl font-semibold text-gray-200">{t.shipping_h_2_3}</h3>
            <p dangerouslySetInnerHTML={{ __html: t.shipping_p_2_3 }} />
            <ul className="list-disc pl-5 space-y-2">
              <li dangerouslySetInnerHTML={{ __html: t.shipping_li_2_1 }} />
              <li dangerouslySetInnerHTML={{ __html: t.shipping_li_2_2 }} />
            </ul>

            <h3 className="text-2xl font-semibold text-red-400">{t.shipping_h_2_4}</h3>
            <p dangerouslySetInnerHTML={{ __html: t.shipping_p_2_4 }} />
            <p dangerouslySetInnerHTML={{ __html: t.shipping_p_2_5 }} />

          </div>
        </div>
      </div>
      <Footer /> {/* <-- 7. ADD FOOTER */}
    </>
  );
};

export default ShippingReturnPolicyPage;