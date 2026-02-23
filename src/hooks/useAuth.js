import { useState, useEffect } from "react";
import api from "../utils/api";


export function useAuth() {
    const [user, setUser] = useState(null);
    const [authStep, setAuthStep] = useState("login");
    const [tempAuthData, setTempAuthData] = useState(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    const res = await api.get("/auth/me");
                    setUser(res.data);
                } catch (error) {
                    console.error("Failed to fetch user", error);
                    localStorage.removeItem("token");
                    setUser(null);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        fetchUser();
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
        loading,
        logout
    };

}
