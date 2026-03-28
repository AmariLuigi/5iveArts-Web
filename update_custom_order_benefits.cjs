const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src', 'dictionaries');

const updates = {
    'en': {
        'benefit1_title': 'Verified Security',
        'benefit1_desc': 'End-to-end encrypted asset transfers and secure payment integration for every commission.',
        'benefit2_title': 'Progress Transparency',
        'benefit2_desc': 'Real-time visual records added to your personal vault throughout the fabrication lifecycle.',
        'benefit3_title': 'Artisan Control',
        'benefit3_desc': 'Direct collaboration with our lead curators to ensure your prototype meets museum-grade standards.'
    },
    'it': {
        'benefit1_title': 'Sicurezza Verificata',
        'benefit1_desc': 'Trasferimenti di asset crittografati end-to-end e integrazione dei pagamenti sicuri per ogni commissione.',
        'benefit2_title': 'Trasparenza dei Progressi',
        'benefit2_desc': 'Registrazioni visive in tempo reale aggiunte al tuo Vault personale durante tutto il ciclo di fabbricazione.',
        'benefit3_title': 'Controllo Artigianale',
        'benefit3_desc': 'Collaborazione diretta con i nostri lead curatori per garantire che il tuo prototipo rispetti gli standard museali.'
    },
    'es': {
        'benefit1_title': 'Seguridad Verificada',
        'benefit1_desc': 'Transferencias de activos cifradas de extremo a extremo e integración de pagos seguros para cada encargo.',
        'benefit2_title': 'Transparencia de Progreso',
        'benefit2_desc': 'Registros visuales en tiempo real añadidos a tu Vault personal durante todo el ciclo de fabricación.',
        'benefit3_title': 'Control Artesanal',
        'benefit3_desc': 'Colaboración directa con nuestros curadores principales para garantizar que tu prototipo cumpla con estándares de museo.'
    },
    'fr': {
        'benefit1_title': 'Sécurité Vérifiée',
        'benefit1_desc': 'Transferts d\'actifs chiffrés de bout en bout et intégration de paiements sécurisés pour chaque commande.',
        'benefit2_title': 'Transparence des Progrès',
        'benefit2_desc': 'Enregistrements visuels en temps réel ajoutés à votre Vault personnel tout au long du cycle de fabrication.',
        'benefit3_title': 'Contrôle Artisanal',
        'benefit3_desc': 'Collaboration directe avec nos conservateurs en chef pour garantir que votre prototype respecte les normes muséales.'
    },
    'de': {
        'benefit1_title': 'Verifizierte Sicherheit',
        'benefit1_desc': 'End-to-End verschlüsselte Asset-Transfers und sichere Zahlungsintegration für jede Kommission.',
        'benefit2_title': 'Fortschrittstransparenz',
        'benefit2_desc': 'Echtzeit-Bildaufzeichnungen, die während des gesamten Fertigungslebenszyklus in Ihren persönlichen Vault eingefügt werden.',
        'benefit3_title': 'Handwerkliche Kontrolle',
        'benefit3_desc': 'Direkte Zusammenarbeit mit unseren leitenden Kuratoren, um sicherzustellen, dass Ihr Prototyp Museumsstandards entspricht.'
    },
    'nl': {
        'benefit1_title': 'Geverifieerde Beveiliging',
        'benefit1_desc': 'End-to-end versleutelde overdrachten van activa en veilige betalingsintegratie voor elke opdracht.',
        'benefit2_title': 'Transparantie van Voortgang',
        'benefit2_desc': 'Real-time visuele verslagen toegevoegd aan uw persoonlijke Vault gedurende de hele fabricagecyclus.',
        'benefit3_title': 'Ambachtelijke Controle',
        'benefit3_desc': 'Directe samenwerking met onze curatoren om ervoor te zorgen dat uw prototype aan museumstandaarden voldoet.'
    },
    'pt': {
        'benefit1_title': 'Segurança Verificada',
        'benefit1_desc': 'Transferências de ativos criptografadas de ponta a ponta e integração de pagamentos seguros para cada encomenda.',
        'benefit2_title': 'Transparência de Progresso',
        'benefit2_desc': 'Registros visuais em tempo real adicionados ao seu Vault pessoal durante todo o ciclo de fabricação.',
        'benefit3_title': 'Controle Artesanal',
        'benefit3_desc': 'Colaboração direta com nossos curadores-chefe para garantir que seu protótipo atenda aos padrões de museu.'
    },
    'pl': {
        'benefit1_title': 'Zweryfikowane Bezpieczeństwo',
        'benefit1_desc': 'Szyfrowane przesyłanie zasobów od końca do końca i bezpieczna integracja płatności dla każdego zamówienia.',
        'benefit2_title': 'Przejrzystość Postępów',
        'benefit2_desc': 'Wizualne zapisy w czasie rzeczywistym dodawane do Twojego osobistego Vaulta przez cały cykl produkcyjny.',
        'benefit3_title': 'Kontrola Rzemieślnicza',
        'benefit3_desc': 'Bezpośrednia współpraca z naszymi głównymi kuratorami, aby zapewnić, że Twój prototyp spełnia standardy muzealne.'
    },
    'tr': {
        'benefit1_title': 'Doğrulanmış Güvenlik',
        'benefit1_desc': 'Her komisyon için uçtan uca şifrelenmiş varlık transferleri ve güvenli ödeme entegrasyonu.',
        'benefit2_title': 'İlerleme Şeffaflığı',
        'benefit2_desc': 'Üretim döngüsü boyunca kişisel Vault\'unuza eklenen gerçek zamanlı görsel kayıtlar.',
        'benefit3_title': 'Zanaatkar Kontrolü',
        'benefit3_desc': 'Prototipinizin müze standartlarını karşıladığından emin olmak için baş küratörlerimizle doğrudan işbirliği.'
    },
    'ru': {
        'benefit1_title': 'Проверенная безопасность',
        'benefit1_desc': 'Сквозное шифрование передачи активов и интеграция безопасных платежей для каждого заказа.',
        'benefit2_title': 'Прозрачность прогресса',
        'benefit2_desc': 'Визуальные записи в реальном времени, добавляемые в ваш личный Vault в течение всего цикла изготовления.',
        'benefit3_title': 'Авторский контроль',
        'benefit3_desc': 'Прямое сотрудничество с нашими ведущими кураторами, чтобы ваш прототип соответствовал музейным стандартам.'
    },
    'ja': {
        'benefit1_title': '検証済みのセキュリティ',
        'benefit1_desc': 'すべての依頼に対するエンドツーエンドの暗号化された資産転送と安全な支払い統合。',
        'benefit2_title': '進捗の透明性',
        'benefit2_desc': '製作ライフサイクル全体を通じて、個人のVaultにリアルタイムで追加される視覚的な記録。',
        'benefit3_title': '職人によるコントロール',
        'benefit3_desc': 'プロトタイプが展示会レベルの基準を満たすよう、主任キュレーターと直接連携します。'
    },
    'ar': {
        'benefit1_title': 'أمن معتمد',
        'benefit1_desc': 'نقل أصول مشفر من طرف إلى طرف وتكامل دفع آمن لكل عمولة.',
        'benefit2_title': 'شفافية التقدم',
        'benefit2_desc': 'سجلات مرئية في الوقت الفعلي تضاف إلى قبوك الشخصي طوال دورة حياة التصنيع.',
        'benefit3_title': 'تحكم حرفي',
        'benefit3_desc': 'تعاون مباشر مع كبار المنسقين لدينا لضمان تلبية النموذج الأولي الخاص بك لمعايير المتاحف.'
    }
};

Object.keys(updates).forEach(locale => {
    const filePath = path.join(targetDir, `${locale}.json`);
    if (fs.existsSync(filePath)) {
        let content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (content.custom_order) {
            content.custom_order.benefit1_title = updates[locale].benefit1_title;
            content.custom_order.benefit1_desc = updates[locale].benefit1_desc;
            content.custom_order.benefit2_title = updates[locale].benefit2_title;
            content.custom_order.benefit2_desc = updates[locale].benefit2_desc;
            content.custom_order.benefit3_title = updates[locale].benefit3_title;
            content.custom_order.benefit3_desc = updates[locale].benefit3_desc;
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
            console.log(`Updated benefits for ${locale}.json`);
        }
    }
});
