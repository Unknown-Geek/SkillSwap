const Home = () => (
  <div className="min-h-screen pt-20">
    <div className="max-w-6xl mx-auto px-4">
      {/* Hero Section */}
      <div className="text-center mb-16 pt-8">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
          Welcome to SkillSwap
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Exchange skills and learn from each other in our collaborative learning community.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="group hover:scale-105 transition-transform duration-300">
          <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg p-8 h-full">
            <div className="h-12 w-12 bg-blue-500 rounded-lg mb-6 flex items-center justify-center text-white">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-4">Share Your Skills</h2>
            <p className="text-gray-600 dark:text-gray-300">Help others learn while earning karma points and building your reputation in the community.</p>
          </div>
        </div>

        <div className="group hover:scale-105 transition-transform duration-300">
          <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg p-8 h-full">
            <div className="h-12 w-12 bg-blue-500 rounded-lg mb-6 flex items-center justify-center text-white">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-4">Learn New Skills</h2>
            <p className="text-gray-600 dark:text-gray-300">Connect with experts and master new abilities through personalized learning experiences.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Home;
