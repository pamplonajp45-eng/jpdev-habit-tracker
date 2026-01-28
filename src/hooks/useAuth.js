import { useState, useEffect } from "react";

export function useAuth() {
    const [user, setUser] = useState(null);
    const [authStep, setAuthStep] = useState("login");
    const [tempAuthData, setTempAuthData] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setUser({ loggedIn: true });
        }
    }, []);

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        setAuthStep("login");
    };

    return {
        user,
        setUser,
        authStep,
        setAuthStep,
        tempAuthData,
        setTempAuthData,
        logout
    };
}
