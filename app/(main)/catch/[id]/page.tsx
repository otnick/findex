import CatchDetailClient from './CatchDetailClient'

export default async function CatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CatchDetailClient id={id} />
}
