import SharedCatchClient from './SharedCatchClient'

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <SharedCatchClient id={id} />
}
