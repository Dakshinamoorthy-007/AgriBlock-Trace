import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ScanLine, 
  Sprout, 
  Truck, 
  ShieldCheck, 
  Users, 
  ArrowRight,
  QrCode,
  Link as LinkIcon,
  Shield
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, translations } from '@/lib/translations';
import IconButton from '@/components/common/IconButton';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const features = [
    {
      icon: Sprout,
      titleEn: 'Farm Registration',
      titleTa: 'பண்ணை பதிவு',
      descEn: 'Farmers register batches with complete harvest details',
      descTa: 'விவசாயிகள் முழுமையான அறுவடை விவரங்களுடன் தொகுதிகளை பதிவு செய்கின்றனர்',
    },
    {
      icon: LinkIcon,
      titleEn: 'Blockchain Tracking',
      titleTa: 'பிளாக்செயின் கண்காணிப்பு',
      descEn: 'Every transaction is recorded on Ethereum blockchain',
      descTa: 'ஒவ்வொரு பரிவர்த்தனையும் எத்தீரியம் பிளாக்செயினில் பதிவு செய்யப்படுகிறது',
    },
    {
      icon: Truck,
      titleEn: 'Supply Chain',
      titleTa: 'விநியோக சங்கிலி',
      descEn: 'Track movement through middlemen with full transparency',
      descTa: 'முழு வெளிப்படைத்தன்மையுடன் இடைத்தரகர்கள் மூலம் இயக்கத்தை கண்காணிக்கவும்',
    },
    {
      icon: ShieldCheck,
      titleEn: 'Verification',
      titleTa: 'சரிபார்ப்பு',
      descEn: 'Consumers verify authenticity via QR code scan',
      descTa: 'நுகர்வோர் QR குறியீடு ஸ்கேன் மூலம் நம்பகத்தன்மையை சரிபார்க்கின்றனர்',
    },
  ];

  const stats = [
    { value: '50K+', labelEn: 'Batches Tracked', labelTa: 'கண்காணிக்கப்பட்ட தொகுதிகள்' },
    { value: '12K+', labelEn: 'Registered Farmers', labelTa: 'பதிவு செய்யப்பட்ட விவசாயிகள்' },
    { value: '99.9%', labelEn: 'Verification Rate', labelTa: 'சரிபார்ப்பு விகிதம்' },
    { value: '8', labelEn: 'States Covered', labelTa: 'மாநிலங்கள் உள்ளடங்கியது' },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary opacity-95" />
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center text-primary-foreground">
            {/* Emblem */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20">
                <Shield className="h-10 w-10" />
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              {t('heroTitle', language)}
            </h1>
            <p className="text-lg md:text-xl mb-2 text-primary-foreground/90 font-tamil">
              {translations.heroTitle.ta}
            </p>
            <p className="text-lg md:text-xl mb-8 text-primary-foreground/80 max-w-2xl mx-auto">
              {t('heroSubtitle', language)}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="hero"
                size="xl"
                onClick={() => navigate('/trace')}
                className="group"
              >
                <ScanLine className="h-5 w-5" />
                {t('traceProduct', language)}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="xl"
                onClick={() => navigate('/login')}
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                <Users className="h-5 w-5" />
                {t('getStarted', language)}
              </Button>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              fill="hsl(var(--background))"
            />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center p-6 rounded-2xl bg-card border border-border shadow-card"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'en' ? stat.labelEn : stat.labelTa}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              {language === 'en' ? 'How It Works' : 'இது எப்படி வேலை செய்கிறது'}
            </h2>
            <p className="text-muted-foreground text-lg">
              {language === 'en' 
                ? 'Simple, secure, and transparent food traceability'
                : 'எளிய, பாதுகாப்பான மற்றும் வெளிப்படையான உணவு கண்காணிப்பு'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="card-govt p-6 text-center hover:shadow-elevated transition-shadow duration-300"
                >
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary mb-4">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {language === 'en' ? feature.titleEn : feature.titleTa}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? feature.descEn : feature.descTa}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Role Selection Preview */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              {language === 'en' ? 'Choose Your Role' : 'உங்கள் பாத்திரத்தை தேர்வு செய்யவும்'}
            </h2>
            <p className="text-muted-foreground text-lg">
              {language === 'en' 
                ? 'Get started based on your role in the supply chain'
                : 'விநியோக சங்கிலியில் உங்கள் பங்கின் அடிப்படையில் தொடங்குங்கள்'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <IconButton
              icon={Sprout}
              labelEn="Farmer"
              labelTa="விவசாயி"
              onClick={() => navigate('/login?role=farmer')}
              variant="primary"
              size="lg"
              className="w-full"
            />
            <IconButton
              icon={Truck}
              labelEn="Middleman"
              labelTa="இடைத்தரகர்"
              onClick={() => navigate('/login?role=middleman')}
              variant="secondary"
              size="lg"
              className="w-full"
            />
            <IconButton
              icon={QrCode}
              labelEn="Consumer"
              labelTa="நுகர்வோர்"
              onClick={() => navigate('/trace')}
              variant="outline"
              size="lg"
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Quick Trace CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <QrCode className="h-16 w-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {language === 'en' ? 'Have a Batch Code?' : 'தொகுதி குறியீடு உள்ளதா?'}
          </h2>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
            {language === 'en'
              ? 'Scan the QR code on your product or enter the batch code to trace its complete journey'
              : 'உங்கள் தயாரிப்பில் உள்ள QR குறியீட்டை ஸ்கேன் செய்யவும் அல்லது அதன் முழுப் பயணத்தையும் கண்காணிக்க தொகுதி குறியீட்டை உள்ளிடவும்'}
          </p>
          <Button
            variant="hero"
            size="xl"
            onClick={() => navigate('/trace')}
          >
            <ScanLine className="h-5 w-5" />
            {t('traceProduct', language)}
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
