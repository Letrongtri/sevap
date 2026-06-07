const LoadingSpinner = () => {
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-btn-primary-hover/20 border-t-btn-primary animate-spin" />
        </div>
    )
}

export default LoadingSpinner
