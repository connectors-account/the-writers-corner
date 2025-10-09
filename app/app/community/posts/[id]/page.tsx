
import { Navigation } from '@/components/navigation'
import { PostDetail } from '@/components/community/post-detail'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function PostPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-parchment">
      <Navigation />
      <main>
        <PostDetail postId={params.id} />
      </main>
    </div>
  )
}
