import { useState } from 'react';
import { MagicStar } from 'iconsax-react';
import AiStarIcon from '@assets/icons/sidebar/stars_selected.svg';
import {
  BackButton,
  WizardActions,
  WizardStepper,
} from '@components/ui';
import { useActiveBrand } from '@/contexts/BrandsContext';
import {
  STEP_IDS,
  WIZARD_STEPS,
  useCampaignCreative,
} from '../context/CampaignCreativeContext';
import { creativeImagesApi } from '../api/creative-images.api';
import { PexelsPickerModal } from '../components/PexelsPickerModal';
import { AiGenerateModal } from '../components/AiGenerateModal';
import {
  ImageSourceCard,
  ImageSourcePreview,
} from '@features/projects/flows/shared';

/** Final wizard step — product image in Storage (`draft.images[0]`); required to submit. */
export function ImagesStep() {
  const { draft, updateDraft, back, submit, isSubmitting, submitError } = useCampaignCreative();
  const { activeBrand } = useActiveBrand();

  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'error'
  const [uploadError, setUploadError] = useState(null);
  const [pexelsOpen, setPexelsOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const currentImage = draft.images?.[0] ?? null;
  const canSubmit =
    !isSubmitting &&
    uploadStatus !== 'uploading' &&
    Boolean(currentImage?.url) &&
    Boolean(activeBrand?.id);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await submit({ brandId: activeBrand.id });
  };

  const adoptImage = async (entry) => {
    const previous = currentImage;
    updateDraft({ images: [entry] });
    if (previous?.url && previous.url !== entry.url) {
      creativeImagesApi.deleteCampaignUpload(previous.url).catch(() => {});
    }
  };

  const removeImage = async () => {
    const previous = currentImage;
    updateDraft({ images: [] });
    if (previous?.url) {
      creativeImagesApi.deleteCampaignUpload(previous.url).catch(() => {});
    }
  };

  const handleDeviceFiles = async (event) => {
    const list = Array.from(event.target.files ?? []).filter((f) =>
      f.type?.startsWith('image/')
    );
    event.target.value = ''; // re-pick same file should still fire
    const file = list[0];
    if (!file) return;

    setUploadStatus('uploading');
    setUploadError(null);
    const { data, error } = await creativeImagesApi.uploadDeviceImage(file);
    if (error) {
      setUploadStatus('error');
      setUploadError(error.message ?? 'ההעלאה נכשלה. נסו שוב.');
      return;
    }
    await adoptImage({ url: data.url, path: data.path, source: 'device' });
    setUploadStatus('idle');
  };

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8 pb-12">
      <Header onBack={back} />

      <section className="bg-white border border-line rounded-3xl shadow-soft p-5 sm:p-7 lg:p-8 space-y-6 sm:space-y-7">
        <div className="flex justify-center">
          <WizardStepper steps={WIZARD_STEPS} currentStepId={STEP_IDS.images} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ImageSourceCard
            uploadStatus={uploadStatus}
            uploadError={uploadError}
            onDeviceFiles={handleDeviceFiles}
            onOpenPexels={() => setPexelsOpen(true)}
            onOpenAi={() => setAiOpen(true)}
            disabled={isSubmitting || uploadStatus === 'uploading'}
          />
          <ImageSourcePreview
            image={currentImage}
            onRemove={removeImage}
            disabled={isSubmitting}
          />
        </div>

        {submitError && (
          <p className="text-sm text-danger text-right">
            {submitError.message ?? 'יצירת הקריאייטיב נכשלה. נסו שוב.'}
          </p>
        )}

        <WizardActions
          onBack={back}
          onNext={handleSubmit}
          canContinue={canSubmit}
          isSubmitting={isSubmitting}
          nextLabel={
            <span className="inline-flex items-center gap-2">
              <MagicStar size="20" variant="Bold" color="currentColor" />
              <span>תג׳נרט לי תוכן</span>
            </span>
          }
        />
      </section>

      <PexelsPickerModal
        open={pexelsOpen}
        onClose={() => setPexelsOpen(false)}
        onSelect={(picked) =>
          adoptImage({
            url: picked.url,
            path: picked.path,
            source: 'pexels',
            pexelsId: picked.pexelsId,
          })
        }
      />

      <AiGenerateModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onSelect={(picked) =>
          adoptImage({ url: picked.url, path: picked.path, source: 'ai' })
        }
      />
    </div>
  );
}

function Header({ onBack }) {
  return (
    <header className="relative space-y-2 text-center">
      {onBack && <BackButton floating onClick={onBack} />}

      <div className="flex items-center justify-center gap-3">
        <h1 className="text-2xl sm:text-[28px] font-extrabold text-ink leading-tight">
          תמונות
        </h1>
        <img src={AiStarIcon} alt="" aria-hidden="true" className="w-9 h-9 shrink-0" />
      </div>
      <p className="text-sm sm:text-base text-ink-muted max-w-3xl mx-auto">
        בחרו תמונה שתשמש את הקריאייטיב — מהמכשיר, ממאגר התמונות, או דרך יצירה עם AI.
      </p>
    </header>
  );
}

