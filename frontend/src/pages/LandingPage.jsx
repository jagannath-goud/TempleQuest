import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Sparkles, Heart } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import MitraChat from "@/components/MitraChat";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [showAuth, setShowAuth] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/temples?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate("/temples");
    }
  };

  const featuredTemples = [
    {
      name: "Brihadeeswarar Temple",
      location: "Thanjavur, Tamil Nadu",
      image: "https://images.unsplash.com/photo-1566915682737-3e97a7eed93b"
    },
    {
      name: "Golden Temple",
      location: "Amritsar, Punjab",
      image: "https://images.unsplash.com/photo-1668605105277-87816e3e2aab"
    },
    {
      name: "Meenakshi Temple",
      location: "Madurai, Tamil Nadu",
      image: "https://images.unsplash.com/photo-1741358706805-a5935a200a5c"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-amber-600" />
            <span className="text-2xl font-bold text-amber-900" style={{ fontFamily: 'Spectral, serif' }}>TempleQuest</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              data-testid="explore-temples-btn"
              variant="ghost"
              onClick={() => navigate("/temples")}
              className="text-amber-800 hover:text-amber-600 hover:bg-amber-50"
            >
              Explore Temples
            </Button>
            {user ? (
              <>
                <Button
                  data-testid="saved-temples-btn"
                  variant="ghost"
                  onClick={() => navigate("/saved")}
                  className="text-amber-800 hover:text-amber-600 hover:bg-amber-50"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Saved
                </Button>
                <Button
                  data-testid="chat-mitra-btn"
                  onClick={() => setShowChat(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  Chat with Mitra
                </Button>
              </>
            ) : (
              <Button
                data-testid="login-btn"
                onClick={() => setShowAuth(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                Login / Sign Up
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1566915682737-3e97a7eed93b')",
            filter: "brightness(0.4)"
          }}
        />
        <div className="relative z-10 text-center text-white px-6 max-w-4xl">
          <h1
            data-testid="hero-title"
            className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6"
            style={{ fontFamily: 'Spectral, serif' }}
          >
            Discover Sacred Journeys
          </h1>
          <p className="text-lg sm:text-xl mb-8 text-gray-200">
            Explore India's divine temples, their history, and spiritual significance
          </p>
          
          {/* Search Bar */}
          <div className="flex max-w-2xl mx-auto bg-white rounded-full shadow-2xl overflow-hidden">
            <Input
              data-testid="search-input"
              type="text"
              placeholder="Search temples, locations, or deities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 border-none focus-visible:ring-0 text-gray-800 px-6 py-6 text-lg"
            />
            <Button
              data-testid="search-btn"
              onClick={handleSearch}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-none rounded-r-full px-8"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Temples */}
      <section className="py-20 px-6 bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-4xl sm:text-5xl font-bold text-amber-900 mb-4"
              style={{ fontFamily: 'Spectral, serif' }}
            >
              Featured Temples
            </h2>
            <p className="text-lg text-gray-600">Explore the most revered temples across India</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredTemples.map((temple, index) => (
              <div
                key={index}
                data-testid={`featured-temple-${index}`}
                className="group relative overflow-hidden rounded-2xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                onClick={() => navigate("/temples")}
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={temple.image}
                    alt={temple.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Spectral, serif' }}>
                    {temple.name}
                  </h3>
                  <div className="flex items-center text-amber-200">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{temple.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              data-testid="view-all-temples-btn"
              onClick={() => navigate("/temples")}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-6 text-lg rounded-full"
            >
              View All Temples
            </Button>
          </div>
        </div>
      </section>

      {/* Why TempleQuest */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl sm:text-5xl font-bold text-center text-amber-900 mb-16"
            style={{ fontFamily: 'Spectral, serif' }}
          >
            Why TempleQuest?
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-amber-900 mb-2">Discover</h3>
              <p className="text-gray-600">Find temples across India with detailed information and history</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-amber-900 mb-2">Save</h3>
              <p className="text-gray-600">Create your personal collection of temples to visit</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-amber-900 mb-2">Learn</h3>
              <p className="text-gray-600">Chat with Mitra AI to learn about temples and spirituality</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-amber-900 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="w-6 h-6" />
            <span className="text-xl font-bold" style={{ fontFamily: 'Spectral, serif' }}>TempleQuest</span>
          </div>
          <p className="text-amber-200">Discover the divine heritage of India</p>
        </div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showChat && <MitraChat onClose={() => setShowChat(false)} />}
    </div>
  );
};

export default LandingPage;