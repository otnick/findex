'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Group } from 'three'

interface FishProps {
  position: [number, number, number]
  species: string
  length: number
}

export default function Fish({ position, species, length }: FishProps) {
  const groupRef = useRef<Group>(null)
  const time = useRef(Math.random() * 1000)

  // Lade das 3D-Modell
  const modelPath = `/models/${species.toLowerCase()}.glb`
  const { scene } = useGLTF(modelPath)

  // Animate fish swimming
  useFrame((state, delta) => {
    if (groupRef.current) {
      time.current += delta
      groupRef.current.position.y = position[1] + Math.sin(time.current * 0.5) * 0.3
      groupRef.current.rotation.y = Math.sin(time.current * 0.3) * 0.2
      groupRef.current.position.x = position[0] + Math.sin(time.current * 0.2) * 0.5
      groupRef.current.position.z = position[2] + Math.cos(time.current * 0.2) * 0.5
    }
  })

  const scale = (length / 50) * 0.8

  return (
    <group ref={groupRef} position={position}>
      <primitive
        object={scene.clone()}
        scale={scale}
        castShadow
      />
    </group>
  )
}

// Preload models für bessere Performance
useGLTF.preload('/models/hecht.glb')
useGLTF.preload('/models/zander.glb')