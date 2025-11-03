import { jwtDecode } from 'jwt-decode';

class AuthService {
    login(token) {
        localStorage.setItem('access_token', token);
    }

    logout() {
        localStorage.removeItem('access_token');
    }

    getToken() {
        return localStorage.getItem('access_token');
    }

    getCurrentUser() {
        const token = this.getToken();
        if (!token) {
            return null;
        }

        try {
            const decoded = jwtDecode(token);
            // The backend stores the username in the 'sub' claim and role in the 'role' claim
            return { 
                username: decoded.sub, 
                role: decoded.role 
            };
        } catch (error) {
            console.error("Failed to decode token:", error);
            this.logout(); // If token is invalid, logout the user
            return null;
        }
    }
}

export default new AuthService();
