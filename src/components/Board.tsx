import React from 'react';
import { Category, Clue } from '../types';

interface BoardProps {
  categories: Category[];
  onSelectClue: (categoryId: string, clueId: string) => void;
}

export const Board: React.FC<BoardProps> = ({ categories, onSelectClue }) => {
  // Max rows among categories (standard Jeopardy is 5 rows: 100 to 500)
  const maxRows = Math.max(...categories.map((c) => c.clues.length), 5);
  const rowIndexes = Array.from({ length: maxRows }, (_, i) => i);
  const colCount = Math.max(categories.length, 1);

  return (
    <div className="w-full h-full flex-1 flex flex-col justify-center items-center p-[clamp(0.25rem,0.8vh+0.4vw,1rem)] overflow-hidden">
      {/* Jeopardy Grid Board Container - Fits dynamically to viewport */}
      <div
        className="w-full h-full max-w-[min(100%,clamp(900px,94vw,2200px))] max-h-full bg-[#000222]/90 p-[clamp(0.35rem,0.8vw,1.25rem)] rounded-[clamp(0.75rem,1.2vw,1.5rem)] border-[clamp(2px,0.3vw,5px)] border-[#D4AF37] shadow-[0_0_60px_rgba(6,12,233,0.5)] grid gap-[clamp(0.3rem,0.6vw,0.85rem)]"
        style={{
          gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
          gridTemplateRows: `clamp(2.75rem,5.5vh+1vw,5.5rem) repeat(${maxRows}, minmax(0, 1fr))`,
        }}
      >
        {/* Category Header Row */}
        {categories.map((category) => (
          <div
            key={category.id}
            id={`category-header-${category.id}`}
            className="h-full bg-[#060CE9] border-[clamp(1px,0.2vw,3px)] border-white/40 rounded-[clamp(0.4rem,0.7vw,0.85rem)] p-[clamp(0.25rem,0.5vw,0.75rem)] flex items-center justify-center text-center shadow-md select-none transition-transform hover:scale-[1.01]"
          >
            <h2
              className="text-white font-black uppercase tracking-wider line-clamp-2 sm:line-clamp-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] font-sans leading-tight text-center"
              style={{
                fontSize: 'clamp(0.68rem, 0.55vw + 0.65vh, 1.35rem)',
              }}
            >
              {category.name}
            </h2>
          </div>
        ))}

        {/* Clue Cells Rows (1fr each, auto-scaling to available height) */}
        {rowIndexes.map((rowIndex) => (
          <React.Fragment key={`row-${rowIndex}`}>
            {categories.map((category) => {
              const clue: Clue | undefined = category.clues[rowIndex];

              if (!clue) {
                return (
                  <div
                    key={`empty-${category.id}-${rowIndex}`}
                    className="h-full bg-[#060CE9]/20 rounded-[clamp(0.4rem,0.7vw,0.85rem)] border border-blue-900/30"
                  />
                );
              }

              const isAnswered = clue.isAnswered;

              return (
                <button
                  key={clue.id}
                  id={`clue-cell-${clue.id}`}
                  disabled={isAnswered}
                  onClick={() => onSelectClue(category.id, clue.id)}
                  className={`h-full rounded-[clamp(0.4rem,0.7vw,0.85rem)] shadow-inner flex flex-col items-center justify-center select-none transition-all duration-150 relative overflow-hidden ${
                    isAnswered
                      ? 'bg-[#060CE9]/30 border-b-[clamp(2px,0.4vh,4px)] border-[#000222] opacity-35 cursor-not-allowed'
                      : 'bg-[#060CE9] border-b-[clamp(2px,0.4vh,5px)] border-[#000222] hover:bg-blue-600 hover:border-b-[#D4AF37] hover:scale-[1.02] active:scale-95 cursor-pointer shadow-lg'
                  }`}
                >
                  {!isAnswered ? (
                    <span
                      className="font-mono font-black text-[#FFCC00] tracking-tight drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] leading-none"
                      style={{
                        fontSize: 'clamp(1.3rem, 1.8vw + 1.8vh, 3.8rem)',
                      }}
                    >
                      {clue.value}
                    </span>
                  ) : (
                    <span
                      className="font-mono font-black text-[#FFCC00]/30 tracking-tight leading-none"
                      style={{
                        fontSize: 'clamp(1.1rem, 1.4vw + 1.2vh, 2.8rem)',
                      }}
                    >
                      {clue.value}
                    </span>
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
