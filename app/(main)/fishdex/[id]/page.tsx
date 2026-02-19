import FinDexDetailClient from './FishDexDetailClient'

export default function FinDexDetailPage({ params }: { params: { id: string } }) {
  return <FinDexDetailClient id={params.id} />
}
