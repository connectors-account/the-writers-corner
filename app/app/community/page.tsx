
import { Navigation } from '@/components/navigation'
import { CommunityOverview } from '@/components/community/community-overview'

export default async function CommunityPage() {
  // Remove authentication requirement to allow anyone to view community posts
  // const session = await getServerSession(authOptions)

  // if (!session) {
  //   redirect('/auth/signin')
  // }

  return (
    <div className="min-h-screen bg-parchment">
      <Navigation />
      <main>
        <CommunityOverview />
      </main>
    </div>
  )
}
