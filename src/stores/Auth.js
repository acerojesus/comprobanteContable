import { defineStore } from "pinia";
import { ref } from "vue";

export const useAuthStore = defineStore(
  "auth",
  () => {
    const token = ref("");
    const userName = ref("");
    const nombre = ref("");
    const empresa = ref("");

    const setSession = (data) => {
      token.value = data.token || "";
      userName.value = data.userName || "";
      nombre.value = data.nombre || "";
      empresa.value = data.empresa || "";
    };

    const clearSession = () => {
      token.value = "";
      userName.value = "";
      nombre.value = "";
      empresa.value = "";
    };

    return {
      token,
      userName,
      nombre,
      empresa,
      setSession,
      clearSession,
    };
  },
  { persist: true }
);