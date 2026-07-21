import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google'; // Import Provider của Google
import App from './App.tsx';
import Login from './components/Login.tsx';
import './index.css';

// Rào chắn bảo vệ tuyến đường (Chỉ cho phép truy cập App khi đã lưu thông tin đăng nhập)
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const user = localStorage.getItem('user');
  return user ? children : <Navigate to="/login" />;
};

// Khai báo Google Client ID (Nên lưu trong file .env với tên VITE_GOOGLE_CLIENT_ID)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Bọc toàn bộ ứng dụng bằng GoogleOAuthProvider */}
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          {/* Mặc định đẩy thẳng người dùng về màn hình đăng nhập */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Route đăng nhập */}
          <Route path="/login" element={<Login />} />

          {/* Route chứa toàn bộ phân hệ (App.tsx) có gắn bảo vệ */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />

          {/* Xử lý chuyển hướng nếu nhập sai đường dẫn */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);