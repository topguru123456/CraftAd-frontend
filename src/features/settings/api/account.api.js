import { supabase } from '@lib/supabase';

const STORAGE_BUCKET = 'brand-assets';
const ACCEPTED_TYPES = 'image/png,image/jpeg,image/jpg';

const ok = (data) => ({ data, error: null });
const fail = (message) => ({ data: null, error: { message } });

export const accountApi = {
  async uploadProfilePhoto(file) {
    if (!file) return fail('לא נבחר קובץ');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail('המשתמש אינו מחובר');

    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const path = `${user.id}/profile-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        contentType: file.type || undefined,
        upsert: true,
      });

    if (uploadError) {
      console.error('[accountApi.uploadProfilePhoto]', uploadError);
      return fail(uploadError.message);
    }

    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return ok({ url: urlData.publicUrl });
  },

  updateName(name) {
    return supabase.auth.updateUser({ data: { name: name.trim() } });
  },

  updateAvatarUrl(avatar_url) {
    return supabase.auth.updateUser({ data: { avatar_url } });
  },

  updateEmail(email) {
    return supabase.auth.updateUser({ email: email.trim() });
  },

  updatePassword(password) {
    return supabase.auth.updateUser({ password });
  },
};

export { ACCEPTED_TYPES };
