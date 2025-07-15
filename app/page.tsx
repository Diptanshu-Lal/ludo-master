export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-wood-light via-wood-brown to-wood-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-nostalgia-red rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-forest-green rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-sunshine-yellow rounded-full blur-3xl"></div>
      </div>
      
      <div className="text-center relative z-10 max-w-4xl mx-auto">
        {/* Logo/Brand */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-nostalgia-red to-forest-green rounded-full shadow-2xl mb-6">
            <div className="text-4xl font-bold text-white">🎲</div>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-nostalgia-red via-sunshine-yellow to-forest-green bg-clip-text text-transparent mb-4">
            Ludo Masters
          </h1>
          <p className="text-xl md:text-2xl text-wood-light font-medium mb-2">
            The Premium Multiplayer Experience
          </p>
          <p className="text-wood-light/80 text-lg">
            Nostalgic gameplay meets modern design
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-white font-semibold mb-2">Real-time Multiplayer</h3>
            <p className="text-wood-light/80 text-sm">Play with friends or match with players worldwide</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="text-white font-semibold mb-2">Multiple Game Modes</h3>
            <p className="text-wood-light/80 text-sm">Classic, Speed, and Quick modes for every playstyle</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-3">💎</div>
            <h3 className="text-white font-semibold mb-2">Premium Themes</h3>
            <p className="text-wood-light/80 text-sm">Beautiful wood, neon, and festival board designs</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="/auth/signup"
              className="inline-flex items-center justify-center bg-gradient-to-r from-nostalgia-red to-forest-green text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 min-w-[200px]"
            >
              Start Playing
            </a>
            <a 
              href="/auth/login"
              className="inline-flex items-center justify-center bg-white/10 backdrop-blur-sm text-white border border-white/30 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-300 min-w-[200px]"
            >
              Sign In
            </a>
          </div>
          
          <div className="text-sm text-wood-light/60 flex items-center justify-center gap-2">
            <span>Ages 18-45</span>
            <span>•</span>
            <span>Premium Gaming Experience</span>
            <span>•</span>
            <span>Free to Play</span>
          </div>
        </div>
      </div>
    </div>
  )
}