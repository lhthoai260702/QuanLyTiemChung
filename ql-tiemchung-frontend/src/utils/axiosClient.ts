import axios from 'axios';

// Biến In-Memory lưu Access Token (Sẽ mất khi F5, cần refresh lại)
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
};

export const getAccessToken = () => accessToken;

// Cấu hình cơ bản cho Axios
const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
    withCredentials: true, // BẮT BUỘC ĐỂ GỬI ĐƯỢC HTTP-ONLY COOKIE (REFRESH TOKEN)
    headers: {
        'Content-Type': 'application/json',
    },
});

// REQUEST INTERCEPTOR: Tự động gắn Token trước khi gửi API
axiosClient.interceptors.request.use((config) => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

// RESPONSE INTERCEPTOR: Tự động xử lý Refresh Token nếu gặp lỗi 401
axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Nếu lỗi 401 (Hết hạn Token) & Chưa thử lại lần nào & Không phải là API refresh
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/api/auth/refresh') {
            originalRequest._retry = true;

            try {
                // Gọi API refresh ngầm (Cookie tự động được đính kèm nhờ withCredentials)
                const res = await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newAccessToken = res.data.token;
                setAccessToken(newAccessToken); // Cập nhật token mới vào RAM

                // Thay thế header cũ bằng Token mới và chạy lại request bị lỗi ban nãy
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axiosClient(originalRequest);
            } catch (refreshError) {
                // Nếu refresh thất bại (Hết hạn Refresh Token hoặc Cookie bị xóa) -> Văng ra Login
                setAccessToken(null);
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;