import fs from 'fs';
import path from 'path';

const dictionariesDir = 'src/dictionaries';
const languages = ['en', 'it', 'fr', 'de', 'es', 'ja', 'nl', 'pl', 'pt', 'ru', 'tr', 'ar'];

const phases = {
    en: {
        analysis: "Analysis",
        deposit: "Deposit",
        forging: "Forging",
        finalizing: "Finalizing",
        deployment: "Deployment"
    },
    it: {
        analysis: "Analisi",
        deposit: "Deposito",
        forging: "Forgiatura",
        finalizing: "Finalizzazione",
        deployment: "Spedizione"
    },
    fr: {
        analysis: "Analyse",
        deposit: "Dépôt",
        forging: "Forgeage",
        finalizing: "Finalisation",
        deployment: "Déploiement"
    },
    de: {
        analysis: "Analyse",
        deposit: "Anzahlung",
        forging: "Schmieden",
        finalizing: "Finalisierung",
        deployment: "Versand"
    },
    es: {
        analysis: "Análisis",
        deposit: "Depósito",
        forging: "Forjado",
        finalizing: "Finalización",
        deployment: "Despliegue"
    },
    ja: {
        analysis: "解析",
        deposit: "預金",
        forging: "鍛造",
        finalizing: "最終段階",
        deployment: "配置"
    },
    nl: {
        analysis: "Analyse",
        deposit: "Aanbetaling",
        forging: "Smeden",
        finalizing: "Afronding",
        deployment: "Inzet"
    },
    pl: {
        analysis: "Analiza",
        deposit: "Kaucja",
        forging: "Kucie",
        finalizing: "Finalizacja",
        deployment: "Wdrożenie"
    },
    pt: {
        analysis: "Análise",
        deposit: "Depósito",
        forging: "Forjamento",
        finalizing: "Finalização",
        deployment: "Implementação"
    },
    ru: {
        analysis: "Анализ",
        deposit: "Депозит",
        forging: "Ковка",
        finalizing: "Завершение",
        deployment: "Развертывание"
    },
    tr: {
        analysis: "Analiz",
        deposit: "Mevduat",
        forging: "Dövme",
        finalizing: "Sonuçlandırma",
        deployment: "Dağıtım"
    },
    ar: {
        analysis: "التحليل",
        deposit: "الايداع",
        forging: "تزوير",
        finalizing: "النهائي",
        deployment: "النشر"
    }
};

async function localize() {
    for (const lang of languages) {
        const filePath = path.join(dictionariesDir, `${lang}.json`);
        if (!fs.existsSync(filePath)) {
            console.log(`File not found: ${filePath}`);
            continue;
        }

        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (!content.orders) content.orders = {};
        
        const langPhases = phases[lang] || phases.en;
        
        Object.assign(content.orders, langPhases);

        fs.writeFileSync(filePath, JSON.stringify(content, null, 4), 'utf8');
        console.log(`Localized ${lang}.json`);
    }
}

localize().then(() => console.log('Localization Protocol Complete.'));
