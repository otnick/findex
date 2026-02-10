'use client'

import { Avatar as FacehashAvatar, AvatarImage, AvatarFallback } from 'facehash'

interface AvatarProps {
  seed: string
  src?: string | null
  size?: number
  className?: string
  alt?: string
}

export default function Avatar({ seed, src, size = 48, className = '', alt = 'Avatar' }: AvatarProps) {
  const dimensionStyle = { width: size, height: size }

  return (
    <FacehashAvatar
      className={`inline-flex items-center justify-center rounded-full overflow-hidden align-middle ${className}`}
      style={dimensionStyle}
    >
      <AvatarImage src={src ?? undefined} alt={alt} style={dimensionStyle} />
      <AvatarFallback
        name={seed}
        facehash
        facehashProps={{ size }}
        className="w-full h-full"
        style={dimensionStyle}
      />
    </FacehashAvatar>
  )
}
