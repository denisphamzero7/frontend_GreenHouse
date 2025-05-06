import { ref } from "vue";
import useError from "./useError.js";
import useAxios from "./useAxios";
import { useAuthStore } from "~/stores/auth.js";
import { storeToRefs } from "pinia";

export default function useAuth() {
  // Khởi tạo store và các tham chiếu trạng thái
  const authStore = useAuthStore();
  const { user, token, isVerified, message } = storeToRefs(authStore);

  // Khởi tạo composable phụ trợ
  const { errorBag, transformValidationErrors, resetErrorBag } = useError();
  const { api } = useAxios();

  // Biến trạng thái cục bộ
  const showOtpModal = ref(false);
  const emailForOtp = ref("");
  const otp = ref("");
  const msg = ref("");

  // Hàm chuyển đổi trạng thái modal OTP
  function toggleOtpModal() {
    showOtpModal.value = !showOtpModal.value;
  }

  // **Lấy thông tin người dùng**
  async function profile() {
    try {
      const { data } = await api.get("api/user/profile");
      authStore.setUser(data.user);
      return {
        success: true,
        message: "Lấy thông tin thành công",
      };
    } catch (error) {
      authStore.clearAuth(); // Xóa thông tin nếu token không hợp lệ
      return {
        success: false,
        message: "Token không hợp lệ hoặc hết hạn",
      };
    }
  }

  // **Đăng nhập**
  async function login(userForm) {
    resetErrorBag(); // Xóa lỗi trước đó
    try {
      const { data } = await api.post("api/user/login", userForm);
      if (!data?.user) throw new Error("Dữ liệu phản hồi không hợp lệ!");

      if (data.success) {
        // Lưu thông tin người dùng và token
        authStore.setUser(data.user, data.accessToken);
        authStore.setVerified(data.isVerified || true);
        authStore.setMessage(data.message);

        // Kiểm tra token hợp lệ
        const profileResult = await profile();
        if (profileResult.success) {
          navigateTo("/dashboard");
          return {
            success: true,
            message: data.message,
          };
        } else {
          throw new Error("Token không hợp lệ");
        }
      } else if (data.isVerified === false) {
        // Nếu cần xác minh OTP
        emailForOtp.value = userForm.email;
        toggleOtpModal();
        return {
          success: false,
          isVerified: false,
          message: data.message,
        };
      } else {
        return {
          success: false,
          message: data.message || "Đăng nhập thất bại",
        };
      }
    } catch (error) {
      if (error.response) {
        transformValidationErrors(error.response);
        return {
          success: false,
          message: error.response.data?.message || "Đăng nhập thất bại",
        };
      }
      return {
        success: false,
        message: "Đăng nhập thất bại do lỗi không xác định",
      };
    }
  }

  // **Đăng xuất**
  async function logout() {
    try {
      await api.post("api/user/logout");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    } finally {
      authStore.clearAuth(); // Xóa thông tin xác thực
      navigateTo("auth/login");
    }
  }

  // **Đăng ký**
  async function register(userForm) {
    resetErrorBag();
    try {
      const { data } = await api.post("api/user/register", userForm);
      if (data.success) {
        authStore.setUser(data.newUser);
        authStore.setMessage(data.message);
        navigateTo("login");
        return {
          success: true,
          message: data.message,
        };
      }
      return {
        success: false,
        message: data.message || "Đăng ký thất bại",
      };
    } catch (error) {
      if (error.response) {
        transformValidationErrors(error.response);
        return {
          success: false,
          message: error.response.data?.message || "Đăng ký thất bại",
        };
      }
      return {
        success: false,
        message: "Đăng ký thất bại do lỗi không xác định",
      };
    }
  }

  // **Gửi OTP**
  async function sendOtpEmail() {
    try {
      const { data } = await api.post("api/user/resendotp", {
        email: emailForOtp.value,
      });
      if (data.success) {
        msg.value = data.message;
        return {
          success: true,
          message: data.message,
        };
      }
      return {
        success: false,
        message: data.message || "Gửi OTP thất bại",
      };
    } catch (error) {
      if (error.response) {
        transformValidationErrors(error.response);
        return {
          success: false,
          message: error.response.data?.message || "Gửi OTP thất bại",
        };
      }
      return {
        success: false,
        message: "Gửi OTP thất bại do lỗi không xác định",
      };
    }
  }

  // **Xác minh OTP**
  async function verifyOtp() {
    try {
      const { data } = await api.post("api/user/verifyotp", {
        email: emailForOtp.value,
        otp: otp.value,
      });
      if (data.success) {
        showOtpModal.value = false;
        authStore.setVerified(true); // Cập nhật trạng thái xác minh
        if (data.accessToken) {
          authStore.setUser(data.user, data.accessToken);
          navigateTo("/dashboard");
        }
        return {
          success: true,
          message: data.message,
        };
      }
      return {
        success: false,
        message: data.message || "Xác minh OTP thất bại",
      };
    } catch (error) {
      if (error.response) {
        transformValidationErrors(error.response);
        return {
          success: false,
          message: error.response.data?.message || "Xác minh OTP thất bại",
        };
      }
      return {
        success: false,
        message: "Xác minh OTP thất bại do lỗi không xác định",
      };
    }
  }

  // Trả về các hàm và trạng thái để sử dụng
  return {
    profile,
    login,
    register,
    sendOtpEmail,
    verifyOtp,
    logout,
    user,
    token,
    isVerified,
    showOtpModal,
    emailForOtp,
    otp,
    msg,
    errorBag,
    toggleOtpModal,
  };
}