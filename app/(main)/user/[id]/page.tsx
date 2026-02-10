import UserProfileClient from './UserProfileClient'

export default function UserProfilePage({ params }: { params: { id: string } }) {
  return <UserProfileClient id={params.id} />
}
