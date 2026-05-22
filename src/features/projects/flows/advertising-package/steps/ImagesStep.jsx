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
  ImageSourceCard,
  ImageSourcePreview,
} from '@features/projects/flows/shared';
/* Cross-flow imports — both modules live under campaign-creative/
 * today but are flow-agnostic. The senior audit already flagged
 * `creative-images.api.js` as a should-fix-move-to-shared; the same
 * applies to PexelsPickerModal + AiGenerateModal now that this is
 * the second consumer. Tracked as a separate cleanup so this turn
 * stays focused on building step 3 — moving 4 files would balloon
 * the diff and touch campaign-creative's import surface again. */
import { creativeImagesApi } from '@features/projects/flows/campaign-creative/api/creative-images.api';
import { PexelsPickerModal } from '@features/projects/flows/campaign-creative/components/PexelsPickerModal';
import { AiGenerateModal } from '@features/projects/flows/campaign-creative/components/AiGenerateModal';
import {
  STEP_IDS,
  WIZARD_STEPS,
  useAdvertisingPackage,
} from '../context/AdvertisingPackageContext';

/* Step 3 (visible stepper, terminal) — תמונות.
 *
 * Identical surface to campaign-creative's ImagesStep: a 2-column
 * grid with the source-card on the right (DOM[0] in RTL) and the
 * preview on the left, three sources (AI / Pexels / device), and
 * the same image lifecycle (commit to Storage immediately, GC the
 * previous blob when the user re-picks or removes).
 *
 * On submit, the context fans out IN PARALLEL to both the image
 * dispatcher and the copywriting dispatcher (see the context's
 * `submit` doc-comment for the dual fan-out rationale + partial-
 * success policy). The wizard's job here ends at "click the gradient
 * button when an image is picked"; everything past that lives in
 * the provider. */
export function ImagesStep() {
  const { draft, updateDraft, back, submit, isSubmitting, submitError } =
    useAdvertisingPackage();
  const { activeBrand } = useActiveBrand();

  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'error'
  const [uploadError, setUploadError] = useState(null);
  const [pexelsOpen, setPexelsOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const currentImage = draft.images?.[0] ?? null;
  /* Same gating contract as campaign-creative: image required,
   * active brand required, no concurrent upload, no in-flight submit. */
  const canSubmit =
    !isSubmitting &&
    uploadStatus !== 'uploading' &&
    Boolean(currentImage?.url) &&
    Boolean(activeBrand?.id);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await submit({ brandId: activeBrand.id });
  };

  /* Replace draft.images with a single new entry and GC the previous
   * Storage object (if any). Source-tagged so the eventual project
   * record carries provenance. Same lifecycle as campaign-creative. */
  const adoptImage = async (entry) => {
    const previous = currentImage;
    updateDraft({ images: [entry] });
    if (previous?.url && previous.url !== entry.url) {
      /* Fire-and-forget — a failed delete leaves an orphan blob,
       * which is cosmetic and gets caught by the future cleanup job. */
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

  /* Device upload path. The hidden <input type=file> inside
   * ImageSourceCard fires this; we upload to Storage immediately
   * and replace the current image on success. */
  const handleDeviceFiles = async (event) => {
    const list = Array.from(event.target.files ?? []).filter((f) =>
      f.type?.startsWith('image/'),
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

        {/* Submit error inline — context's submit() sets this when the
          * project couldn't be created OR when BOTH image + copy
          * dispatches failed entirely (partial success doesn't
          * surface as an error; the detail page renders whichever
          * side landed). Mirrors campaign-creative's pattern so the
          * user can retry without losing their step state. */}
        {submitError && (
          <p className="text-sm text-danger text-right">
            {submitError.message ?? 'יצירת התוכן נכשלה. נסו שוב.'}
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
