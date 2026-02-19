import FinDexDetailClient from './FinDexDetailClient'

export default function FinDexDetailPage({ params }: { params: { id: string } }) {
  return <FinDexDetailClient id={params.id} />
}
