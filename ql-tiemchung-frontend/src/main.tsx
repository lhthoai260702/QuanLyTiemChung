import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.tsx';
import Login from './components/Login.tsx'; // Trỏ tới file Login bạn vừa tạo
import './index.css';

// Rào chắn bảo vệ tuyến đường (Chỉ cho phép truy cập App khi đã lưu thông tin đăng nhập)
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const user = localStorage.getItem('user');
  return user ? children : <Navigate to="/login" />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
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
  </React.StrictMode>,
);