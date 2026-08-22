import { useEffect, useState } from 'react';

const CARD_BACK = '/card-back.png';

interface ResidentFlipCardProps {
  frontImage: string;
  alt: string;
  width?: number;
  height?: number;
}

export default function ResidentFlipCard({
  frontImage,
  alt,
  width = 280,
  height = 380,
}: ResidentFlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFlipped(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="flip-card"
      style={{ width, height }}
    >
      <div className={`flip-card-inner ${flipped ? 'flipped' : ''}`}>
        {/* Front face (card back image, visible first) */}
        <div className="flip-card-face">
          <img
            src={CARD_BACK}
            alt="카드 뒷면"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Back face (resident card image, revealed after flip) */}
        <div className="flip-card-face flip-card-back">
          <img
            src={frontImage}
            alt={alt}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
