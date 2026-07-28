import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Image } from '@/components/ui/image';

export default function ImageLightbox({ images, index, onClose, onNavigate }) {
  if (index == null || !images.length) return null;
  const img = images[index];
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-800/80 text-slate-200 flex items-center justify-center hover:bg-slate-700"
      >
        <X className="w-5 h-5" />
      </button>
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(index - 1); }}
          className="absolute left-3 sm:left-6 w-10 h-10 rounded-full bg-slate-800/80 text-slate-200 flex items-center justify-center hover:bg-slate-700"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {index < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(index + 1); }}
          className="absolute right-3 sm:right-6 w-10 h-10 rounded-full bg-slate-800/80 text-slate-200 flex items-center justify-center hover:bg-slate-700"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
      <div className="h-[82vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <Image src={img.url} fittingType="fit" className="w-full h-full rounded-lg" />
        <p className="text-center text-slate-400 text-sm mt-2">
          {index + 1} / {images.length} · {img.name}
        </p>
      </div>
    </div>
  );
}