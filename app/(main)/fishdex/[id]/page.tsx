import FishDexDetailClient from './FishDexDetailClient'

export default function FishDexDetailPage({ params }: { params: { id: string } }) {
  return <FishDexDetailClient id={params.id} />
}
