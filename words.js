/**
 * Chinese Vocabulary Data
 *
 * To add a new word, add an entry to the array below:
 *   { n: <number>, char: "汉字", pinyin: "pīnyīn", pos: "n.", viet: "nghĩa tiếng Việt", lesson: <number> }
 *
 * pos options: n. (noun), v. (verb), pron. (pronoun), adv. (adverb), adj. (adjective), part. (particle), suff. (suffix), q. (quantifier), or "" (none)
 */
const words = [
  // ── Lesson 1 ──
  { n:1,  char:"你好",   pinyin:"nǐ hǎo",       pos:"",      viet:"chào bạn",                                          lesson:1 },
  { n:2,  char:"好",     pinyin:"hǎo",           pos:"adj.",  viet:"tốt, khỏe, hay, ngon",                              lesson:1 },
  { n:3,  char:"你",     pinyin:"nǐ",            pos:"pron.", viet:"bạn, anh, chị... (ngôi thứ 2 số ít)",               lesson:1 },
  { n:4,  char:"是",     pinyin:"shì",           pos:"v.",    viet:"là, thì...",                                         lesson:1 },
  { n:5,  char:"老师",   pinyin:"lǎoshī",        pos:"n.",    viet:"giáo viên, thầy/cô giáo",                           lesson:1 },
  { n:6,  char:"吗",     pinyin:"ma",            pos:"part.", viet:"...không? ...à? (trợ từ nghi vấn)",                  lesson:1 },
  { n:7,  char:"不",     pinyin:"bù",            pos:"adv.",  viet:"không (trợ từ phủ định)",                            lesson:1 },
  { n:8,  char:"我",     pinyin:"wǒ",            pos:"pron.", viet:"tôi, tớ, mình... (ngôi thứ nhất số ít)",            lesson:1 },
  { n:9,  char:"学生",   pinyin:"xuésheng",      pos:"n.",    viet:"học sinh",                                           lesson:1 },
  { n:10, char:"她",     pinyin:"tā",            pos:"pron.", viet:"cô ấy, chị ấy, nó (nữ, ngôi thứ 3 số ít)",         lesson:1 },
  { n:11, char:"谢谢",   pinyin:"xièxie",        pos:"v.",    viet:"cảm ơn",                                            lesson:1 },
  { n:12, char:"不客气", pinyin:"bú kèqi",        pos:"",      viet:"đừng khách sáo",                                    lesson:1 },
  { n:13, char:"您",     pinyin:"nín",           pos:"pron.", viet:"ông, bà, cô, chú, anh, chị... (trang trọng, số ít)", lesson:1 },
  { n:14, char:"留学生", pinyin:"liúxuéshēng",    pos:"n.",    viet:"lưu học sinh",                                      lesson:1 },
  { n:15, char:"叫",     pinyin:"jiào",          pos:"v.",    viet:"gọi, kêu",                                           lesson:1 },
  { n:16, char:"什么",   pinyin:"shénme",        pos:"pron.", viet:"gì, cái gì?",                                        lesson:1 },
  { n:17, char:"名字",   pinyin:"míngzi",        pos:"n.",    viet:"tên, họ tên",                                        lesson:1 },

  // ── Lesson 2 ──
  { n:18, char:"同学",   pinyin:"tóngxué",       pos:"n.",    viet:"bạn cùng học",                                       lesson:2 },
  { n:19, char:"们",     pinyin:"men",           pos:"suff.", viet:"hậu tố chỉ người ở số nhiều",                        lesson:2 },
  { n:20, char:"来",     pinyin:"lái",           pos:"v.",    viet:"đến, tới",                                            lesson:2 },
  { n:21, char:"介绍",   pinyin:"jièshào",       pos:"v.",    viet:"giới thiệu",                                         lesson:2 },
  { n:22, char:"一下儿", pinyin:"yíxiàr",         pos:"q.",    viet:"một chút",                                           lesson:2 },
  { n:23, char:"姓",     pinyin:"xìng",          pos:"v./n.", viet:"họ (của tên)",                                        lesson:2 },
  { n:24, char:"的",     pinyin:"de",            pos:"part.", viet:"trợ từ",                                              lesson:2 },
  { n:25, char:"哪",     pinyin:"nǎ",            pos:"pron.", viet:"nào",                                                lesson:2 },
  { n:26, char:"国",     pinyin:"guó",           pos:"n.",    viet:"nước, quốc gia",                                     lesson:2 },
  { n:27, char:"人",     pinyin:"rén",           pos:"n.",    viet:"người",                                               lesson:2 },
  { n:28, char:"他",     pinyin:"tā",            pos:"pron.", viet:"anh ấy, ông ấy...",                                  lesson:2 },
  { n:29, char:"认识",   pinyin:"rènshi",        pos:"v.",    viet:"quen biết",                                           lesson:2 },
  { n:30, char:"很",     pinyin:"hěn",           pos:"adv.",  viet:"rất",                                                lesson:2 },
  { n:31, char:"高兴",   pinyin:"gāoxìng",       pos:"adj.",  viet:"vui mừng",                                           lesson:2 },
  { n:32, char:"也",     pinyin:"yě",            pos:"adv.",  viet:"cũng",                                               lesson:2 },
  { n:33, char:"呢",     pinyin:"ne",            pos:"part.", viet:"trợ từ",                                              lesson:2 },

  // ── Lesson 3 ──
  { n:34, char:"那",     pinyin:"nà",            pos:"pron.", viet:"kia, đó",                                            lesson:3 },
  { n:35, char:"谁",     pinyin:"shéi/shuí",     pos:"pron.", viet:"ai, người nào",                                      lesson:3 },
  { n:36, char:"书",     pinyin:"shū",           pos:"n.",    viet:"quyển sách",                                         lesson:3 },
  { n:37, char:"同屋",   pinyin:"tóngwū",        pos:"n.",    viet:"bạn cùng phòng",                                     lesson:3 },
  { n:38, char:"汉语",   pinyin:"Hànyǔ",         pos:"n.",    viet:"tiếng Hán",                                          lesson:3 },
  { n:39, char:"课本",   pinyin:"kèběn",         pos:"n.",    viet:"sách giáo khoa, giáo trình",                         lesson:3 },
  { n:40, char:"词典",   pinyin:"cídiǎn",        pos:"n.",    viet:"từ điển",                                             lesson:3 },
  { n:41, char:"就是",   pinyin:"jiù shì",       pos:"",      viet:"điều đó nghĩa là",                                   lesson:3 },
  { n:42, char:"日语",   pinyin:"Rìyǔ",          pos:"n.",    viet:"tiếng Nhật",                                         lesson:3 },
  { n:43, char:"这",     pinyin:"zhè",           pos:"pron.", viet:"này, đây",                                           lesson:3 },
  { n:44, char:"杂志",   pinyin:"zázhì",         pos:"n.",    viet:"tạp chí",                                             lesson:3 },
  { n:45, char:"音乐",   pinyin:"yīnyuè",        pos:"n.",    viet:"âm nhạc",                                            lesson:3 },
  { n:46, char:"朋友",   pinyin:"péngyou",       pos:"n.",    viet:"bạn, bạn bè",                                        lesson:3 },

  // ── Add new words below ──
];
