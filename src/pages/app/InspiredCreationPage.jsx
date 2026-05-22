import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@components/ui';
import { ROUTES } from '@config/routes';
import { useToast } from '@/contexts/ToastContext';
import { InspiredCreationWorkspace } from '@features/inspired-creation';

export default function InspiredCreationPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const handleGenerate = async ({ productFile, inspirationFile }) => {
    /* Generation wiring lands in a follow-up — UI collects both images
     * so dispatch can send inspiration as `images.example` + product as
     * `images.product`, same GCF shape as campaign-creative. */
    void productFile;
    void inspirationFile;
    toast.info('יצירה מהשראה — החיבור לשרת יתווסף בשלב הבא.');
  };

  return (
    <PageContainer>
      <div className="space-y-6 sm:space-y-8" dir="rtl">
        <header className="text-right space-y-2">
          <h1 className="text-[28px] sm:text-[32px] font-extrabold text-ink leading-tight">
            יצירת קריאייטיב מהשראה
          </h1>
          <p className="text-sm sm:text-base text-ink-muted max-w-3xl leading-relaxed">
            העלו כאן מודעה שאהבתם ותרצו לקחת ממנה השראה, ואנחנו נדאג להתאים לך
            מודעה באותו קונספט ורעיון.
          </p>
        </header>

        <InspiredCreationWorkspace
          onGenerate={handleGenerate}
          onBack={() => navigate(ROUTES.app.projects.list)}
        />
      </div>
    </PageContainer>
  );
}
