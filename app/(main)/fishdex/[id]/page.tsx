import FishDexDetailClient from './FishDexDetailClient'

export default async function FishDexDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <FishDexDetailClient id={id} />
}
