/* AUTO-GENERATED - do not edit by hand.
   The hexagonal word field: see WordHex.tsx for what this drives.

   TWO FIGURES, both pointy-top hexagons - the silhouette of the Strivers'
   Hub mark:

     HEX    866 x 993, 28 rows, void 0.42, 112 words - the whole
            vocabulary, with the section's heading inside the void
     HEX_S  350 x 401, 21 rows, void 0.36, 49 words - a spread of
            the same vocabulary at phone sizes, the void left empty and the
            heading above it

   Neither is a regular hexagon, because the mark is not one. Its outline was
   measured row by row off public/favicon.png and both figures are cut to
   that same profile - symmetric left to right, and not top to bottom. The
   upper shoulders break at 90.2% width, where the interlaced ribbons stop
   short of the sides, so the top taper runs over 34% of the height in two
   slopes against the bottom's 24% in one, and the full-width band is 42%
   rather than half. Width over height is 0.8723, the mark's own, against a
   regular hexagon's 0.8660. The void is the same outline scaled about the
   centre, the way the mark's own rings nest.

   The CSS needs the outline as a polygon for the void's light:
     polygon(50% 0%, 95.1% 22.99%, 100% 34.22%, 100% 76.47%, 50% 100%, 0% 76.47%, 0% 34.22%, 4.9% 22.99%)

   GEOMETRY. Half-width at normalised height t, as a fraction of W/2, is the
   measured outline interpolated between these points:
       t 0.0000  ->  0.000
       t 0.2299  ->  0.902
       t 0.3422  ->  1.000
       t 0.7647  ->  1.000
       t 1.0000  ->  0.000
   Each row takes the chord at its own vertical midpoint. Rows crossing the
   void are split into a left and a right segment with the void's chord
   between them.

   Sizes here are design pixels of each drawing. The stylesheet scales each
   figure with a container query, and the full one is capped against the
   viewport height as well, so the whole hexagon is on screen at once.

   PACKING. Words are justified across their segment (space-between), so the
   silhouette is exact whatever the words measure - the packing below only
   decides how many go in each segment so the gaps come out even (38px and
   24px). Changing words.ts therefore costs a little evenness in one row
   and nothing else; regenerate this file to get it back.

   COLOUR. Not a palette - the mark itself. Its interlaced ribbons make five
   zones, measured off favicon.png:

     mauve   #965B81  across the top
     plum    #7D3269  upper right and right
     orange  #FE8B33  lower right
     peach   #E8B197  the bottom
     crimson #D32B45  the left

   Each word is coloured by reading the mark at the word's own place in the
   figure - the two outlines are the same, so a word on the left edge lands
   on the mark's left edge. The gaps between the ribbons are filled with
   their nearest colour and the whole thing blurred by 9px first, so the
   seams soften without the zones moving.

   What is read is then pushed to 1.7x the logo's chroma and darkened only as
   far as it must be to clear AA on the shell - lightness is kept where it
   can be, so the dark plum and the pale mauve stay different colours. Peach
   and orange are the exception: at 1.8:1 and 2.2:1 both have to come down to
   the same lightness, and their hues are 7 degrees apart, so the bottom of
   the figure reads as one warm zone rather than two. The darkest word is
   4.52:1, clear of AA. */

export type HexWord = { t: string; k: 1 | 2 | 3; c: string };
export type HexSeg = { w: number; words: HexWord[] };
export type HexRow = { s?: HexSeg; l?: HexSeg; r?: HexSeg; g?: number };
export type HexSpec = { w: number; h: number; rows: number; rowH: number; hole: number };

export const HEX: HexSpec = { w: 866, h: 993, rows: 28, rowH: 35.455, hole: 0.42 };
export const HEX_S: HexSpec = { w: 350, h: 401, rows: 21, rowH: 19.106, hole: 0.36 };

export const HEX_ROWS: HexRow[] = [
  { s: { w: 60.7, words: [{ t: "Jualan", k: 2, c: "#AB4492" }] } },
  { s: { w: 182.0, words: [{ t: "Pertanian", k: 1, c: "#AA4190" }, { t: "Francais", k: 3, c: "#AA4190" }] } },
  { s: { w: 303.4, words: [{ t: "Pengangkutan", k: 1, c: "#AD3C8A" }, { t: "Sumber manusia", k: 2, c: "#A93B8E" }] } },
  { s: { w: 424.7, words: [{ t: "Kerjasama strategik", k: 3, c: "#B83585" }, { t: "Pemperibadian", k: 3, c: "#A62181" }, { t: "Pelancongan", k: 1, c: "#AA3E8F" }] } },
  { s: { w: 546.1, words: [{ t: "Pelesenan perniagaan", k: 2, c: "#C0297E" }, { t: "Perisian produktiviti", k: 2, c: "#A80072" }, { t: "Pengekalan pelanggan", k: 3, c: "#A93B8E" }] } },
  { s: { w: 667.4, words: [{ t: "Jaringan profesional", k: 3, c: "#BC3183" }, { t: "WhatsApp Business", k: 3, c: "#CF0050" }, { t: "Pertumbuhan organisasi", k: 3, c: "#A40072" }, { t: "Literasi kewangan", k: 2, c: "#A93B8E" }] } },
  { s: { w: 782.8, words: [{ t: "Eksport & import", k: 2, c: "#BC3783" }, { t: "Minda & ketahanan diri", k: 3, c: "#DB004C" }, { t: "Pengembangan perniagaan", k: 2, c: "#AD0060" }, { t: "Pengalaman pelanggan", k: 2, c: "#AA398B" }] } },
  { s: { w: 809.8, words: [{ t: "Pembiayaan & pertumbuhan", k: 2, c: "#D30061" }, { t: "Pemasaran kandungan", k: 2, c: "#E30045" }, { t: "Pengurusan operasi", k: 2, c: "#AB0062" }, { t: "Pelaburan alternatif", k: 2, c: "#B23B7C" }] } },
  { l: { w: 395.3, words: [{ t: "Laporan industri", k: 3, c: "#DF0062" }, { t: "Geran & pinjaman", k: 3, c: "#E20043" }, { t: "Pembungkusan", k: 3, c: "#DE163E" }] }, r: { w: 395.3, words: [{ t: "Komuniti", k: 3, c: "#D70046" }, { t: "Reka bentuk produk", k: 2, c: "#AC0060" }, { t: "Kehadiran digital", k: 3, c: "#C84251" }] }, g: 46.1 },
  { l: { w: 348.2, words: [{ t: "Hospitaliti", k: 1, c: "#DF0054" }, { t: "Modal kerja", k: 2, c: "#E10040" }, { t: "Acara industri", k: 3, c: "#CA3F3D" }] }, r: { w: 348.2, words: [{ t: "Automasi AI", k: 2, c: "#CD0045" }, { t: "Kewangan", k: 1, c: "#A3006B" }, { t: "QuickBooks", k: 3, c: "#C74600" }] }, g: 167.5 },
  { l: { w: 288.6, words: [{ t: "Undang-undang", k: 3, c: "#E1004C" }, { t: "Inovasi", k: 3, c: "#E2003E" }, { t: "Notion AI", k: 3, c: "#C6463B" }] }, r: { w: 288.6, words: [{ t: "Kecantikan", k: 1, c: "#C2004C" }, { t: "Penjenamaan peribadi", k: 3, c: "#D4352C" }] }, g: 288.8 },
  { l: { w: 259.8, words: [{ t: "Belanjawan", k: 3, c: "#E1004B" }, { t: "Automasi", k: 3, c: "#E2003F" }, { t: "Meta AI", k: 3, c: "#C8443C" }] }, r: { w: 259.8, words: [{ t: "Media sosial", k: 2, c: "#BC004D" }, { t: "Barangan kemas", k: 2, c: "#D43600" }] }, g: 346.3 },
  { l: { w: 251.1, words: [{ t: "Kelestarian", k: 3, c: "#E1004B" }, { t: "Keselamatan siber", k: 2, c: "#E30038" }] }, r: { w: 251.1, words: [{ t: "Insurans", k: 2, c: "#C2004A" }, { t: "Canva AI", k: 3, c: "#B0005E" }, { t: "TikTok AI", k: 3, c: "#B85400" }] }, g: 363.7 },
  { l: { w: 251.1, words: [{ t: "E-dagang", k: 2, c: "#E1004B" }, { t: "Fesyen", k: 1, c: "#E2003E" }, { t: "SEO", k: 3, c: "#BF4D39" }] }, r: { w: 251.1, words: [{ t: "Pemasaran digital", k: 2, c: "#AB005B" }, { t: "Perakaunan", k: 3, c: "#BD5000" }] }, g: 363.7 },
  { l: { w: 251.1, words: [{ t: "Chatbot & CRM", k: 2, c: "#E2004B" }, { t: "Kesihatan", k: 1, c: "#D43437" }] }, r: { w: 251.1, words: [{ t: "Pembuatan", k: 1, c: "#AE005B" }, { t: "Penjenamaan", k: 2, c: "#C64900" }] }, g: 363.7 },
  { l: { w: 251.1, words: [{ t: "Grammarly", k: 3, c: "#E10049" }, { t: "Wave", k: 3, c: "#E10041" }, { t: "CapCut AI", k: 3, c: "#CE3C37" }] }, r: { w: 251.1, words: [{ t: "Pitching", k: 3, c: "#B1005F" }, { t: "Rekreasi", k: 3, c: "#B81866" }, { t: "ManyChat", k: 3, c: "#B85500" }] }, g: 363.7 },
  { l: { w: 251.1, words: [{ t: "Google Analytics", k: 3, c: "#E2004B" }, { t: "Analisis pesaing", k: 3, c: "#D92837" }] }, r: { w: 251.1, words: [{ t: "Strategi perniagaan", k: 3, c: "#B71174" }, { t: "Meta Insights", k: 3, c: "#B85400" }] }, g: 363.7 },
  { l: { w: 276.6, words: [{ t: "Data & analitik", k: 2, c: "#E1004B" }, { t: "Teknologi", k: 3, c: "#E40038" }, { t: "ESG", k: 3, c: "#BF4A43" }] }, r: { w: 276.6, words: [{ t: "Aliran tunai", k: 2, c: "#BC2978" }, { t: "Sistem pembayaran", k: 2, c: "#BE4F00" }] }, g: 312.8 },
  { l: { w: 342.3, words: [{ t: "Mikrokredit", k: 3, c: "#E10049" }, { t: "Kemahiran digital", k: 3, c: "#E10039" }, { t: "Perkongsian", k: 3, c: "#BA4E63" }] }, r: { w: 342.3, words: [{ t: "Kosmetik", k: 3, c: "#B1277B" }, { t: "Komunikasi", k: 3, c: "#BC4B61" }, { t: "Keyakinan digital", k: 2, c: "#B45700" }] }, g: 181.4 },
  { l: { w: 408.0, words: [{ t: "Claude", k: 3, c: "#E10047" }, { t: "ChatGPT", k: 3, c: "#E10039" }, { t: "Penglibatan", k: 3, c: "#C84236" }, { t: "Hubungan digital", k: 3, c: "#BD4779" }] }, r: { w: 408.0, words: [{ t: "Kecerdasan buatan", k: 3, c: "#B8367D" }, { t: "Adobe Firefly", k: 3, c: "#BA5042" }, { t: "Pemerolehan klien", k: 3, c: "#B25900" }] }, g: 49.9 },
  { s: { w: 866.0, words: [{ t: "Penyelidikan pasaran", k: 2, c: "#E2003A" }, { t: "Kreatif & media", k: 1, c: "#BC5032" }, { t: "Pertumbuhan strategik", k: 3, c: "#C0437B" }, { t: "Operasi & produktiviti", k: 3, c: "#BB502F" }, { t: "Seni & hiburan", k: 1, c: "#B35900" }] } },
  { s: { w: 854.4, words: [{ t: "Pendaftaran perniagaan", k: 2, c: "#E3002E" }, { t: "Perancangan kewangan", k: 2, c: "#BA5133" }, { t: "Makanan & minuman", k: 1, c: "#BB4E35" }, { t: "Kehadiran dalam talian", k: 2, c: "#B45800" }] } },
  { s: { w: 722.9, words: [{ t: "Rangkaian & perkongsian", k: 2, c: "#DF1F09" }, { t: "Rantaian bekalan", k: 2, c: "#BC512F" }, { t: "Pembangunan bakat", k: 3, c: "#BC501F" }, { t: "Cukai & percukaian", k: 2, c: "#B55700" }] } },
  { s: { w: 591.5, words: [{ t: "Borong & perdagangan", k: 1, c: "#D53308" }, { t: "Khidmat pelanggan", k: 2, c: "#B9531B" }, { t: "Pengiklanan digital", k: 2, c: "#B75600" }] } },
  { s: { w: 460.1, words: [{ t: "Pemasaran & penjenamaan", k: 2, c: "#D63209" }, { t: "Perdagangan antarabangsa", k: 2, c: "#B75600" }] } },
  { s: { w: 328.6, words: [{ t: "Kawalan kos", k: 2, c: "#E01C16" }, { t: "Logistik", k: 3, c: "#C34B00" }, { t: "Pendidikan", k: 1, c: "#B65700" }] } },
  { s: { w: 197.2, words: [{ t: "Aktiviti", k: 3, c: "#E4031C" }, { t: "Tidio", k: 3, c: "#C94400" }, { t: "Gemini", k: 3, c: "#B65600" }] } },
  { s: { w: 65.7, words: [{ t: "Runcit", k: 1, c: "#D03B00" }] } },
];

export const HEX_ROWS_S: HexRow[] = [
  { s: { w: 32.7, words: [{ t: "Wave", k: 3, c: "#AB4490" }] } },
  { s: { w: 98.1, words: [{ t: "Pelancongan", k: 1, c: "#A93B8C" }] } },
  { s: { w: 163.5, words: [{ t: "Kewangan", k: 1, c: "#B73283" }, { t: "Automasi AI", k: 2, c: "#A8388D" }] } },
  { s: { w: 228.9, words: [{ t: "Penjenamaan peribadi", k: 3, c: "#CB006A" }, { t: "Chatbot & CRM", k: 2, c: "#A7358B" }] } },
  { s: { w: 294.3, words: [{ t: "Penyelidikan pasaran", k: 2, c: "#CF0063" }, { t: "Rangkaian & perkongsian", k: 2, c: "#A41D83" }] } },
  { s: { w: 325.5, words: [{ t: "Perancangan kewangan", k: 2, c: "#D80050" }, { t: "Pengembangan perniagaan", k: 2, c: "#A40078" }] } },
  { s: { w: 340.0, words: [{ t: "Kawalan kos", k: 2, c: "#DD0059" }, { t: "Pemasaran digital", k: 2, c: "#E1103F" }, { t: "Pengurusan operasi", k: 2, c: "#A70076" }] } },
  { l: { w: 149.5, words: [{ t: "Kesihatan", k: 1, c: "#E1004D" }, { t: "E-dagang", k: 2, c: "#C04B3C" }] }, r: { w: 149.5, words: [{ t: "Makanan & minuman", k: 1, c: "#AE005B" }] }, g: 51.0 },
  { l: { w: 117.9, words: [{ t: "Kecantikan", k: 1, c: "#E30047" }] }, r: { w: 117.9, words: [{ t: "Pendidikan", k: 1, c: "#B60052" }] }, g: 114.3 },
  { l: { w: 112.0, words: [{ t: "Meta AI", k: 3, c: "#E2004B" }, { t: "CapCut AI", k: 3, c: "#D13939" }] }, r: { w: 112.0, words: [{ t: "ChatGPT", k: 3, c: "#C1004B" }, { t: "Runcit", k: 1, c: "#C74600" }] }, g: 126.0 },
  { l: { w: 112.0, words: [{ t: "Canva AI", k: 3, c: "#E2004B" }, { t: "Notion AI", k: 3, c: "#CC3E37" }] }, r: { w: 112.0, words: [{ t: "Kreatif & media", k: 1, c: "#A50065" }] }, g: 126.0 },
  { l: { w: 112.0, words: [{ t: "Pengangkutan", k: 1, c: "#E30043" }] }, r: { w: 112.0, words: [{ t: "Seni & hiburan", k: 1, c: "#AA006B" }] }, g: 126.0 },
  { l: { w: 112.0, words: [{ t: "Fesyen", k: 1, c: "#E2004B" }, { t: "ManyChat", k: 3, c: "#D23536" }] }, r: { w: 112.0, words: [{ t: "Pembuatan", k: 1, c: "#BA2376" }] }, g: 126.0 },
  { l: { w: 147.4, words: [{ t: "Grammarly", k: 3, c: "#E10048" }, { t: "Hospitaliti", k: 1, c: "#BB4E54" }] }, r: { w: 147.4, words: [{ t: "Kelestarian", k: 3, c: "#B11978" }, { t: "Adobe Firefly", k: 3, c: "#BC5000" }] }, g: 55.2 },
  { s: { w: 350.0, words: [{ t: "Google Analytics", k: 3, c: "#E2003E" }, { t: "Jaringan profesional", k: 3, c: "#AD247D" }, { t: "Perisian produktiviti", k: 2, c: "#BE4F1B" }] } },
  { s: { w: 350.0, words: [{ t: "Keselamatan siber", k: 2, c: "#E40022" }, { t: "Sumber manusia", k: 2, c: "#BF4670" }, { t: "QuickBooks", k: 3, c: "#B25800" }] } },
  { s: { w: 318.7, words: [{ t: "Borong & perdagangan", k: 1, c: "#C94510" }, { t: "Pendaftaran perniagaan", k: 2, c: "#BA5400" }] } },
  { s: { w: 247.9, words: [{ t: "Kehadiran dalam talian", k: 2, c: "#CA4409" }, { t: "Pemerolehan klien", k: 3, c: "#B85500" }] } },
  { s: { w: 177.1, words: [{ t: "Media sosial", k: 2, c: "#D92B0D" }, { t: "Data & analitik", k: 2, c: "#B85500" }] } },
  { s: { w: 106.2, words: [{ t: "Pertanian", k: 1, c: "#DA2700" }, { t: "ESG", k: 3, c: "#B45700" }] } },
  { s: { w: 35.4, words: [{ t: "Tidio", k: 3, c: "#D53200" }] } },
];
