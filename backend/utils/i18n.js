import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, '..', 'locales');
const translations = {};

// Load all translation files
const loadTranslations = () => {
    const files = fs.readdirSync(localesDir).filter(file => file.endsWith('.json'));
    files.forEach(file => {
        const locale = file.replace('.json', '');
        const content = fs.readFileSync(path.join(localesDir, file), 'utf8');
        translations[locale] = JSON.parse(content);
    });
};

loadTranslations();

export const t = (key, locale = 'en') => {
    const keys = key.split('.');
    let value = translations[locale] || translations['en'];
    
    for (const k of keys) {
        value = value?.[k];
    }
    
    return value || key;
};

export const getAvailableLocales = () => {
    return Object.keys(translations);
};

export const i18nMiddleware = (req, res, next) => {
    const locale = req.headers['accept-language']?.split(',')[0].split('-')[0] || 'en';
    req.locale = translations[locale] ? locale : 'en';
    req.t = (key) => t(key, req.locale);
    next();
};

export default { t, getAvailableLocales, i18nMiddleware };
