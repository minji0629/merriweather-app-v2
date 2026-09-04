import { Analytics } from '@vercel/analytics/react';
import { AppProvider } from '@/store/AppProvider';
import { AuthProvider } from '@/store/AuthProvider';
import { useApp } from '@/store/useApp';
import { LandingPage } from '@/pages/LandingPage';
import { NicknamePage } from '@/pages/NicknamePage';
import { TransitionPage } from '@/pages/TransitionPage';
import { LuPage } from '@/pages/LuPage';
import { QuestionPage } from '@/pages/QuestionPage';
import { LoadingPage } from '@/pages/LoadingPage';
import { ResultPage } from '@/pages/ResultPage';
import { PremiumResultPage } from '@/pages/PremiumResultPage';
import { SharedResultPage } from '@/pages/SharedResultPage';
import { PaymentPage } from '@/pages/PaymentPage';
import { GiftPage } from '@/pages/GiftPage';
import { PaymentSuccessPage } from '@/pages/PaymentSuccessPage';
import { PaymentFailPage } from '@/pages/PaymentFailPage';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import { ArchivePage } from '@/pages/ArchivePage';
import { NoticePage } from '@/pages/NoticePage';
import { ContactPage } from '@/pages/ContactPage';
import { DeveloperNotePage } from '@/pages/DeveloperNotePage';
import { TravelPlazaPage } from '@/pages/TravelPlazaPage';
import  TermsPage   from '@/pages/TermsPage';
import  PrivacyPage  from '@/pages/PrivacyPage';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { LoginModal } from '@/components/LoginModal';
import { MarketingConsentModal } from '@/components/MarketingConsentModal';

function Router() {
  const { currentPage, sharedResultId } = useApp();

  switch (currentPage) {
    case 'landing':
      return <LandingPage />;
    case 'nickname':
      return <NicknamePage />;
    case 'transition':
      return <TransitionPage />;
    case 'lu':
      return <LuPage />;
    case 'question':
      return <QuestionPage />;
    case 'loading':
      return <LoadingPage />;
    case 'result':
      return <ResultPage />;
    case 'premium':
      return <PremiumResultPage />;
    case 'sharedResult':
      return sharedResultId ? <SharedResultPage resultId={sharedResultId} /> : <LandingPage />;
    case 'payment':
      return <PaymentPage />;
    case 'gift':
      return <GiftPage />;
    case 'paymentSuccess':
      return <PaymentSuccessPage />;
    case 'paymentFail':
      return <PaymentFailPage />;
    case 'authCallback':
      return <AuthCallbackPage />;
    case 'archive':
      return <ArchivePage />;
    case 'notice':
      return <NoticePage />;
    case 'contact':
      return <ContactPage />;
    case 'terms':
      return <TermsPage />;
    case 'privacy':
      return <PrivacyPage />;
    case 'developerNote':
      return <DeveloperNotePage />;
    case 'travelPlaza':
      return <TravelPlazaPage />;
    default:
      return <LandingPage />;
  }
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router />
        <HamburgerMenu />
        <LoginModal />
        <MarketingConsentModal />
        <Analytics />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
