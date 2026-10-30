// This pinia store contains state with respect to whether a user is logged in
import { defineStore } from 'pinia'
import { useToast } from 'vue-toastification'
import { loginUser, logoutUser, setAuthHeader } from '../api/api' // import API calls
import jwt_decode from 'jwt-decode'; // import JSON Web Token decoder to decode the token into the user's information

//Notifications
const toast = useToast()

// Defining a store
export const useLoggedInUserStore = defineStore({
  id: 'loggedInUser',
  state: () => {
    return {
      name: "",
      role: "",
      isLoggedIn: false
    }
  },
  actions: {
    async login(username, password) {
      try {
        const token = await loginUser(username, password);
        // Get the user's name and role from the JWT token
        const decodedToken = jwt_decode(token);
        this.$patch({
          isLoggedIn: true,
          role: decodedToken.role,
          name: decodedToken.name
        });
        this.$router.push("/");
        toast.success("Login Sucessful!")

      } catch ( error ) {
        toast.error(error.message)
      }
    },
    logout() {
      logoutUser();
      // Reset value after user log out
      this.$patch({
        name: "",
        role: "",
        isLoggedIn: false
      });
      this.$router.push("/");
      toast.info("You have been logged out!")
    },
    // Sprint 2, F4: re-establishes the logged-in state from the JWT already
    // sitting in localStorage, so a page refresh doesn't silently log the
    // user out of the UI even though their token is still valid. Called
    // once from main.js, right after pinia is installed and before the app
    // mounts. Deliberately swallows any failure (missing token, expired or
    // malformed JWT) by just leaving the user logged out -- there's no
    // token to recover from and no page to redirect away from yet.
    restoreSession() {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return;
      }

      try {
        const decodedToken = jwt_decode(token);

        // a JWT with an exp claim that's already passed is not usable --
        // treat it the same as no token at all
        if (decodedToken.exp && Date.now() >= decodedToken.exp * 1000) {
          localStorage.removeItem('authToken');
          return;
        }

        setAuthHeader(token);
        this.$patch({
          isLoggedIn: true,
          role: decodedToken.role,
          name: decodedToken.name
        });
      } catch (error) {
        // token isn't valid JSON/JWT -- drop it rather than leave a bad
        // value around for the next load to choke on too
        localStorage.removeItem('authToken');
      }
    }
  },
});
