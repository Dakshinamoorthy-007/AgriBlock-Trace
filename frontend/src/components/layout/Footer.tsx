import React from 'react';
import { Leaf, Shield, Link as LinkIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';

const Footer: React.FC = () => {
  const { language } = useLanguage();

  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10">
                <Leaf className="h-6 w-6" />
              </div>
              <div>
                <span className="text-lg font-bold">{t('appName', language)}</span>
                <p className="text-xs text-primary-foreground/70 font-tamil">
                  அக்ரிசெயின்
                </p>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/80">
              {language === 'en' 
                ? 'Blockchain-backed food traceability for transparent and secure agricultural supply chains.'
                : 'வெளிப்படையான மற்றும் பாதுகாப்பான விவசாய விநியோக சங்கிலிகளுக்கான பிளாக்செயின் ஆதரவு உணவு கண்காணிப்பு.'
              }
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h4 className="font-semibold flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              {language === 'en' ? 'Quick Links' : 'விரைவு இணைப்புகள்'}
            </h4>
            <nav className="flex flex-col gap-2 text-sm text-primary-foreground/80">
              <a href="/trace" className="hover:text-primary-foreground transition-colors">
                {t('traceProduct', language)}
              </a>
              <a href="/login" className="hover:text-primary-foreground transition-colors">
                {t('login', language)}
              </a>
              <a href="#" className="hover:text-primary-foreground transition-colors">
                {language === 'en' ? 'API Documentation' : 'API ஆவணங்கள்'}
              </a>
            </nav>
          </div>

          {/* Trust & Security */}
          <div className="flex flex-col gap-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {language === 'en' ? 'Trust & Security' : 'நம்பகத்தன்மை & பாதுகாப்பு'}
            </h4>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-foreground/10 text-xs">
                <Shield className="h-3 w-3" />
                {language === 'en' ? 'Blockchain Verified' : 'பிளாக்செயின் சரிபார்க்கப்பட்டது'}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-foreground/10 text-xs">
                SHA-256
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-foreground/10 text-xs">
                Ethereum
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/60">
          <p>
            © {new Date().getFullYear()} AgriChain. {language === 'en' ? 'All rights reserved.' : 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.'}
          </p>
          <p className="mt-1 text-xs">
            {t('governmentOf', language)}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
