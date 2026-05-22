import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Gallery } from 'iconsax-react';
import { PageContainer } from '@components/ui';
import { cn } from '@lib/cn';
import { ROUTES } from '@config/routes';
import { creativeGenerationsApi } from '@features/projects/flows/campaign-creative/api/creative-generations.api';
import { useVariantFailureToasts } from '@features/projects/hooks/useGenerationFailureToasts';
import { useVariantSync } from '@features/projects/hooks/useVariantSync';
import { useToast } from '@/contexts/ToastContext';
import EditIcon from '@assets/icons/edit.svg';

const MAX_PROMPT_LEN = 500;

export default function CreativeEditPage() {
  const { projectId, variantId } = useParams();
  const navigate = useNavigate();

  const toast = useToast();
  const {
    variant,
    loading,
    error: loadError,
    mergeVariant,
    refetchSilent,
  } = useVariantSync({ mode: 'row', variantId });

  useVariantFailureToasts(variant, { enabled: !loading });

  const [prompt, setPrompt] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const prevEditStatusRef = useRef(null);

  const editStatus = variant?.editStatus ?? null;
  const editImageUrl = variant?.editImageUrl ?? null;
  const editErrorMessage = variant?.editErrorMessage ?? null;
  const isDispatching = editStatus === 'pending' || editStatus === 'dispatched';
  const isEditInFlight = isDispatching || applying;
  const hasReadyEdit = editStatus === 'ready' && !!editImageUrl;
  const hasFailedEdit = editStatus === 'failed' && !isEditInFlight;

  /* Clear local "applying" only when edit leaves pending/dispatched —
   * not when status is still "failed" from a prior attempt (that was
   * resetting applying immediately and blocking the loading UI). */
  useEffect(() => {
    const prev = prevEditStatusRef.current;
    prevEditStatusRef.current = editStatus;
    if (!applying) return;
    const wasInFlight =
      prev === 'pending' || prev === 'dispatched';
    if (
      wasInFlight &&
      (editStatus === 'ready' || editStatus === 'failed')
    ) {
      setApplying(false);
    }
  }, [applying, editStatus]);

  const handleApply = useCallback(async () => {
    if (!variantId) return;
    const trimmed = prompt.trim();
    if (!trimmed) return;
    if (applying || isDispatching) return;

    setApplying(true);
    setApplyError(null);
    mergeVariant({
      editStatus: 'pending',
      editPrompt: trimmed,
      editImageUrl: null,
      editErrorMessage: null,
    });

    const { error } = await creativeGenerationsApi.dispatchEdit({
      variantId,
      prompt: trimmed,
    });

    if (error) {
      const msg = error.message ?? 'העריכה נכשלה';
      mergeVariant({
        editStatus: 'failed',
        editErrorMessage: msg,
        editImageUrl: null,
      });
      setApplying(false);
      setApplyError(msg);
      toast.warning(msg, {
        description: 'הבקשה לא יצאה לדרך — ניתן לנסות שוב.',
      });
      return;
    }

    mergeVariant({
      editStatus: 'dispatched',
      editPrompt: trimmed,
      editImageUrl: null,
      editErrorMessage: null,
    });
    refetchSilent();
  }, [variantId, prompt, applying, isDispatching, mergeVariant, refetchSilent, toast]);

  const handleSave = useCallback(async () => {
    if (!variantId || !hasReadyEdit || saving) return;
    setSaving(true);
    setSaveError(null);
    const { error } = await creativeGenerationsApi.commitEdit({ variantId });
    if (error) {
      setSaving(false);
      setSaveError(error.message ?? 'שמירה נכשלה');
      return;
    }
    navigate(ROUTES.app.projects.detail(projectId));
  }, [variantId, hasReadyEdit, saving, navigate, projectId]);

  const handleBack = useCallback(() => {
    navigate(ROUTES.app.projects.detail(projectId));
  }, [navigate, projectId]);

  const loadErrorMessage = loadError?.message ?? null;

  return (
    <PageContainer>
      <div className="space-y-6" dir="rtl">
        {loading && <LoadingState />}

        {!loading && loadErrorMessage && (
          <div className="rounded-card border border-line bg-white p-12 text-center">
            <p className="text-base text-danger mb-3">{loadErrorMessage}</p>
            <button
              type="button"
              onClick={handleBack}
              className="btn-outline inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold"
            >
              חזרה לפרויקט
            </button>
          </div>
        )}

        {!loading && !loadErrorMessage && variant && (
          <>
            <PanelHeader />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OriginalPanel imageUrl={variant.imageUrl} />
              <EditPanel
                editImageUrl={editImageUrl}
                isDispatching={isEditInFlight}
                hasFailedEdit={hasFailedEdit}
                editErrorMessage={editErrorMessage}
              />
            </div>

            <PromptArea
              prompt={prompt}
              onPromptChange={setPrompt}
              onApply={handleApply}
              onSave={handleSave}
              onBack={handleBack}
              applying={isEditInFlight}
              saving={saving}
              canSave={hasReadyEdit}
              applyError={applyError}
              saveError={saveError}
            />
          </>
        )}
      </div>
    </PageContainer>
  );
}

function PanelHeader() {
  return (
    <div className="flex items-center justify-between px-1 text-sm font-bold text-ink" dir="rtl">
      <span className="inline-flex items-center gap-1.5">
        <Gallery size="18" variant="Linear" color="currentColor" />
        <span>מקורי</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <img src={EditIcon} alt="" className="w-[18px] h-[18px]" />
        <span>נערך</span>
      </span>
    </div>
  );
}

function OriginalPanel({ imageUrl }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-muted/30 overflow-hidden aspect-square">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="הקריאייטיב המקורי"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-ink-muted text-sm">
          אין תמונה
        </div>
      )}
    </div>
  );
}

function EditPanel({ editImageUrl, isDispatching, hasFailedEdit, editErrorMessage }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-brand-300 bg-surface-muted/30 overflow-hidden aspect-square">
      {isDispatching ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-center gap-3 px-6">
          <span
            aria-hidden="true"
            className="h-10 w-10 rounded-full border-[3px] border-brand-100 border-t-brand-500 animate-spin"
          />
          <p className="text-sm text-ink-muted">ה-AI עובד...</p>
        </div>
      ) : editImageUrl ? (
        <img
          src={editImageUrl}
          alt="הקריאייטיב הערוך"
          className="w-full h-full object-cover"
        />
      ) : hasFailedEdit ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-center gap-2 px-6">
          <p className="text-sm text-danger font-bold">העריכה נכשלה</p>
          {editErrorMessage && (
            <p className="text-xs text-ink-muted line-clamp-3">{editErrorMessage}</p>
          )}
        </div>
      ) : (
        <EditPlaceholder />
      )}
    </div>
  );
}

function EditPlaceholder() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center gap-3 px-6">
      <img src={EditIcon} alt="" className="w-10 h-10" />
      <p className="text-base font-bold text-ink">התמונה הערוכה תופיע כאן</p>
      <p className="text-xs text-ink-muted">
        תאר את השינויים ולחץ על &quot;בצע שינויים&quot;
      </p>
    </div>
  );
}

function PromptArea({
  prompt,
  onPromptChange,
  onApply,
  onSave,
  onBack,
  applying,
  saving,
  canSave,
  applyError,
  saveError,
}) {
  const canApply = prompt.trim().length > 0 && !applying && !saving;
  const remaining = MAX_PROMPT_LEN - prompt.length;

  return (
    <div className="space-y-3" dir="rtl">
      <label htmlFor="edit-prompt" className="block text-sm font-bold text-ink">
        תאר את השינויים שאתה רוצה לעשות
      </label>

      <div className="relative">
        <textarea
          id="edit-prompt"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value.slice(0, MAX_PROMPT_LEN))}
          rows={4}
          maxLength={MAX_PROMPT_LEN}
          dir="rtl"
          placeholder="לדוגמה: הוסף קולאז' של פרחים ברקע, הגדל את הכותרת..."
          className={cn(
            'w-full rounded-2xl border border-line bg-white px-4 py-3',
            'text-sm text-ink placeholder:text-ink-muted/70',
            'focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent',
            'resize-none'
          )}
        />
        <span className="absolute bottom-2 start-3 text-xs text-ink-muted">
          {remaining}
        </span>
      </div>

      {(applyError || saveError) && (
        <p className="text-sm text-danger">{applyError ?? saveError}</p>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave || saving}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5',
            'text-sm font-bold border transition-colors',
            canSave && !saving
              ? 'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100'
              : 'border-line bg-surface-muted text-ink-muted cursor-not-allowed'
          )}
        >
          {saving ? (
            <span
              aria-hidden="true"
              className="h-4 w-4 rounded-full border-[3px] border-brand-200 border-t-brand-500 animate-spin"
            />
          ) : null}
          <span>{saving ? 'שומר...' : 'שמר שינויים'}</span>
        </button>

        <button
          type="button"
          onClick={onApply}
          disabled={!canApply}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5',
            'text-sm font-bold text-white shadow-brand transition-opacity',
            canApply ? 'bg-brand-gradient hover:opacity-95' : 'bg-brand-gradient opacity-60 cursor-not-allowed'
          )}
        >
          {applying ? (
            <span
              aria-hidden="true"
              className="h-4 w-4 rounded-full border-[3px] border-white/40 border-t-white animate-spin"
            />
          ) : (
            // Edit icon (filtered to white so it reads on the gradient).
            <img
              src={EditIcon}
              alt=""
              className="w-4 h-4 brightness-0 invert"
            />
          )}
          <span>{applying ? 'מעבד...' : 'בצע שינויים'}</span>
        </button>

        <div className="grow" />

        <button
          type="button"
          onClick={onBack}
          aria-label="חזרה לפרויקט"
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-xl',
            'border border-line text-ink-muted bg-white',
            'hover:text-brand-500 hover:border-brand-300 transition-colors'
          )}
        >
          <ArrowRight size="18" variant="Linear" color="currentColor" />
        </button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="aspect-square rounded-2xl bg-surface-muted animate-pulse" />
        <div className="aspect-square rounded-2xl bg-surface-muted animate-pulse" />
      </div>
      <div className="h-24 rounded-2xl bg-surface-muted animate-pulse" />
    </div>
  );
}
