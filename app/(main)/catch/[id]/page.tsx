import CatchDetailClient from './CatchDetailClient'

export default function CatchDetailPage({ params }: { params: { id: string } }) {
  return <CatchDetailClient id={params.id} />
}
