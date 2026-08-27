import Image from 'next/image';

interface RecoupLogoProps {
  className?: string;
  size?: number;
}

export function RecoupLogo({ className = 'w-8 h-8', size = 32 }: RecoupLogoProps) {
  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 rounded-lg overflow-hidden ${className}`}>
      <Image
        src="/logo.png"
        alt="Recoup Logo"
        width={size}
        height={size}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );
}
