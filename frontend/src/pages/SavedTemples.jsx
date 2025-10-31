import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { MapPin, Heart, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import MitraChat from "@/components/MitraChat";

const SavedTemples = () => {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [temples, setTemples] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedTemples();
  }, []);

  const fetchSavedTemples = async () => {
    try {
      const response = await axios.get(`${API}/temples/saved/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemples(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch saved temples", error);
      toast.error("Failed to load saved temples");
      setLoading(false);
    }
  };

  const handleRemove = async (templeId, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API}/temples/saved/${templeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemples(temples.filter((t) => t.id !== templeId));
      toast.success("Temple removed from saved list");
    } catch (error) {
      console.error("Failed to remove temple", error);
      toast.error("Failed to remove temple");
    }
  };

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
            <Button
              data-testid="explore-temples-saved-btn"
              variant="ghost"
              onClick={() => navigate("/temples")}
              className="text-amber-800 hover:text-amber-600 hover:bg-amber-50"
            >
              Explore Temples
            </Button>
            <Button
              data-testid="chat-mitra-saved-btn"
              onClick={() => setShowChat(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              Chat with Mitra
            </Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <Heart className="w-12 h-12 text-amber-600 mr-4" />
            <h1
              data-testid="saved-temples-title"
              className="text-4xl sm:text-5xl font-bold text-amber-900"
              style={{ fontFamily: 'Spectral, serif' }}
            >
              My Saved Temples
            </h1>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <p className="text-gray-600">Loading saved temples...</p>
            </div>
          ) : temples.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 mb-4">You haven't saved any temples yet.</p>
              <Button
                data-testid="explore-temples-empty-btn"
                onClick={() => navigate("/temples")}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                Explore Temples
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {temples.map((temple) => (
                <div
                  key={temple.id}
                  data-testid={`saved-temple-card-${temple.id}`}
                  className="group relative bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  onClick={() => navigate(`/temples/${temple.id}`)}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={temple.image_url}
                      alt={temple.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute top-4 right-4">
                    <Button
                      data-testid={`remove-temple-btn-${temple.id}`}
                      onClick={(e) => handleRemove(temple.id, e)}
                      className="rounded-full w-10 h-10 p-0 bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
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

      {showChat && <MitraChat onClose={() => setShowChat(false)} />}
    </div>
  );
};

export default SavedTemples;