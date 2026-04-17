/**
 * Chinese Vocabulary Data
 *
 * To add a new word, just append to the array — `n` is assigned automatically.
 *   { char: "汉字", pinyin: "pīnyīn", pos: "n.", viet: "nghĩa tiếng Việt", lesson: <number> }
 *
 * pos options: n. (noun), v. (verb), pron. (pronoun), adv. (adverb), adj. (adjective), part. (particle), suff. (suffix), q. (quantifier), or "" (none)
 */
const words = [
  // ── Lesson 1 ──
  { char:"你好",   pinyin:"nǐ hǎo",       pos:"",      viet:"chào bạn",                                          lesson:1 },
  { char:"好",     pinyin:"hǎo",           pos:"adj.",  viet:"tốt, khỏe, hay, ngon",                              lesson:1 },
  { char:"你",     pinyin:"nǐ",            pos:"pron.", viet:"bạn, anh, chị... (ngôi thứ 2 số ít)",               lesson:1 },
  { char:"是",     pinyin:"shì",           pos:"v.",    viet:"là, thì...",                                         lesson:1 },
  { char:"老师",   pinyin:"lǎoshī",        pos:"n.",    viet:"giáo viên, thầy/cô giáo",                           lesson:1 },
  { char:"吗",     pinyin:"ma",            pos:"part.", viet:"...không? ...à? (trợ từ nghi vấn)",                  lesson:1 },
  { char:"不",     pinyin:"bù",            pos:"adv.",  viet:"không (trợ từ phủ định)",                            lesson:1 },
  { char:"我",     pinyin:"wǒ",            pos:"pron.", viet:"tôi, tớ, mình... (ngôi thứ nhất số ít)",            lesson:1 },
  { char:"学生",   pinyin:"xuésheng",      pos:"n.",    viet:"học sinh",                                           lesson:1 },
  { char:"她",     pinyin:"tā",            pos:"pron.", viet:"cô ấy, chị ấy, nó (nữ, ngôi thứ 3 số ít)",         lesson:1 },
  { char:"谢谢",   pinyin:"xièxie",        pos:"v.",    viet:"cảm ơn",                                            lesson:1 },
  { char:"不客气", pinyin:"bú kèqi",        pos:"",      viet:"đừng khách sáo",                                    lesson:1 },
  { char:"您",     pinyin:"nín",           pos:"pron.", viet:"ông, bà, cô, chú, anh, chị... (trang trọng, số ít)", lesson:1 },
  { char:"留学生", pinyin:"liúxuéshēng",    pos:"n.",    viet:"lưu học sinh",                                      lesson:1 },
  { char:"叫",     pinyin:"jiào",          pos:"v.",    viet:"gọi, kêu",                                           lesson:1 },
  { char:"什么",   pinyin:"shénme",        pos:"pron.", viet:"gì, cái gì?",                                        lesson:1 },
  { char:"名字",   pinyin:"míngzi",        pos:"n.",    viet:"tên, họ tên",                                        lesson:1 },
  { char:"大卫",   pinyin:"Dàwèi",         pos:"n.",    viet:"David (tên người)",                                  lesson:1 },
  { char:"王",     pinyin:"Wáng",          pos:"n.",    viet:"Vương (họ)",                                          lesson:1 },
  { char:"李军",   pinyin:"Lǐ Jūn",        pos:"n.",    viet:"Lý Quân (tên người)",                                lesson:1 },

  // ── Lesson 2 ──
  { char:"同学",   pinyin:"tóngxué",       pos:"n.",    viet:"bạn cùng học",                                       lesson:2 },
  { char:"们",     pinyin:"men",           pos:"suff.", viet:"hậu tố chỉ người ở số nhiều",                        lesson:2 },
  { char:"来",     pinyin:"lái",           pos:"v.",    viet:"đến, tới",                                            lesson:2 },
  { char:"介绍",   pinyin:"jièshào",       pos:"v.",    viet:"giới thiệu",                                         lesson:2 },
  { char:"一下儿", pinyin:"yíxiàr",         pos:"q.",    viet:"một chút",                                           lesson:2 },
  { char:"姓",     pinyin:"xìng",          pos:"v./n.", viet:"họ (của tên)",                                        lesson:2 },
  { char:"的",     pinyin:"de",            pos:"part.", viet:"trợ từ",                                              lesson:2 },
  { char:"哪",     pinyin:"nǎ",            pos:"pron.", viet:"nào",                                                lesson:2 },
  { char:"国",     pinyin:"guó",           pos:"n.",    viet:"nước, quốc gia",                                     lesson:2 },
  { char:"人",     pinyin:"rén",           pos:"n.",    viet:"người",                                               lesson:2 },
  { char:"他",     pinyin:"tā",            pos:"pron.", viet:"anh ấy, ông ấy...",                                  lesson:2 },
  { char:"认识",   pinyin:"rènshi",        pos:"v.",    viet:"quen biết",                                           lesson:2 },
  { char:"很",     pinyin:"hěn",           pos:"adv.",  viet:"rất",                                                lesson:2 },
  { char:"高兴",   pinyin:"gāoxìng",       pos:"adj.",  viet:"vui mừng",                                           lesson:2 },
  { char:"也",     pinyin:"yě",            pos:"adv.",  viet:"cũng",                                               lesson:2 },
  { char:"呢",     pinyin:"ne",            pos:"part.", viet:"trợ từ",                                              lesson:2 },
  { char:"中国",   pinyin:"Zhōngguó",      pos:"n.",    viet:"Trung Quốc",                                         lesson:2 },
  { char:"美国",   pinyin:"Měiguó",        pos:"n.",    viet:"Mỹ",                                                  lesson:2 },
  { char:"英国",   pinyin:"Yīngguó",       pos:"n.",    viet:"Anh",                                                 lesson:2 },
  { char:"法国",   pinyin:"Fǎguó",         pos:"n.",    viet:"Pháp",                                                lesson:2 },
  { char:"加拿大", pinyin:"Jiānádà",        pos:"n.",    viet:"Canada",                                              lesson:2 },
  { char:"日本",   pinyin:"Rìběn",         pos:"n.",    viet:"Nhật Bản",                                            lesson:2 },
  { char:"韩国",   pinyin:"Hánguó",        pos:"n.",    viet:"Hàn Quốc",                                            lesson:2 },
  { char:"越南",   pinyin:"Yuènán",        pos:"n.",    viet:"Việt Nam",                                            lesson:2 },

  // ── Lesson 3 ──
  { char:"那",     pinyin:"nà",            pos:"pron.", viet:"kia, đó",                                            lesson:3 },
  { char:"谁",     pinyin:"shéi/shuí",     pos:"pron.", viet:"ai, người nào",                                      lesson:3 },
  { char:"书",     pinyin:"shū",           pos:"n.",    viet:"quyển sách",                                         lesson:3 },
  { char:"同屋",   pinyin:"tóngwū",        pos:"n.",    viet:"bạn cùng phòng",                                     lesson:3 },
  { char:"汉语",   pinyin:"Hànyǔ",         pos:"n.",    viet:"tiếng Hán",                                          lesson:3 },
  { char:"课本",   pinyin:"kèběn",         pos:"n.",    viet:"sách giáo khoa, giáo trình",                         lesson:3 },
  { char:"词典",   pinyin:"cídiǎn",        pos:"n.",    viet:"từ điển",                                             lesson:3 },
  { char:"就是",   pinyin:"jiù shì",       pos:"",      viet:"điều đó nghĩa là",                                   lesson:3 },
  { char:"日语",   pinyin:"Rìyǔ",          pos:"n.",    viet:"tiếng Nhật",                                         lesson:3 },
  { char:"这",     pinyin:"zhè",           pos:"pron.", viet:"này, đây",                                           lesson:3 },
  { char:"杂志",   pinyin:"zázhì",         pos:"n.",    viet:"tạp chí",                                             lesson:3 },
  { char:"音乐",   pinyin:"yīnyuè",        pos:"n.",    viet:"âm nhạc",                                            lesson:3 },
  { char:"朋友",   pinyin:"péngyou",       pos:"n.",    viet:"bạn, bạn bè",                                        lesson:3 },
  { char:"语言",   pinyin:"yǔyán",        pos:"n.",    viet:"ngôn ngữ",                                           lesson:3 },
  { char:"说",     pinyin:"shuō",         pos:"v.",    viet:"nói",                                                 lesson:3 },
  { char:"会",     pinyin:"huì",          pos:"v.",    viet:"biết (qua rèn luyện, học hỏi)",                       lesson:3 },
  { char:"本",     pinyin:"běn",          pos:"mw.",   viet:"cuốn, quyển",                                         lesson:3 },
  { char:"一",     pinyin:"yī",           pos:"num.",  viet:"một, 1",                                              lesson:3 },
  { char:"喜欢",   pinyin:"xǐhuan",       pos:"v.",    viet:"thích",                                               lesson:3 },
  { char:"看",     pinyin:"kàn",          pos:"v.",    viet:"xem, nhìn, đọc",                                      lesson:3 },
  { char:"听",     pinyin:"tīng",         pos:"v.",    viet:"nghe",                                                lesson:3 },

  // ── Lesson 4 ──
  { char:"请问",   pinyin:"qǐngwèn",      pos:"v.",    viet:"xin hỏi",                                             lesson:4 },
  { char:"图书馆", pinyin:"túshūguǎn",    pos:"n.",    viet:"thư viện",                                            lesson:4 },
  { char:"在",     pinyin:"zài",          pos:"v./adv.", viet:"ở, đang",                                           lesson:4 },
  { char:"哪儿",   pinyin:"nǎr",          pos:"pron.", viet:"ở đâu, chỗ nào",                                      lesson:4 },
  { char:"哪里",   pinyin:"nǎli",         pos:"pron.", viet:"ở đâu, chỗ nào",                                      lesson:4 },
  { char:"对不起", pinyin:"duìbuqǐ",      pos:"v.",    viet:"xin lỗi",                                             lesson:4 },
  { char:"个",     pinyin:"gè",           pos:"mw.",   viet:"lượng từ chung (cho người, đồ vật)",                 lesson:4 },
  { char:"学校",   pinyin:"xuéxiào",      pos:"n.",    viet:"trường học",                                          lesson:4 },
  { char:"知道",   pinyin:"zhīdào",       pos:"v.",    viet:"biết",                                                lesson:4 },
  { char:"没关系", pinyin:"méi guānxi",   pos:"",      viet:"không sao, không có gì",                              lesson:4 },
  { char:"这儿",   pinyin:"zhèr",         pos:"pron.", viet:"chỗ này, nơi này",                                    lesson:4 },
  { char:"这里",   pinyin:"zhèli",        pos:"pron.", viet:"chỗ này, nơi này",                                    lesson:4 },
  // { char:"教学",   pinyin:"jiàoxué",      pos:"n.",    viet:"dạy học",                                             lesson:4 },
  { char:"楼",     pinyin:"lóu",          pos:"n.",    viet:"tòa nhà",                                             lesson:4 },
  { char:"那儿",   pinyin:"nàr",          pos:"pron.", viet:"chỗ kia, nơi kia",                                    lesson:4 },
  { char:"那里",   pinyin:"nàli",         pos:"pron.", viet:"chỗ kia, nơi kia",                                    lesson:4 },
  // { char:"宿舍",   pinyin:"sùshè",        pos:"n.",    viet:"ký túc xá",                                           lesson:4 },
  // { char:"北边",   pinyin:"běibian",      pos:"n.",    viet:"phía bắc",                                            lesson:4 },
  // { char:"左边",   pinyin:"zuǒbian",      pos:"n.",    viet:"bên trái",                                            lesson:4 },
  // { char:"右边",   pinyin:"yòubian",      pos:"n.",    viet:"bên phải",                                            lesson:4 },
  // { char:"不用谢", pinyin:"búyòng xiè",   pos:"",      viet:"không cần cảm ơn, không có gì",                       lesson:4 },
  // { char:"不用",   pinyin:"búyòng",       pos:"adv.",  viet:"không cần",                                           lesson:4 },
  { char:"对",     pinyin:"duì",          pos:"adj.",  viet:"đúng",                                                lesson:4 },

  // ── Add new words below ──
];

// Auto-assign `n` from array index
words.forEach((w, i) => w.n = i + 1);
