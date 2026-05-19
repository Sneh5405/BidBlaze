const EmptyState = ({ icon, title, description, action }) => {
  return (
    <div className='flex flex-col items-center justify-center py-20 text-center'>
      <div className='w-24 h-24 bg-card border border-surface rounded-full flex items-center justify-center text-4xl mb-6'>
        {icon}
      </div>

      <h3 className='text-xl font-semibold text-white mb-2'>
        {title}
      </h3>

      <p className='text-gray-400 mb-6 max-w-sm'>
        {description}
      </p>

      {action && (
        <a
          href={action.href}
          className='bg-primary hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors'
        >
          {action.label}
        </a>
      )}
    </div>
  )
}

export default EmptyState