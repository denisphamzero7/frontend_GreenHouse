import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    token: process.client ? localStorage.getItem("token") || null : null,
    isVerified: false,
    role: null as string | null,
    message: null as string | null,
  
    // Các biến liên quan đến OTP
    showOtpModal: false,
    emailForOtp: "",
    otp: "",
    otpMsg: "", // Để lưu thông báo OTP riêng, tránh nhầm lẫn với message chung
  }),
  getters: {
    isAuthenticated: (state) => !!state.user && !!state.token,
  },
  actions: {
    setUser(userData: any, accessToken?: string, message?: string) {
      this.user = userData;
      if (accessToken) {
        this.token = accessToken;
        if (process.client) {
          localStorage.setItem("token", accessToken);
        }
      }
      if (message) {
        this.message = message;
      }
    },
    setVerified(isVerified: boolean) {
      this.isVerified = isVerified;
    },
    setMessage(msg?: string) {
      this.message = msg || null;
    },
    clearAuth() {
      this.user = null;
      this.token = null;
      this.message = null;
      if (process.client) {
        localStorage.removeItem("token");
      }
    },
    // Các action cho OTP
    setShowOtpModal(val: boolean) {
      this.showOtpModal = val;
    },
    setEmailForOtp(email: string) {
      this.emailForOtp = email;
    },
    setOtp(otpValue: string) {
      this.otp = otpValue;
    },
    setOtpMsg(msg: string) {
      this.otpMsg = msg;
    },
    clearOtp() {
      this.showOtpModal = false;
      this.emailForOtp = "";
      this.otp = "";
      this.otpMsg = "";
    },
  },
});
