import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Trash2, GripVertical, CheckCircle2, Loader2 } from 'lucide-react';

export default function ChapterImages({ images, perPage, onReorder, onRemove, onPreview }) {
  if (!images.length) return null;

  const onDragEnd = (res) => {
    if (!res.destination || res.destination.index === res.source.index) return;
    const next = Array.from(images);
    const [moved] = next.splice(res.source.index, 1);
    next.splice(res.destination.index, 0, moved);
    onReorder(next);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="chapter-images" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="grid grid-cols-3 sm:grid-cols-4 gap-2"
          >
            {images.map((img, i) => {
              const ps = perPage?.[i];
              const done = ps?.status === 'done';
              const run = ps?.status === 'running';
              return (
                <Draggable key={`${img.url}-${i}`} draggableId={`img-${i}`} index={i}>
                  {(p, s) => (
                    <div
                      ref={p.innerRef}
                      {...p.draggableProps}
                      className={`relative group rounded-lg overflow-hidden border aspect-square bg-[hsl(var(--c-bg))] ${
                        done ? 'border-emerald-500/60' : 'border-[hsl(var(--c-border))]'
                      } ${s.isDragging ? 'ring-2 ring-[hsl(var(--c-accent))] opacity-90' : ''}`}
                    >
                      <div
                        {...p.dragHandleProps}
                        className="absolute top-1 left-1 z-10 w-6 h-6 rounded bg-black/50 flex items-center justify-center cursor-grab text-white hover:bg-black/70"
                        title="Drag to reorder"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      <img
                        src={img.url}
                        alt={img.name}
                        onClick={() => onPreview(i)}
                        className="w-full h-full object-cover cursor-zoom-in"
                      />
                      {done && (
                        <div className="absolute top-1 right-1 z-10 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow" title="OCR done">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                      {run && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                        </div>
                      )}
                      {!done && !run && (
                        <button
                          onClick={() => onRemove(i)}
                          className="absolute top-1 right-1 z-10 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:text-rose-400"
                          title="Remove image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-white px-1 py-0.5 truncate flex items-center gap-1">
                        {done && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />}
                        {i + 1}. {img.name}
                      </span>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}