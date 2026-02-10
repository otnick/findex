import SharedCatchClient from './SharedCatchClient'

export default function SharePage({ params }: { params: { id: string } }) {
  return <SharedCatchClient id={params.id} />
}
