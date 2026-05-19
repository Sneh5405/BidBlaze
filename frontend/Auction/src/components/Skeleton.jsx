// reusable skeleton components for loading states

export const AuctionCardSkeleton = () => (
  <div className='bg-card border border-surface rounded-2xl overflow-hidden animate-pulse'>
    <div className='h-48 bg-surface' />
    <div className='p-5 space-y-3'>
      <div className='h-5 bg-surface rounded w-3/4' />
      <div className='h-4 bg-surface rounded w-full' />
      <div className='h-4 bg-surface rounded w-2/3' />
      <div className='flex justify-between mt-4'>
        <div className='h-6 bg-surface rounded w-1/3' />
        <div className='h-6 bg-surface rounded w-1/4' />
      </div>
    </div>
  </div>
)

export const ChatRoomSkeleton = () => (
  <div className='bg-card border border-surface rounded-2xl p-5 flex items-center gap-4 animate-pulse'>
    <div className='w-12 h-12 bg-surface rounded-full flex-shrink-0' />
    <div className='flex-1 space-y-2'>
      <div className='h-4 bg-surface rounded w-1/3' />
      <div className='h-3 bg-surface rounded w-2/3' />
    </div>
  </div>
)

export const ProfileSkeleton = () => (
  <div className='bg-card border border-surface rounded-2xl p-6 animate-pulse'>
    <div className='flex items-center gap-4'>
      <div className='w-16 h-16 bg-surface rounded-full' />
      <div className='space-y-2'>
        <div className='h-5 bg-surface rounded w-32' />
        <div className='h-4 bg-surface rounded w-48' />
      </div>
    </div>
  </div>
)