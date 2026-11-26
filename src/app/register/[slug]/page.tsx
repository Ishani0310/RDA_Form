"use client";

import React, { useState, useEffect, use } from "react";
import RegisterPage from "../page";
import {
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Printer,
  ExternalLink,
  RefreshCw,
  Send,
  HelpCircle,
  Copy,
  ArrowRight,
  Package,
  Truck,
  Plus,
  X,
  Users,
  Wrench,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { IQuestionnaireData, IFormSection, IFormQuestion } from "@/types/questionnaire";
import { SUPPLIER_MATERIALS } from "@/lib/questionnaire-types";

type Language = "en" | "si" | "ta";

const TRANSLATIONS = {
  en: {
    govSriLanka: "Government of Sri Lanka",
    rda: "Road Development Authority",
    formCode: "FORM 02",
    formTitle: "Materials, Labour & Equipment Supplier Registration",
    formDesc: "Official institutional questionnaire for materials, labour, and equipment suppliers under the Inclusive Connectivity and Development Project (ICDP).",
    instructions: "Please fill in all mandatory fields with verified institutional data. Once submitted, your registration reference will be immediately generated.",

    // Section 1
    sec1Title: "1. Supplier Organization & Contact Details",
    sec1Desc: "All three fields below are mandatory. Each organization must register using a unique email address.",
    q1Label: "1. Name of Supplier Organization / Company",
    q1Help: "Official registered corporate or commercial trading name.",
    q1Placeholder: "e.g., Lanka Asphalt & Aggregates (Pvt) Ltd",
    q2Label: "2. Organization Contact Telephone / Mobile Number",
    q2Help: "Active official contact number for institutional correspondence (e.g., +94 11 234 5678 or 077 123 4567).",
    q2Placeholder: "+94 11 234 5678 / 077 123 4567",
    q3Label: "3. Official Organization Email Address (Unique)",
    q3Help: "Primary verified email. Official registration confirmation and tracking reference will be dispatched to this address. Must be unique per supplier.",
    q3Placeholder: "e.g., supplier@organization.lk",
    emailUniqueNote: "Verified unique institutional email requirement enforced.",

    // Section 2
    sec2Title: "2. Supplier Details",
    sec2Desc: "Select your supplier category and provide specific operational capacity details.",
    supplierTypeLabel: "Supplier Type",
    supplierTypeHelp: "Please select the primary supply category provided by your organization (Material, Labour, or Equipment).",
    selectSupplierTypePrompt: "-- Select Supplier Type --",
    optMaterial: "Material (Bitumen, asphalt premix, aggregate, cement, steel, etc.)",
    optLabour: "Labour (Skilled/unskilled labour force, site crews, technical personnel)",
    optEquipment: "Equipment (Heavy machinery, pavers, rollers, excavators, transport fleet)",

    // Material Details
    matCallout: "Please provide details of the materials you supply and your production/supply capacity.",
    matSelectLabel: "Please select the material(s) you supply * (Multiple selection allowed)",
    materials: {
      "Bitumen / Asphalt": "Bitumen / Asphalt",
      "Sand": "Sand",
      "Cement": "Cement",
      "Aggregates": "Aggregates",
      "Steel": "Steel",
      "Soil": "Soil",
      "Other": "Other",
    } as Record<string, string>,
    specifyOther: "Specify Other Supplied Material(s) *",
    addMoreOtherPrompt: "Add one or more material types",
    otherPlaceholderFirst: "If Other, please specify your material type...",
    otherPlaceholderNext: "Additional material #",
    addAnotherMaterial: "Add another material",
    annualCapacityTitle: "Annual Supply Capacity & Rates",
    annualCapacityHelp: "Specify annual production or supply capacity with its unit (e.g. MT per year), and enter the unit rate with its selected unit.",
    colMaterial: "Material",
    colCapacity: "Annual Capacity (Quantity & Unit)",
    colRate: "Rate & Unit",
    quantityPlaceholder: "Quantity (e.g. 50,000)",
    unitPlaceholder: "Unit (e.g. MT per year)",
    ratePlaceholder: "Rate (e.g. 4,500)",

    // Labour Details
    labourCallout: "Please provide details of the labour categories supplied by your organization and available workforce capacity.",
    labourSelectLabel: "Please select the labour category(ies) you supply * (Multiple selection allowed)",
    labourCategories: {
      "Skilled": { label: "Skilled Labour", desc: "Certified masons, carpenters, bar benders, equipment operators, electricians, welders, etc." },
      "Semi-Skilled": { label: "Semi-Skilled Labour", desc: "Trades assistants, experienced site hands, machine attendants, concrete placement crew." },
      "Unskilled": { label: "Unskilled Labour", desc: "General manual construction labour, earthwork/excavation workforce, site clearing crew." },
    } as Record<string, { label: string; desc: string }>,
    labourCapacityTitle: "Workforce Capacity & Daily Rates",
    labourCapacityHelp: "Specify available personnel count, daily wage/rate (LKR per day), and key trades provided.",
    colLabourCategory: "Labour Category",
    colAvailableWorkforce: "Available Workforce (Personnel Count)",
    colDailyRate: "Daily Rate (LKR / Day)",
    colKeyTrades: "Key Trades / Specialization",
    workforcePlaceholder: "e.g. 25 workers",
    dailyRatePlaceholder: "e.g. 4,500 / day",
    tradesPlaceholder: "e.g. Masons, Carpenters",

    // Equipment Details
    equipCallout: "Please provide details of the construction machinery and equipment supplied by your organization, including capacity and available city/location.",
    equipInventoryTitle: "Equipment / Machinery Inventory",
    equipInventoryHelp: "Specify equipment name, capacity, and available city",
    colEquipName: "Equipment Name",
    colEquipCapacity: "Capacity",
    colEquipCity: "Available City",
    equipNamePlaceholder: "e.g. Excavator, Motor Grader, Asphalt Paver",
    equipCapacityPlaceholder: "e.g. 20 Ton, 1.2 cu.m, 200 HP",
    equipCityPlaceholder: "e.g. Colombo, Kandy, Kurunegala",
    addAnotherEquip: "Add Another Equipment",

    // Bottom
    govNotice: "Official Government Filing • Democratic Socialist Republic of Sri Lanka",
    submitBtn: "Submit Supplier Registration",
    submittingBtn: "Filing Registration...",
    copyright: "© 2026 Road Development Authority (RDA). Inclusive Connectivity and Development Project (ICDP).",

    // Receipt
    receiptTitle: "Thank You for Your Submission!",
    receiptDesc: "Your official supplier registration has been successfully recorded in the Road Development Authority system.",
    receiptVerified: "VERIFIED FILING",
    receiptRefPrompt: "Keep this official reference number for all institutional correspondence.",
    receiptOrgName: "Organization Name",
    receiptSupplierType: "Supplier Type",
    receiptContactNumber: "Contact Number",
    receiptEmail: "Registered Email",
    receiptTimestamp: "Filing Timestamp",
    receiptMaterials: "Materials Supplied",
    receiptLabour: "Labour Categories Supplied",
    receiptEquip: "Equipment / Machinery Supplied",
    receiptPrintBtn: "Print Official Receipt",
    receiptSubmitAnother: "Submit Another",
  },
  si: {
    govSriLanka: "ශ්‍රී ලංකා රජය",
    rda: "මාර්ග සංවර්ධන අධිකාරිය",
    formCode: "ආකෘති පත්‍රය 02",
    formTitle: "ද්‍රව්‍ය, ශ්‍රම සහ උපකරණ සැපයුම්කරුවන් ලියාපදිංචි කිරීම",
    formDesc: "අන්තර්කරණීය සම්බන්ධතා සහ සංවර්ධන ව්‍යාපෘතිය (ICDP) යටතේ ද්‍රව්‍ය, ශ්‍රම සහ උපකරණ සැපයුම්කරුවන් ලියාපදිංචි කිරීමේ නිල ආකෘති පත්‍රය.",
    instructions: "කරුණාකර සියලුම අනිවාර්ය ක්ෂේත්‍ර නිවැරදි ආයතනික තොරතුරු සහිතව පුරවන්න. ඉදිරිපත් කළ පසු ඔබගේ නිල ලියාපදිංචි යොමු අංකය වහාම නිකුත් කෙරේ.",

    // Section 1
    sec1Title: "1. සැපයුම්කරු ආයතනික සහ සබඳතා තොරතුරු",
    sec1Desc: "පහත දැක්වෙන සියලුම තොරතුරු අනිවාර්ය වේ. එක් එක් ආයතනය අනන්‍ය විද්‍යුත් තැපැල් ලිපිනයක් භාවිතා කළ යුතුය.",
    q1Label: "1. සැපයුම්කරු ආයතනයේ / සමාගමේ නම",
    q1Help: "නිල වශයෙන් ලියාපදිංචි කළ ආයතනික හෝ වෙළඳ නාමය.",
    q1Placeholder: "උදා: ලංකා ඇස්ෆෝල්ට් ඇන්ඩ් ඇග්‍රිගේට්ස් (පුද්) සමාගම",
    q2Label: "2. ආයතනික දුරකථන / ජංගම දුරකථන අංකය",
    q2Help: "නිල ලිපිගනුදෙනු සඳහා වලංගු දුරකථන අංකය (උදා: +94 11 234 5678 හෝ 077 123 4567).",
    q2Placeholder: "+94 11 234 5678 / 077 123 4567",
    q3Label: "3. නිල ආයතනික විද්‍යුත් තැපැල් ලිපිනය (අනන්‍ය)",
    q3Help: "ප්‍රධාන විද්‍යුත් තැපැල් ලිපිනය. නිල ලියාපදිංචි කිරීමේ තහවුරු කිරීම සහ යොමු අංකය මෙම ලිපිනයට එවනු ලැබේ. එක් එක් සැපයුම්කරු සඳහා අනන්‍ය විය යුතුය.",
    q3Placeholder: "උදා: supplier@organization.lk",
    emailUniqueNote: "සත්‍යාපිත අනන්‍ය ආයතනික විද්‍යුත් තැපෑල අනිවාර්ය වේ.",

    // Section 2
    sec2Title: "2. සැපයුම්කරුගේ තොරතුරු",
    sec2Desc: "ඔබගේ සැපයුම්කරු කාණ්ඩය තෝරා මෙහෙයුම් ධාරිතාව පිළිබඳ නිශ්චිත තොරතුරු සපයන්න.",
    supplierTypeLabel: "සැපයුම්කරු වර්ගය",
    supplierTypeHelp: "කරුණාකර ඔබගේ ආයතනය සපයන ප්‍රධාන සැපයුම් කාණ්ඩය තෝරන්න (ද්‍රව්‍ය, ශ්‍රමය, හෝ උපකරණ).",
    selectSupplierTypePrompt: "-- සැපයුම්කරු වර්ගය තෝරන්න --",
    optMaterial: "ද්‍රව්‍ය (බිටුමින්, ඇස්ෆෝල්ට් ප්‍රිමික්ස්, ඇග්‍රිගේට්ස්, සිමෙන්ති, වානේ, ආදිය)",
    optLabour: "ශ්‍රමය (පුහුණු/නුපුහුණු ශ්‍රම බලකාය, වැඩබිම් සේවකයින්, කාර්මික ශිල්පීන්)",
    optEquipment: "උපකරණ (බර යන්ත්‍රෝපකරණ, පේවර්, රෝලර්, එක්ස්කැවේටර්, ප්‍රවාහන රථ)",

    // Material Details
    matCallout: "ඔබ සපයන ද්‍රව්‍ය සහ ඔබගේ නිෂ්පාදන/සැපයුම් ධාරිතාව පිළිබඳ විස්තර සපයන්න.",
    matSelectLabel: "කරුණාකර ඔබ සපයන ද්‍රව්‍ය තෝරන්න * (බහුවිධ තේරීම් කළ හැක)",
    materials: {
      "Bitumen / Asphalt": "බිටුමින් / ඇස්ෆෝල්ට්",
      "Sand": "වැලි",
      "Cement": "සිමෙන්ති",
      "Aggregates": "ගල් / ඇග්‍රිගේට්ස්",
      "Steel": "වානේ / කම්බි",
      "Soil": "පස්",
      "Other": "වෙනත්",
    } as Record<string, string>,
    specifyOther: "වෙනත් සපයන ද්‍රව්‍ය සඳහන් කරන්න *",
    addMoreOtherPrompt: "ද්‍රව්‍ය වර්ග එකක් හෝ කිහිපයක් එක් කරන්න",
    otherPlaceholderFirst: "වෙනත් නම්, කරුණාකර ඔබගේ ද්‍රව්‍ය වර්ගය සඳහන් කරන්න...",
    otherPlaceholderNext: "අමතර ද්‍රව්‍යය #",
    addAnotherMaterial: "තවත් ද්‍රව්‍යයක් එක් කරන්න",
    annualCapacityTitle: "වාර්ෂික සැපයුම් ධාරිතාව සහ මිල ගණන්",
    annualCapacityHelp: "ඒකකය සමඟ වාර්ෂික නිෂ්පාදන හෝ සැපයුම් ධාරිතාව සඳහන් කරන්න (උදා: මෙ.ටොන්/වසරකට), සහ තෝරාගත් ඒකකයට අදාළ මිල සඳහන් කරන්න.",
    colMaterial: "ද්‍රව්‍යය",
    colCapacity: "වාර්ෂික ධාරිතාව (ප්‍රමාණය සහ ඒකකය)",
    colRate: "මිල සහ ඒකකය",
    quantityPlaceholder: "ප්‍රමාණය (උදා: 50,000)",
    unitPlaceholder: "ඒකකය (උදා: මෙ.ටොන්/වසරකට)",
    ratePlaceholder: "මිල (උදා: 4,500)",

    // Labour Details
    labourCallout: "ඔබගේ ආයතනය සපයන ශ්‍රම කාණ්ඩ සහ පවතින ශ්‍රම බලකා ධාරිතාව පිළිබඳ විස්තර සපයන්න.",
    labourSelectLabel: "කරුණාකර ඔබ සපයන ශ්‍රම කාණ්ඩ තෝරන්න * (බහුවිධ තේරීම් කළ හැක)",
    labourCategories: {
      "Skilled": { label: "පුහුණු ශ්‍රමය", desc: "සහතිකලත් මේසන්වරුන්, වඩු කාර්මිකයින්, බාර් බෙන්ඩර්වරුන්, යන්ත්‍ර ක්‍රියාකරුවන්, විදුලි කාර්මිකයින් ආදී." },
      "Semi-Skilled": { label: "අර්ධ පුහුණු ශ්‍රමය", desc: "වෘත්තීය සහයකයින්, පළපුරුදු වැඩබිම් සේවකයින්, යන්ත්‍ර සහයකයින්, කොන්ක්‍රීට් කණ්ඩායම්." },
      "Unskilled": { label: "නුපුහුණු ශ්‍රමය", desc: "සාමාන්‍ය ඉදිකිරීම් ශ්‍රමිකයින්, පස් කැපීමේ/හාරීමේ ශ්‍රමිකයින්, වැඩබිම් පිරිසිදු කිරීමේ සේවකයින්." },
    } as Record<string, { label: string; desc: string }>,
    labourCapacityTitle: "ශ්‍රම බලකා ධාරිතාව සහ දෛනික වැටුප්",
    labourCapacityHelp: "පවතින සේවක සංඛ්‍යාව, දෛනික වැටුප (රුපියල් වලින්), සහ සපයන ප්‍රධාන වෘත්තීන් සඳහන් කරන්න.",
    colLabourCategory: "ශ්‍රම කාණ්ඩය",
    colAvailableWorkforce: "පවතින සේවක සංඛ්‍යාව (පුද්ගල සංඛ්‍යාව)",
    colDailyRate: "දෛනික වැටුප (රු. / දිනකට)",
    colKeyTrades: "ප්‍රධාන වෘත්තීන් / විශේෂඥතා",
    workforcePlaceholder: "උදා: සේවකයින් 25",
    dailyRatePlaceholder: "උදා: 4,500 / දිනකට",
    tradesPlaceholder: "උදා: මේසන්, වඩු කාර්මික",

    // Equipment Details
    equipCallout: "ඔබගේ ආයතනය සපයන ඉදිකිරීම් යන්ත්‍රෝපකරණ සහ උපකරණ, ඒවායේ ධාරිතාව සහ පවතින නගරය පිළිබඳ විස්තර සපයන්න.",
    equipInventoryTitle: "උපකරණ / යන්ත්‍රෝපකරණ ලැයිස්තුව",
    equipInventoryHelp: "උපකරණයේ නම, ධාරිතාව සහ පවතින නගරය සඳහන් කරන්න",
    colEquipName: "උපකරණයේ නම",
    colEquipCapacity: "ධාරිතාව",
    colEquipCity: "පවතින නගරය",
    equipNamePlaceholder: "උදා: එක්ස්කැවේටර්, මෝටර් ග්‍රේඩර්, ඇස්ෆෝල්ට් පේවර්",
    equipCapacityPlaceholder: "උදා: ටොන් 20, ඝන මීටර් 1.2, අශ්වබල 200",
    equipCityPlaceholder: "උදා: කොළඹ, මහනුවර, කුරුණෑගල",
    addAnotherEquip: "වෙනත් උපකරණයක් එක් කරන්න",

    // Bottom
    govNotice: "නිල රජයේ ලේඛනගත කිරීම • ශ්‍රී ලංකා ප්‍රජාතාන්ත්‍රික සමාජවාදී ජනරජය",
    submitBtn: "සැපයුම්කරු ලියාපදිංචිය ඉදිරිපත් කරන්න",
    submittingBtn: "ලියාපදිංචි කරමින් පවතී...",
    copyright: "© 2026 මාර්ග සංවර්ධන අධිකාරිය (RDA). අන්තර්කරණීය සම්බන්ධතා සහ සංවර්ධන ව්‍යාපෘතිය (ICDP).",

    // Receipt
    receiptTitle: "ඔබගේ ලියාපදිංචිය සාර්ථකයි!",
    receiptDesc: "ඔබගේ නිල සැපයුම්කරු ලියාපදිංචිය මාර්ග සංවර්ධන අධිකාරී පද්ධතියෙහි සාර්ථකව සටහන් කර ඇත.",
    receiptVerified: "සත්‍යාපිත ලියාපදිංචිය",
    receiptRefPrompt: "සියලුම ආයතනික ලිපිගනුදෙනු සඳහා මෙම නිල යොමු අංකය සුරක්ෂිතව තබා ගන්න.",
    receiptOrgName: "ආයතනයේ නම",
    receiptSupplierType: "සැපයුම්කරු වර්ගය",
    receiptContactNumber: "දුරකථන අංකය",
    receiptEmail: "ලියාපදිංචි විද්‍යුත් තැපෑල",
    receiptTimestamp: "ලියාපදිංචි කළ වේලාව",
    receiptMaterials: "සපයන ද්‍රව්‍ය",
    receiptLabour: "සපයන ශ්‍රම කාණ්ඩ",
    receiptEquip: "සපයන උපකරණ / යන්ත්‍රෝපකරණ",
    receiptPrintBtn: "නිල රිසිට්පත මුද්‍රණය කරන්න",
    receiptSubmitAnother: "වෙනත් ලියාපදිංචියක් සිදු කරන්න",
  },
  ta: {
    govSriLanka: "இலங்கை அரசாங்கம்",
    rda: "வீதி அபிவிருத்தி அதிகாரசபை",
    formCode: "படிவம் 02",
    formTitle: "பொருட்கள், தொழிலாளர் மற்றும் உபகரண விநியோகஸ்தர் பதிவு",
    formDesc: "உள்ளடக்கிய இணைப்பு மற்றும் அபிவிருத்தி திட்டத்தின் (ICDP) கீழ் பொருட்கள், தொழிலாளர் மற்றும் உபகரண விநியோகஸ்தர்களுக்கான உத்தியோகபூர்வ பதிவு படிவம்.",
    instructions: "அனைத்து கட்டாய புலங்களையும் சரியான நிறுவன விபரங்களுடன் நிரப்பவும். சமர்ப்பித்தவுடன் உங்கள் பதிவு குறிப்பு எண் உடனடியாக வழங்கப்படும்.",

    // Section 1
    sec1Title: "1. விநியோகஸ்தர் நிறுவனம் மற்றும் தொடர்பு விபரங்கள்",
    sec1Desc: "கீழே உள்ள மூன்று புலங்களும் கட்டாயமாகும். ஒவ்வொரு நிறுவனமும் தனிப்பட்ட மின்னஞ்சல் முகவரியைப் பயன்படுத்த வேண்டும்.",
    q1Label: "1. விநியோகஸ்தர் நிறுவனத்தின் / வர்த்தகப் பெயர்",
    q1Help: "உத்தியோகபூர்வமாக பதிவு செய்யப்பட்ட நிறுவன அல்லது வர்த்தக பெயர்.",
    q1Placeholder: "உதா: லங்கா அஸ்பால்ட் & அக்ரிகேட்ஸ் (பிரைவேட்) லிமிடெட்",
    q2Label: "2. நிறுவன தொடர்பு தொலைபேசி / கைபேசி எண்",
    q2Help: "உத்தியோகபூர்வ தொடர்புகளுக்கான தொலைபேசி எண் (உதா: +94 11 234 5678 அல்லது 077 123 4567).",
    q2Placeholder: "+94 11 234 5678 / 077 123 4567",
    q3Label: "3. உத்தியோகபூர்வ மின்னஞ்சல் முகவரி (தனித்துவமானது)",
    q3Help: "முக்கிய மின்னஞ்சல் முகவரி. உத்தியோகபூர்வ உறுதிப்படுத்தல் மற்றும் குறிப்பு எண் இந்த முகவரிக்கு அனுப்பப்படும். ஒவ்வொரு விநியோகஸ்தருக்கும் தனித்துவமாக இருக்க வேண்டும்.",
    q3Placeholder: "உதா: supplier@organization.lk",
    emailUniqueNote: "சரிபார்க்கப்பட்ட தனித்துவமான நிறுவன மின்னஞ்சல் அவசியம்.",

    // Section 2
    sec2Title: "2. விநியோகஸ்தர் விபரங்கள்",
    sec2Desc: "உங்கள் விநியோகஸ்தர் வகையைத் தேர்ந்தெடுத்து விபரங்களை வழங்கவும்.",
    supplierTypeLabel: "விநியோகஸ்தர் வகை",
    supplierTypeHelp: "உங்கள் நிறுவனம் வழங்கும் முதன்மை விநியோக வகையைத் தேர்ந்தெடுக்கவும் (பொருட்கள், தொழிலாளர் அல்லது உபகரணங்கள்).",
    selectSupplierTypePrompt: "-- விநியோகஸ்தர் வகையைத் தேர்ந்தெடுக்கவும் --",
    optMaterial: "பொருட்கள் (பிற்றுமின், நிலக்கீல், மணல், சீமெந்து, எஃகு போன்றவை)",
    optLabour: "தொழிலாளர் (திறமையான/திறமையற்ற தொழிலாளர்கள், தளப் பணியாளர்கள்)",
    optEquipment: "உபகரணங்கள் (கனரக இயந்திரங்கள், பேவர்கள், ரோலர்கள், அகழ்வாராய்ச்சிகள்)",

    // Material Details
    matCallout: "நீங்கள் வழங்கும் பொருட்கள் மற்றும் உங்கள் உற்பத்தி/விநியோக திறன் பற்றிய விபரங்களை வழங்கவும்.",
    matSelectLabel: "நீங்கள் வழங்கும் பொருள்(களை) தேர்ந்தெடுக்கவும் * (ஒன்றுக்கு மேற்பட்ட தேர்வு அனுமதிக்கப்படுகிறது)",
    materials: {
      "Bitumen / Asphalt": "பிற்றுமின் / நிலக்கீல்",
      "Sand": "மணல்",
      "Cement": "சீமெந்து",
      "Aggregates": "சரளை / அக்ரிகேட்ஸ்",
      "Steel": "எஃகு (ஸ்டீல்)",
      "Soil": "மண்",
      "Other": "பிற",
    } as Record<string, string>,
    specifyOther: "பிற வழங்கப்பட்ட பொருள்(களை) குறிப்பிடவும் *",
    addMoreOtherPrompt: "ஒன்று அல்லது அதற்கு மேற்பட்ட பொருள் வகைகளைச் சேர்க்கவும்",
    otherPlaceholderFirst: "பிற என்றால், தயவுசெய்து உங்கள் பொருள் வகையைக் குறிப்பிடவும்...",
    otherPlaceholderNext: "கூடுதல் பொருள் #",
    addAnotherMaterial: "மற்றொரு பொருளைச் சேர்க்கவும்",
    annualCapacityTitle: "வருடாந்த விநியோக திறன் மற்றும் கட்டணங்கள்",
    annualCapacityHelp: "வருடாந்த உற்பத்தி அல்லது விநியோக திறனை அதன் அலகுகளுடன் குறிப்பிடவும், தேர்ந்தெடுக்கப்பட்ட அலகிற்கான கட்டணத்தை உள்ளிடவும்.",
    colMaterial: "பொருள்",
    colCapacity: "வருடாந்த திறன் (அளவு & அலகு)",
    colRate: "கட்டணம் & அலகு",
    quantityPlaceholder: "அளவு (உதா: 50,000)",
    unitPlaceholder: "அலகு (உதா: MT/வருடம்)",
    ratePlaceholder: "கட்டணம் (உதா: 4,500)",

    // Labour Details
    labourCallout: "உங்கள் நிறுவனம் வழங்கும் தொழிலாளர் பிரிவுகள் மற்றும் கிடைக்கக்கூடிய பணியாளர்களின் விபரங்களை வழங்கவும்.",
    labourSelectLabel: "நீங்கள் வழங்கும் தொழிலாளர் பிரிவை தேர்ந்தெடுக்கவும் * (ஒன்றுக்கு மேற்பட்ட தேர்வு அனுமதிக்கப்படுகிறது)",
    labourCategories: {
      "Skilled": { label: "திறமையான தொழிலாளர்", desc: "மேசன், தச்சர், பார் பெண்டர், இயந்திர ஆபரேட்டர்கள், எலக்ட்ரீஷியன்கள் போன்றவை." },
      "Semi-Skilled": { label: "அரை-திறமையான தொழிலாளர்", desc: "தொழில் உதவியாளர்கள், அனுபவமிக்க தளப் பணியாளர்கள், கான்கிரீட் குழு." },
      "Unskilled": { label: "திறமையற்ற தொழிலாளர்", desc: "பொது கட்டுமானத் தொழிலாளர்கள், மண் அகழ்வுப் பணியாளர்கள், தள துப்புரவுப் பணியாளர்கள்." },
    } as Record<string, { label: string; desc: string }>,
    labourCapacityTitle: "பணியாளர் திறன் மற்றும் தினசரி கட்டணங்கள்",
    labourCapacityHelp: "கிடைக்கக்கூடிய பணியாளர்களின் எண்ணிக்கை, தினசரி ஊதியம் மற்றும் முக்கிய தொழில்களைக் குறிப்பிடவும்.",
    colLabourCategory: "தொழிலாளர் பிரிவு",
    colAvailableWorkforce: "கிடைக்கும் பணியாளர்கள் (எண்ணிக்கை)",
    colDailyRate: "தினசரி கட்டணம் (ரூ. / நாள்)",
    colKeyTrades: "முக்கிய தொழில்கள் / நிபுணத்துவம்",
    workforcePlaceholder: "உதா: 25 தொழிலாளர்கள்",
    dailyRatePlaceholder: "உதா: 4,500 / நாள்",
    tradesPlaceholder: "உதா: மேசன், தச்சர்",

    // Equipment Details
    equipCallout: "உங்கள் நிறுவனம் வழங்கும் கட்டுமான இயந்திரங்கள் மற்றும் உபகரணங்களின் திறன் மற்றும் கிடைக்கும் நகரம் பற்றிய விபரங்களை வழங்கவும்.",
    equipInventoryTitle: "உபகரணங்கள் / இயந்திரங்களின் பட்டியல்",
    equipInventoryHelp: "உபகரணத்தின் பெயர், திறன் மற்றும் கிடைக்கும் நகரத்தைக் குறிப்பிடவும்",
    colEquipName: "உபகரணத்தின் பெயர்",
    colEquipCapacity: "திறன்",
    colEquipCity: "கிடைக்கும் நகரம்",
    equipNamePlaceholder: "உதா: அகழ்வாராய்ச்சி (Excavator), பேவர் (Paver)",
    equipCapacityPlaceholder: "உதா: 20 டன், 1.2 cu.m, 200 HP",
    equipCityPlaceholder: "உதா: கொழும்பு, கண்டி, குருநாகல்",
    addAnotherEquip: "மற்றொரு உபகரணத்தைச் சேர்க்கவும்",

    // Bottom
    govNotice: "உத்தியோகபூர்வ அரச பதிவு • இலங்கை ஜனநாயக சோசலிச குடியரசு",
    submitBtn: "விநியோகஸ்தர் பதிவை சமர்ப்பிக்கவும்",
    submittingBtn: "பதிவு செய்யப்படுகிறது...",
    copyright: "© 2026 வீதி அபிவிருத்தி அதிகாரசபை (RDA). உள்ளடக்கிய இணைப்பு மற்றும் அபிவிருத்தி திட்டம் (ICDP).",

    // Receipt
    receiptTitle: "உங்கள் சமர்ப்பிப்பிற்கு நன்றி!",
    receiptDesc: "உங்கள் உத்தியோகபூர்வ விநியோகஸ்தர் பதிவு வீதி அபிவிருத்தி அதிகாரசபை அமைப்பில் வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளது.",
    receiptVerified: "சரிபார்க்கப்பட்ட பதிவு",
    receiptRefPrompt: "அனைத்து உத்தியோகபூர்வ தொடர்புகளுக்கும் இந்த குறிப்பு எண்ணை வைத்திருக்கவும்.",
    receiptOrgName: "நிறுவனத்தின் பெயர்",
    receiptSupplierType: "விநியோகஸ்தர் வகை",
    receiptContactNumber: "தொடர்பு எண்",
    receiptEmail: "பதிவு செய்யப்பட்ட மின்னஞ்சல்",
    receiptTimestamp: "பதிவு செய்த நேரம்",
    receiptMaterials: "வழங்கப்படும் பொருட்கள்",
    receiptLabour: "வழங்கப்படும் தொழிலாளர் பிரிவுகள்",
    receiptEquip: "வழங்கப்படும் உபகரணங்கள்",
    receiptPrintBtn: "உத்தியோகபூர்வ ரசீதை அச்சிடுக",
    receiptSubmitAnother: "மற்றொரு பதிவைச் சமர்ப்பிக்கவும்",
  },
};

const LABOUR_CATEGORIES = [
  {
    id: "Skilled",
    label: "Skilled Labour",
    description: "Certified masons, carpenters, bar benders, equipment operators, electricians, welders, etc.",
  },
  {
    id: "Semi-Skilled",
    label: "Semi-Skilled Labour",
    description: "Trades assistants, experienced site hands, machine attendants, concrete placement crew.",
  },
  {
    id: "Unskilled",
    label: "Unskilled Labour",
    description: "General manual construction labour, earthwork/excavation workforce, site clearing crew.",
  },
] as const;

interface DynamicRegistrationPageProps {
  params: Promise<{ slug: string }>;
}

export default function DynamicRegistrationPage({ params }: DynamicRegistrationPageProps) {
  const resolvedParams = use(params);
  const slug = (resolvedParams.slug || "").trim().toLowerCase();

  // If the slug is 'contractor', strictly preserve and render Form 1
  if (slug === "contractor" || !slug) {
    return <RegisterPage />;
  }

  return <CustomFormRegistrationPortal slug={slug} />;
}

function CustomFormRegistrationPortal({ slug }: { slug: string }) {
  const [lang, setLang] = useState<Language>("en");
  const t = TRANSLATIONS[lang];

  const [questionnaire, setQuestionnaire] = useState<IQuestionnaireData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Field values state
  const [formData, setFormData] = useState<Record<string, any>>({
    organizationName: "",
    contactNumber: "",
    email: "",
    supplierType: "",
    materialsSupplied: [] as string[],
    materialsOther: "",
    supplyCapacities: {} as Record<string, any>,
    labourCategories: [] as string[],
    labourDetails: {} as Record<string, any>,
    equipmentList: [{ name: "", capacity: "", availableCity: "" }],
  });
  const [supplierMaterialsOtherList, setSupplierMaterialsOtherList] = useState<string[]>([""]);

  // Validation errors state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailUniqueError, setEmailUniqueError] = useState<string | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    reference: string;
    organizationName: string;
    contactNumber: string;
    email: string;
    supplierType?: string;
    materialsSupplied?: string[];
    labourCategories?: string[];
    equipmentList?: Array<{ name: string; capacity?: string; availableCity?: string }>;
    submittedAt: string;
  } | null>(null);

  // Fetch form schema
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/public/questionnaire?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.questionnaire) {
          setQuestionnaire(d.questionnaire);
        } else {
          setError(d.message || "Failed to load registration form.");
        }
      })
      .catch(() => setError("Network error loading registration form."))
      .finally(() => setLoading(false));
  }, [slug]);

  // Handle value change
  const handleChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[fieldId];
        return updated;
      });
    }
    if (fieldId === "email" && emailUniqueError) {
      setEmailUniqueError(null);
    }
  };

  // Handle materials toggle for material supplier
  const handleMaterialToggle = (mat: string) => {
    setFormData((prev) => {
      const currentList: string[] = prev.materialsSupplied || [];
      const updated = currentList.includes(mat)
        ? currentList.filter((m) => m !== mat)
        : [...currentList, mat];
      return { ...prev, materialsSupplied: updated };
    });
    if (fieldErrors.materialsSupplied) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.materialsSupplied;
        return copy;
      });
    }
  };

  const handleAddSupplierMaterialOther = () => {
    setSupplierMaterialsOtherList((prev) => [...prev, ""]);
  };

  const handleRemoveSupplierMaterialOther = (index: number) => {
    setSupplierMaterialsOtherList((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      const combined = updated.map((s) => s.trim()).filter(Boolean).join(", ");
      setFormData((f) => ({ ...f, materialsOther: combined }));
      return updated.length > 0 ? updated : [""];
    });
  };

  const handleUpdateSupplierMaterialOther = (index: number, val: string) => {
    setSupplierMaterialsOtherList((prev) => {
      const updated = [...prev];
      updated[index] = val;
      const combined = updated.map((s) => s.trim()).filter(Boolean).join(", ");
      setFormData((f) => ({ ...f, materialsOther: combined }));
      return updated;
    });
  };

  // Handle capacity changes
  const handleCapacityChange = (matKey: string, field: string, val: string) => {
    setFormData((prev) => {
      const caps = { ...(prev.supplyCapacities || {}) };
      caps[matKey] = {
        ...(caps[matKey] || { quantity: "", unit: "MT per year", rate: "", rateUnit: "cu.m" }),
        [field]: val,
      };
      return { ...prev, supplyCapacities: caps };
    });
  };

  // Handle labour categories toggle
  const handleLabourCategoryToggle = (catId: string) => {
    setFormData((prev) => {
      const currentList: string[] = prev.labourCategories || [];
      const updated = currentList.includes(catId)
        ? currentList.filter((c) => c !== catId)
        : [...currentList, catId];
      return { ...prev, labourCategories: updated };
    });
    if (fieldErrors.labourCategories) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.labourCategories;
        return copy;
      });
    }
  };

  // Handle labour category details
  const handleLabourDetailChange = (catId: string, field: string, val: string) => {
    setFormData((prev) => {
      const currentDetails = { ...(prev.labourDetails || {}) };
      currentDetails[catId] = {
        ...(currentDetails[catId] || { count: "", rate: "", trades: "" }),
        [field]: val,
      };
      return { ...prev, labourDetails: currentDetails };
    });
  };

  // Handle equipment management
  const handleAddEquipment = () => {
    setFormData((prev) => ({
      ...prev,
      equipmentList: [...(prev.equipmentList || []), { name: "", capacity: "", availableCity: "" }],
    }));
  };

  const handleRemoveEquipment = (index: number) => {
    setFormData((prev) => {
      const list = [...(prev.equipmentList || [])];
      const updated = list.filter((_, idx) => idx !== index);
      return {
        ...prev,
        equipmentList: updated.length > 0 ? updated : [{ name: "", capacity: "", availableCity: "" }],
      };
    });
  };

  const handleEquipmentChange = (index: number, field: "name" | "capacity" | "availableCity", val: string) => {
    setFormData((prev) => {
      const list = [...(prev.equipmentList || [{ name: "", capacity: "", availableCity: "" }])];
      list[index] = { ...list[index], [field]: val };
      return { ...prev, equipmentList: list };
    });
    if (fieldErrors.equipmentList) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.equipmentList;
        return copy;
      });
    }
  };

  // Real-time unique email check on blur
  const handleEmailBlur = async () => {
    const rawEmail = (formData.email || "").trim().toLowerCase();
    if (!rawEmail) return;

    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail)) {
      setFieldErrors((prev) => ({ ...prev, email: "Please enter a valid email address (e.g. name@domain.com)." }));
      return;
    }

    setCheckingEmail(true);
    try {
      const res = await fetch(`/api/public/check-email?email=${encodeURIComponent(rawEmail)}&slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (!data.available) {
        setEmailUniqueError(data.message || "This email address has already been used for an official registration. Email must be unique.");
      } else {
        setEmailUniqueError(null);
      }
    } catch {
      // Ignore network hiccup on check
    } finally {
      setCheckingEmail(false);
    }
  };

  // Validate all fields
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    // 1. Organization Name
    const org = (formData.organizationName || "").trim();
    if (!org) {
      errors.organizationName = "Organization / Company name is required.";
    } else if (org.length < 3) {
      errors.organizationName = "Organization name must be at least 3 characters.";
    } else if (org.length > 200) {
      errors.organizationName = "Organization name cannot exceed 200 characters.";
    }

    // 2. Phone Number
    const phone = (formData.contactNumber || "").trim();
    if (!phone) {
      errors.contactNumber = "Organization contact phone number is required.";
    } else {
      const digitsOnly = phone.replace(/[^0-9]/g, "");
      if (digitsOnly.length < 9 || digitsOnly.length > 15) {
        errors.contactNumber = "Please enter a valid telephone/mobile number (9 to 15 digits).";
      }
    }

    // 3. Email
    const email = (formData.email || "").trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.email = "Official organization email address is required.";
    } else if (!emailRegex.test(email)) {
      errors.email = "Please enter a valid email address.";
    } else if (emailUniqueError) {
      errors.email = emailUniqueError;
    }

    // 4. Supplier Type
    const supType = (formData.supplierType || "").trim();
    if (!supType) {
      errors.supplierType = "Supplier type is required. Please select Material, Labour, or Equipment.";
    } else if (!["Material", "Labour", "Equipment"].includes(supType)) {
      errors.supplierType = "Please select a valid supplier type (Material, Labour, or Equipment).";
    }

    // If Material is selected, require at least one material selected
    if (supType === "Material") {
      if (!formData.materialsSupplied || formData.materialsSupplied.length === 0) {
        errors.materialsSupplied = "Please select at least one material you supply.";
      } else if (formData.materialsSupplied.includes("Other")) {
        const hasOtherValue =
          supplierMaterialsOtherList.some((s) => s.trim().length > 0) ||
          Boolean(formData.materialsOther?.trim());
        if (!hasOtherValue) {
          errors.materialsOther = "Please specify the other material(s) you supply.";
        }
      }
    }

    // If Labour is selected, require at least one labour category
    if (supType === "Labour") {
      if (!formData.labourCategories || formData.labourCategories.length === 0) {
        errors.labourCategories = "Please select at least one labour category (Skilled, Semi-Skilled, or Unskilled).";
      }
    }

    // If Equipment is selected, require at least one equipment name
    if (supType === "Equipment") {
      const hasValidEquip = (formData.equipmentList || []).some(
        (eq: any) => eq.name && eq.name.trim().length > 0
      );
      if (!hasValidEquip) {
        errors.equipmentList = "Please provide details for at least one piece of equipment (Equipment Name is required).";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0 && !emailUniqueError;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const otherCombined = supplierMaterialsOtherList
        .map((s) => s.trim())
        .filter(Boolean)
        .join(", ");

      const cleanedEquipmentList = (formData.equipmentList || []).filter(
        (eq: any) => eq.name && eq.name.trim().length > 0
      );

      const payload = {
        businessName: formData.organizationName.trim(),
        formId: questionnaire?.code || "RDA-SUPPLIER-Q",
        formSlug: questionnaire?.slug || slug,
        questionnaireData: {
          ...formData,
          organizationName: formData.organizationName.trim(),
          contactNumber: formData.contactNumber.trim(),
          email: formData.email.trim().toLowerCase(),
          supplierType: (formData.supplierType || "Material").trim(),
          materialsSupplied: formData.materialsSupplied || [],
          materialsOther: otherCombined || formData.materialsOther || "",
          supplyCapacities: formData.supplyCapacities || {},
          labourCategories: formData.labourCategories || [],
          labourDetails: formData.labourDetails || {},
          equipmentList: cleanedEquipmentList,
          supplierDetails: {
            companyName: formData.organizationName.trim(),
            materialsSupplied: formData.materialsSupplied || [],
            materialsOther: otherCombined || formData.materialsOther || "",
            supplyCapacities: formData.supplyCapacities || {},
            labourCategories: formData.labourCategories || [],
            labourDetails: formData.labourDetails || {},
            equipmentList: cleanedEquipmentList,
          },
          participantCategory: questionnaire?.category || "Supplier",
        },
      };

      const res = await fetch("/api/public/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsRedirecting(false);

        const refNo =
          data.submissionReference ||
          data.submission?.reference ||
          data.reference ||
          "";

        setSubmissionSuccess({
          reference: refNo,
          organizationName: formData.organizationName.trim(),
          contactNumber: formData.contactNumber.trim(),
          email: formData.email.trim().toLowerCase(),
          supplierType: (formData.supplierType || "Material").trim(),
          materialsSupplied: formData.materialsSupplied || [],
          labourCategories: formData.labourCategories || [],
          equipmentList: cleanedEquipmentList,
          submittedAt: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const msg = data.message || "Failed to submit questionnaire.";
        if (msg.toLowerCase().includes("email")) {
          setEmailUniqueError(msg);
          setFieldErrors((prev) => ({ ...prev, email: msg }));
        } else {
          alert(`Submission Error: ${msg}`);
        }
      }
    } catch {
      alert("Network error submitting questionnaire. Please check your internet connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading Official Registration Portal...</p>
        <p className="text-xs text-slate-400 mt-1">Connecting to Government of Sri Lanka Road Development Authority</p>
      </div>
    );
  }

  if (error || !questionnaire) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Registration Form Not Found</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error || `No published form found for address "/register/${slug}".`}
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-sm"
            >
              <span>Go to Contractor Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // SUCCESS CONFIRMATION RECEIPT VIEW
  if (submissionSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 flex items-center justify-center">
        <div className="bg-white max-w-2xl w-full rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-6">
          {/* Header Logos & Language Switcher */}
          <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ministry-logo.png" alt="Ministry" className="h-9 w-auto object-contain" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/rda-logo.png" alt="RDA" className="h-9 w-auto object-contain" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icdp-logo.jpg" alt="ICDP" className="h-9 w-auto object-contain" />
            </div>

            {/* Language Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1 shrink-0" />
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  lang === "en"
                    ? "bg-[#0b1f3a] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang("si")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  lang === "si"
                    ? "bg-[#0b1f3a] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                සිංහල
              </button>
              <button
                type="button"
                onClick={() => setLang("ta")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  lang === "ta"
                    ? "bg-[#0b1f3a] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                தமிழ்
              </button>
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {t.receiptTitle}
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {t.receiptDesc}
            </p>
          </div>

          {/* Reference Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {t.receiptVerified}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                {t.receiptVerified}
              </span>
            </div>

            <div className="text-center py-2">
              <span className="font-mono text-xl sm:text-2xl font-black text-blue-950 tracking-wider select-all">
                {submissionSuccess.reference}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">{t.receiptRefPrompt}</p>
            </div>

            <div className="pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.receiptOrgName}</span>
                <span className="font-bold text-slate-800">{submissionSuccess.organizationName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.receiptSupplierType}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200 mt-0.5">
                  {submissionSuccess.supplierType === "Material"
                    ? t.materials[submissionSuccess.supplierType] || "Material"
                    : submissionSuccess.supplierType || "Material"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.receiptContactNumber}</span>
                <span className="font-bold text-slate-800">{submissionSuccess.contactNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.receiptEmail}</span>
                <span className="font-bold text-blue-900">{submissionSuccess.email}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.receiptTimestamp}</span>
                <span className="font-bold text-slate-800">{submissionSuccess.submittedAt}</span>
              </div>
              {submissionSuccess.materialsSupplied && submissionSuccess.materialsSupplied.length > 0 && (
                <div className="sm:col-span-2 pt-2 border-t border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">
                    {t.receiptMaterials}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {submissionSuccess.materialsSupplied.map((m) => (
                      <span
                        key={m}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-900 border border-blue-200"
                      >
                        {t.materials[m] || m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {submissionSuccess.labourCategories && submissionSuccess.labourCategories.length > 0 && (
                <div className="sm:col-span-2 pt-2 border-t border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">
                    {t.receiptLabour}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {submissionSuccess.labourCategories.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200"
                      >
                        {t.labourCategories[c]?.label || c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {submissionSuccess.equipmentList && submissionSuccess.equipmentList.length > 0 && (
                <div className="sm:col-span-2 pt-2 border-t border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">
                    {t.receiptEquip}
                  </span>
                  <div className="space-y-1.5">
                    {submissionSuccess.equipmentList.map((eq, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[11px] p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-lg"
                      >
                        <span className="font-bold text-emerald-950">{eq.name}</span>
                        <div className="flex items-center gap-2 text-slate-600">
                          {eq.capacity && (
                            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">
                              {eq.capacity}
                            </span>
                          )}
                          {eq.availableCity && (
                            <span className="font-semibold text-emerald-900">
                              {eq.availableCity}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs transition-all"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>{t.receiptPrintBtn}</span>
            </button>
            <Link
              href={`/register/${slug}`}
              onClick={() => {
                setSubmissionSuccess(null);
                setFormData({
                  organizationName: "",
                  contactNumber: "",
                  email: "",
                  supplierType: "",
                  materialsSupplied: [],
                  materialsOther: "",
                  supplyCapacities: {},
                  labourCategories: [],
                  labourDetails: {},
                  equipmentList: [{ name: "", capacity: "", availableCity: "" }],
                });
                setSupplierMaterialsOtherList([""]);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl shadow-xs transition-all"
            >
              <span>{t.receiptSubmitAnother}</span>
            </Link>
          </div>

          <p className="text-center text-[11px] text-slate-400 pt-3 border-t border-slate-100">
            {t.copyright}
          </p>
        </div>
      </div>
    );
  }

  // ACTIVE REGISTRATION FORM VIEW
  return (
    <div className="min-h-screen bg-slate-100/80 py-8 px-4 sm:px-6 relative">
      {/* Redirecting Overlay */}
      {isRedirecting && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg mb-4 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold">Supplier Registration Submitted Successfully!</h2>
          <p className="text-xs text-slate-300 mt-2 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>Redirecting to Material Suppliers Directory...</span>
          </p>
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Government Letterhead Bar with Language Switcher */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ministry-logo.png" alt="Ministry of Transport" className="h-8 sm:h-10 w-auto object-contain" />
              <div className="h-8 w-px bg-slate-200" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/rda-logo.png" alt="Road Development Authority" className="h-8 sm:h-10 w-auto object-contain" />
              <div className="h-8 w-px bg-slate-200" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icdp-logo.jpg" alt="ICDP" className="h-8 sm:h-10 w-auto object-contain" />
            </div>

            <div className="sm:border-l sm:border-slate-200 sm:pl-3.5 text-left">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block leading-tight">
                {t.govSriLanka}
              </span>
              <span className="text-xs font-black text-blue-950 block leading-tight">
                {t.rda}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end w-full sm:w-auto">
            {/* Language Switcher Pill */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  lang === "en"
                    ? "bg-[#0b1f3a] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang("si")}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  lang === "si"
                    ? "bg-[#0b1f3a] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                සිංහල
              </button>
              <button
                type="button"
                onClick={() => setLang("ta")}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  lang === "ta"
                    ? "bg-[#0b1f3a] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                தமிழ்
              </button>
            </div>
          </div>
        </div>

        {/* Hero Form Header Card */}
        <div className="bg-[#0b1f3a] text-white p-5 sm:p-7 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-black text-[10px] text-amber-950 bg-amber-400 px-2.5 py-0.5 rounded-full shadow-2xs">
                {t.formCode}
              </span>
              <span className="font-mono font-bold text-[10px] text-blue-200 bg-blue-900/60 border border-blue-700/60 px-2 py-0.5 rounded">
                {questionnaire.code}
              </span>
              <span className="text-[10px] font-bold bg-white/10 text-slate-200 px-2.5 py-0.5 rounded-full">
                {questionnaire.category || "Supplier"}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {lang === "en" ? questionnaire.title : t.formTitle}
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              {lang === "en" ? (questionnaire.description || t.formDesc) : t.formDesc}
            </p>

            <div className="pt-2 text-[11px] text-amber-300/90 leading-relaxed flex items-start gap-1.5 border-t border-white/10 mt-2">
              <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
              <span>{lang === "en" ? (questionnaire.instructions || t.instructions) : t.instructions}</span>
            </div>
          </div>
        </div>

        {/* Registration Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-900" />
              <span>{t.sec1Title}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.sec1Desc}
            </p>
          </div>

          <div className="space-y-5 text-xs">
            {/* Question 1: Organization Name */}
            <div className="space-y-1.5">
              <label htmlFor="input-org-name" className="block font-bold text-slate-800">
                {t.q1Label} <span className="text-rose-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500">
                {t.q1Help}
              </p>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="input-org-name"
                  type="text"
                  placeholder={t.q1Placeholder}
                  value={formData.organizationName}
                  onChange={(e) => handleChange("organizationName", e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                    fieldErrors.organizationName
                      ? "border-rose-400 focus:ring-rose-200 text-rose-950"
                      : "border-slate-300 focus:ring-blue-900/30 text-slate-900"
                  }`}
                  required
                />
              </div>
              {fieldErrors.organizationName && (
                <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.organizationName}</span>
                </p>
              )}
            </div>

            {/* Question 2: Phone Number */}
            <div className="space-y-1.5">
              <label htmlFor="input-phone" className="block font-bold text-slate-800">
                {t.q2Label} <span className="text-rose-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500">
                {t.q2Help}
              </p>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="input-phone"
                  type="tel"
                  placeholder={t.q2Placeholder}
                  value={formData.contactNumber}
                  onChange={(e) => handleChange("contactNumber", e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                    fieldErrors.contactNumber
                      ? "border-rose-400 focus:ring-rose-200 text-rose-950"
                      : "border-slate-300 focus:ring-blue-900/30 text-slate-900"
                  }`}
                  required
                />
              </div>
              {fieldErrors.contactNumber && (
                <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.contactNumber}</span>
                </p>
              )}
            </div>

            {/* Question 3: Email Address (Unique) */}
            <div className="space-y-1.5">
              <label htmlFor="input-email" className="block font-bold text-slate-800">
                {t.q3Label} <span className="text-rose-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500">
                {t.q3Help}
              </p>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="input-email"
                  type="email"
                  placeholder={t.q3Placeholder}
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={handleEmailBlur}
                  className={`w-full pl-9 pr-10 py-2.5 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                    fieldErrors.email || emailUniqueError
                      ? "border-rose-400 focus:ring-rose-200 text-rose-950 bg-rose-50/30"
                      : "border-slate-300 focus:ring-blue-900/30 text-slate-900"
                  }`}
                  required
                />
                {checkingEmail && (
                  <RefreshCw className="w-4 h-4 text-blue-900 animate-spin absolute right-3 top-3 pointer-events-none" />
                )}
              </div>

              {emailUniqueError ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 mt-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{emailUniqueError}</span>
                </div>
              ) : fieldErrors.email ? (
                <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              ) : (
                <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.emailUniqueNote}</span>
                </p>
              )}
            </div>
          </div>

          {/* SECTION 2: SUPPLIER DETAILS */}
          <div className="pt-6 border-t border-slate-200 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-900" />
                <span>{t.sec2Title}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.sec2Desc}
              </p>
            </div>

            <div className="space-y-5 text-xs">
              {/* Supplier Type Selection */}
              <div className="space-y-1.5">
                <label htmlFor="input-supplier-type" className="block font-bold text-slate-800">
                  {t.supplierTypeLabel} <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  {t.supplierTypeHelp}
                </p>
                <div className="relative">
                  <Package className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <select
                    id="input-supplier-type"
                    value={formData.supplierType}
                    onChange={(e) => handleChange("supplierType", e.target.value)}
                    className={`w-full pl-9 pr-8 py-2.5 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:outline-hidden focus:ring-2 transition-all cursor-pointer text-slate-900 ${
                      fieldErrors.supplierType
                        ? "border-rose-400 focus:ring-rose-200 text-rose-950"
                        : "border-slate-300 focus:ring-blue-900/30"
                    }`}
                    required
                  >
                    <option value="" disabled>{t.selectSupplierTypePrompt}</option>
                    <option value="Material">{t.optMaterial}</option>
                    <option value="Labour">{t.optLabour}</option>
                    <option value="Equipment">{t.optEquipment}</option>
                  </select>
                </div>

                {fieldErrors.supplierType && (
                  <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.supplierType}</span>
                  </p>
                )}
              </div>

              {/* Conditionally Show Material Details when Material is selected */}
              {formData.supplierType === "Material" && (
                <div className="space-y-4 pt-3 border-t border-slate-100 animate-fadeIn">
                  <div className="p-3.5 bg-blue-50 border border-blue-200/80 rounded-xl text-xs text-blue-950">
                    <p className="leading-relaxed">
                      {t.matCallout}
                    </p>
                  </div>

                <div className="space-y-4 text-xs">
                  {/* Material Selection Checkboxes */}
                  <div id="input-supplierDetails-materialsSupplied">
                    <label className="block font-semibold text-slate-700 mb-2">
                      {t.matSelectLabel}
                    </label>
                    <div
                      className={`grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-1.5 rounded-xl transition-all ${
                        fieldErrors.materialsSupplied ? "bg-rose-50/40 border-2 border-rose-500" : ""
                      }`}
                    >
                      {SUPPLIER_MATERIALS.map((mat) => {
                        const isChecked = (formData.materialsSupplied || []).includes(mat);
                        return (
                          <label
                            key={mat}
                            className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors ${
                              isChecked
                                ? "bg-blue-50/80 border-blue-800 text-blue-950 font-semibold shadow-xs"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleMaterialToggle(mat)}
                              className="w-4 h-4 text-blue-900 rounded focus:ring-blue-800 cursor-pointer"
                            />
                            <span>{t.materials[mat] || mat}</span>
                          </label>
                        );
                      })}
                    </div>
                    {fieldErrors.materialsSupplied && (
                      <div role="alert" className="flex items-start gap-1.5 mt-2 text-xs font-semibold text-rose-600 animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                        <span>{fieldErrors.materialsSupplied}</span>
                      </div>
                    )}

                    {/* Specify Other Supplied Material(s) */}
                    {(formData.materialsSupplied || []).includes("Other") && (
                      <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                            {t.specifyOther}
                          </label>
                          <span className="text-[11px] text-slate-500">
                            {t.addMoreOtherPrompt}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {supplierMaterialsOtherList.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={item}
                                onChange={(e) => {
                                  handleUpdateSupplierMaterialOther(idx, e.target.value);
                                  if (fieldErrors.materialsOther) {
                                    setFieldErrors((prev) => {
                                      const copy = { ...prev };
                                      delete copy.materialsOther;
                                      return copy;
                                    });
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddSupplierMaterialOther();
                                  }
                                }}
                                placeholder={
                                  idx === 0
                                    ? t.otherPlaceholderFirst
                                    : `${t.otherPlaceholderNext} ${idx + 1}`
                                }
                                className={`flex-1 p-2 bg-white rounded-lg text-slate-900 text-xs focus:outline-hidden focus:ring-2 ${
                                  fieldErrors.materialsOther && idx === 0
                                    ? "border-2 border-rose-500 focus:ring-rose-200"
                                    : "border border-slate-300 focus:ring-blue-800"
                                }`}
                              />
                              {supplierMaterialsOtherList.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSupplierMaterialOther(idx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                                  title="Remove this material"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {fieldErrors.materialsOther && (
                          <div role="alert" className="flex items-start gap-1.5 mt-1 text-xs font-semibold text-rose-600 animate-fadeIn">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                            <span>{fieldErrors.materialsOther}</span>
                          </div>
                        )}

                        <div>
                          <button
                            type="button"
                            onClick={handleAddSupplierMaterialOther}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg shadow-xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t.addAnotherMaterial}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Annual Supply Capacity Per Selected Material */}
                  {(formData.materialsSupplied || []).length > 0 && (
                    <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <span className="font-bold text-slate-900 uppercase text-[11px] block">
                          {t.annualCapacityTitle}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {t.annualCapacityHelp}
                        </span>
                      </div>

                      {/* Desktop Header */}
                      <div className="hidden sm:grid sm:grid-cols-12 gap-2.5 px-3 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <div className="sm:col-span-2">{t.colMaterial}</div>
                        <div className="sm:col-span-6">{t.colCapacity}</div>
                        <div className="sm:col-span-4">{t.colRate}</div>
                      </div>

                      <div className="space-y-2.5">
                        {(() => {
                          const capacityRows: { key: string; label: string }[] = [];
                          const mats: string[] = formData.materialsSupplied || [];
                          const otherItems = supplierMaterialsOtherList
                            .map((s) => s.trim())
                            .filter(Boolean);

                          mats.forEach((mat: string) => {
                            if (mat !== "Other") {
                              capacityRows.push({ key: mat, label: t.materials[mat] || mat });
                            } else if (otherItems.length === 0) {
                              capacityRows.push({ key: "Other", label: t.materials["Other"] || "Other" });
                            } else {
                              otherItems.forEach((item) => {
                                capacityRows.push({
                                  key: `Other (${item})`,
                                  label: `${t.materials["Other"] || "Other"} (${item})`,
                                });
                              });
                            }
                          });

                          return capacityRows.map((row) => {
                            const defaultUnit = "MT per year";
                            const cap =
                              formData.supplyCapacities?.[row.key] || {
                                quantity: "",
                                unit: defaultUnit,
                                rate: "",
                                rateUnit: "cu.m",
                              };

                            return (
                              <div
                                key={row.key}
                                className="p-3 bg-white border border-slate-200 rounded-lg space-y-2.5 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-2.5 sm:items-center"
                              >
                                <div className="sm:col-span-2">
                                  <span className="font-semibold text-blue-950 text-xs sm:text-sm block">
                                    {row.label}
                                  </span>
                                </div>

                                {/* 1. Annual Capacity */}
                                <div className="sm:col-span-6">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 sm:hidden">
                                    {t.colCapacity}
                                  </label>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={cap.quantity !== null && cap.quantity !== undefined ? cap.quantity : ""}
                                      onChange={(e) => handleCapacityChange(row.key, "quantity", e.target.value)}
                                      placeholder={t.quantityPlaceholder}
                                      className="w-1/2 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-800 font-mono"
                                    />
                                    <input
                                      type="text"
                                      value={cap.unit || ""}
                                      onChange={(e) => handleCapacityChange(row.key, "unit", e.target.value)}
                                      placeholder={t.unitPlaceholder}
                                      className="w-1/2 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-800"
                                    />
                                  </div>
                                </div>

                                {/* 2. Rate & Unit */}
                                <div className="sm:col-span-4">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 sm:hidden">
                                    {t.colRate}
                                  </label>
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex items-center w-3/5">
                                      <span className="px-2 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-[10px] font-bold text-slate-600 select-none">
                                        LKR
                                      </span>
                                      <input
                                        type="text"
                                        value={cap.rate !== null && cap.rate !== undefined ? cap.rate : ""}
                                        onChange={(e) => handleCapacityChange(row.key, "rate", e.target.value)}
                                        placeholder={t.ratePlaceholder}
                                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-r-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-800 font-mono"
                                      />
                                    </div>
                                    <div className="w-2/5">
                                      <select
                                        value={cap.rateUnit || "cu.m"}
                                        onChange={(e) => handleCapacityChange(row.key, "rateUnit", e.target.value)}
                                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-800 cursor-pointer"
                                      >
                                        <option value="cu.m">cu.m</option>
                                        <option value="cube">cube</option>
                                        <option value="MT">MT</option>
                                        <option value="Liters">Liter</option>
                                        <option value="Nos">Nos</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Conditionally Show Labour Details when Labour is selected */}
            {formData.supplierType === "Labour" && (
              <div className="space-y-4 pt-3 border-t border-slate-100 animate-fadeIn">
                <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs text-amber-950">
                  <p className="leading-relaxed">
                    {t.labourCallout}
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Labour Category Selection Checkboxes */}
                  <div id="input-supplierDetails-labourCategories">
                    <label className="block font-semibold text-slate-700 mb-2">
                      {t.labourSelectLabel}
                    </label>
                    <div
                      className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 rounded-xl transition-all ${
                        fieldErrors.labourCategories ? "bg-rose-50/40 border-2 border-rose-500" : ""
                      }`}
                    >
                      {LABOUR_CATEGORIES.map((cat) => {
                        const isChecked = (formData.labourCategories || []).includes(cat.id);
                        const catI18n = t.labourCategories[cat.id] || { label: cat.label, desc: cat.description };
                        return (
                          <label
                            key={cat.id}
                            className={`flex flex-col gap-1 p-3 border rounded-xl cursor-pointer transition-colors ${
                              isChecked
                                ? "bg-amber-50/80 border-amber-600 text-amber-950 font-semibold shadow-xs"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleLabourCategoryToggle(cat.id)}
                                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                              />
                              <span className="font-bold text-slate-900">{catI18n.label}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 pl-6 leading-tight font-normal">
                              {catI18n.desc}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {fieldErrors.labourCategories && (
                      <div role="alert" className="flex items-start gap-1.5 mt-2 text-xs font-semibold text-rose-600 animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                        <span>{fieldErrors.labourCategories}</span>
                      </div>
                    )}
                  </div>

                  {/* Labour Capacity & Rate Details for selected categories */}
                  {(formData.labourCategories || []).length > 0 && (
                    <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <span className="font-bold text-slate-900 uppercase text-[11px] block">
                          {t.labourCapacityTitle}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {t.labourCapacityHelp}
                        </span>
                      </div>

                      {/* Desktop Header */}
                      <div className="hidden sm:grid sm:grid-cols-12 gap-2.5 px-3 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <div className="sm:col-span-3">{t.colLabourCategory}</div>
                        <div className="sm:col-span-3">{t.colAvailableWorkforce}</div>
                        <div className="sm:col-span-3">{t.colDailyRate}</div>
                        <div className="sm:col-span-3">{t.colKeyTrades}</div>
                      </div>

                      <div className="space-y-2.5">
                        {LABOUR_CATEGORIES.filter((cat) => (formData.labourCategories || []).includes(cat.id)).map((cat) => {
                          const details = formData.labourDetails?.[cat.id] || { count: "", rate: "", trades: "" };
                          const catI18n = t.labourCategories[cat.id] || { label: cat.label, desc: cat.description };
                          return (
                            <div
                              key={cat.id}
                              className="p-3 bg-white border border-slate-200 rounded-lg space-y-2.5 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-2.5 sm:items-center"
                            >
                              <div className="sm:col-span-3">
                                <span className="font-semibold text-amber-950 text-xs sm:text-sm block">
                                  {catI18n.label}
                                </span>
                              </div>

                              <div className="sm:col-span-3">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 sm:hidden">
                                  {t.colAvailableWorkforce}
                                </label>
                                <input
                                  type="text"
                                  value={details.count || ""}
                                  onChange={(e) => handleLabourDetailChange(cat.id, "count", e.target.value)}
                                  placeholder={t.workforcePlaceholder}
                                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 sm:hidden">
                                  {t.colDailyRate}
                                </label>
                                <div className="flex items-center">
                                  <span className="px-2 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-[10px] font-bold text-slate-600 select-none">
                                    LKR
                                  </span>
                                  <input
                                    type="text"
                                    value={details.rate || ""}
                                    onChange={(e) => handleLabourDetailChange(cat.id, "rate", e.target.value)}
                                    placeholder={t.dailyRatePlaceholder}
                                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-r-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
                                  />
                                </div>
                              </div>

                              <div className="sm:col-span-3">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 sm:hidden">
                                  {t.colKeyTrades}
                                </label>
                                <input
                                  type="text"
                                  value={details.trades || ""}
                                  onChange={(e) => handleLabourDetailChange(cat.id, "trades", e.target.value)}
                                  placeholder={t.tradesPlaceholder}
                                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Conditionally Show Equipment Details when Equipment is selected */}
            {formData.supplierType === "Equipment" && (
              <div className="space-y-4 pt-3 border-t border-slate-100 animate-fadeIn">
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/90 rounded-xl text-xs text-emerald-950">
                  <p className="leading-relaxed">
                    {t.equipCallout}
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div id="input-supplierDetails-equipment">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block font-semibold text-slate-700">
                        {t.equipInventoryTitle} <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-500">
                        {t.equipInventoryHelp}
                      </span>
                    </div>

                    {fieldErrors.equipmentList && (
                      <div role="alert" className="flex items-start gap-1.5 mb-2.5 text-xs font-semibold text-rose-600 animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                        <span>{fieldErrors.equipmentList}</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      {(formData.equipmentList || []).map((eq: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-2.5 sm:items-center shadow-2xs"
                        >
                          {/* 1. Equipment Name */}
                          <div className="sm:col-span-5 space-y-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">
                              {t.colEquipName} <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={eq.name || ""}
                              onChange={(e) => handleEquipmentChange(idx, "name", e.target.value)}
                              placeholder={t.equipNamePlaceholder}
                              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                            />
                          </div>

                          {/* 2. Capacity Input Area */}
                          <div className="sm:col-span-3 space-y-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">
                              {t.colEquipCapacity}
                            </label>
                            <input
                              type="text"
                              value={eq.capacity || ""}
                              onChange={(e) => handleEquipmentChange(idx, "capacity", e.target.value)}
                              placeholder={t.equipCapacityPlaceholder}
                              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-mono"
                            />
                          </div>

                          {/* 3. Available City Input Area */}
                          <div className="sm:col-span-3 space-y-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">
                              {t.colEquipCity}
                            </label>
                            <input
                              type="text"
                              value={eq.availableCity || ""}
                              onChange={(e) => handleEquipmentChange(idx, "availableCity", e.target.value)}
                              placeholder={t.equipCityPlaceholder}
                              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                            />
                          </div>

                          {/* Action (Remove) */}
                          <div className="sm:col-span-1 flex sm:justify-center items-end sm:pt-4">
                            {(formData.equipmentList || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveEquipment(idx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                                title="Remove this equipment"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleAddEquipment}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.addAnotherEquip}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Submission Notice & Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-900 shrink-0" />
              <span>{t.govNotice}</span>
            </div>

            <button
              type="submit"
              disabled={submitting || checkingEmail}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 text-xs font-bold text-white bg-[#0b1f3a] hover:bg-[#132f54] rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t.submittingBtn}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>{t.submitBtn}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-400 py-3">
          {t.copyright}
        </div>
      </div>
    </div>
  );
}
