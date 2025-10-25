import { createContext, useContext, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useEffect } from "react";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {

  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

  const { user } = useUser();
  const { getToken } = useAuth();
  const location  = useLocation();
  const navigate = useNavigate();

  const fetchUserAuthenticationStatus = async () => {
    try {
      const { data } = await axios.get('/api/user/isUserAuthenticated', 
        {headers: {Authorization: `Bearer ${await getToken()}`}});
      setIsUserAuthenticated(data.isUserAuthenticated);

      // if(!data.isUserAuthenticated && location.pathname.startsWith('/my-learning')) {
      //   navigate('/');
      //   toast.error("You need to be logged in to access this page.");
      // }
    } catch (error) {
      console.error("Error fetching user authentication status:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserAuthenticationStatus();
    }
  }, [user])

  const value = {    
    axios,
    fetchUserAuthenticationStatus,
    user, getToken, navigate, isUserAuthenticated
};

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
