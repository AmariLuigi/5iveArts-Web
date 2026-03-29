#!/usr/bin/env python3
"""
Batch-update all 12 dictionary files with custom success page strings.
Run from: z:\Projects\5ive Arts Web
Usage: python scripts/update_success_i18n.py
"""

import json
import os

DICTIONARIES_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "dictionaries")

# All 15 custom success keys with translations per language
CUSTOM_SUCCESS_KEYS = {
    "en": {
        "finalProtocol": "Final Protocol Solidified",
        "commissionProtocol": "Commission Confirmed",
        "acquisitionComplete": "Acquisition Phase: COMPLETE",
        "fabricationInitiated": "Fabrication Protocol Initiated",
        "logisticsLocked": "Logistics have been locked. Your artifact is being prepared for extraction.",
        "projectQueued": "Your project is now being queued in the Artisan Workshop.",
        "fabricationJournal": "Fabrication Journal",
        "balanceReconciled": "Balance Reconciled",
        "depositSecured": "Deposit Secured",
        "logisticsVerified": "Logistics investment and final artifact balance verified.",
        "depositVerified": "50% deposit confirmed — your commission is now active.",
        "extractionProtocol": "Extraction Protocol",
        "artisanForging": "Artisan Forging",
        "carrierHandoff": "Hand-off to logistical carrier initiated.",
        "productionQueue": "Your artifact has entered the production queue.",
        "vaultEntry": "Vault Entry Permitted",
        "recordsArchived": "Your fabrication records are archived in your account.",
        "viewProtocol": "View Fabrication Protocol"
    },
    "it": {
        "finalProtocol": "Protocollo Finale Consolidato",
        "commissionProtocol": "Commissione Confermata",
        "acquisitionComplete": "Fase di Acquisizione: COMPLETATA",
        "fabricationInitiated": "Protocollo di Fabbricazione Avviato",
        "logisticsLocked": "La logistica è stata bloccata. Il tuo artefatto è in preparazione per la spedizione.",
        "projectQueued": "Il tuo progetto è ora in coda nel laboratorio Artisan.",
        "fabricationJournal": "Diario di Fabbricazione",
        "balanceReconciled": "Saldo Riconciliato",
        "depositSecured": "Deposito Garantito",
        "logisticsVerified": "Investimento logistico e saldo finale dell'artefatto verificati.",
        "depositVerified": "50% di deposito confermato — la tua commissione è ora attiva.",
        "extractionProtocol": "Protocollo di Estrazione",
        "artisanForging": "Forgiatura Artigianale",
        "carrierHandoff": "Consegna al vettore logistico avviata.",
        "productionQueue": "Il tuo artefatto è entrato nella coda di produzione.",
        "vaultEntry": "Accesso al Vault Consentito",
        "recordsArchived": "I tuoi dati di fabbricazione sono archiviati nel tuo account.",
        "viewProtocol": "Visualizza Protocollo di Fabbricazione"
    },
    "es": {
        "finalProtocol": "Protocolo Final Consolidado",
        "commissionProtocol": "Comisión Confirmada",
        "acquisitionComplete": "Fase de Adquisición: COMPLETA",
        "fabricationInitiated": "Protocolo de Fabricación Iniciado",
        "logisticsLocked": "La logística ha sido bloqueada. Tu artefacto está siendo preparado para la extracción.",
        "projectQueued": "Tu proyecto está ahora en cola en el Taller Artesano.",
        "fabricationJournal": "Diario de Fabricación",
        "balanceReconciled": "Saldo Conciliado",
        "depositSecured": "Depósito Asegurado",
        "logisticsVerified": "Inversión logística y saldo final del artefacto verificados.",
        "depositVerified": "50% de depósito confirmado — tu comisión está ahora activa.",
        "extractionProtocol": "Protocolo de Extracción",
        "artisanForging": "Forja Artesanal",
        "carrierHandoff": "Entrega al transportista logístico iniciada.",
        "productionQueue": "Tu artefacto ha entrado en la cola de producción.",
        "vaultEntry": "Entrada al Vault Permitida",
        "recordsArchived": "Tus registros de fabricación están archivados en tu cuenta.",
        "viewProtocol": "Ver Protocolo de Fabricación"
    },
    "fr": {
        "finalProtocol": "Protocole Final Solidifié",
        "commissionProtocol": "Commission Confirmée",
        "acquisitionComplete": "Phase d'Acquisition: COMPLÈTE",
        "fabricationInitiated": "Protocole de Fabrication Lancé",
        "logisticsLocked": "La logistique est verrouillée. Votre artefact est en cours de préparation pour l'extraction.",
        "projectQueued": "Votre projet est maintenant en file d'attente dans l'Atelier Artisan.",
        "fabricationJournal": "Journal de Fabrication",
        "balanceReconciled": "Solde Réconcilié",
        "depositSecured": "Dépôt Sécurisé",
        "logisticsVerified": "Investissement logistique et solde final de l'artefact vérifiés.",
        "depositVerified": "50% de dépôt confirmé — votre commission est maintenant active.",
        "extractionProtocol": "Protocole d'Extraction",
        "artisanForging": "Forge Artisanale",
        "carrierHandoff": "Transfert au transporteur logistique initié.",
        "productionQueue": "Votre artefact est entré en file de production.",
        "vaultEntry": "Accès au Vault Autorisé",
        "recordsArchived": "Vos dossiers de fabrication sont archivés dans votre compte.",
        "viewProtocol": "Voir le Protocole de Fabrication"
    },
    "de": {
        "finalProtocol": "Endprotokoll Verfestigt",
        "commissionProtocol": "Auftrag Bestätigt",
        "acquisitionComplete": "Erwerbsphase: ABGESCHLOSSEN",
        "fabricationInitiated": "Fertigungsprotokoll Gestartet",
        "logisticsLocked": "Die Logistik wurde gesperrt. Ihr Artefakt wird für den Versand vorbereitet.",
        "projectQueued": "Ihr Projekt befindet sich nun in der Warteschlange der Handwerkswerkstatt.",
        "fabricationJournal": "Fertigungsprotokoll",
        "balanceReconciled": "Saldo Abgestimmt",
        "depositSecured": "Anzahlung Gesichert",
        "logisticsVerified": "Logistikinvestition und endgültiger Artefaktsaldo überprüft.",
        "depositVerified": "50% Anzahlung bestätigt — Ihr Auftrag ist jetzt aktiv.",
        "extractionProtocol": "Extraktionsprotokoll",
        "artisanForging": "Handwerksschmiede",
        "carrierHandoff": "Übergabe an den Logistikträger eingeleitet.",
        "productionQueue": "Ihr Artefakt ist in die Produktionswarteschlange eingetreten.",
        "vaultEntry": "Tresor-Zugang Gewährt",
        "recordsArchived": "Ihre Fertigungsdaten sind in Ihrem Konto archiviert.",
        "viewProtocol": "Fertigungsprotokoll Ansehen"
    },
    "ru": {
        "finalProtocol": "Финальный Протокол Закреплён",
        "commissionProtocol": "Комиссия Подтверждена",
        "acquisitionComplete": "Фаза Приобретения: ЗАВЕРШЕНА",
        "fabricationInitiated": "Протокол Изготовления Запущен",
        "logisticsLocked": "Логистика заблокирована. Ваш артефакт готовится к отправке.",
        "projectQueued": "Ваш проект теперь стоит в очереди в Мастерской.",
        "fabricationJournal": "Журнал Изготовления",
        "balanceReconciled": "Баланс Выверен",
        "depositSecured": "Депозит Обеспечен",
        "logisticsVerified": "Логистические инвестиции и итоговый баланс артефакта подтверждены.",
        "depositVerified": "50% депозит подтверждён — ваш заказ теперь активен.",
        "extractionProtocol": "Протокол Извлечения",
        "artisanForging": "Ремесленная Кузница",
        "carrierHandoff": "Передача логистическому перевозчику инициирована.",
        "productionQueue": "Ваш артефакт вступил в очередь производства.",
        "vaultEntry": "Доступ к Хранилищу Разрешён",
        "recordsArchived": "Ваши производственные записи архивированы в вашем аккаунте.",
        "viewProtocol": "Просмотр Протокола Изготовления"
    },
    "tr": {
        "finalProtocol": "Son Protokol Pekiştirildi",
        "commissionProtocol": "Sipariş Onaylandı",
        "acquisitionComplete": "Edinim Aşaması: TAMAMLANDI",
        "fabricationInitiated": "Üretim Protokolü Başlatıldı",
        "logisticsLocked": "Lojistik kilitlendi. Eserin nakliye için hazırlanıyor.",
        "projectQueued": "Projeniz şimdi Usta Atölyesi'nde sıraya alındı.",
        "fabricationJournal": "Üretim Günlüğü",
        "balanceReconciled": "Bakiye Mutabık Kılındı",
        "depositSecured": "Depozito Güvence Altına Alındı",
        "logisticsVerified": "Lojistik yatırım ve nihai eser bakiyesi doğrulandı.",
        "depositVerified": "%50 depozito onaylandı — siparişiniz artık aktif.",
        "extractionProtocol": "Çıkarma Protokolü",
        "artisanForging": "Usta Dövmeciliği",
        "carrierHandoff": "Lojistik taşıyıcıya devir başlatıldı.",
        "productionQueue": "Eseriniz üretim kuyruğuna girdi.",
        "vaultEntry": "Kasaya Giriş İzni Verildi",
        "recordsArchived": "Üretim kayıtlarınız hesabınızda arşivlendi.",
        "viewProtocol": "Üretim Protokolünü Görüntüle"
    },
    "pt": {
        "finalProtocol": "Protocolo Final Solidificado",
        "commissionProtocol": "Comissão Confirmada",
        "acquisitionComplete": "Fase de Aquisição: COMPLETA",
        "fabricationInitiated": "Protocolo de Fabricação Iniciado",
        "logisticsLocked": "A logística foi bloqueada. Seu artefato está sendo preparado para extração.",
        "projectQueued": "Seu projeto está agora na fila do Ateliê Artesanal.",
        "fabricationJournal": "Diário de Fabricação",
        "balanceReconciled": "Saldo Conciliado",
        "depositSecured": "Depósito Garantido",
        "logisticsVerified": "Investimento logístico e saldo final do artefato verificados.",
        "depositVerified": "50% de depósito confirmado — sua comissão agora está ativa.",
        "extractionProtocol": "Protocolo de Extração",
        "artisanForging": "Forja Artesanal",
        "carrierHandoff": "Entrega ao transportador logístico iniciada.",
        "productionQueue": "Seu artefato entrou na fila de produção.",
        "vaultEntry": "Acesso ao Vault Permitido",
        "recordsArchived": "Seus registros de fabricação estão arquivados em sua conta.",
        "viewProtocol": "Ver Protocolo de Fabricação"
    },
    "nl": {
        "finalProtocol": "Eindprotocol Vastgelegd",
        "commissionProtocol": "Opdracht Bevestigd",
        "acquisitionComplete": "Aankoopfase: VOLTOOID",
        "fabricationInitiated": "Fabricageprotocol Gestart",
        "logisticsLocked": "De logistiek is vergrendeld. Uw artefact wordt voorbereid voor verzending.",
        "projectQueued": "Uw project staat nu in de wachtrij van het Vakmanswerkplaats.",
        "fabricationJournal": "Fabricagelogboek",
        "balanceReconciled": "Saldo Vereffend",
        "depositSecured": "Aanbetaling Veiliggesteld",
        "logisticsVerified": "Logistieke investering en eindbalans artefact geverifieerd.",
        "depositVerified": "50% aanbetaling bevestigd — uw opdracht is nu actief.",
        "extractionProtocol": "Extractieprotocol",
        "artisanForging": "Vakmanssmedij",
        "carrierHandoff": "Overdracht aan logistiek vervoerder geïnitieerd.",
        "productionQueue": "Uw artefact is de productiewachtrij ingegaan.",
        "vaultEntry": "Toegang tot Kluis Verleend",
        "recordsArchived": "Uw fabricagegegevens zijn gearchiveerd in uw account.",
        "viewProtocol": "Fabricageprotocol Bekijken"
    },
    "ja": {
        "finalProtocol": "最終プロトコル確定",
        "commissionProtocol": "コミッションが確認されました",
        "acquisitionComplete": "取得フェーズ：完了",
        "fabricationInitiated": "製作プロトコル開始",
        "logisticsLocked": "物流がロックされました。アーティファクトは発送準備中です。",
        "projectQueued": "プロジェクトは職人工房のキューに入りました。",
        "fabricationJournal": "製作ジャーナル",
        "balanceReconciled": "残高が調整されました",
        "depositSecured": "デポジット確保",
        "logisticsVerified": "物流投資と最終アーティファクト残高が確認されました。",
        "depositVerified": "50%デポジット確認 — コミッションが有効になりました。",
        "extractionProtocol": "抽出プロトコル",
        "artisanForging": "職人の鍛造",
        "carrierHandoff": "物流キャリアへの引き渡しが開始されました。",
        "productionQueue": "アーティファクトが製作キューに入りました。",
        "vaultEntry": "ボールト入場許可",
        "recordsArchived": "製作記録がアカウントにアーカイブされました。",
        "viewProtocol": "製作プロトコルを表示"
    },
    "ar": {
        "finalProtocol": "البروتوكول النهائي راسخ",
        "commissionProtocol": "تم تأكيد الطلب",
        "acquisitionComplete": "مرحلة الاستحواذ: مكتملة",
        "fabricationInitiated": "بروتوكول التصنيع قيد التنفيذ",
        "logisticsLocked": "تم قفل اللوجستيات. قطعتك قيد التجهيز للشحن.",
        "projectQueued": "مشروعك الآن في قائمة الانتظار بورشة الحرفيين.",
        "fabricationJournal": "سجل التصنيع",
        "balanceReconciled": "تمت تسوية الرصيد",
        "depositSecured": "تم تأمين العربون",
        "logisticsVerified": "تم التحقق من الاستثمار اللوجستي والرصيد النهائي للقطعة.",
        "depositVerified": "تم تأكيد عربون 50% — طلبك نشط الآن.",
        "extractionProtocol": "بروتوكول الاستخراج",
        "artisanForging": "حدادة الحرفيين",
        "carrierHandoff": "تم بدء التسليم لشركة الشحن.",
        "productionQueue": "دخلت قطعتك قائمة الإنتاج.",
        "vaultEntry": "مسموح بالدخول إلى الخزينة",
        "recordsArchived": "سجلات التصنيع الخاصة بك مؤرشفة في حسابك.",
        "viewProtocol": "عرض بروتوكول التصنيع"
    },
    "pl": {
        "finalProtocol": "Protokół Końcowy Zatwierdzony",
        "commissionProtocol": "Zamówienie Potwierdzone",
        "acquisitionComplete": "Faza Nabycia: ZAKOŃCZONA",
        "fabricationInitiated": "Protokół Wytwarzania Zainicjowany",
        "logisticsLocked": "Logistyka została zablokowana. Twój artefakt jest przygotowywany do wysyłki.",
        "projectQueued": "Twój projekt jest teraz w kolejce w Warsztacie Rzemieślniczym.",
        "fabricationJournal": "Dziennik Wytwarzania",
        "balanceReconciled": "Saldo Uzgodnione",
        "depositSecured": "Depozyt Zabezpieczony",
        "logisticsVerified": "Inwestycja logistyczna i ostateczne saldo artefaktu zweryfikowane.",
        "depositVerified": "50% depozytu potwierdzone — Twoje zamówienie jest teraz aktywne.",
        "extractionProtocol": "Protokół Ekstrakcji",
        "artisanForging": "Rzemieślnicze Kucie",
        "carrierHandoff": "Przekazanie przewoźnikowi logistycznemu zainicjowane.",
        "productionQueue": "Twój artefakt wszedł do kolejki produkcyjnej.",
        "vaultEntry": "Dostęp do Skarbca Przyznany",
        "recordsArchived": "Twoje dane produkcyjne są zarchiwizowane na Twoim koncie.",
        "viewProtocol": "Wyświetl Protokół Wytwarzania"
    }
}

def update_dictionary(lang: str, translations: dict) -> None:
    path = os.path.join(DICTIONARIES_DIR, f"{lang}.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    if "success" not in data:
        data["success"] = {}
    
    for key, value in translations.items():
        data["success"][key] = value
    
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"  ✓ {lang}.json — {len(translations)} keys added to 'success'")

def main():
    print("Updating success page custom order strings across all 12 dictionaries...\n")
    for lang, translations in CUSTOM_SUCCESS_KEYS.items():
        update_dictionary(lang, translations)
    print(f"\nDone. {len(CUSTOM_SUCCESS_KEYS)} language files updated.")

if __name__ == "__main__":
    main()
