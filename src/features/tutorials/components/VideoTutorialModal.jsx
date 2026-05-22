import { Modal } from '@components/ui';

const VIMEO_VIDEO_URL = 'https://player.vimeo.com/video/1115814944?autoplay=1';

export function VideoTutorialModal({ open, onClose, src = VIMEO_VIDEO_URL, title = 'סרטון הדרכה' }) {
  return (
    <Modal open={open} onClose={onClose} size="xl" ariaLabel={title}>
      <div className="aspect-video bg-black">
        {open && (
          <iframe
            src={src}
            title={title}
            className="w-full h-full"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
          />
        )}
      </div>
    </Modal>
  );
}
