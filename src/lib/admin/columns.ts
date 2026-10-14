/**
 * The assessment export columns, exactly as the previous platform's Excel
 * export wrote them (scripts/export.mjs and data/questions-map.mjs in the old
 * repository), so a spreadsheet from the new admin page lines up with the
 * ones TAF already has. q6a to q6g are caregiving questions the old site asked
 * until July 2026; older rows carry them, newer ones leave them blank.
 */

export const QUESTION_ORDER = ["q1","q2a","q2a1","q2a2","q2a3","q2b","q3a","q3b","q3c","q4a","q4b","q4c","q4d","q4e","q4f","q4g","q4h","q6a","q6b","q6c","q6d","q6e","q6f","q6g","q5a","q5b","q5c","q5d","q5e","q5f","q5g","q5h","q5i","q5j","q5k"] as const;

export const QUESTION_LABELS: Record<string, { en: string; bm: string }> = {
  q1: {"en":"Do you presently own a business?","bm":"Adakah anda memiliki perniagaan pada masa kini?"},
  q2a: {"en":"Type/industry of your business (multiple allowed)","bm":"Jenis/industri perniagaan anda (boleh pilih lebih daripada satu)"},
  q2a1: {"en":"How many years has your business been in operation?","bm":"Berapa lamakah perniagaan anda sudah beroperasi?"},
  q2a2: {"en":"Number of employees","bm":"Bilangan pekerja"},
  q2a3: {"en":"Approximate monthly revenue","bm":"Anggaran pendapatan bulanan"},
  q2b: {"en":"Type of industry of interest (multiple allowed)","bm":"Jenis industri yang diminati (boleh pilih lebih daripada satu)"},
  q3a: {"en":"Where are you in your entrepreneurial journey?","bm":"Di mana anda berada dalam perjalanan keusahawanan anda?"},
  q3b: {"en":"Training resources you are looking for (select 4)","bm":"Sumber latihan yang anda cari (pilih 4)"},
  q3c: {"en":"Do you promote/market your products/services online?","bm":"Adakah anda mengiklankan produk/perkhidmatan anda dalam talian?"},
  q4a: {"en":"AI and digital literacy level (1=Low, 5=High)","bm":"Tahap literasi AI dan digital (1=Rendah, 5=Tinggi)"},
  q4b: {"en":"Confident using AI and digital tools for business (1=Strongly Disagree, 5=Strongly Agree)","bm":"Yakin menggunakan AI dan alat digital untuk perniagaan (1=Sangat Tidak Setuju, 5=Sangat Setuju)"},
  q4c: {"en":"Frequently use digital platforms for networking (1=Strongly Disagree, 5=Strongly Agree)","bm":"Kerap guna platform digital untuk rangkaian (1=Sangat Tidak Setuju, 5=Sangat Setuju)"},
  q4d: {"en":"Reliable support system in place (1=Strongly Disagree, 5=Strongly Agree)","bm":"Sistem sokongan yang boleh dipercayai (1=Sangat Tidak Setuju, 5=Sangat Setuju)"},
  q4e: {"en":"AI tools or platforms used for business (select all that apply)","bm":"Alat atau platform AI yang digunakan untuk perniagaan (pilih semua yang berkenaan)"},
  q4f: {"en":"Frequency of AI tool usage for business","bm":"Kekerapan penggunaan alat AI untuk perniagaan"},
  q4g: {"en":"Digital and AI-related training resources sought (up to 4)","bm":"Sumber latihan digital dan AI yang dicari (sehingga 4)"},
  q4h: {"en":"Observed/experienced bias against women entrepreneurs?","bm":"Pernah memerhati/mengalami bias terhadap usahawan wanita?"},
  q6a: {"en":"Currently providing care for (select all that apply)","bm":"Kini menjaga (pilih semua yang berkenaan)"},
  q6b: {"en":"Is the care you provide paid or unpaid?","bm":"Adakah penjagaan yang anda berikan berbayar atau tidak berbayar?"},
  q6c: {"en":"Monthly amount received for care work (RM)","bm":"Jumlah bulanan yang diterima untuk kerja penjagaan (RM)"},
  q6d: {"en":"Hours per week spent on caregiving","bm":"Jam seminggu untuk aktiviti penjagaan"},
  q6e: {"en":"Who else shares caregiving responsibilities with you?","bm":"Siapakah lagi yang berkongsi tanggungjawab penjagaan bersama anda?"},
  q6f: {"en":"How caregiving affects your work or livelihood","bm":"Kesan tanggungjawab penjagaan terhadap pekerjaan atau pendapatan"},
  q6g: {"en":"Support that would most help manage caregiving (up to 3)","bm":"Sokongan yang paling membantu dalam menguruskan penjagaan (sehingga 3)"},
  q5a: {"en":"Gender identity","bm":"Identiti gender"},
  q5b: {"en":"Age group","bm":"Kumpulan umur"},
  q5c: {"en":"State of residence","bm":"Negeri tempat tinggal"},
  q5d: {"en":"Residence area type","bm":"Jenis kawasan tempat tinggal"},
  q5e: {"en":"Ethnic background","bm":"Latar belakang etnik"},
  q5f: {"en":"Highest level of education","bm":"Tahap pendidikan tertinggi"},
  q5g: {"en":"First name","bm":"Nama pertama"},
  q5h: {"en":"Last name","bm":"Nama keluarga"},
  q5i: {"en":"Email","bm":"E-mel"},
  q5j: {"en":"Contact number","bm":"Nombor telefon"},
  q5k: {"en":"How did you hear about Strivers' Hub?","bm":"Bagaimana anda mendapat tahu tentang Strivers' Hub?"},
};
