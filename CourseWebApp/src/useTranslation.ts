import { useLanguage } from "./LanguageContext.tsx";
import { translations } from "./translations";

export const useTranslation = () => {
    const { language } = useLanguage();

    const t = (key: keyof typeof translations): string => {
        return translations[key][language] || key;
    };

    return { t };
};