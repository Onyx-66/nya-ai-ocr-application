import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Trash2, GripVertical } from 'lucide-react';

export default function ChapterImages({ images, onReorder, onRemove, onPreview }) {
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
            {images.map((img, i) => (
              <Draggable key={`${img.url}-${i}`} draggableId={`img-${i}`} index={i}>
                {(p, s) => (
                  <div
                    ref={p.innerRef}
                    {...p.draggableProps}
                    className={`relative group rounded-lg overflow-hidden border border-slate-800 aspect-square bg-slate-950 ${
                      s.isDragging ? 'ring-2 ring-indigo-500 opacity-90' : ''
                    }`}
                  >
                    <div
                      {...p.dragHandleProps}
                      className="absolute top-1 left-1 z-10 w-6 h-6 rounded bg-slate-950/80 flex items-center justify-center cursor-grab text-slate-300 hover:text-white"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                    <img
                      src={img.url}
                      alt={img.name}
                      onClick={() => onPreview(i)}
                      className="w-full h-full object-cover cursor-zoom-in pointer-events-auto"
                    />
                    <button
                      onClick={() => onRemove(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-950/80 text-slate-300 flex items-center justify-center hover:text-rose-400"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[10px] text-slate-300 px-1 py-0.5 truncate">
                      {i + 1}. {img.name}
                    </span>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}