import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "../locales/en.json";
import hi from "../locales/hi.json";
import mr from "../locales/mr.json";
import gj from "../locales/gj.json";
import be from "../locales/be.json";

const STORE_LANGUAGE_KEY = "settings.lang";

const languageDetectorPlugin = {
  type: "languageDetector" as const,
  async: true,
  init: () => {},
  detect: async function (callback: (lang: string) => void) {
    try {
      const savedLanguage = await AsyncStorage.getItem(STORE_LANGUAGE_KEY);
      if (savedLanguage) {
        return callback(savedLanguage);
      }

      const deviceLang = Localization.getLocales()[0].languageCode;
      if (
        deviceLang === "hi" ||
        deviceLang === "mr" ||
        deviceLang === "gj" ||
        deviceLang === "be"
      ) {
        return callback(deviceLang);
      }

      return callback("en");
    } catch (error) {
      console.log("Error reading language", error);
      callback("en");
    }
  },
  cacheUserLanguage: async function (language: string) {
    try {
      await AsyncStorage.setItem(STORE_LANGUAGE_KEY, language);
    } catch (error) {
      console.log("Error saving language", error);
    }
  },
};

i18n
  .use(initReactI18next)
  .use(languageDetectorPlugin)
  .init({
    resources: {
      en: en,
      hi: hi,
      mr: mr,
      gj: gj,
      be: be,
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
