import { useNavigate } from 'react-router-dom';
import Header from '../components/Header'; // <-- 1. IMPORT HEADER
import Footer from '../components/Footer'; // <-- 2. IMPORT FOOTER
import { useLanguage } from '../contexts/LanguageContext'; // <-- 3. IMPORT LANGUAGE HOOK

const TermsOfUsePage = () => {
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
              {/* 7. REPLACED LINK WITH SMART BACK BUTTON */}
              <button onClick={goBack} className="text-sm text-gray-400 hover:text-amber-400 transition">&larr; {t.terms_back_button}</button>
              <h1 className="text-4xl font-bold text-amber-400 mt-2">{t.terms_title}</h1>
              <p className="text-gray-400">{t.terms_last_updated}</p>
          </div>

          {/* 8. ALL CONTENT IS NOW TRANSLATED */}
          <div className="prose prose-invert prose-lg max-w-none space-y-6">
              <p>
                {t.terms_p1}
              </p>

              <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">{t.terms_h1}</h2>
              <p>
                {t.terms_p2}
              </p>

              <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">{t.terms_h2}</h2>
              <p>
                {t.terms_p3}
              </p>

              <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">{t.terms_h3}</h2>
              <p>
                {t.terms_p4}
              </p>
              
              <h2 className="text-2xl font-semibold text-red-400 border-b border-gray-700 pb-2">{t.terms_h4}</h2>
              <p>
                {t.terms_p5}
              </p>
              <ul className="list-disc pl-5 space-y-2">
                  <li>
                    {t.terms_li1}
                  </li>
                  <li className="font-bold">
                    {t.terms_li2}
                  </li>
                  <li>
                    {t.terms_li3}
                  </li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">{t.terms_h5}</h2>
              <p>
                {t.terms_p6}
              </p>

              <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">{t.terms_h6}</h2>
              <p>
                {t.terms_p7}
              </p>
          </div>

        </div>
      </div>
      <Footer /> {/* <-- 9. ADD FOOTER */}
    </>
  );
};

export default TermsOfUsePage;
