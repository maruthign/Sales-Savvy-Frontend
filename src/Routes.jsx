// 6. Routes.jsx

import React from "react";
import { Routes, Route } from "react-router-dom";
import RegistrationPage from "./RegistrationPage";
import LoginPage from "./LoginPage";
import CustomerHomePage from "./componenets/CustomerHomePage";
// import CartPage from "./CartPage";
// import OrderPage from "./OrderPage";
// import AdminLogin from "./AdminLogin";
// import AdminDashboard from "./AdminDashboard";

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/customerhome" element={<CustomerHomePage />} />
        </Routes>
    );
};

export default AppRoutes;