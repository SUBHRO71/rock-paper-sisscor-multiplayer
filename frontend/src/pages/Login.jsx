import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || "/game";

  const login = async () => {
    await signInWithPopup(auth, provider);
    navigate(from, { replace: true });
  };

  return (
    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="bg-white/10 backdrop-blur-lg px-12 py-10 rounded-3xl border border-white/20 text-center">
        <h1 className="text-5xl font-bold text-white mb-6">
          Rock Paper Scissors
        </h1>
        <button
          onClick={login}
          className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold"
        >
          Login with Google
        </button>
      </div>
    </div>
  );
}
