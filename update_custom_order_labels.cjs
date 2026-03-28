const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src', 'dictionaries');

// Updated to the exact locales present in the directory
const updates = {
    'it': {
        'step2_title': '2. Analisi di Fattibilità',
        'step2_desc': 'I nostri curatori valutano la densità geometrica e la complessità della pittura per un preventivo di precisione.'
    },
    'en': {
        'step2_title': '2. Complexity Appraisal',
        'step2_desc': 'Our curators evaluate geometric density and painting complexity for a precision quote.'
    },
    'es': {
        'step2_title': '2. Evaluación de Complejidad',
        'step2_desc': 'Nuestros curadores evalúan la densidad geométrica e la complejidad de la pintura para un presupuesto de precisión.'
    },
    'fr': {
        'step2_title': '2. Évaluation de la Complexité',
        'step2_desc': 'Nos conservateurs évaluent la densité géométrique et la complexité de la peinture pour un devis de précision.'
    },
    'de': {
        'step2_title': '2. Komplexitätsbewertung',
        'step2_desc': 'Unsere Kuratoren bewerten die geometrische Dichte und die Komplexität der Bemalung für ein präzises Angebot.'
    },
    'ja': {
        'step2_title': '2. 複雑さの評価',
        'step2_desc': '当社のキュレーターが、正確な見積もりのために幾何学的な密度と塗装の複雑さを評価します。'
    },
    'pt': {
        'step2_title': '2. Avaliação de Complexidade',
        'step2_desc': 'Nossos curadores avaliam a densidade geométrica e a complexidade da pintura para um orçamento de precisão.'
    },
    'ar': {
        'step2_title': '2. تقييم التعقيد',
        'step2_desc': 'يقوم المنسقون لدينا بتقييم الكثافة الهندسية وتعقيد الطلاء للحصول على عرض سعر دقيق.'
    },
    'ru': {
        'step2_title': '2. Оценка сложности',
        'step2_desc': 'Наши кураторы оценивают геометрическую плотность и сложность окраски для точного расчета стоимости.'
    },
    'nl': {
        'step2_title': '2. Complexiteitsbeoordeling',
        'step2_desc': 'Onze curatoren beoordelen de geometrische dichtheid en de complexiteit van het schilderwerk voor een nauwkeurige offerte.'
    },
    'pl': {
        'step2_title': '2. Ocena złożoności',
        'step2_desc': 'Nasi kuratorzy oceniają gęstość geometryczną i złożoność malowania w celu uzyskania precyzynej wyceny.'
    },
    'tr': {
        'step2_title': '2. Karmaşıklık Değerlendirmesi',
        'step2_desc': 'Küratörlerimiz, hassas bir teklif için geometrik yoğunluğu ve boyama karmaşıklığını değerlendirir.'
    }
};

Object.keys(updates).forEach(locale => {
    const filePath = path.join(targetDir, `${locale}.json`);
    if (fs.existsSync(filePath)) {
        let content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (content.custom_order) {
            content.custom_order.step2_title = updates[locale].step2_title;
            content.custom_order.step2_desc = updates[locale].step2_desc;
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
            console.log(`Updated ${locale}.json`);
        }
    }
});
