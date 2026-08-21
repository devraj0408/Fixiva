/**
 * Fixiva AI Chatbot Service
 * Provides automated, context-aware AI support for Customers, Workers, Contractors, and Admins.
 * Supports Google Gemini API (if VITE_GEMINI_API_KEY is configured) and falls back seamlessly
 * to an extensive built-in Fixiva Knowledge & Rule Engine.
 */

const FIXIVA_SYSTEM_KNOWLEDGE = `
You are the official Fixiva AI Assistant, an intelligent support assistant for Fixiva — a modern home-service marketplace control plane.

Key Fixiva Concepts & Features:
1. PLATFORM OVERVIEW & AUTHENTICATION:
   - Fixiva connects Customers with verified Workers and service Contractors for home services (Plumbing, Electrical, Cleaning, Appliance Repair, HVAC, Carpentry, Painting, Pest Control, etc.).
   - Role-Based Portal: Supports Customers, Workers, Contractors, and Admins.
   - Passwordless OTP login via email.
   - How to Login: 1) Click Login at top right. 2) Enter registered email address. 3) Receive 6-digit OTP in email. 4) Enter OTP to access account.
   - How to Register: 1) Click Register at top right. 2) Choose role (Customer, Worker, Contractor). 3) Enter Name, Email, Mobile, City. 4) Verify email via OTP.

2. CUSTOMER WORKFLOW:
   - Browse service catalog by categories and city availability.
   - Schedule bookings, select preferred time slot & location.
   - Transparent pricing: Base Service Price + Platform Fee + Inspection Fee.
   - Live booking status tracking: Pending -> Confirmed / Dispatched -> In Progress -> Completed / Cancelled.
   - Support desk live chat for resolving booking issues, cancellations, and inquiries.

3. WORKER WORKFLOW:
   - Account setup with skills, city selection, and identity verification documents.
   - Job Dispatch Board: Receives real-time dispatches based on location and skills.
   - Worker Trust Score: Dynamic canonical score (0-100) based on KYC verification, contact status, job completion history, customer reviews, punctuality, and reliability. Higher trust score leads to priority job dispatches.
   - Status updates: Accept job, start work, mark as completed.
   - Worker Payouts: Daily/weekly automatic payouts sent to verified bank/UPI accounts.

4. CONTRACTOR WORKFLOW:
   - Register company details & business license for contractor verification.
   - Manage team/worker dispatches and high-volume commercial/residential service requests.
   - Access to service listings and contractor marketplace.

5. ADMIN CONTROL PANEL:
   - Overview metrics for total bookings, revenue, workers, contractors, and open support tickets.
   - Tariff management: Adjust base price, platform fee, and inspection fee per service & city.
   - Worker & Contractor verification approval/rejection workflows.
   - Ticket resolution desk with admin replies.

Tone & Style Guidelines:
- Be friendly, professional, clear, and helpful.
- Keep answers structured with bullet points or numbered steps where appropriate.
- Personalize responses using the user's name, role, and current active bookings or status.
- When helping with Login or Registration, clearly state the step-by-step OTP process.
`;

/**
 /**
 * Universal Action Intent Classifier
 * Determines the target route and button label for any question category.
 */
function detectActionIntent(lowerQuery, userRole = 'Customer', availableServices = []) {
  // 1. Login queries
  if (/login|log in|signin|sign in|how to log|where to log|access account|enter account|otp login|login page|how to login/i.test(lowerQuery)) {
    return {
      type: 'login',
      path: '/login',
      label: '🔑 Open Login Page',
      countdownSeconds: 5
    };
  }

  // 2. Registration queries
  if (/register|regist|sign up|signup|create account|new account|how to register|register page/i.test(lowerQuery)) {
    return {
      type: 'register',
      path: '/register',
      label: '📝 Open Register Page',
      countdownSeconds: 5
    };
  }

  // 3. Service Booking & Specific Service Questions (e.g. "How to book plumbing?", "electrician", "cleaning", "services")
  if (/book|plumb|electric|clean|hvac|ac |repair|service|catalogue|hire|carpenter|painter|pest|appliance/i.test(lowerQuery)) {
    let matchedService = null;
    if (availableServices && availableServices.length > 0) {
      matchedService = availableServices.find(s => 
        s.name && lowerQuery.includes(s.name.toLowerCase())
      );
    }

    if (matchedService && matchedService.id) {
      return {
        type: 'book_service',
        path: `/book/${matchedService.id}`,
        label: `🛠 Book ${matchedService.name} Now`,
        countdownSeconds: 5
      };
    }

    return {
      type: 'services',
      path: '/services',
      label: '🛠 Go to Services Page',
      countdownSeconds: 5
    };
  }

  // 4. Booking Tracking, Dispatches & Dashboard
  if (/dispatch|track|order|status|my booking|live status|assigned worker|no show|ongoing job/i.test(lowerQuery)) {
    const dashPath = userRole === 'Worker' ? '/worker-dashboard' : userRole === 'Contractor' ? '/contractor-dashboard' : '/dashboard/customer';
    return {
      type: 'dashboard',
      path: dashPath,
      label: '📋 Go to Dashboard & Bookings',
      countdownSeconds: 5
    };
  }

  // 5. Trust Score, Worker Payouts & Profile Verification
  if (/trust score|score|rating|payout|earning|salary|verif|document|kyc|approval|identity|bank details/i.test(lowerQuery)) {
    if (userRole === 'Worker') {
      return {
        type: 'worker_dashboard',
        path: '/worker-dashboard',
        label: '⭐ Go to Worker Dashboard',
        countdownSeconds: 5
      };
    }
    if (userRole === 'Contractor') {
      return {
        type: 'contractor_dashboard',
        path: '/contractor-dashboard',
        label: '💼 Go to Contractor Panel',
        countdownSeconds: 5
      };
    }
    return {
      type: 'profile',
      path: '/profile',
      label: '👤 Go to Profile & Verification',
      countdownSeconds: 5
    };
  }

  // 6. Cancellation & Refunds
  if (/cancel|refund|reschedule|policy|terms|privacy|rules/i.test(lowerQuery)) {
    return {
      type: 'cancellation',
      path: '/cancellation',
      label: '📜 View Cancellation Policy',
      countdownSeconds: 5
    };
  }

  // 7. Contact Support & Ticket Escalation
  if (/human|admin|escalate|agent|complaint|contact|support number|ticket|help desk/i.test(lowerQuery)) {
    return {
      type: 'contact',
      path: '/contact',
      label: '📞 Go to Contact Support',
      countdownSeconds: 5
    };
  }

  return null;
}

/**
 * Detect language of the user prompt (Bengali, Hindi, Hinglish, or English)
 */
export function detectPromptLanguage(text) {
  if (!text) return 'en';
  const str = text.trim();

  // 1. Bengali Script (\u0980-\u09FF) or common Bengali words in Roman script
  if (/[\u0980-\u09FF]/.test(str) || /\b(kivabe|korbo|koro|bhabe|bolun|khub|kono|amar|apnar|jani|kamne|dorkar|amader|apni|tumi|chai|lagbe|hobe|kore)\b/i.test(str)) {
    return 'bn';
  }

  // 2. Devanagari Script (\u0900-\u097F) - Formal Devanagari Hindi
  if (/[\u0900-\u097F]/.test(str)) {
    return 'hi';
  }

  // 3. Hinglish (Hindi / Urdu words written in Roman script)
  const hinglishWordsRegex = /\b(kaise|karein|karo|karne|karte|kya|kyun|hai|hain|ho|hoon|chahiye|batao|bataiye|bhejo|apna|apni|par|mein|karke|karna|raha|rahe|rahi|samajh|bhai|karwana|karwani|kardo|kardijiye|dene|dena|chahiye|chahiye|milte|aaj|mujhe|tumhe|bhi|dikhao|bata)\b/i;
  if (hinglishWordsRegex.test(str)) {
    return 'hinglish';
  }

  return 'en';
}

/**
 * Generates AI response using Gemini API or built-in reasoning engine.
 * Automatically matches response language to user prompt language.
 */
export async function generateAIResponse({
  userMessage,
  chatHistory = [],
  userRole = 'Customer',
  userProfile = null,
  userLanguage = 'en',
  activeBookings = [],
  availableServices = [],
  availableCities = []
}) {
  const query = userMessage.trim();

  // Extract multi-turn context from recent chat history
  let contextualQuery = query;
  if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
    const recentUserMsgs = chatHistory
      .filter(m => m.sender === 'user' && m.text && m.text !== query)
      .slice(-2)
      .map(m => m.text);
    if (recentUserMsgs.length > 0) {
      contextualQuery = `${recentUserMsgs.join(' ')} ${query}`;
    }
  }

  const lowerQuery = contextualQuery.toLowerCase();

  // Automatically detect prompt language (e.g. Hindi, Bengali, Hinglish, English)
  // Follow user's latest prompt language immediately!
  const detectedLang = detectPromptLanguage(query);
  const effectiveLanguage = detectedLang !== 'en' ? detectedLang : (userLanguage || 'en');

  // Universally detect Action Intent using contextual query
  const action = detectActionIntent(lowerQuery, userRole, availableServices);

  // Prepare live context string
  const userContextStr = `
User Profile: Name = ${userProfile?.name || 'User'}, Email = ${userProfile?.email || 'N/A'}, Role = ${userRole}, City = ${userProfile?.city || 'Not specified'}
Active Language: ${effectiveLanguage.toUpperCase()}
Active Bookings Count: ${activeBookings.length}
${activeBookings.length > 0 ? `Recent Bookings: ${activeBookings.slice(0, 3).map(b => `#${b.id.slice(0, 6)} (${b.service_name || 'Service'} - Status: ${b.status})`).join(', ')}` : ''}
Available Cities: ${availableCities.map(c => c.name || c).slice(0, 5).join(', ')}
Available Services: ${availableServices.slice(0, 5).map(s => s.name).join(', ')}
  `.trim();

  // Language names helper
  const langNameMap = {
    en: 'English',
    hi: 'Hindi (हिन्दी)',
    bn: 'Bengali (বাংলা)',
    hinglish: 'Hinglish (Hindi written in English script)'
  };
  const targetLang = langNameMap[effectiveLanguage] || 'English';

  // Try Google Gemini API if API Key is configured
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (apiKey && apiKey !== 'your-gemini-api-key') {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${FIXIVA_SYSTEM_KNOWLEDGE}\n\nCURRENT USER CONTEXT:\n${userContextStr}\n\nCRITICAL LANGUAGE REQUIREMENT: The user wrote/spoke in ${targetLang}. You MUST respond strictly in ${targetLang}.\n\nUSER QUESTION: "${query}"\n\nProvide a concise, helpful response tailored to Fixiva in ${targetLang}:`
                  }
                ]
              }
            ]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return {
            text: text.trim(),
            source: 'gemini',
            suggestions: getSuggestedPrompts(userRole, effectiveLanguage),
            action,
            detectedLanguage: effectiveLanguage
          };
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to built-in Fixiva AI engine:', err);
    }
  }

  // Fallback: Built-in Fixiva Context Knowledge & Reasoning Engine
  const text = processFallbackKnowledgeEngine(query, lowerQuery, userRole, userProfile, activeBookings, availableServices, effectiveLanguage);
  return {
    text,
    source: 'built-in-ai',
    suggestions: getSuggestedPrompts(userRole, effectiveLanguage),
    action,
    detectedLanguage: effectiveLanguage
  };
}

/**
 * Built-in Intelligent Fallback Knowledge & Reasoning Engine
 */
function processFallbackKnowledgeEngine(query, lowerQuery, userRole, userProfile, activeBookings, availableServices, userLanguage = 'en') {
  const userName = userProfile?.name || (userRole === 'Worker' ? 'Worker' : userRole === 'Contractor' ? 'Partner' : 'Customer');
  const isHi = userLanguage === 'hi';
  const isBn = userLanguage === 'bn';
  const isHn = userLanguage === 'hinglish';

  // Login queries
  if (/login|log in|signin|sign in|how to log|where to log|access account|enter account|otp login|login page/i.test(lowerQuery)) {
    if (userProfile?.email) {
      if (isHi) return `नमस्ते ${userName}! 👋 आप फ़िक्सिवा में पहले से लॉगिन हैं।\n\n👤 **खाता विवरण**:\n• **नाम**: ${userName}\n• **ईमेल**: ${userProfile.email}\n• **प्रकार**: ${userRole}\n\nदूसरे खाते से लॉगिन करने के लिए टॉप मेनू पर **लॉगिन** दबाएं।`;
      if (isBn) return `হ্যালো ${userName}! 👋 আপনি ইতিমধ্যেই ফিক্সিভায় লগইন করে আছেন।\n\n👤 **অ্যাকাউন্টের বিবরণ**:\n• **নাম**: ${userName}\n• **ইমেল**: ${userProfile.email}\n• **ধরন**: ${userRole}\n\nঅন্য অ্যাকাউন্ট দিয়ে লগইন করতে উপরের মেনুতে **লগইন** চাপুন।`;
      if (isHn) return `Hello ${userName}! 👋 Aap Fixiva par logged in hain.\n\n👤 **Account Details**:\n• **Name**: ${userName}\n• **Email**: ${userProfile.email}\n• **Role**: ${userRole}\n\nDusre account se login karne ke liye menu par **Login** dabaayein.`;
      return `Hello ${userName}! 👋 You are currently logged in to Fixiva.\n\n👤 **Account Details**:\n• **Name**: ${userName}\n• **Email**: ${userProfile.email}\n• **Role**: ${userRole}\n\nIf you want to log in with a different account or switch roles:\n1. Click **Login** at the top menu (or click the button below).\n2. Enter your registered email address to receive a secure 6-digit OTP code.\n3. Enter the OTP code to log in to your account.`;
    }

    if (isHi) return `🔑 **फ़िक्सिवा में लॉगिन कैसे करें**:\n\n1. **लॉगिन पर क्लिक करें**: ऊपर दाएं कोने में **लॉगिन** बटन पर क्लिक करें।\n2. **ईमेल दर्ज करें**: अपना पंजीकृत ईमेल पता टाइप करें।\n3. **ओटीपी प्राप्त करें**: **आगे बढ़ें** पर क्लिक करें। आपके ईमेल पर 6 अंकों का सत्यापन कोड भेजा जाएगा।\n4. **सत्यापित करें**: कोड दर्ज करके अपने डैशबोर्ड पर लॉगिन करें।`;
    if (isBn) return `🔑 **ফিক্সিভায় কীভাবে লগইন করবেন**:\n\n১. **লগইন অপশনে চাপুন**: উপরে ডানদিকে **লগইন** বোতামে ক্লিক করুন।\n২. **ইমেল দিন**: আপনার নিবন্ধিত ইমেল ঠিকানা টাইপ করুন।\n৩. **ওটিপি পান**: **এগিয়ে যান** চাপুন। আপনার ইমেলে ৬ সংখ্যার ওটিপি কোড পাঠানো হবে।\n৪. **যাচাই করুন**: ওটিপি কোড লিখে সরাসরি লগইন করুন।`;
    if (isHn) return `🔑 **Fixiva mein Login kaise karein**:\n\n1. **Login par click karein**: Top right mein **Login** button par click karein.\n2. **Email enter karein**: Apna registered email address type karein.\n3. **OTP paayein**: **Continue** par click karein. Aapke email par 6-digit OTP code aayega.\n4. **Verify & Access**: OTP enter karke dashboard par login karein.`;

    return `🔑 **How to Login to Fixiva**:\n\nFollow these simple steps to access your account:\n\n1. **Click on Login**: Click the **Login** button at the top right of the page (or click the button below).\n2. **Enter Email**: Type the registered email address associated with your Fixiva account.\n3. **Get Verification Code (OTP)**: Click **Continue**. A 6-digit OTP code will be sent to your email inbox.\n4. **Verify & Access**: Enter the OTP code to log in directly to your dashboard.\n\n📝 **Not registered yet?**\nIf you don't have an account, click **Register** first to create a Customer, Worker, or Contractor account.`;
  }

  // Registration queries
  if (/register|regist|sign up|signup|create account|new account|how to register|register page/i.test(lowerQuery)) {
    if (isHi) return `📝 **फ़िक्सिवा पर पंजीकरण (Register) कैसे करें**:\n\n1. **रजिस्टर पर क्लिक करें**: **फ़िक्सिवा से जुड़ें** या **रजिस्टर** बटन दबाएं।\n2. **खाता प्रकार चुनें**: Customer, Worker या Contractor का चयन करें।\n3. **जानकारी भरें**: नाम, ईमेल, मोबाइल नंबर और शहर दर्ज करें।\n4. **ओटीपी से सत्यापित करें**: ईमेल ओटीपी से खाता तुरंत सक्रिय करें।`;
    if (isBn) return `📝 **ফিক্সিভায় কীভাবে রেজিস্ট্রেশন করবেন**:\n\n১. **রেজিস্টার অপশনে চাপুন**: **ফিক্সিভায় যোগ দিন** বা **রেজিস্টার** চাপুন।\n২. **ধরণ নির্বাচন করুন**: Customer, Worker বা Contractor নির্বাচন করুন।\n৩. **তথ্য দিন**: নাম, ইমেল, মোবাইল নম্বর ও শহর লিখুন।\n৪. **ওটিপি যাচাই করুন**: ইমেল ওটিপি কোড দিয়ে অ্যাকাউন্ট অ্যাক্টিভ করুন।`;
    if (isHn) return `📝 **Fixiva par Register kaise karein**:\n\n1. **Register par click karein**: **Join Fixiva** ya **Register** button dabaayein.\n2. **Role select karein**: Customer, Worker ya Contractor chunein.\n3. **Details bharein**: Full Name, Email, Phone aur City enter karein.\n4. **OTP Verify karein**: Email OTP se account activate karein.`;

    return `📝 **How to Register on Fixiva**:\n\nFollow these simple steps to create a new account:\n\n1. **Click on Register**: Click the **Register** button at the top right of the page (or click the button below).\n2. **Select Account Type**: Choose whether you are registering as a **Customer**, **Worker / Technician**, or **Contractor Partner**.\n3. **Fill Information**: Enter your Full Name, Email Address, Mobile Number, and City.\n4. **Complete Registration**: Verify your email via OTP to instantly activate your account.\n\n🔑 **Already have an account?**\nIf you are already registered, click **Login** to sign in with your email.`;
  }

  // Service & Booking queries
  if (/book|plumb|electric|clean|hvac|ac |repair|service|catalogue|hire|carpenter|painter|pest|appliance/i.test(lowerQuery)) {
    let specificName = 'Service';
    if (availableServices && availableServices.length > 0) {
      const match = availableServices.find(s => s.name && lowerQuery.includes(s.name.toLowerCase()));
      if (match) specificName = match.name;
    } else if (lowerQuery.includes('plumb')) specificName = 'Plumbing';
    else if (lowerQuery.includes('electric')) specificName = 'Electrical';
    else if (lowerQuery.includes('clean')) specificName = 'Cleaning';
    else if (lowerQuery.includes('hvac') || lowerQuery.includes('ac')) specificName = 'AC & HVAC';

    if (isHi) return `🛠 **फ़िक्सिवा पर ${specificName} सेवा कैसे बुक करें**:\n\n1. **सेवा चुनें**: नीचे दिए गए बटन पर क्लिक करके सेवाओं की सूची खोलें।\n2. **समय और स्थान चुनें**: अपनी सुविधानुसार तिथि और समय स्लॉट चुनें।\n3. **पारदर्शी मूल्य दरें**: स्पष्ट शुल्क विवरण देखें (बिना किसी गुप्त शुल्क के)।\n4. **तुरंत बुकिंग और डिस्पैच**: पुष्टि करें! फ़िक्सिवा स्वचालित रूप से आपके निकटतम सत्यापित कारीगर को भेजेगा।`;
    if (isBn) return `🛠 **ফিক্সিভায় ${specificName} সেবা কীভাবে বুক করবেন**:\n\n১. **সেবা নির্বাচন করুন**: নিচের বোতামে চাপ দিয়ে সেবাসমূহের তালিকা খুলুন।\n২. **সময় ও স্থান দিন**: আপনার সুবিধাজনক তারিখ ও সময় স্লট বেছে নিন।\n৩. **স্বচ্ছ মূল্য তালিকা**: কোনো লুকানো খরচ ছাড়াই স্পষ্ট মূল্য দেখুন।\n৪. **ইনস্ট্যান্ট ডিসপ্যাচ**: নিশ্চিত করুন! ফিক্সিভা স্বয়ংক্রিয়ভাবে আপনার নিকটতম যাচাইকৃত কর্মীকে পাঠাবে।`;
    if (isHn) return `🛠 **Fixiva par ${specificName} kaise book karein**:\n\n1. **Service chunein**: Niche button par click karke service catalog kholein.\n2. **Time & Location chunein**: Apna date, time slot aur address enter karein.\n3. **Transparent Pricing**: Clear price breakdown dekhein (no hidden charges).\n4. **Instant Worker Dispatch**: Confirm karein! Fixiva nearby top verified worker dispatch kar dega.`;

    return `🛠 **How to Book ${specificName} on Fixiva**:\n\nFollow these simple steps to schedule your service:\n\n1. **Select Service**: Browse the **Services** menu or click the button below to open the service catalog.\n2. **Choose Date & Time**: Pick your preferred service slot and specify your location address.\n3. **Transparent Pricing**: View the upfront pricing breakdown (Base Fee + Platform Fee + Inspection Fee if applicable).\n4. **Instant Worker Dispatch**: Confirm your booking. Fixiva's dispatch board matches your request with top-rated verified professionals in your area!\n\nClick the button below to explore all available services and book now!`;
  }

  // Booking Tracking & Dispatches
  if (/dispatch|track|order|status|my booking|live status|assigned worker|no show|ongoing job/i.test(lowerQuery)) {
    if (isHi) return `📋 **लाइव बुकिंग ट्रैकिंग और डिस्पैच**:\n\n1. अपने **डैशबोर्ड** या **बुकिंग** टैब पर जाएं।\n2. रीयल-टाइम स्थिति देखें: **Pending** ➔ **Dispatched** ➔ **In Progress** ➔ **Completed**।\n3. अपने असाइन किए गए कारीगर का विवरण लाइव ट्रैक करें।`;
    if (isBn) return `📋 **লাইভ বুকিং ট্র্যাকিং এবং ডিসপ্যাচ**:\n\n১. আপনার **ড্যাশবোর্ড** বা **বুকিং** ট্যাবে যান।\n২. রিয়েল-টাইম স্ট্যাটাস দেখুন: **Pending** ➔ **Dispatched** ➔ **In Progress** ➔ **Completed**।\n৩. আপনার কর্মীর বিবরণ লাইভ ট্র্যাক করুন।`;
    if (isHn) return `📋 **Live Booking Tracking & Dispatch**:\n\n1. Apne **Dashboard** ya **Bookings** tab par jaayein.\n2. Real-time status dekhein: **Pending** ➔ **Dispatched** ➔ **In Progress** ➔ **Completed**.\n3. Assigned worker details live track karein.`;

    return `📋 **Fixiva Live Dispatch & Booking Tracking**:\n\n1. Head over to your **Dashboard** or click the **Bookings** tab.\n2. View real-time status updates: **Pending** ➔ **Dispatched** ➔ **In Progress** ➔ **Completed**.\n3. Get assigned worker contact details and track dispatch updates live.`;
  }

  // Greetings
  if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/i.test(lowerQuery) || lowerQuery === 'i want to know' || lowerQuery === 'help') {
    if (isHi) return `नमस्ते ${userName}! 👋 मैं आपका फ़िक्सिवा एआई सहायक हूँ।\n\nमैं आपकी मदद कर सकता हूँ:\n• **सेवा बुकिंग**: प्लंबिंग, इलेक्ट्रिकल, सफाई आदि कैसे बुक करें।\n• **बुकिंग स्थिति**: अपनी जारी या पिछली बुकिंग की जाँच करना।\n• **मूल्य और दरें**: बेस प्राइस और सुविधा शुल्क समझना।\n\nआज मैं आपकी क्या सहायता कर सकता हूँ?`;
    if (isBn) return `হ্যালো ${userName}! 👋 আমি আপনার ফিক্সিভা এআই অ্যাসিস্ট্যান্ট।\n\nআমি আপনাকে সাহায্য করতে পারি:\n• **সেবা বুকিং**: প্লাম্বিং, ইলেকট্রিক্যাল, পরিষ্কার বুকিং।\n• **বুকিং স্ট্যাটাস**: চলমান বুকিং চেক করা।\n• **মূল্য তালিকা**: চার্জ বোঝা।\n\nআজ আপনাকে কীভাবে সাহায্য করতে পারি?`;
    if (isHn) return `Hello ${userName}! 👋 Main aapka Fixiva AI Assistant hoon.\n\nMain aapki help kar sakta hoon:\n• **Service Booking**: Plumbing, Electrical, Cleaning booking.\n• **Booking Status**: Ongoing orders check karna.\n• **Pricing**: Clear rates samajhna.\n\nAaj main aapki kya help kar sakta hoon?`;

    return `Hello ${userName}! 👋 Welcome to Fixiva Support.\n\nI am your AI Assistant and can help you with:\n• **Service Bookings**: How to book plumbing, electrical, cleaning, and more.\n• **Booking Status**: Checking your ongoing or past orders.\n• **Pricing & Fees**: Understanding base prices, platform fees, and city tariffs.\n• **Cancellation & Support**: Raising support tickets or modifying orders.\n\nHow can I assist you today?`;
  }

  // Default smart fallback response
  if (isHi) return `धन्यवाद, ${userName}! 🤖\n\n**"${query}"** के बारे में:\nफ़िक्सिवा निर्बाध होम सर्विस प्रबंधन प्रदान करता है। क्या आप बुकिंग, पेआउट या सत्यापन में मदद चाहते हैं?\n\n• आप नीचे **सहायता केंद्र** पर जा सकते हैं।`;
  if (isBn) return `ধন্যবাদ, ${userName}! 🤖\n\n**"${query}"** সম্পর্কে:\nফিক্সিভা সহজ হোম সার্ভিস ব্যবস্থাপনা প্রদান করে।\n\n• আপনি নিচে সাপোর্ট টিকিট পাঠাতে পারেন।`;
  if (isHn) return `Thank you, ${userName}! 🤖\n\nRegarding **"${query}"**:\nFixiva se aap kisi bhi home service ko easily book aur track kar sakte hain.`;

  return `Thank you for asking, ${userName}! 🤖\n\nRegarding **"${query}"**:\nFixiva is designed to provide seamless end-to-end service management. Whether you need assistance with job dispatches, booking updates, pricing tariffs, or account verification, our platform handles it automatically.`;
}

/**
 * Helper to generate quick prompt suggestion chips in active language
 */
function getSuggestedPrompts(userRole, userLanguage = 'en') {
  if (userLanguage === 'hi') {
    return [
      'फ़िक्सिवा में लॉगिन कैसे करें?',
      'प्लंबिंग बुकिंग कैसे करें?',
      'डिस्पैच कैसे काम करता है?',
      'रद्दीकरण नीति (Cancellation)'
    ];
  } else if (userLanguage === 'bn') {
    return [
      'ফিক্সিভায় কীভাবে লগইন করবেন?',
      'প্লাম্বিং সেবা বুক করবেন কীভাবে?',
      'ডিসপ্যাচ কীভাবে কাজ করে?',
      'বাতিলকরণ নীতি (Cancellation)'
    ];
  } else if (userLanguage === 'hinglish') {
    return [
      'How to login in Fixiva?',
      'Plumbing kaise book karein?',
      'Dispatches kaise kaam karta hai?',
      'Cancellation policy kya hai?'
    ];
  }

  return [
    'How to Login in fixiva?',
    'How to book plumbing?',
    'How do dispatches work?',
    'Worker trust score rules',
    'Cancellation policy'
  ];
}


