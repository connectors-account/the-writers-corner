
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all milestones with user progress
    const milestones = await prisma.milestone.findMany({
      orderBy: [
        { week: 'asc' },
        { order: 'asc' }
      ],
      include: {
        userProgress: {
          where: {
            userId: session.user.id
          }
        }
      }
    })

    // Transform to include completed status
    const milestonesWithProgress = milestones.map((milestone: typeof milestones[number]) => ({
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      week: milestone.week,
      order: milestone.order,
      completed: milestone.userProgress.length > 0 ? milestone.userProgress[0].completed : false,
      completedAt: milestone.userProgress.length > 0 ? milestone.userProgress[0].completedAt?.toISOString() : undefined
    }))

    return NextResponse.json({ milestones: milestonesWithProgress })
  } catch (error) {
    console.error('Error fetching milestones:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
