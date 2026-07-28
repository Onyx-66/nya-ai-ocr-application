import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useOverlayBack } from '@/lib/overlayHistory';

export default function ImageLightbox({ images, index, onClose, onNavigate }) {
  const open = index != null && images.length > 0;
  const { close } = useOverlayBack('lightbox', open, onClose);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;
  const img = images[index];
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={close}>
      <button onClick={close} className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
        <X className="w-5 h-5" />
      </button>
      {index > 0 && (
        <button onClick={(e) => { e.stopPropagation(); onNavigate(index - 1); }} className="absolute left-3 sm:left-6 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {index < images.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); onNavigate(index + 1); }} className="absolute right-3 sm:right-6 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
      <div className="h-[82vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <Image src={img.url} fittingType="fit" className="w-full h-full rounded-lg" />
        <p className="text-center text-slate-300 text-sm mt-2">{index + 1} / {images.length} · {img.name}</p>
      </div>
    </div>
  );
}