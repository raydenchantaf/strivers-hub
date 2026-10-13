/* AUTO-GENERATED from the live platform's own question bank.
   Twenty-five questions across two branches: business owners answer 24,
   aspiring entrepreneurs 21. Only q3a, q3b and q3c carry points - see
   ./scoring.ts for why that matters. */

import type { Question, SectionKey, Localised } from './types';

export const sections: Record<SectionKey, Localised> = {
  "Business Status": {
    "en": "Business status",
    "bm": "Status perniagaan"
  },
  "Business Info": {
    "en": "About your business",
    "bm": "Tentang perniagaan anda"
  },
  "Categorisation": {
    "en": "Where you are now",
    "bm": "Di mana anda sekarang"
  },
  "Baseline": {
    "en": "Digital confidence",
    "bm": "Keyakinan digital"
  },
  "Demographic": {
    "en": "About you",
    "bm": "Tentang anda"
  }
};

export const questions: Record<string, Question> = {
  q1: {
    "id": "q1",
    "section": "Business Status",
    "type": "single",
    "text": {
      "en": "Do you presently own a business?",
      "bm": "Adakah anda memiliki perniagaan pada masa kini?"
    },
    "next": "q2a",
    "options": [
      {
        "id": "q1_yes",
        "label": {
          "en": "Yes",
          "bm": "Ya"
        },
        "points": 0,
        "next": "q2a"
      },
      {
        "id": "q1_no",
        "label": {
          "en": "No, but I aspire to be an entrepreneur",
          "bm": "Tidak, tetapi saya berhasrat untuk menjadi seorang usahawan"
        },
        "points": 0,
        "next": "q2b"
      }
    ]
  },

  q2a: {
    "id": "q2a",
    "section": "Business Info",
    "type": "multi",
    "text": {
      "en": "Kindly specify the type or industry of your business (you may select multiple responses)",
      "bm": "Jika ya, sila nyatakan jenis atau industri perniagaan anda: (boleh pilih lebih daripada satu)"
    },
    "next": "q2a1",
    "options": [
      {
        "id": "q2a_1",
        "label": {
          "en": "Hospitality services",
          "bm": "Perkhidmatan hospitaliti/pelancongan"
        },
        "points": 0
      },
      {
        "id": "q2a_2",
        "label": {
          "en": "Arts, entertainment & recreation",
          "bm": "Seni, hiburan & rekreasi"
        },
        "points": 0
      },
      {
        "id": "q2a_3",
        "label": {
          "en": "Beauty & cosmetics",
          "bm": "Kecantikan & kosmetik"
        },
        "points": 0
      },
      {
        "id": "q2a_4",
        "label": {
          "en": "Creative & media",
          "bm": "Kreatif & media"
        },
        "points": 0
      },
      {
        "id": "q2a_5",
        "label": {
          "en": "Education",
          "bm": "Pendidikan"
        },
        "points": 0
      },
      {
        "id": "q2a_6",
        "label": {
          "en": "Fashion & jewellery",
          "bm": "Fesyen & barangan kemas"
        },
        "points": 0
      },
      {
        "id": "q2a_7",
        "label": {
          "en": "Financial & insurance activities",
          "bm": "Perkhidmatan kewangan & insurans"
        },
        "points": 0
      },
      {
        "id": "q2a_8",
        "label": {
          "en": "Food & drink",
          "bm": "Makanan & minuman"
        },
        "points": 0
      },
      {
        "id": "q2a_9",
        "label": {
          "en": "Health, fitness & wellness",
          "bm": "Penjagaan kesihatan, kecergasan & kesejahteraan"
        },
        "points": 0
      },
      {
        "id": "q2a_10",
        "label": {
          "en": "Wholesale & international trade",
          "bm": "Borong & perdagangan antarabangsa"
        },
        "points": 0
      },
      {
        "id": "q2a_11",
        "label": {
          "en": "Other (please specify)",
          "bm": "Lain-lain (sila nyatakan)"
        },
        "points": 0,
        "hasOther": true
      }
    ]
  },

  q2a1: {
    "id": "q2a1",
    "section": "Business Info",
    "type": "text",
    "text": {
      "en": "How many years has your business been in operation?",
      "bm": "Berapa lamakah perniagaan anda sudah beroperasi?"
    },
    "next": "q2a2",
    "inputType": "number",
    "placeholder": {
      "en": "Enter number of years (e.g., 3)",
      "bm": "Masukkan bilangan tahun (cth., 3)"
    }
  },

  q2a2: {
    "id": "q2a2",
    "section": "Business Info",
    "type": "single",
    "text": {
      "en": "Please indicate the number of employees that you have for your business (including part-time, full-time staffs, if you have multiple businesses then choose the main one)",
      "bm": "Nyatakan bilangan pekerja untuk perniagaan anda (termasuk pekerja separa masa, pekerja sepenuh masa. Jika anda memiliki beberapa perniagaan maka pilih yang utama.)"
    },
    "next": "q2a3",
    "options": [
      {
        "id": "q2a2_1",
        "label": {
          "en": "< 5",
          "bm": "< 5"
        },
        "points": 0
      },
      {
        "id": "q2a2_2",
        "label": {
          "en": "5-10",
          "bm": "5-10"
        },
        "points": 0
      },
      {
        "id": "q2a2_3",
        "label": {
          "en": "16-30",
          "bm": "16-30"
        },
        "points": 0
      },
      {
        "id": "q2a2_4",
        "label": {
          "en": "31-50",
          "bm": "31-50"
        },
        "points": 0
      },
      {
        "id": "q2a2_5",
        "label": {
          "en": "51-75",
          "bm": "51-75"
        },
        "points": 0
      },
      {
        "id": "q2a2_6",
        "label": {
          "en": "75+",
          "bm": "75+"
        },
        "points": 0
      }
    ]
  },

  q2a3: {
    "id": "q2a3",
    "section": "Business Info",
    "type": "dropdown",
    "text": {
      "en": "What is the approximate monthly revenue of your business?",
      "bm": "Apakah anggaran pendapatan bulanan perniagaan anda?"
    },
    "next": "q3a",
    "options": [
      {
        "id": "q2a3_1",
        "label": {
          "en": "Below RM 1,500",
          "bm": "Di bawah RM 1,500"
        },
        "points": 0
      },
      {
        "id": "q2a3_2",
        "label": {
          "en": "RM 1,501 - RM 2,500",
          "bm": "RM 1,501 - RM 2,500"
        },
        "points": 0
      },
      {
        "id": "q2a3_3",
        "label": {
          "en": "RM 2,501 - RM 5,000",
          "bm": "RM 2,501 - RM 5,000"
        },
        "points": 0
      },
      {
        "id": "q2a3_4",
        "label": {
          "en": "RM 5,001 - RM 7,500",
          "bm": "RM 5,001 - RM 7,500"
        },
        "points": 0
      },
      {
        "id": "q2a3_5",
        "label": {
          "en": "RM 7,501 - RM 10,000",
          "bm": "RM 7,501 - RM 10,000"
        },
        "points": 0
      },
      {
        "id": "q2a3_6",
        "label": {
          "en": "RM 10,001 - RM 12,500",
          "bm": "RM 10,001 - RM 12,500"
        },
        "points": 0
      },
      {
        "id": "q2a3_7",
        "label": {
          "en": "Above RM 12,500",
          "bm": "Melebihi RM 12,500"
        },
        "points": 0
      },
      {
        "id": "q2a3_8",
        "label": {
          "en": "Prefer not to say",
          "bm": "Tidak ingin menjawab"
        },
        "points": 0
      }
    ]
  },

  q2b: {
    "id": "q2b",
    "section": "Business Info",
    "type": "multi",
    "text": {
      "en": "Kindly specify the type of industry of your interest (you may select multiple responses)",
      "bm": "Jika tidak, sila nyatakan jenis industri yang anda minati: (boleh pilih lebih daripada satu)"
    },
    "next": "q3a",
    "options": [
      {
        "id": "q2b_1",
        "label": {
          "en": "Hospitality services",
          "bm": "Perkhidmatan hospitaliti/pelancongan"
        },
        "points": 0
      },
      {
        "id": "q2b_2",
        "label": {
          "en": "Arts, entertainment & recreation",
          "bm": "Seni, hiburan & rekreasi"
        },
        "points": 0
      },
      {
        "id": "q2b_3",
        "label": {
          "en": "Beauty & cosmetics",
          "bm": "Kecantikan & kosmetik"
        },
        "points": 0
      },
      {
        "id": "q2b_4",
        "label": {
          "en": "Creative & media",
          "bm": "Kreatif & media"
        },
        "points": 0
      },
      {
        "id": "q2b_5",
        "label": {
          "en": "Education",
          "bm": "Pendidikan"
        },
        "points": 0
      },
      {
        "id": "q2b_6",
        "label": {
          "en": "Fashion & jewellery",
          "bm": "Fesyen & barangan kemas"
        },
        "points": 0
      },
      {
        "id": "q2b_7",
        "label": {
          "en": "Financial & insurance activities",
          "bm": "Perkhidmatan kewangan & insurans"
        },
        "points": 0
      },
      {
        "id": "q2b_8",
        "label": {
          "en": "Food & drink",
          "bm": "Makanan & minuman"
        },
        "points": 0
      },
      {
        "id": "q2b_9",
        "label": {
          "en": "Health, fitness & wellness",
          "bm": "Penjagaan kesihatan, kecergasan & kesejahteraan"
        },
        "points": 0
      },
      {
        "id": "q2b_10",
        "label": {
          "en": "Wholesale & international trade",
          "bm": "Borong & perdagangan antarabangsa"
        },
        "points": 0
      },
      {
        "id": "q2b_11",
        "label": {
          "en": "Other (please specify)",
          "bm": "Lain-lain (sila nyatakan)"
        },
        "points": 0,
        "hasOther": true
      }
    ]
  },

  q3a: {
    "id": "q3a",
    "section": "Categorisation",
    "type": "single",
    "text": {
      "en": "Where are you in your entrepreneurial journey?",
      "bm": "Di mana anda berada dalam perjalanan keusahawanan anda?"
    },
    "next": "q3b",
    "options": [
      {
        "id": "q3a_1",
        "label": {
          "en": "I'm in the early stages, focusing on conceptualizing my business, working on ideation and opportunity, or setting up my business platform.",
          "bm": "Saya berada dalam peringkat awal, sedang mengusahakan konsep dan idea, mencari peluang, atau menyediakan platform perniagaan."
        },
        "points": 1
      },
      {
        "id": "q3a_2",
        "label": {
          "en": "I have launched my business. I'm focusing on managing daily operations, resources, and addressing challenges for business stability.",
          "bm": "Perniagaan saya sudah dilancarkan, dan saya memberi tumpuan kepada operasi harian, sumber, dan menangani cabaran untuk kestabilan perniagaan."
        },
        "points": 2
      },
      {
        "id": "q3a_3",
        "label": {
          "en": "I'm actively planning and taking steps for business growth and expansion, focusing on increasing market share or entering new market.",
          "bm": "Saya secara aktif merancang dan mengambil langkah untuk perkembangan perniagaan yang mampan, memfokuskan pada peningkatan bahagian pasaran atau memasuki pasaran baharu."
        },
        "points": 3
      }
    ]
  },

  q3b: {
    "id": "q3b",
    "section": "Categorisation",
    "type": "multi",
    "text": {
      "en": "What type of training resources are you currently looking for in your entrepreneurial journey? (Select 4 options)",
      "bm": "Apakah jenis sumber latihan yang sedang anda cari/minat dalam perjalanan keusahawanan anda sekarang? (Pilih 4 pilihan)"
    },
    "next": "q3c",
    "options": [
      {
        "id": "q3b_1a",
        "label": {
          "en": "Business registration/licensing",
          "bm": "Pendaftaran perniagaan/perlesenan"
        },
        "points": 1
      },
      {
        "id": "q3b_1b",
        "label": {
          "en": "Online presence setup",
          "bm": "Penubuhan kewujudan perniagaan atas talian"
        },
        "points": 1
      },
      {
        "id": "q3b_1c",
        "label": {
          "en": "Basic market research techniques",
          "bm": "Teknik asas penyelidikan pasaran"
        },
        "points": 1
      },
      {
        "id": "q3b_1d",
        "label": {
          "en": "Financial Planning Basics",
          "bm": "Perancangan kewangan asas"
        },
        "points": 1
      },
      {
        "id": "q3b_2a",
        "label": {
          "en": "Day-to-day operation management",
          "bm": "Pengurusan operasi harian"
        },
        "points": 2
      },
      {
        "id": "q3b_2b",
        "label": {
          "en": "Human resource management",
          "bm": "Pengurusan sumber manusia"
        },
        "points": 2
      },
      {
        "id": "q3b_2c",
        "label": {
          "en": "Cost control and budgeting",
          "bm": "Kawalan kos dan perancangan belanjawan"
        },
        "points": 2
      },
      {
        "id": "q3b_2d",
        "label": {
          "en": "Alternative investments",
          "bm": "Pelaburan alternatif"
        },
        "points": 2
      },
      {
        "id": "q3b_3a",
        "label": {
          "en": "Networking opportunities and strategic partnerships",
          "bm": "Peluang jaringan dan perkongsian strategik"
        },
        "points": 3
      },
      {
        "id": "q3b_3b",
        "label": {
          "en": "Business expansion strategies",
          "bm": "Strategi pengembangan perniagaan"
        },
        "points": 3
      },
      {
        "id": "q3b_3c",
        "label": {
          "en": "Advanced digital marketing skills",
          "bm": "Kemahiran pemasaran digital yang canggih"
        },
        "points": 3
      },
      {
        "id": "q3b_3d",
        "label": {
          "en": "Industry updates and events",
          "bm": "Berita dan acara-acara terkini industri"
        },
        "points": 3
      }
    ],
    "maxSelections": 4,
    "exactSelections": true
  },

  q3c: {
    "id": "q3c",
    "section": "Categorisation",
    "type": "single",
    "text": {
      "en": "Do you promote or market your products/services online?",
      "bm": "Adakah anda mengiklankan atau memasarkan produk / perkhidmatan anda dalam talian."
    },
    "next": "q4a",
    "options": [
      {
        "id": "q3c_1",
        "label": {
          "en": "Not at all",
          "bm": "Tidak langsung"
        },
        "points": 1
      },
      {
        "id": "q3c_2",
        "label": {
          "en": "Yes, on a single platform",
          "bm": "Ya, pada satu platform sahaja"
        },
        "points": 2
      },
      {
        "id": "q3c_3",
        "label": {
          "en": "Yes, on multiple platforms",
          "bm": "Ya, pada pelbagai platform"
        },
        "points": 3
      }
    ]
  },

  q4a: {
    "id": "q4a",
    "section": "Baseline",
    "type": "likert",
    "text": {
      "en": "How would you rate your level of AI and digital literacy?",
      "bm": "Bagaimanakah anda menilai tahap literasi AI dan digital anda?"
    },
    "next": "q4b",
    "likert": {
      "low": {
        "en": "Low",
        "bm": "Rendah"
      },
      "high": {
        "en": "High",
        "bm": "Tinggi"
      }
    }
  },

  q4b: {
    "id": "q4b",
    "section": "Baseline",
    "type": "likert",
    "text": {
      "en": "I am confident in using AI and digital tools for my business.",
      "bm": "Saya yakin menggunakan AI dan alat digital untuk perniagaan saya."
    },
    "next": "q4c",
    "likert": {
      "low": {
        "en": "Strongly Disagree",
        "bm": "Sangat Tidak Setuju"
      },
      "high": {
        "en": "Strongly Agree",
        "bm": "Sangat Setuju"
      }
    }
  },

  q4c: {
    "id": "q4c",
    "section": "Baseline",
    "type": "likert",
    "text": {
      "en": "I frequently leverage digital platforms for networking and seeking support within the entrepreneurial community.",
      "bm": "Saya kerap menggunakan platform digital untuk mendapatkan rangkaian dan sokongan dalam komuniti keusahawanan."
    },
    "next": "q4d",
    "likert": {
      "low": {
        "en": "Strongly Disagree",
        "bm": "Sangat Tidak Setuju"
      },
      "high": {
        "en": "Strongly Agree",
        "bm": "Sangat Setuju"
      }
    }
  },

  q4d: {
    "id": "q4d",
    "section": "Baseline",
    "type": "likert",
    "text": {
      "en": "I have a reliable support system (e.g., mentors, family, friends, business networks) in place to assist me as an entrepreneur.",
      "bm": "Saya mempunyai sistem sokongan yang boleh dipercayai (contohnya, mentor, keluarga, rakan-rakan, rangkaian perniagaan) untuk membantu saya sebagai usahawan."
    },
    "next": "q4e",
    "likert": {
      "low": {
        "en": "Strongly Disagree",
        "bm": "Sangat Tidak Setuju"
      },
      "high": {
        "en": "Strongly Agree",
        "bm": "Sangat Setuju"
      }
    }
  },

  q4e: {
    "id": "q4e",
    "section": "Baseline",
    "type": "multi",
    "text": {
      "en": "Which of the following AI tools or platforms have you used for your business? (Tick all that apply)",
      "bm": "Antara alat atau platform AI berikut, yang manakah pernah anda gunakan untuk perniagaan anda? (Tandakan semua yang berkenaan)"
    },
    "next": "q4f",
    "options": [
      {
        "id": "q4e_1",
        "label": {
          "en": "ChatGPT / Claude / Gemini",
          "bm": "ChatGPT / Claude / Gemini"
        },
        "points": 0
      },
      {
        "id": "q4e_2",
        "label": {
          "en": "Canva AI",
          "bm": "Canva AI"
        },
        "points": 0
      },
      {
        "id": "q4e_3",
        "label": {
          "en": "Meta AI / TikTok AI features",
          "bm": "Meta AI / Ciri AI TikTok"
        },
        "points": 0
      },
      {
        "id": "q4e_4",
        "label": {
          "en": "Grammarly / Notion AI",
          "bm": "Grammarly / Notion AI"
        },
        "points": 0
      },
      {
        "id": "q4e_5",
        "label": {
          "en": "Google Analytics / Meta Insights",
          "bm": "Google Analytics / Meta Insights"
        },
        "points": 0
      },
      {
        "id": "q4e_6",
        "label": {
          "en": "AI chatbots for customer service (e.g. Tidio, ManyChat)",
          "bm": "Chatbot AI untuk khidmat pelanggan (contohnya Tidio, ManyChat)"
        },
        "points": 0
      },
      {
        "id": "q4e_7",
        "label": {
          "en": "AI accounting tools (e.g. Wave, QuickBooks AI)",
          "bm": "Alat perakaunan AI (contohnya Wave, QuickBooks AI)"
        },
        "points": 0
      },
      {
        "id": "q4e_8",
        "label": {
          "en": "AI image/video generators (e.g. Adobe Firefly, CapCut AI)",
          "bm": "Penjana imej/video AI (contohnya Adobe Firefly, CapCut AI)"
        },
        "points": 0
      }
    ]
  },

  q4f: {
    "id": "q4f",
    "section": "Baseline",
    "type": "single",
    "text": {
      "en": "How often do you use AI tools for your business?",
      "bm": "Berapa kerap anda menggunakan alat AI untuk perniagaan anda?"
    },
    "next": "q4g",
    "options": [
      {
        "id": "q4f_1",
        "label": {
          "en": "Never",
          "bm": "Tidak pernah"
        },
        "points": 0
      },
      {
        "id": "q4f_2",
        "label": {
          "en": "Rarely",
          "bm": "Jarang"
        },
        "points": 0
      },
      {
        "id": "q4f_3",
        "label": {
          "en": "A few times a month",
          "bm": "Beberapa kali sebulan"
        },
        "points": 0
      },
      {
        "id": "q4f_4",
        "label": {
          "en": "A few times a week",
          "bm": "Beberapa kali seminggu"
        },
        "points": 0
      },
      {
        "id": "q4f_5",
        "label": {
          "en": "Daily",
          "bm": "Setiap hari"
        },
        "points": 0
      }
    ]
  },

  q4g: {
    "id": "q4g",
    "section": "Baseline",
    "type": "multi",
    "text": {
      "en": "What type of digital and AI-related training resources are you currently looking for in your entrepreneurial journey? (Select up to 4 options)",
      "bm": "Apakah jenis latihan atau sumber pembelajaran berkaitan digital dan AI yang sedang anda cari dalam perjalanan keusahawanan anda? (Pilih sehingga 4 pilihan)"
    },
    "next": "q4h",
    "options": [
      {
        "id": "q4g_1",
        "label": {
          "en": "Using AI tools to automate business tasks",
          "bm": "Menggunakan alat AI untuk mengautomasikan tugas perniagaan"
        },
        "points": 0
      },
      {
        "id": "q4g_2",
        "label": {
          "en": "Setting up and managing an online business presence",
          "bm": "Menubuhkan dan mengurus kehadiran perniagaan dalam talian"
        },
        "points": 0
      },
      {
        "id": "q4g_3",
        "label": {
          "en": "Digital marketing and social media strategies",
          "bm": "Pemasaran digital dan strategi media sosial"
        },
        "points": 0
      },
      {
        "id": "q4g_4",
        "label": {
          "en": "Understanding data and analytics for business decisions",
          "bm": "Memahami data dan analitik untuk membuat keputusan perniagaan"
        },
        "points": 0
      },
      {
        "id": "q4g_5",
        "label": {
          "en": "Cybersecurity and protecting your business online",
          "bm": "Keselamatan siber dan perlindungan perniagaan dalam talian"
        },
        "points": 0
      },
      {
        "id": "q4g_6",
        "label": {
          "en": "E-commerce and digital payment systems",
          "bm": "E-dagang dan sistem pembayaran digital"
        },
        "points": 0
      },
      {
        "id": "q4g_7",
        "label": {
          "en": "Using productivity and collaboration software (e.g., Google Workspace, Canva, Notion)",
          "bm": "Menggunakan perisian produktiviti dan kolaborasi (contohnya Google Workspace, Canva, Notion)"
        },
        "points": 0
      },
      {
        "id": "q4g_8",
        "label": {
          "en": "AI-powered customer engagement tools (e.g., chatbots, CRM systems)",
          "bm": "Alat penglibatan pelanggan berasaskan AI (contohnya chatbot dan sistem CRM)"
        },
        "points": 0
      }
    ],
    "maxSelections": 4
  },

  q4h: {
    "id": "q4h",
    "section": "Baseline",
    "type": "single",
    "text": {
      "en": "Have you observed or experienced any instances of prejudice or bias against women entrepreneurs in your work experiences?",
      "bm": "Adakah anda pernah memerhati atau mengalami sebarang kejadian prasangka atau bias terhadap usahawan wanita dalam pengalaman kerja anda?"
    },
    "next": "q5a",
    "options": [
      {
        "id": "q4h_1",
        "label": {
          "en": "Always",
          "bm": "Sentiasa"
        },
        "points": 0
      },
      {
        "id": "q4h_2",
        "label": {
          "en": "Sometimes",
          "bm": "Kadang-kadang"
        },
        "points": 0
      },
      {
        "id": "q4h_3",
        "label": {
          "en": "Seldom",
          "bm": "Jarang"
        },
        "points": 0
      },
      {
        "id": "q4h_4",
        "label": {
          "en": "Never",
          "bm": "Tidak pernah"
        },
        "points": 0
      }
    ]
  },

  q5a: {
    "id": "q5a",
    "section": "Demographic",
    "type": "single",
    "text": {
      "en": "What is your gender identity?",
      "bm": "Apakah identiti gender anda?"
    },
    "next": "q5b",
    "options": [
      {
        "id": "q5a_1",
        "label": {
          "en": "Female",
          "bm": "Perempuan"
        },
        "points": 0
      },
      {
        "id": "q5a_2",
        "label": {
          "en": "Male",
          "bm": "Lelaki"
        },
        "points": 0
      }
    ]
  },

  q5b: {
    "id": "q5b",
    "section": "Demographic",
    "type": "single",
    "text": {
      "en": "Which age group do you fall into?",
      "bm": "Berapakah umur anda?"
    },
    "next": "q5c",
    "options": [
      {
        "id": "q5b_1",
        "label": {
          "en": "<21",
          "bm": "<21"
        },
        "points": 0
      },
      {
        "id": "q5b_2",
        "label": {
          "en": "21-30",
          "bm": "21-30"
        },
        "points": 0
      },
      {
        "id": "q5b_3",
        "label": {
          "en": "31-40",
          "bm": "31-40"
        },
        "points": 0
      },
      {
        "id": "q5b_4",
        "label": {
          "en": "41-50",
          "bm": "41-50"
        },
        "points": 0
      },
      {
        "id": "q5b_5",
        "label": {
          "en": "51-60",
          "bm": "51-60"
        },
        "points": 0
      },
      {
        "id": "q5b_6",
        "label": {
          "en": "60+",
          "bm": "60+"
        },
        "points": 0
      }
    ]
  },

  q5c: {
    "id": "q5c",
    "section": "Demographic",
    "type": "dropdown",
    "text": {
      "en": "In which state do you currently reside?",
      "bm": "Di negeri mana anda tinggal sekarang?"
    },
    "next": "q5d",
    "options": [
      {
        "id": "johor",
        "label": {
          "en": "Johor",
          "bm": "Johor"
        },
        "points": 0
      },
      {
        "id": "kedah",
        "label": {
          "en": "Kedah",
          "bm": "Kedah"
        },
        "points": 0
      },
      {
        "id": "kelantan",
        "label": {
          "en": "Kelantan",
          "bm": "Kelantan"
        },
        "points": 0
      },
      {
        "id": "kl",
        "label": {
          "en": "Kuala Lumpur",
          "bm": "Kuala Lumpur"
        },
        "points": 0
      },
      {
        "id": "labuan",
        "label": {
          "en": "Labuan",
          "bm": "Labuan"
        },
        "points": 0
      },
      {
        "id": "melaka",
        "label": {
          "en": "Melaka",
          "bm": "Melaka"
        },
        "points": 0
      },
      {
        "id": "ns",
        "label": {
          "en": "Negeri Sembilan",
          "bm": "Negeri Sembilan"
        },
        "points": 0
      },
      {
        "id": "pahang",
        "label": {
          "en": "Pahang",
          "bm": "Pahang"
        },
        "points": 0
      },
      {
        "id": "penang",
        "label": {
          "en": "Penang",
          "bm": "Pulau Pinang"
        },
        "points": 0
      },
      {
        "id": "perak",
        "label": {
          "en": "Perak",
          "bm": "Perak"
        },
        "points": 0
      },
      {
        "id": "perlis",
        "label": {
          "en": "Perlis",
          "bm": "Perlis"
        },
        "points": 0
      },
      {
        "id": "putrajaya",
        "label": {
          "en": "Putrajaya",
          "bm": "Putrajaya"
        },
        "points": 0
      },
      {
        "id": "sabah",
        "label": {
          "en": "Sabah",
          "bm": "Sabah"
        },
        "points": 0
      },
      {
        "id": "sarawak",
        "label": {
          "en": "Sarawak",
          "bm": "Sarawak"
        },
        "points": 0
      },
      {
        "id": "selangor",
        "label": {
          "en": "Selangor",
          "bm": "Selangor"
        },
        "points": 0
      },
      {
        "id": "terengganu",
        "label": {
          "en": "Terengganu",
          "bm": "Terengganu"
        },
        "points": 0
      }
    ]
  },

  q5d: {
    "id": "q5d",
    "section": "Demographic",
    "type": "single",
    "text": {
      "en": "How would you describe your current residence area?",
      "bm": "Di manakah lokasi tempat tinggal anda?"
    },
    "next": "q5e",
    "options": [
      {
        "id": "q5d_1",
        "label": {
          "en": "Urban",
          "bm": "Bandaraya"
        },
        "points": 0
      },
      {
        "id": "q5d_2",
        "label": {
          "en": "Semi-urban",
          "bm": "Bandar kecil"
        },
        "points": 0
      },
      {
        "id": "q5d_3",
        "label": {
          "en": "Rural",
          "bm": "Luar bandar"
        },
        "points": 0
      }
    ]
  },

  q5e: {
    "id": "q5e",
    "section": "Demographic",
    "type": "single",
    "text": {
      "en": "What is your ethnic background?",
      "bm": "Apakah latar belakang etnik anda?"
    },
    "next": "q5f",
    "options": [
      {
        "id": "q5e_1",
        "label": {
          "en": "Malay",
          "bm": "Melayu"
        },
        "points": 0
      },
      {
        "id": "q5e_2",
        "label": {
          "en": "Chinese",
          "bm": "Cina"
        },
        "points": 0
      },
      {
        "id": "q5e_3",
        "label": {
          "en": "Indian",
          "bm": "India"
        },
        "points": 0
      },
      {
        "id": "q5e_4",
        "label": {
          "en": "Other bumiputera (Bajau, Bidayuh, Dusun, Kadazan, Melanau, etc)",
          "bm": "Bumiputera lain (Bajau, Bidayuh, Dusun, Kadazan, Melanau, dll)"
        },
        "points": 0
      },
      {
        "id": "q5e_5",
        "label": {
          "en": "Other (please specify)",
          "bm": "Lain-lain (sila nyatakan)"
        },
        "points": 0,
        "hasOther": true
      }
    ]
  },

  q5f: {
    "id": "q5f",
    "section": "Demographic",
    "type": "single",
    "text": {
      "en": "What is the highest level of education you have?",
      "bm": "Apakah tahap pendidikan tertinggi anda?"
    },
    "next": "q5g",
    "options": [
      {
        "id": "q5f_1",
        "label": {
          "en": "No Formal Education",
          "bm": "Tiada pendidikan formal"
        },
        "points": 0
      },
      {
        "id": "q5f_2",
        "label": {
          "en": "Primary School",
          "bm": "Sekolah rendah"
        },
        "points": 0
      },
      {
        "id": "q5f_3",
        "label": {
          "en": "Secondary School",
          "bm": "Sekolah menengah"
        },
        "points": 0
      },
      {
        "id": "q5f_4",
        "label": {
          "en": "University/college and above",
          "bm": "Universiti/kolej dan ke atas"
        },
        "points": 0
      },
      {
        "id": "q5f_5",
        "label": {
          "en": "Other (please specify)",
          "bm": "Lain-lain (sila nyatakan)"
        },
        "points": 0,
        "hasOther": true
      }
    ]
  },

  q5g: {
    "id": "q5g",
    "section": "Demographic",
    "type": "multi-text",
    "text": {
      "en": "Please provide your contact details",
      "bm": "Sila berikan maklumat hubungan anda"
    },
    "next": "q5k",
    "fields": [
      {
        "id": "q5g",
        "label": {
          "en": "First name",
          "bm": "Nama pertama"
        },
        "placeholder": {
          "en": "Enter your first name",
          "bm": "Masukkan nama pertama anda"
        },
        "inputType": "text",
        "required": true
      },
      {
        "id": "q5h",
        "label": {
          "en": "Last name",
          "bm": "Nama keluarga"
        },
        "placeholder": {
          "en": "Enter your last name",
          "bm": "Masukkan nama keluarga anda"
        },
        "inputType": "text",
        "required": true
      },
      {
        "id": "q5i",
        "label": {
          "en": "Email",
          "bm": "E-mel"
        },
        "placeholder": {
          "en": "Enter your email address",
          "bm": "Masukkan alamat e-mel anda"
        },
        "inputType": "email",
        "required": true
      },
      {
        "id": "q5j",
        "label": {
          "en": "Contact number",
          "bm": "Nombor telefon"
        },
        "placeholder": {
          "en": "Enter your contact number",
          "bm": "Masukkan nombor telefon anda"
        },
        "inputType": "tel"
      }
    ]
  },

  q5k: {
    "id": "q5k",
    "section": "Demographic",
    "type": "single",
    "text": {
      "en": "How did you hear about Strivers' Hub?",
      "bm": "Bagaimana anda mendapat tahu tentang Strivers' Hub?"
    },
    "next": "[END]",
    "options": [
      {
        "id": "q5k_1",
        "label": {
          "en": "Universiti Malaysia Kelantan/GERIK",
          "bm": "Universiti Malaysia Kelantan/GERIK"
        },
        "points": 0
      },
      {
        "id": "q5k_6",
        "label": {
          "en": "FutureLab",
          "bm": "FutureLab"
        },
        "points": 0
      },
      {
        "id": "q5k_7",
        "label": {
          "en": "Facebook",
          "bm": "Facebook"
        },
        "points": 0
      },
      {
        "id": "q5k_8",
        "label": {
          "en": "WhatsApp",
          "bm": "WhatsApp"
        },
        "points": 0
      },
      {
        "id": "q5k_9",
        "label": {
          "en": "Other (please specify)",
          "bm": "Lain-lain (sila nyatakan)"
        },
        "points": 0,
        "hasOther": true
      }
    ]
  },
};

/** Entry point of the flow. */
export const FIRST_QUESTION = 'q1';

/** Total questions on each branch, used for the progress ring. */
export const BRANCH_LENGTH = { owner: 24, aspiring: 21 } as const;
