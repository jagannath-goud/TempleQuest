import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Users, Calendar, Heart, Sparkles, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import AuthModal from "@/components/AuthModal";
import MitraChat from "@/components/MitraChat";

const TempleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [temple, setTemple] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemple();
    if (user) {
      checkIfSaved();
    }
  }, [id, user]);

  const fetchTemple = async () => {
    try {
      const response = await axios.get(`${API}/temples/${id}`);
      setTemple(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch temple", error);
      toast.error("Failed to load temple details");
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const response = await axios.get(`${API}/temples/saved/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsSaved(response.data.some((t) => t.id === id));
    } catch (error) {
      console.error("Failed to check saved status", error);
    }
  };

  const handleSaveToggle = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    try {
      if (isSaved) {
        await axios.delete(`${API}/temples/saved/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsSaved(false);
        toast.success("Temple removed from saved list");
      } else {
        await axios.post(
          `${API}/temples/saved`,
          { temple_id: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsSaved(true);
        toast.success("Temple saved successfully");
      }
    } catch (error) {
      console.error("Failed to toggle save", error);
      toast.error(error.response?.data?.detail || "Failed to save temple");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading temple details...</p>
      </div>
    );
  }

  if (!temple) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Temple not found</p>
      </div>
    );
  }

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
                  data-testid="saved-temples-detail-btn"
                  variant="ghost"
                  onClick={() => navigate("/saved")}
                  className="text-amber-800 hover:text-amber-600 hover:bg-amber-50"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Saved
                </Button>
                <Button
                  data-testid="chat-mitra-detail-btn"
                  onClick={() => setShowChat(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  Chat with Mitra
                </Button>
              </>
            ) : (
              <Button
                data-testid="login-detail-btn"
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
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <Button
            data-testid="back-btn"
            variant="ghost"
            onClick={() => navigate("/temples")}
            className="mb-6 text-amber-800 hover:text-amber-600 hover:bg-amber-50"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Temples
          </Button>

          {/* Temple Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl mb-8">
            <img
              src={temple.image_url}
              alt={temple.name}
              className="w-full h-[500px] object-cover"
            />
            <div className="absolute top-4 right-4">
              <Button
                data-testid="save-temple-btn"
                onClick={handleSaveToggle}
                className={`rounded-full w-12 h-12 p-0 ${
                  isSaved
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-white/80 hover:bg-white text-amber-600"
                }`}
              >
                <Heart className={`w-6 h-6 ${isSaved ? "fill-white" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Temple Info */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1
              data-testid="temple-detail-name"
              className="text-4xl sm:text-5xl font-bold text-amber-900 mb-4"
              style={{ fontFamily: 'Spectral, serif' }}
            >
              {temple.name}
            </h1>

            <div className="flex items-center text-gray-600 text-lg mb-6">
              <MapPin className="w-5 h-5 mr-2 text-amber-600" />
              <span>{temple.location}, {temple.state}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start">
                <Users className="w-5 h-5 mr-3 text-amber-600 mt-1" />
                <div>
                  <p className="font-semibold text-amber-900">Deity</p>
                  <p className="text-gray-700">{temple.deity}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Clock className="w-5 h-5 mr-3 text-amber-600 mt-1" />
                <div>
                  <p className="font-semibold text-amber-900">Timings</p>
                  <p className="text-gray-700">{temple.timings}</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-amber-900 mb-3" style={{ fontFamily: 'Spectral, serif' }}>
                Description
              </h2>
              <p className="text-gray-700 leading-relaxed">{temple.description}</p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-amber-900 mb-3" style={{ fontFamily: 'Spectral, serif' }}>
                History
              </h2>
              <p className="text-gray-700 leading-relaxed">{temple.history}</p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-amber-900 mb-3" style={{ fontFamily: 'Spectral, serif' }}>
                Dress Code
              </h2>
              <p className="text-gray-700 leading-relaxed">{temple.dress_code}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-3" style={{ fontFamily: 'Spectral, serif' }}>
                Festivals
              </h2>
              <div className="flex flex-wrap gap-3">
                {temple.festivals.map((festival, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-amber-50 text-amber-800 px-4 py-2 rounded-full"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {festival}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showChat && <MitraChat onClose={() => setShowChat(false)} />}
    </div>
  );
};

export default TempleDetail;