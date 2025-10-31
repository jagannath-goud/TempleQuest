import { useState, useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Heart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import AuthModal from "@/components/AuthModal";
import MitraChat from "@/components/MitraChat";

const TempleListing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useContext(AuthContext);
  const [temples, setTemples] = useState([]);
  const [filteredTemples, setFilteredTemples] = useState([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [stateFilter, setStateFilter] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemples();
  }, []);

  useEffect(() => {
    filterTemples();
  }, [searchQuery, stateFilter, temples]);

  const fetchTemples = async () => {
    try {
      const response = await axios.get(`${API}/temples`);
      setTemples(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch temples", error);
      toast.error("Failed to load temples");
      setLoading(false);
    }
  };

  const filterTemples = () => {
    let filtered = temples;

    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.deity.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (stateFilter) {
      filtered = filtered.filter((t) => t.state === stateFilter);
    }

    setFilteredTemples(filtered);
  };

  const states = [...new Set(temples.map((t) => t.state))].sort();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <Sparkles className="w-8 h-8 text-amber-600" />
            <span className="text-2xl font-bold text-amber-900" style={{ fontFamily: 'Spectral, serif' }}>
              TempleQuest
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button
                  data-testid="saved-temples-nav-btn"
                  variant="ghost"
                  onClick={() => navigate("/saved")}
                  className="text-amber-800 hover:text-amber-600 hover:bg-amber-50"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Saved
                </Button>
                <Button
                  data-testid="chat-mitra-nav-btn"
                  onClick={() => setShowChat(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  Chat with Mitra
                </Button>
              </>
            ) : (
              <Button
                data-testid="login-nav-btn"
                onClick={() => setShowAuth(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                Login / Sign Up
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1
            data-testid="temples-page-title"
            className="text-4xl sm:text-5xl font-bold text-amber-900 mb-8 text-center"
            style={{ fontFamily: 'Spectral, serif' }}
          >
            Explore Temples
          </h1>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 flex bg-white rounded-lg shadow-md overflow-hidden">
              <Input
                data-testid="temple-search-input"
                type="text"
                placeholder="Search temples, deities, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border-none focus-visible:ring-0 text-gray-800"
              />
              <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-none">
                <Search className="w-5 h-5" />
              </Button>
            </div>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger data-testid="state-filter" className="w-full md:w-64 bg-white">
                <SelectValue placeholder="Filter by State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All States</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Temple Grid */}
          {loading ? (
            <div className="text-center py-20">
              <p className="text-gray-600">Loading temples...</p>
            </div>
          ) : filteredTemples.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600">No temples found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTemples.map((temple) => (
                <div
                  key={temple.id}
                  data-testid={`temple-card-${temple.id}`}
                  className="group bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  onClick={() => navigate(`/temples/${temple.id}`)}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={temple.image_url}
                      alt={temple.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-amber-900 mb-2" style={{ fontFamily: 'Spectral, serif' }}>
                      {temple.name}
                    </h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-2 text-amber-600" />
                      <span>{temple.location}, {temple.state}</span>
                    </div>
                    <p className="text-gray-700 mb-2">
                      <span className="font-semibold">Deity:</span> {temple.deity}
                    </p>
                    <p className="text-gray-600 line-clamp-2">{temple.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showChat && <MitraChat onClose={() => setShowChat(false)} />}
    </div>
  );
};

export default TempleListing;