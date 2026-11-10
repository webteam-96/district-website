/* ==========================================================================
   Rotary District 3141 — shared content for the theme prototypes
   (Sovereign · Monolith · Atelier). Every theme renders ONLY from this file.

   • Plain global (window.ROTARY), not an ES module, so a theme opens straight
     from file:// by double-click. Load it before the theme's own script:
         <script src="../shared/content.js"></script>
   • Image and PDF paths are relative to a theme folder (themes-sample/<theme>/).
   • Sections appear in homepage order. The three year-dependent sections
     (snapshot, dignitaries, press) carry a `byYear` map keyed by Rotary year.

   Where the content comes from
   • LIVE (rid3141.rotaryindia.org and its public API, Nov 2026): copy, links,
     contact, club list, the 8 latest 2026-27 club bulletins, RI Presidents and
     District Governors per year (names, photos, bio facts), banner photos and
     club project photos.
   • SPEC: the 2026-27 snapshot numbers, tab counts and visitor count.
   • DUMMY: stats for every other year, bulletins for other years, Governor's
     Monthly Letters, the District Governors for 2016-17 and 2017-18 (not in
     the API; marked `dummy: true`), and every calendar entry. Calendar names
     are invented — none are real members.
   ========================================================================== */
window.ROTARY = (function () {
  'use strict';

  var IMG = '../shared/img/';
  var DIG = IMG + 'dignitaries/';
  var LIVE = 'https://rid3141.rotaryindia.org';
  /* Inner pages sit beside each theme's index.html, so these work from every theme folder. */
  var PAGE = { home: 'index.html', about: 'about.html', committee: 'district-committee.html', finder: 'club-finder.html',
               projects: 'club-projects.html', service: 'club-service.html', calendar: 'calendar.html',
               newsletters: 'newsletters.html', contact: 'contact.html' };
  var PDF = '../shared/newsletter-placeholder.pdf';

  /* ---------- formatting: Indian digit grouping (6,42,815 · ₹54.59 Cr) ---------- */
  function num(n, decimals) {
    decimals = decimals || 0;
    return Number(n).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  /* ---------- photography: one pool; each theme applies its own art direction ----------
     w/h are the files' pixel sizes. `credit` is the club that ran the project.     */
  var photos = {
    dgAddress:  { src: IMG + 'banner-01.jpg', w: 996,  h: 596,  alt: 'District Governor Rajan Dua addressing Rotarians' },
    coreTeam:   { src: IMG + 'banner-02.jpg', w: 996,  h: 596,  alt: 'District Governor Rajan Dua at the 2026-27 Core Team announcement' },
    beach:      { src: IMG + 'banner-03.jpg', w: 1600, h: 900,  alt: 'Volunteers collecting waste on a Mumbai beach', credit: 'RC Bombay Bay View' },
    dignity:    { src: IMG + 'banner-04.jpg', w: 1600, h: 900,  alt: 'Rotarians handing dignity packs to women and girls', credit: 'RC Queen’s Necklace' },
    vision:     { src: IMG + 'photo-vision.jpg',     w: 1920, h: 1280, alt: 'Rotarians at the opening of a vision centre and clinic', credit: 'RC Mumbai Kandivli West' },
    classroom:  { src: IMG + 'photo-classroom.jpg',  w: 1600, h: 1200, alt: 'Schoolgirls at work during an English-speaking course', credit: 'RC Mumbai Ghatkopar West' },
    medical:    { src: IMG + 'photo-medical.jpg',    w: 1600, h: 900,  alt: 'Doctors and Rotarians with donated medical equipment', credit: 'RC Mumbai Nariman Point' },
    foodkits:   { src: IMG + 'photo-foodkits.jpg',   w: 1600, h: 900,  alt: 'Rotarians distributing food kits to families' },
    plantation: { src: IMG + 'photo-plantation.jpg', w: 1280, h: 960,  alt: 'Volunteers gathered for a tree-plantation drive', credit: 'RC Mumbai Mulund South' },
    meals:      { src: IMG + 'photo-meals.jpg',      w: 960,  h: 1280, alt: 'Schoolchildren holding their mid-day meal at their desks', credit: 'RC Mumbai Western Elite' },
    school:     { src: IMG + 'photo-school.jpg',     w: 1600, h: 900,  alt: 'Students, staff and Rotarians at the opening of a goodwill school', credit: 'RC Bombay North' },
    relief:     { src: IMG + 'photo-relief.jpg',     w: 1600, h: 1200, alt: 'Flood-relief supplies ready for families in Dahanu', credit: 'RC Dahanu Sea Coast' },
    notebooks:  { src: IMG + 'photo-notebooks.jpg',  w: 1311, h: 738,  alt: 'Rotarians handing notebooks to students', credit: 'RC Mumbai Ghatkopar' },
    warkaris:   { src: IMG + 'photo-warkaris.jpg',   w: 1280, h: 960,  alt: 'Rotarians serving food to Warkari pilgrims', credit: 'RC Mumbai Ghatkopar West' }
  };
  var coverPool = ['beach', 'classroom', 'vision', 'medical', 'plantation', 'relief', 'school', 'notebooks', 'warkaris', 'dignity', 'foodkits', 'meals'];

  /* ---------- 1 · utility bar ---------- */
  var years = ['2016-17', '2017-18', '2018-19', '2019-20', '2020-21', '2021-22',
               '2022-23', '2023-24', '2024-25', '2025-26', '2026-27', '2027-28'];

  /* ---------- 4 · snapshot numbers per year (2026-27 = spec, year to date; others dummy) ---------- */
  var statsByYear = {
    '2016-17': { projects: 3412, hours: 48260, amount: 21.37, beneficiaries: 386540, clubs: 96,  members: 4412 },
    '2017-18': { projects: 3688, hours: 51904, amount: 24.85, beneficiaries: 410236, clubs: 99,  members: 4630 },
    '2018-19': { projects: 3951, hours: 55118, amount: 27.92, beneficiaries: 452780, clubs: 103, members: 4905 },
    '2019-20': { projects: 3204, hours: 46577, amount: 25.40, beneficiaries: 596312, clubs: 106, members: 5128 },
    '2020-21': { projects: 4876, hours: 71340, amount: 38.66, beneficiaries: 984120, clubs: 108, members: 5240 },
    '2021-22': { projects: 5102, hours: 74915, amount: 41.08, beneficiaries: 762450, clubs: 112, members: 5610 },
    '2022-23': { projects: 5640, hours: 80226, amount: 44.73, beneficiaries: 710905, clubs: 116, members: 6045 },
    '2023-24': { projects: 6018, hours: 86410, amount: 49.85, beneficiaries: 748330, clubs: 119, members: 6520 },
    '2024-25': { projects: 6425, hours: 91872, amount: 56.12, beneficiaries: 805615, clubs: 122, members: 6880 },
    '2025-26': { projects: 6790, hours: 95330, amount: 61.48, beneficiaries: 864220, clubs: 124, members: 7045 },
    '2026-27': { projects: 2763, hours: 62636, amount: 54.59, beneficiaries: 642815, clubs: 125, members: 7171, status: 'in-progress', note: 'Year to date' },
    '2027-28': { projects: 0,    hours: 0,     amount: 0,     beneficiaries: 0,      clubs: 125, members: 7171, status: 'upcoming',    note: 'Rotary year 2027-28 begins on 1 July 2027.' }
  };

  /* ---------- 5 · dignitaries per year ----------
     Names, photos and bio facts: district API (photo null = none usable; render
     the theme's designed initials plate). 2025-26 DG is from a club document.  */
  function P(name, photo, bio, role) {
    return { name: name, role: role || 'President', photo: photo ? { src: DIG + photo, w: 480, h: 600, alt: 'Portrait of ' + name } : null, bio: bio };
  }
  function G(name, photo, bio, extra) {
    var o = { name: name, role: 'District Governor', photo: photo ? { src: DIG + photo, w: 480, h: 600, alt: 'Portrait of ' + name } : null, bio: bio };
    for (var k in extra || {}) o[k] = extra[k];
    return o;
  }
  var dignitariesByYear = {
    '2016-17': {
      president: P('John F. Germ', null, 'A member of the Rotary Club of Chattanooga, Tennessee, USA, John F. Germ led Rotary through the centennial year of The Rotary Foundation, under the theme “Rotary Serving Humanity.”'),
      dg: G('Sameer Kulkarni', null, 'District Governor of Rotary District 3141 for 2016-17, the year RI President John F. Germ named “Rotary Serving Humanity.”', { dummy: true })
    },
    '2017-18': {
      president: P('Ian H.S. Riseley', null, 'Ian H.S. Riseley of the Rotary Club of Sandringham, Victoria, Australia, challenged every club to plant a tree for each of its members, under the theme “Rotary: Making a Difference.”'),
      dg: G('Nitin Bhandari', null, 'District Governor of Rotary District 3141 for 2017-18, under RI President Ian H.S. Riseley’s theme, “Rotary: Making a Difference.”', { dummy: true })
    },
    '2018-19': {
      president: P('Barry Rassin', 'president-2018-19.jpg', 'Barry Rassin of the Rotary Club of East Nassau, New Providence, Bahamas, asked Rotarians everywhere to “Be the Inspiration.”'),
      dg: G('Shashi Kumar R. Sharma', 'dg-2018-19.jpg', 'Shashi Kumar R. Sharma led Rotary District 3141 in 2018-19, the year of RI President Barry Rassin’s call to “Be the Inspiration.”')
    },
    '2019-20': {
      president: P('Mark Daniel Maloney', 'president-2019-20.jpg', 'An attorney from the Rotary Club of Decatur, Alabama, USA, Mark Daniel Maloney held that the clubs are where Rotary happens. His theme was “Rotary Connects the World.”'),
      dg: G('Harjit Singh Talwar', 'dg-2019-20.jpg', 'Harjit Singh Talwar led the district in 2019-20, as clubs took up RI President Mark Daniel Maloney’s theme, “Rotary Connects the World.”')
    },
    '2020-21': {
      president: P('Holger Knaack', 'president-2020-21.jpg', 'Holger Knaack, chief executive of the real-estate firm Knaack KG and a member of the Rotary Club of Herzogtum Lauenburg-Mölln, Germany, led the year “Rotary Opens Opportunities.”'),
      dg: G('Sunnil Mehra', null, 'Sunnil Mehra led District 3141 through 2020-21, “Rotary Opens Opportunities,” as clubs kept serving through the pandemic.')
    },
    '2021-22': {
      president: P('Shekhar Mehta', 'president-2021-22.jpg', 'Shekhar Mehta of the Rotary Club of Calcutta-Mahanagar, only the fourth Indian to lead Rotary International, called on members to “Serve to Change Lives.”'),
      dg: G('Rajendra K. Agarwal', 'dg-2021-22.jpg', 'Rajendra K. Agarwal led the district in 2021-22, the year RI President Shekhar Mehta asked every Rotarian to “Serve to Change Lives.”')
    },
    '2022-23': {
      president: P('Jennifer E. Jones', 'president-2022-23.jpg', 'Jennifer E. Jones of the Rotary Club of Windsor-Roseland, Ontario, Canada, became the first woman to serve as president of Rotary International, under the theme “Imagine Rotary.”'),
      dg: G('Sandip Agarwalla', 'dg-2022-23.jpg', 'A third-generation Rotarian, Sandip Agarwalla joined the Rotary Club of Bombay at 29 and went on to become its youngest president.')
    },
    '2023-24': {
      president: P('R. Gordon R. McInally', 'president-2023-24.jpg', 'Gordon R. McInally, a dental surgeon and member of the Rotary Club of South Queensferry, Scotland, asked Rotary to “Create Hope in the World.”'),
      dg: G('Arun Kumar Bhargava', null, 'Born and raised in Jaipur, Arun Kumar Bhargava earned a master’s degree in nuclear physics from the University of Rajasthan before leading District 3141 in 2023-24.')
    },
    '2024-25': {
      president: P('Stephanie A. Urchick', 'president-2024-25.jpg', 'Stephanie A. Urchick of the Rotary Club of McMurray, Pennsylvania, USA, led Rotary in 2024-25 under the theme “The Magic of Rotary.”'),
      dg: G('Chetan D. Desai', null, 'A mechanical engineer turned IT entrepreneur, Chetan D. Desai is a director of Vibrant Etechnologies and led District 3141 in 2024-25.')
    },
    '2025-26': {
      president: P('Francesco Arezzo', 'president-2025-26.jpg', 'Francesco Arezzo, a member of the Rotary Club of Ragusa, Italy, was selected by the RI Board to lead Rotary in 2025-26, under the theme “Unite for Good.”'),
      dg: G('Dr. Manish Motwani', null, 'Dr. Manish Motwani led Rotary District 3141 in 2025-26, the year of RI President Francesco Arezzo’s theme, “Unite for Good.”')
    },
    '2026-27': {
      president: P('Olayinka Hakeem Babalola', 'president-2026-27.jpg', 'A member of the Rotary Club of Trans Amadi, Nigeria, Olayinka Hakeem Babalola began his Rotary journey as a Rotaractor in 1984 and has served as district governor, RI vice president and RI director.'),
      dg: G('Rajan Dua', 'dg-2026-27.jpg', 'Rajan Dua leads Rotary District 3141 in 2026-27: 125 clubs and 7,171 Rotarians across Mumbai and Palghar, joined in service.')
    },
    '2027-28': {
      president: P('Larry A. Lunsford', 'president-2027-28.jpg', 'Larry A. Lunsford, a member of the Rotary Club of Kansas City-Plaza, Missouri, USA, will lead Rotary International as president in 2027-28.', 'President-elect'),
      dg: G('Deepak Jiandani', 'dg-2027-28.jpg', 'Deepak Jiandani is District Governor-elect and will lead Rotary District 3141 in 2027-28.', { role: 'District Governor-elect' })
    }
  };
  years.forEach(function (y) {
    var d = dignitariesByYear[y];
    d.president.term = 'Rotary International ' + y;
    d.dg.term = y;
  });

  /* ---------- 7 · press per year ---------- */
  // 2026-27: the live site's 8 latest club bulletins (title/club/date are real;
  // `source` is the real PDF, `pdf` the local placeholder every theme previews).
  var liveBulletins = [
    { title: 'Weekly Bulletin 30th October 2026', club: 'Organ Donation International', date: '2026-10-30', source: 'https://rizones45678.org/API/Documents/ebulletin/Group34496/Bulletin30thOct_9797921929102026071935PM.pdf' },
    { title: 'Panache — July to September', club: 'Bombay Pier', date: '2026-10-28', source: 'https://rizones45678.org/API/Documents/ebulletin/Group47/Panache_July-September_2026_e3195ee830102026034743PM.pdf' },
    { title: 'Queen’s Dossier — July to September 2026', club: 'Queen’s Necklace', date: '2026-10-27', source: 'https://rizones45678.org/API/Documents/ebulletin/Group79/OCV_-_Queen_s_Dossier_July_-_Sep_2026_626b91ce27102026082632PM.pdf' },
    { title: 'Newsletter No. 16', club: 'Bombay Bay View', date: '2026-10-25', source: 'https://rizones45678.org/API/Documents/ebulletin/Group15/week16_486c382128102026122722PM.pdf' },
    { title: 'Weekly Bulletin 23rd October 2026', club: 'Organ Donation International', date: '2026-10-23', source: 'https://rizones45678.org/API/Documents/ebulletin/Group34496/Bulletin23rdOct_ba0b712b23102026085614AM.pdf' },
    { title: 'Asha Newsletter — July 2026', club: 'Mumbai Sher-E-Punjab', date: '2026-10-21', source: 'https://rizones45678.org/API/Documents/ebulletin/Group34426/newsletter_july_e79eda8d21102026041422PM.pdf' },
    { title: 'Asha Newsletter — August 2026', club: 'Mumbai Sher-E-Punjab', date: '2026-10-21', source: 'https://rizones45678.org/API/Documents/ebulletin/Group34426/newsletter_aug_f029b0f521102026100510AM.pdf' },
    { title: '100 Days of Service: Project Report 2026-27', club: 'Chembur (Mumbai)', date: '2026-10-20', source: 'https://rizones45678.org/API/Documents/ebulletin/Group66/Rotary_Club_of_Chembur_100_Days_Report_5d0f86ed31102026055354PM.pdf' }
  ];
  var MASTHEADS = [
    ['Bombay Bay View', 'Bay Watch'], ['Bombay Pier', 'Panache'], ['Queen’s Necklace', 'Queen’s Dossier'],
    ['Bombay West', 'Westwind'], ['Bombay Sea Face', 'Sea Breeze'], ['Bombay Peninsula', 'The Peninsula Post'],
    ['Bombay Mid-Town', 'Midtowner'], ['Mumbai Juhu', 'Juhu Journal'], ['Mumbai Ghatkopar West', 'Ghatkopar Gazette'],
    ['Bombay Hills South', 'Hilltop'], ['Mumbai Sher-E-Punjab', 'Asha'], ['Chembur (Mumbai)', 'Chembur Chronicle']
  ];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var bulletinTotals = { '2016-17': 58, '2017-18': 66, '2018-19': 74, '2019-20': 81, '2020-21': 118, '2021-22': 132,
                         '2022-23': 141, '2023-24': 156, '2024-25': 169, '2025-26': 184, '2026-27': 107, '2027-28': 0 };

  // Dummy: the 8 latest bulletins of a past year, walking back from late June.
  function pastBulletins(y, yi) {
    var end = new Date(+y.slice(0, 4) + 1, 5, 27), out = [];
    for (var i = 0; i < 8; i++) {
      var m = MASTHEADS[(yi * 5 + i * 7) % MASTHEADS.length];
      end = new Date(end.getFullYear(), end.getMonth(), end.getDate() - (2 + (yi + i * 3) % 6));
      var kind = (yi + i) % 3;
      var title = kind === 0 ? m[1] + ' — Weekly Bulletin No. ' + (44 - i * 2 - yi % 4)
                : kind === 1 ? m[1] + ' — ' + MONTHS[end.getMonth()] + ' ' + end.getFullYear()
                :              m[1] + ' — April to June ' + end.getFullYear();
      out.push({ title: title, club: m[0], date: iso(end) });
    }
    return out;
  }
  // Dummy: the 3 latest Governor's Monthly Letters of a past year (June, May, April).
  function pastLetters(y) {
    var endYear = +y.slice(0, 4) + 1, gov = dignitariesByYear[y].dg.name;
    return [5, 4, 3].map(function (m, i) {
      return { title: 'Governor’s Monthly Letter — ' + MONTHS[m] + ' ' + endYear, month: MONTHS[m] + ' ' + endYear,
               governor: gov, date: iso(new Date(endYear, m, 1 + i)), pdf: PDF };
    });
  }
  var pressByYear = {};
  years.forEach(function (y, yi) {
    var list = y === '2026-27' ? liveBulletins.slice() : y === '2027-28' ? [] : pastBulletins(y, yi);
    list.forEach(function (b, i) { b.pdf = PDF; b.cover = photos[coverPool[(yi * 3 + i) % coverPool.length]]; });
    pressByYear[y] = {
      gml: y === '2026-27' || y === '2027-28' ? [] : pastLetters(y),
      bulletins: list,
      total: bulletinTotals[y],
      status: y === '2026-27' ? 'in-progress' : y === '2027-28' ? 'upcoming' : 'complete'
    };
  });

  /* ---------- 6 · calendar: November 2026 (all names invented) ----------
     Today is the real date while it falls in November 2026, otherwise
     3 Nov 2026 — so the prototype always opens on a populated day.          */
  var now = new Date();
  var today = now.getFullYear() === 2026 && now.getMonth() === 10 ? iso(now) : '2026-11-03';
  var RELATION = /^(Spouse|Son|Daughter|Mother|Father) of /;
  function day(d) { return '2026-11-' + pad(d); }
  function B(d, name, clubOrRelation) {
    var o = { date: day(d), type: 'birthday', name: name };
    if (RELATION.test(clubOrRelation)) o.relation = clubOrRelation; else o.club = clubOrRelation;
    return o;
  }
  function A(d, couple, club) { return { date: day(d), type: 'anniversary', name: couple, club: club }; }
  function C(d, title, club, time, venue) { return { date: day(d), type: 'club', title: title, club: club, time: time, venue: venue }; }
  function D(d, title, time, venue) { return { date: day(d), type: 'district', title: title, time: time, venue: venue }; }

  var entries = [
    B(1, 'Parth Vora', 'Bombay Juhu Beach'), B(1, 'Anjali Menon', 'Spouse of Rtn. Ravi Menon'), A(1, 'Ravi & Anjali Menon', 'Mumbai Andheri'),
    B(2, 'Cyrus Engineer', 'Bombay'), C(2, 'Literacy Mission Book Drive', 'Mumbai Ghatkopar', '11:00', 'Municipal School, Pant Nagar'),

    // 3 Nov — the busy day (35 entries) that proves the day panel scrolls
    D(3, 'District Rotary Foundation Seminar', '18:30', 'Nehru Centre, Worli'),
    C(3, 'Diwali Fellowship Evening', 'Bombay Bay View', '19:30', 'Bellissima Banquets, Opera House'),
    B(3, 'Aarav Mehta', 'Bombay West'), B(3, 'Nandini Kulkarni', 'Bombay Bay View'), B(3, 'Farhan Merchant', 'Bombay Pier'),
    B(3, 'Ishita Shah', 'Spouse of Rtn. Rohan Shah'), B(3, 'Kabir Malhotra', 'Mumbai Juhu'), B(3, 'Devika Iyer', 'Queen’s Necklace'),
    B(3, 'Sahil Kapadia', 'Son of Rtn. Mihir Kapadia'), B(3, 'Rustom Daruwalla', 'Bombay Hills South'), B(3, 'Meher Bhathena', 'Daughter of Rtn. Kaizad Bhathena'),
    B(3, 'Pranav Deshpande', 'Mumbai Ghatkopar West'), B(3, 'Tanvi Agarwal', 'Bombay Sea Face'), B(3, 'Joel D’Souza', 'Bombay Seacoast'),
    B(3, 'Rhea Sachdev', 'Spouse of Rtn. Varun Sachdev'), B(3, 'Hemant Joshi', 'Borivli'), B(3, 'Zoya Lakdawala', 'Mumbai Nariman Point'),
    B(3, 'Anirudh Rao', 'Bombay Peninsula'), B(3, 'Kiara Bhatia', 'Daughter of Rtn. Neel Bhatia'), B(3, 'Suresh Nair', 'Chembur (Mumbai)'),
    B(3, 'Lavanya Pillai', 'Spouse of Rtn. Arjun Pillai'), B(3, 'Vikrant Thakkar', 'Dahanu Sea Coast'), B(3, 'Gauri Patwardhan', 'Mumbai Kandivli West'),
    B(3, 'Yash Chandiramani', 'Son of Rtn. Prakash Chandiramani'),
    A(3, 'Rohan & Ishita Shah', 'Bombay West'), A(3, 'Kaizad & Shirin Bhathena', 'Bombay Hills South'), A(3, 'Neel & Pooja Bhatia', 'Bombay Pier'),
    A(3, 'Arjun & Lavanya Pillai', 'Mumbai Juhu'), A(3, 'Mihir & Krupa Kapadia', 'Bombay Bay View'), A(3, 'Varun & Rhea Sachdev', 'Queen’s Necklace'),
    A(3, 'Sameer & Aditi Gokhale', 'Mumbai Ghatkopar West'), A(3, 'Imran & Sana Contractor', 'Bombay Sea Face'), A(3, 'Ashwin & Meera Venkatesh', 'Bombay Peninsula'),
    A(3, 'Dhruv & Simran Ahuja', 'Borivli'), A(3, 'Nikhil & Rutuja Pawar', 'Vasai'),

    B(4, 'Riya Doshi', 'Bombay Mid-Town'), B(4, 'Aditya Bhosale', 'Mumbai Mulund East'), A(4, 'Sunil & Kavita Hegde', 'Bombay Worli'),
    B(5, 'Sneha Rane', 'Daughter of Rtn. Milind Rane'), C(5, 'Diwali Gifting for Pada Schools', 'Mumbai Kandivli West', '10:00', 'Zilla Parishad School, Wada'),
    B(6, 'Harsh Vardhan Singh', 'Bombay North'), A(6, 'Kunal & Priya Mirchandani', 'Bombay Pier'),
    D(7, 'District Membership Seminar', '09:30', 'Indian Merchants’ Chamber, Churchgate'), B(7, 'Mitali Sen', 'Mumbai Nariman Point'), B(7, 'Omkar Sawant', 'Virar'),
    C(8, 'Diwali Fellowship by the Sea', 'Queen’s Necklace', '19:30', 'Marine Drive'), B(8, 'Lakshmi Narayanan', 'Spouse of Rtn. Hari Narayanan'), A(8, 'Hari & Lakshmi Narayanan', 'Chembur (Mumbai)'),
    B(9, 'Fatema Rangwala', 'Bombay Bay View'),
    B(10, 'Advait Kelkar', 'Son of Rtn. Mandar Kelkar'), A(10, 'Mandar & Shruti Kelkar', 'Mulund'),
    C(11, 'Blood Donation Drive', 'Bombay West', '09:00', 'Rotary Service Centre, Santacruz'), B(11, 'Neha Chawla', 'Mumbai Khar'),
    B(12, 'Tejas Parikh', 'Bombay Seacoast'), B(12, 'Ira Wadia', 'Daughter of Rtn. Jehangir Wadia'),
    A(13, 'Jehangir & Freny Wadia', 'Bombay'), B(13, 'Ruchi Goenka', 'Mumbai Lower Parel'),
    C(14, 'Children’s Day Carnival', 'Bombay Bay View', '16:00', 'Vatsalya Foundation, Mahalaxmi'), C(14, 'Diabetes Awareness Walk', 'Mumbai Juhu', '06:30', 'Juhu Beach'),
    B(14, 'Arnav Saxena', 'Son of Rtn. Gaurav Saxena'), B(14, 'Smita Patil', 'Mumbai Dahisar'),
    D(15, 'Official Club Visit — Bombay Sea Face', '18:30', 'Indian Merchants’ Chamber, Churchgate'), A(15, 'Gaurav & Nidhi Saxena', 'Bombay Juhu Beach'),
    B(16, 'Vivek Ranade', 'Bombay Powai'), B(16, 'Aisha Qureshi', 'Spouse of Rtn. Tariq Qureshi'),
    C(17, 'Men’s Health Check-up Camp', 'Mumbai West Coast', '09:00', 'Siddharth Nagar, Goregaon West'), A(17, 'Tariq & Aisha Qureshi', 'Mumbai Bandra Kurla Complex'),
    B(18, 'Shreya Nanavati', 'Bombay Hanging Garden'), B(18, 'Rahul Bhandari', 'Mumbai Mid-West'),
    C(19, 'Fund-raising Concert: Sur Sandhya', 'Bombay Up-Town', '19:30', 'Nehru Centre, Worli'), B(19, 'Pooja Reddy', 'Daughter of Rtn. Srinivas Reddy'),
    C(20, 'Speaker Meeting: Water Security for Mumbai', 'Bombay Bay View', '19:30', 'Imara, Hughes Road'), A(20, 'Srinivas & Padma Reddy', 'Bombay Peninsula'),
    D(21, 'District RYLA — Opening Ceremony', '09:00', 'SNDT Campus, Juhu'), B(21, 'Kavya Hegde', 'Daughter of Rtn. Sunil Hegde'),
    B(22, 'Deepak Malani', 'Mulund'), A(22, 'Ajay & Sonal Thakur', 'Mumbai Lakers'),
    B(23, 'Natasha Fernandes', 'Bombay Bandra'),
    C(24, 'Community Lunch Seva', 'Mumbai Sher-E-Punjab', '12:00', 'Sher-E-Punjab Colony, Andheri East'), B(24, 'Gurpreet Kohli', 'Mumbai Sher-E-Punjab'),
    B(25, 'Esha Mistry', 'Spouse of Rtn. Darius Mistry'), A(25, 'Darius & Esha Mistry', 'Bombay Mid-Town'),
    B(26, 'Manav Gandhi', 'Bombay Harbour'), C(26, 'Constitution Day Quiz for Interactors', 'Mumbai Island City', '11:00', 'Island City Centre, Dadar East'),
    B(27, 'Sanjana Kamath', 'Mumbai Versova'), A(27, 'Rakesh & Leena Jain', 'Borivli'),
    D(28, 'Rotary Foundation Month Walkathon', '06:30', 'Marine Drive'), B(28, 'Akash Chopra', 'Mumbai Elite'),
    B(29, 'Divya Rao', 'Daughter of Rtn. Anirudh Rao'), A(29, 'Anirudh & Sunita Rao', 'Bombay Peninsula'),
    C(30, 'Beach Clean-up at Versova', 'Mumbai Versova', '07:00', 'Versova Beach'), B(30, 'Zubin Kotwal', 'Bombay Mid-City'), A(30, 'Sahil & Tara Mehra', 'Mumbai Juhu Elite')
  ];
  function countOf(type) { return entries.filter(function (e) { return e.type === type; }).length; }
  // Birthdays and anniversaries show the live month totals from the spec; the
  // entries above are a representative subset. Event tabs count the entries.
  var counts = { club: countOf('club'), district: countOf('district'), birthday: 1081, anniversary: 573 };
  counts.all = counts.club + counts.district + counts.birthday + counts.anniversary;

  return {
    site: { name: 'Rotary District 3141', district: '3141', region: 'Mumbai, Maharashtra', zone: 'Zone 4', live: LIVE },

    brand: {
      blue: '#005DAA', gold: '#F7A81B',
      logo: IMG + 'rotary-logo.svg',                   // official signature, unmodified
      logoReversed: IMG + 'rotary-logo-reversed.svg',  // white wordmark for dark grounds
      wheel: IMG + 'rotary-wheel.svg',                 // the wheel alone
      logoAlt: 'Rotary',
      // The wheel's outline for inline SVG animation (e.g. drawing it from lines):
      // <svg viewBox="{viewBox}"><g transform="{outer}"><path transform="{transform}" d="{d}"/></g></svg>
      wheelSvg: { viewBox: '242.3 1.5 145 145', outer: 'matrix(1.3333333,0,0,-1.3333333,0,147.82533)', transform: 'translate(216.2026,90.2168)',
        d: 'M 0,0 0.186,-0.318 0.87,-1.5 2.29,-0.754 c 0.132,0.066 0.208,0.231 0.233,0.436 C 2.55,0.323 2.087,1.191 1.415,0.787 0.891,0.512 0.572,0.323 0,0 M -1.481,-0.318 -1.856,0.355 C -0.872,0.979 0.186,1.521 1.207,2.067 2.407,2.729 4.102,1.123 3.983,-0.318 3.96,-0.572 3.89,-0.802 3.738,-1.035 L 6.194,-2.822 C 5.732,-3.04 5.382,-3.225 4.829,-3.464 l -2.15,1.572 -1.187,-0.635 1.264,-2.09 C 2.267,-4.929 1.969,-5.123 1.398,-5.455 Z m 32.469,-67.36 2.237,-6.387 c 0.435,0.151 0.902,0.283 1.343,0.477 l -2.171,6.358 c -0.594,-0.203 -0.869,-0.284 -1.409,-0.448 m -8.944,-6.028 -0.524,1.292 -0.53,1.398 -0.46,-1.398 -0.454,-1.377 z m 0.884,1.292 1.464,-3.549 c -0.478,-0.02 -0.924,-0.069 -1.353,-0.118 l -0.451,1.146 -2.925,-0.081 -0.335,-1.198 c -0.468,0.04 -0.905,0.054 -1.368,0.054 l 1.261,3.746 0.899,2.843 0.043,0.09 1.492,0.066 0.076,-0.179 z m 7.345,74.656 1.512,-0.488 c 0.414,-0.119 0.96,0.529 0.96,1.094 0,0.269 -0.094,0.507 -0.453,0.586 -0.56,0.217 -0.942,0.313 -1.552,0.467 L 30.428,2.848 Z m -0.927,-3.531 c -0.542,0.158 -0.943,0.224 -1.539,0.394 l 1.098,3.743 0.803,2.668 C 30.865,5.228 31.965,4.854 33.065,4.495 33.688,4.303 34.022,3.598 34.086,2.848 34.127,1.829 33.621,0.72 32.591,0.489 l 0.4,-3.016 c -0.483,0.2 -0.84,0.35 -1.375,0.559 l -0.35,2.637 -1.291,0.396 z M 8.792,-69.204 c -0.041,0.189 -0.118,0.342 -0.35,0.448 l -1.694,0.624 -0.382,-1.072 -0.137,-0.39 -0.01,-0.025 1.544,-0.578 c 0.423,-0.188 0.832,0.189 0.979,0.603 0.05,0.113 0.093,0.254 0.05,0.39 m 1.269,0 v -0.367 c -0.104,-0.902 -0.715,-1.817 -1.706,-1.932 l 0.23,-3.148 c -0.461,0.106 -0.98,0.258 -1.47,0.467 l -0.053,2.961 -1.33,0.569 -1.079,-2.614 c -0.436,0.145 -0.871,0.284 -1.298,0.493 l 1.367,3.181 0.163,0.39 1.112,2.624 3.029,-1.168 c 0.674,-0.242 0.984,-0.841 1.035,-1.456 m 19.325,0.956 c -1.966,-0.431 -3.48,-0.79 -5.432,-1.092 l 0.181,-1.133 c 0.722,0.115 1.381,0.2 2.144,0.296 l 0.984,-5.456 1.447,0.273 -1.174,5.441 c 0.744,0.185 1.431,0.373 2.172,0.545 z m 7.389,63.839 1.461,2.814 3.944,1.833 C 41.765,0.535 41.317,0.743 40.9,1.018 L 38.184,-0.22 37.682,2.729 c -0.566,0.269 -0.907,0.388 -1.497,0.626 l 0.789,-4.289 -1.463,-2.78 z m 14.789,-1.722 c -0.622,0.762 -1.654,0.649 -1.951,0.118 l -4.59,-4.612 c -0.673,-0.7 -0.607,-1.724 0.089,-2.222 6.929,-7.67 9.824,-17.218 7.552,-29.04 -0.051,-0.774 0.437,-1.398 1.042,-1.572 l 6.347,-1.841 c 0.845,-0.239 1.386,0.275 1.567,0.998 3.265,14.555 -1.207,28.864 -10.056,38.171 m 7.342,-42.56 -6.352,2.169 c -0.333,0.123 -1.199,0.123 -1.653,-0.994 -5.131,-12.302 -17.072,-20.723 -30.9,-20.723 -13.846,0 -26.009,8.614 -30.919,20.915 -0.365,0.925 -1.257,0.925 -1.595,0.802 l -6.317,-2.169 c -0.686,-0.247 -1.098,-0.855 -0.738,-1.733 6.205,-15.836 21.636,-27.015 39.569,-27.015 17.926,0 33.427,11.256 39.654,27.082 0.322,0.828 -0.068,1.419 -0.749,1.666 m -78.772,3.391 6.337,1.841 c 0.593,0.174 1.082,0.798 1.035,1.572 -2.275,11.802 0.615,21.37 7.534,29.04 0.7,0.498 0.774,1.522 0.105,2.222 l -4.606,4.631 c -0.448,0.512 -1.261,0.512 -1.96,-0.2 -8.829,-9.292 -13.286,-23.553 -10.016,-38.133 0.181,-0.698 0.733,-1.212 1.571,-0.973 m 63.569,29.505 c 0.018,0.283 -0.156,0.64 -0.551,1.029 -5.073,5.366 -10.283,8.368 -17.429,10.067 -0.401,0.104 -0.866,0.198 -1.176,-0.076 -0.32,-0.256 -0.412,-0.75 -0.347,-1.491 l 1.177,-16.533 c 0.038,-0.625 0.321,-1.121 0.738,-1.374 0.458,-0.26 1.007,-0.211 1.576,0.063 l 14.889,7.185 c 0.477,0.232 1.021,0.484 1.123,0.994 0,0.031 0.018,0.072 0,0.136 m 3.01,-29.549 c 0.442,-0.287 0.956,-0.634 1.421,-0.473 0.316,0.096 0.588,0.443 0.764,1.067 2.084,7.066 2.084,13.103 0,20.086 -0.129,0.438 -0.333,0.891 -0.699,1.055 -0.372,0.133 -0.838,-0.021 -1.507,-0.474 l -13.655,-9.284 c -0.529,-0.355 -0.798,-0.84 -0.798,-1.34 0,-0.499 0.269,-0.983 0.798,-1.333 z M 24.507,-64.558 c 0.251,-0.199 0.665,-0.257 1.3,-0.098 7.103,1.705 12.313,4.715 17.39,10.043 0.302,0.351 0.635,0.712 0.536,1.112 -0.093,0.384 -0.42,0.731 -1.112,1.058 l -14.893,7.227 c -0.565,0.266 -1.114,0.266 -1.568,0.028 -0.437,-0.275 -0.704,-0.744 -0.745,-1.397 L 24.211,-63.07 c -0.011,-0.541 -0.076,-1.156 0.296,-1.488 m -4.506,19.095 c 5.879,0 10.66,4.772 10.66,10.652 0,5.879 -4.781,10.658 -10.66,10.68 -5.878,0 -10.655,-4.801 -10.655,-10.68 0,-5.88 4.777,-10.652 10.655,-10.652 m -23.423,-8.314 c 0,-0.282 0.192,-0.634 0.551,-1.008 5.121,-5.386 10.306,-8.383 17.427,-10.055 0.456,-0.137 0.902,-0.205 1.218,0.042 0.322,0.24 0.414,0.734 0.36,1.514 0,0.024 -1.211,16.53 -1.211,16.53 -0.052,0.626 -0.288,1.103 -0.726,1.354 -0.445,0.261 -0.997,0.261 -1.591,-0.009 L -2.248,-52.64 c -0.517,-0.241 -1.08,-0.514 -1.157,-1 0,-0.031 -0.017,-0.095 -0.017,-0.137 m -0.215,37.719 c 0.062,-0.498 0.628,-0.752 1.123,-0.984 l 14.869,-7.224 c 0.592,-0.283 1.141,-0.283 1.589,-0.049 0.419,0.274 0.691,0.75 0.729,1.383 l 1.201,16.494 c 0.065,0.798 -0.047,1.264 -0.335,1.509 -0.313,0.271 -0.778,0.194 -1.226,0.112 -7.127,-1.714 -12.321,-4.725 -17.439,-10.064 -0.414,-0.468 -0.606,-0.86 -0.511,-1.177 m -2.986,-8.134 c -0.486,0.314 -1.004,0.673 -1.427,0.485 -0.345,-0.104 -0.596,-0.466 -0.777,-1.053 -2.067,-7.091 -2.067,-13.105 0,-20.106 0.14,-0.455 0.297,-0.909 0.712,-1.024 0.339,-0.141 0.839,0 1.492,0.45 l 13.644,9.296 c 0.507,0.341 0.815,0.824 0.815,1.311 0,0.528 -0.308,0.992 -0.815,1.349 z m -0.299,20.648 4.408,-4.91 c 0.616,-0.662 1.293,-0.581 2.184,0.116 5.57,4.368 12.716,6.953 20.331,6.953 7.621,0 14.772,-2.575 20.395,-6.953 0.88,-0.65 1.538,-0.778 2.184,-0.116 l 4.41,4.91 c 0.499,0.542 0.499,1.291 -0.458,2.091 -7.393,5.756 -16.517,9.308 -26.55,9.308 -9.972,0 -19.228,-3.552 -26.489,-9.334 -0.95,-0.774 -0.908,-1.523 -0.415,-2.065 M 73.7,-34.851 c 0,-0.625 -0.028,-1.254 -0.098,-1.755 l -0.018,-0.135 -0.144,-0.075 c -2.282,-1.358 -5.23,-2.131 -8.187,-2.212 -0.07,-0.375 -0.391,-3.045 -0.446,-3.421 2.757,-0.795 5.429,-2.301 7.293,-4.227 l 0.076,-0.12 v -0.122 c -0.146,-1.051 -0.519,-2.461 -0.931,-3.377 l -0.048,-0.143 -0.134,-0.022 c -2.585,-0.745 -5.63,-0.716 -8.448,-0.019 -0.134,-0.35 -1.176,-2.832 -1.282,-3.192 2.47,-1.561 4.653,-3.706 5.881,-5.996 l 0.065,-0.128 -0.04,-0.134 c -0.386,-0.911 -1.107,-2.23 -1.753,-3.022 l -0.069,-0.119 h -0.164 c -2.638,-0.031 -5.585,0.752 -8.157,2.184 -0.234,-0.307 -1.951,-2.576 -2.184,-2.882 2.026,-2.087 3.563,-4.733 4.186,-7.343 l 0.04,-0.136 -0.075,-0.095 c -0.588,-0.799 -1.671,-1.857 -2.456,-2.491 l -0.092,-0.081 -0.195,0.038 c -2.538,0.677 -5.221,2.214 -7.306,4.229 -0.31,-0.233 -2.438,-1.896 -2.755,-2.133 1.363,-2.496 2.191,-5.368 2.191,-7.963 v -0.361 l -0.158,-0.09 c -0.785,-0.632 -2.091,-1.388 -3.022,-1.769 l -0.093,-0.039 -0.154,0.05 c -2.286,1.331 -4.475,3.501 -5.972,5.989 -0.361,-0.16 -2.952,-1.268 -3.306,-1.423 0.354,-1.386 0.564,-2.836 0.604,-4.269 0,-1.447 -0.25,-2.893 -0.604,-4.2 l -0.019,-0.13 -0.139,-0.076 c -0.866,-0.361 -2.329,-0.723 -3.348,-0.901 l -0.156,-0.022 -0.088,0.11 c -1.968,1.872 -3.475,4.534 -4.267,7.316 -0.35,-0.026 -3.035,-0.39 -3.413,-0.469 -0.047,-2.917 -0.847,-5.876 -2.236,-8.168 l -0.075,-0.12 -0.158,-0.02 c -0.932,-0.142 -2.425,-0.142 -3.442,0 l -0.125,0.02 -0.089,0.12 c -1.344,2.292 -2.149,5.251 -2.213,8.168 -0.401,0.039 -3.229,0.443 -3.622,0.469 -0.773,-2.764 -2.294,-5.412 -4.209,-7.307 l -0.103,-0.097 -0.158,0.024 c -1.05,0.154 -2.429,0.558 -3.353,0.941 l -0.112,0.055 -0.046,0.118 c -0.391,1.303 -0.592,2.764 -0.592,4.211 0,1.419 0.201,2.841 0.562,4.227 -0.361,0.155 -2.807,1.146 -3.16,1.305 -1.514,-2.53 -3.698,-4.728 -6.004,-6.01 l -0.121,-0.069 -0.148,0.039 c -0.955,0.427 -2.212,1.149 -3.026,1.759 l -0.1,0.1 v 0.274 c 0,2.627 0.8,5.52 2.171,8.05 -0.303,0.235 -2.585,1.969 -2.898,2.204 -2.091,-2.015 -4.752,-3.534 -7.324,-4.192 l -0.133,-0.041 -0.14,0.091 c -0.787,0.635 -1.799,1.657 -2.435,2.46 l -0.086,0.139 0.038,0.135 c 0.684,2.594 2.224,5.241 4.226,7.299 -0.228,0.31 -1.956,2.549 -2.2,2.884 -2.544,-1.426 -5.519,-2.251 -8.157,-2.183 h -0.141 l -0.091,0.091 c -0.617,0.816 -1.355,2.12 -1.752,3.045 l -0.06,0.138 0.06,0.123 c 1.328,2.326 3.499,4.472 5.978,5.959 -0.161,0.381 -1.218,2.88 -1.396,3.233 -2.818,-0.702 -5.881,-0.723 -8.459,0 l -0.125,0.039 -0.076,0.116 c -0.347,0.869 -0.73,2.332 -0.888,3.362 l -0.028,0.16 0.093,0.122 c 1.875,1.911 4.51,3.424 7.331,4.259 -0.032,0.394 -0.446,3.236 -0.488,3.629 -2.942,0.039 -5.902,0.799 -8.204,2.166 l -0.115,0.076 -0.011,0.16 c -0.065,0.477 -0.082,1.101 -0.082,1.734 0,0.617 0.017,1.223 0.082,1.739 l 0.011,0.158 0.115,0.064 c 2.302,1.357 5.262,2.142 8.204,2.187 0.062,0.388 0.411,3.15 0.456,3.523 -2.789,0.799 -5.45,2.326 -7.34,4.231 l -0.079,0.093 0.027,0.147 c 0.121,1.063 0.523,2.482 0.916,3.363 l 0.045,0.128 0.138,0.04 c 2.545,0.75 5.624,0.729 8.454,0.035 0.157,0.344 1.189,2.835 1.345,3.21 -2.498,1.511 -4.692,3.661 -5.996,5.983 l -0.065,0.148 0.065,0.139 c 0.409,0.931 1.147,2.193 1.726,2.985 l 0.095,0.119 h 0.159 c 2.671,0.04 5.616,-0.777 8.157,-2.185 0.238,0.285 1.97,2.629 2.207,2.941 -2.017,2.1 -3.543,4.733 -4.202,7.342 l -0.028,0.112 0.055,0.115 c 0.646,0.809 1.715,1.86 2.498,2.476 l 0.125,0.078 0.118,-0.023 c 2.625,-0.671 5.271,-2.233 7.332,-4.237 0.3,0.238 2.364,1.829 2.67,2.061 -1.42,2.484 -2.213,5.38 -2.213,7.953 v 0.388 l 0.131,0.09 c 0.772,0.605 2.082,1.356 3.016,1.736 l 0.098,0.062 0.157,-0.068 c 2.298,-1.3 4.46,-3.476 5.973,-5.967 0.362,0.137 3.045,1.302 3.412,1.449 -0.35,1.388 -0.569,2.826 -0.547,4.252 0,1.482 0.18,2.893 0.57,4.194 l 0.019,0.161 0.14,0.036 c 0.865,0.363 2.309,0.752 3.324,0.907 l 0.163,0.021 0.117,-0.102 c 1.914,-1.862 3.44,-4.527 4.246,-7.339 0.391,0.041 3.212,0.396 3.589,0.464 0.061,2.895 0.853,5.852 2.236,8.149 l 0.059,0.12 0.145,0.04 c 1.01,0.119 2.498,0.119 3.475,0 l 0.13,-0.04 0.081,-0.12 c 1.391,-2.297 2.196,-5.254 2.196,-8.122 0.423,-0.095 3.178,-0.45 3.571,-0.491 0.823,2.812 2.337,5.457 4.264,7.326 l 0.087,0.094 0.128,-0.039 c 1.05,-0.116 2.471,-0.505 3.383,-0.904 l 0.112,-0.045 0.045,-0.158 C 36.185,15 36.374,13.596 36.374,12.137 36.349,10.698 36.14,9.247 35.79,7.855 c 0.35,-0.142 3.029,-1.262 3.402,-1.419 1.484,2.491 3.621,4.65 5.944,5.967 l 0.134,0.068 0.139,-0.062 c 0.921,-0.391 2.209,-1.131 3.001,-1.754 l 0.117,-0.072 v -0.362 c 0,-2.639 -0.818,-5.522 -2.197,-7.979 0.296,-0.232 2.509,-1.962 2.841,-2.218 2.084,2.025 4.733,3.574 7.344,4.216 l 0.116,0.063 0.114,-0.121 C 57.531,3.598 58.591,2.496 59.191,1.706 L 59.302,1.589 59.256,1.456 c -0.665,-2.61 -2.237,-5.259 -4.24,-7.331 0.234,-0.319 1.899,-2.513 2.155,-2.829 2.596,1.396 5.532,2.196 8.192,2.147 h 0.123 l 0.086,-0.117 C 66.218,-7.5 66.959,-8.78 67.32,-9.66 l 0.086,-0.169 -0.086,-0.128 c -1.322,-2.303 -3.494,-4.437 -5.987,-5.958 0.152,-0.378 1.166,-2.879 1.359,-3.229 2.794,0.704 5.867,0.719 8.412,0 l 0.151,-0.03 0.059,-0.147 c 0.355,-0.884 0.769,-2.321 0.904,-3.378 l 0.021,-0.129 -0.104,-0.104 c -1.869,-1.937 -4.53,-3.452 -7.328,-4.243 0.055,-0.385 0.404,-3.115 0.47,-3.503 2.945,-0.064 5.881,-0.852 8.163,-2.203 l 0.144,-0.086 0.018,-0.139 c 0.07,-0.497 0.098,-1.101 0.098,-1.745 m -30.06,-25.32 2.795,-3.013 -4.691,1.384 c -0.391,-0.297 -0.653,-0.4 -0.998,-0.701 l 4.082,-5.489 c 0.349,0.272 0.709,0.601 1.035,0.88 l -2.477,3.302 4.738,-1.428 c 0.326,0.283 0.791,0.602 1.11,1.003 l -4.725,4.997 c -0.253,-0.273 -0.543,-0.632 -0.869,-0.935 m -3.244,-8.027 c 0,0.404 -0.103,0.765 -0.296,1.113 -0.56,1.044 -1.888,1.38 -2.922,0.786 -0.73,-0.391 -1.102,-1.134 -1.102,-1.899 0.023,-0.35 0.109,-0.742 0.314,-1.072 0.058,-0.104 0.128,-0.211 0.232,-0.324 0.651,-0.776 1.797,-0.957 2.677,-0.445 0.241,0.12 0.435,0.277 0.59,0.445 0.325,0.39 0.507,0.915 0.507,1.396 m 0.761,1.68 c 0.287,-0.503 0.427,-1.086 0.45,-1.68 0,-0.465 -0.099,-0.941 -0.29,-1.373 -0.315,-0.626 -0.78,-1.186 -1.428,-1.56 -1.577,-0.922 -3.618,-0.372 -4.575,1.251 -0.034,0.092 -0.077,0.195 -0.14,0.309 -0.192,0.432 -0.286,0.908 -0.326,1.373 0.04,1.195 0.623,2.297 1.693,2.918 1.603,0.908 3.673,0.365 4.616,-1.238 m 7.061,8.98 0.796,-1.259 0.728,-1.269 0.983,1.269 0.257,0.315 z m -0.765,1.539 6.718,-2.207 c -0.156,-0.199 -0.282,-0.391 -0.424,-0.591 -0.116,-0.151 -0.257,-0.304 -0.349,-0.501 l -1.177,0.424 -1.834,-2.291 0.67,-1.05 c -0.274,-0.312 -0.582,-0.65 -0.931,-0.995 l -2.661,4.413 -0.984,1.626 z m 7.442,0.994 -4.935,2.718 -0.633,-1.137 5.923,-3.306 2.281,4.09 -1.016,0.545 z m -39.021,-14.265 -0.492,-4.107 -1.973,4.504 c -0.462,0.091 -0.751,0.21 -1.216,0.284 l -1.549,-6.643 c 0.478,-0.128 0.938,-0.18 1.432,-0.265 l 0.829,4.081 2,-4.547 c 0.454,-0.069 0.969,-0.211 1.496,-0.197 l 0.742,6.862 c -0.389,0.021 -0.851,-0.042 -1.269,0.028 m -0.229,74.511 0.594,-5.503 1.445,0.151 -0.566,5.463 2.187,0.135 -0.084,1.226 C 16.78,6.573 15.774,6.474 13.358,6.113 L 13.52,4.949 Z M 22.34,2.242 C 23.074,2.207 23.755,2.125 24.443,2.027 L 24.081,3.434 23.627,4.883 22.946,3.434 Z m -1.117,-2.289 c -0.564,0.005 -0.825,0.005 -1.379,0.005 l 1.676,3.476 1.519,3.159 1.508,-0.157 0.792,-3.002 1.095,-4.034 c -0.507,0.094 -0.901,0.17 -1.38,0.199 l -0.39,1.265 C 23.669,1.018 22.769,1.065 21.846,1.106 Z M 7.228,1.615 c 0.091,-1.196 1.152,-2.069 2.303,-1.97 1.137,0.116 1.986,1.024 1.986,2.167 0.04,0.057 0,0.122 0,0.198 C 11.418,3.213 10.383,4.056 9.183,3.944 8.043,3.859 7.186,2.956 7.228,1.812 Z M 5.997,1.496 v 0.316 c -0.035,1.74 1.299,3.173 3.05,3.312 1.852,0.18 3.497,-1.18 3.654,-3.043 V 1.812 c 0,-1.736 -1.313,-3.222 -3.094,-3.385 -1.799,-0.16 -3.452,1.196 -3.61,3.069 M 20.12,-41.245 c 3.507,0 6.393,2.882 6.393,6.394 0,2.917 -2.03,5.454 -4.823,6.151 -0.035,0.287 -0.112,1.621 -0.112,1.621 h -3.224 c 0,0 -0.075,-1.449 -0.101,-1.737 -2.677,-0.812 -4.482,-3.253 -4.482,-6.035 0,-3.512 2.883,-6.394 6.349,-6.394 m -0.119,-3.179 c -5.288,0 -9.607,4.337 -9.607,9.613 0,5.313 4.319,9.628 9.607,9.628 5.321,0 9.6,-4.315 9.6,-9.628 0,-5.299 -4.301,-9.613 -9.6,-9.613 M 1.077,-65.357 c 0.915,-0.498 1.811,-1.018 2.813,-1.492 l 0.6,0.994 c -1.387,0.717 -2.688,1.536 -3.855,2.344 l -3.826,-5.614 c 1.451,-0.961 2.777,-1.764 4.268,-2.624 l 0.617,0.992 -3.086,1.817 1.042,1.465 2.044,-1.229 0.596,0.956 c -0.657,0.359 -1.341,0.777 -2.058,1.215 z m -7.65,8.328 -3.145,-2.716 1.603,4.657 c -0.284,0.399 -0.415,0.677 -0.712,1.044 l -5.636,-3.824 c 0.252,-0.379 0.561,-0.729 0.828,-1.119 l 3.389,2.348 -1.59,-4.693 c 0.275,-0.311 0.553,-0.785 0.942,-1.102 l 5.215,4.473 c -0.29,0.309 -0.638,0.584 -0.894,0.932 m -3.725,5.415 -5.805,-3.391 c 0.208,-0.406 0.431,-0.883 0.685,-1.275 l 5.818,3.399 c -0.284,0.513 -0.444,0.786 -0.698,1.267 m 7.172,-10.562 -3.579,-4.245 -1.114,0.967 3.699,4.122 c -0.586,0.543 -1.034,1.031 -1.601,1.537 l 0.824,0.827 c 1.408,-1.333 2.649,-2.364 4.204,-3.617 l -0.714,-0.911 c -0.566,0.445 -1.149,0.87 -1.719,1.32' }
    },

    photos: photos,

    /* 1 · utility bar */
    contact: { label: 'District Governor', email: 'rajan.dua@dpbuildhomes.com', phone: '9004762626', phoneDisplay: '+91 90047 62626', tel: '+919004762626' },
    years: { label: 'Rotary Year', list: years, current: '2026-27' },

    /* 2 · header / navigation */
    nav: [
      { key: 'home',      label: 'Home',               href: PAGE.home, current: true,                    image: photos.beach },
      { key: 'about',     label: 'About',              href: PAGE.about,                               image: photos.vision },
      { key: 'committee', label: 'District Committee', href: PAGE.committee,                           image: photos.coreTeam },
      { key: 'finder',    label: 'Club Finder',        href: PAGE.finder,                              image: photos.plantation },
      { key: 'projects',  label: 'Club Projects',      href: PAGE.projects,                            image: photos.foodkits },
      { key: 'service',   label: 'Club Service',       href: PAGE.service,                             image: photos.classroom },
      { key: 'optimus',   label: 'Optimus Studio',     href: 'https://bit.ly/RotaryOptimusStudio', external: true, image: photos.meals }
    ],
    ctas: {
      join:  { label: 'Join Rotary', href: 'https://zfrmz.com/IYIxCyfrS2jgW8gnR1Ia', external: true },  // primary
      admin: { label: 'Admin Login', href: 'https://rizones45678.org', external: true }                // secondary
    },

    /* 3 · hero */
    hero: {
      title: 'District Highlights',
      autoplayMs: 6000,
      slides: [
        { photo: photos.dgAddress, caption: 'District Governor Rajan Dua addresses members' },
        { photo: photos.coreTeam,  caption: 'The 2026-27 Core Team announcement' }
      ],
      // The advertisement shown beside the banner (the live site's default ad).
      ads: [
        { image: { src: IMG + 'ad-four-way-test.png', w: 1080, h: 1080,
                   alt: 'Rotary — The Four-Way Test. Of the things we think, say or do: Is it the truth? Is it fair to all concerned? Will it build goodwill and better friendships? Will it be beneficial to all concerned?' },
          href: null }
      ]
    },
    fourWayTest: {
      kicker: 'Rotary',
      title: 'The Four-Way Test',
      lead: 'Of the things we think, say or do',
      questions: [
        { text: 'Is it the TRUTH?',                                html: 'Is it the <b>TRUTH</b>?' },
        { text: 'Is it FAIR to all concerned?',                    html: 'Is it <b>FAIR</b> to all concerned?' },
        { text: 'Will it build GOODWILL and BETTER FRIENDSHIPS?',  html: 'Will it build <b>GOODWILL</b> and <b>BETTER FRIENDSHIPS</b>?' },
        { text: 'Will it be BENEFICIAL to all concerned?',         html: 'Will it be <b>BENEFICIAL</b> to all concerned?' }
      ]
    },

    /* 4 · district snapshot */
    snapshot: {
      title: 'District Snapshot',
      groups: [{ key: 'projects', label: 'Projects' }, { key: 'membership', label: 'Membership' }],
      stats: [
        { key: 'projects',      group: 'projects',   label: 'Projects',      href: PAGE.projects, image: photos.foodkits },
        { key: 'hours',         group: 'projects',   label: 'Man Hours',                               image: photos.beach },
        { key: 'amount',        group: 'projects',   label: 'Amount Spent',  prefix: '₹', suffix: ' Cr', decimals: 2, image: photos.medical },
        { key: 'beneficiaries', group: 'projects',   label: 'Beneficiaries',                           image: photos.warkaris },
        { key: 'clubs',         group: 'membership', label: 'Clubs',                                   image: photos.school },
        { key: 'members',       group: 'membership', label: 'Members',                                 image: photos.plantation }
      ],
      byYear: statsByYear
    },

    /* 5 · dignitaries */
    dignitaries: {
      title: 'Dignitaries of Rotary',
      label: 'Dignitary',
      readMore: 'Read More',
      order: ['president', 'dg'],
      links: { president: LIVE + '/dignitary?type=president', dg: LIVE + '/dignitary?type=dg' },
      byYear: dignitariesByYear
    },

    /* 6 · what's happening */
    calendar: {
      eyebrow: 'District Calendar',
      title: 'What’s Happening',
      subtext: 'Birthdays, anniversaries and events across District 3141 — date by date. Pick a day on the calendar to zoom in.',
      today: today,
      weekStartsOn: 1, // Monday
      weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      types: [
        { key: 'club',        label: 'Club Event',     group: 'Club Events' },
        { key: 'district',    label: 'District Event', group: 'District Events' },
        { key: 'birthday',    label: 'Birthday',       group: 'Birthdays' },
        { key: 'anniversary', label: 'Anniversary',    group: 'Anniversaries' }
      ],
      tabs: [
        { key: 'all',         label: 'All' },
        { key: 'club',        label: 'Club Events' },
        { key: 'district',    label: 'District Events' },
        { key: 'birthday',    label: 'Birthdays' },
        { key: 'anniversary', label: 'Anniversaries' }
      ],
      counts: counts,
      todayTag: 'Today',
      emptyDay: 'Nothing on the calendar for this day.',
      entries: entries
    },

    /* 7 · newsletters */
    press: {
      eyebrow: 'District Press',
      title: 'Newsletters',
      tagline: 'hot off the press!',
      subtext: 'The Governor’s Monthly Letter and the latest bulletins from clubs across District 3141.',
      gml: {
        title: 'Governor’s Monthly Letter',
        viewAll: { label: 'View all', href: PAGE.newsletters + '#governor' },
        empty: 'No Governor’s Monthly Letters in {year} yet.'
      },
      club: {
        title: 'Club Newsletters',
        href: PAGE.newsletters + '#club',
        empty: 'No club newsletters in {year} yet.',
        footer: 'Showing the {shown} most recent — {total} bulletins in {year} on the {link}.',
        footerLink: 'Newsletters page'
      },
      actions: { preview: 'Preview', download: 'Download' },
      placeholderPdf: PDF,
      byYear: pressByYear
    },

    /* 8 · footer */
    footer: {
      visitors: 10508,
      visitorsText: 'people have visited this website',
      rotaryLinks: { title: 'Rotary Links', items: [
        { label: 'Rotary.org', href: 'https://rotary.org' },
        { label: 'Rotary Zones 4, 5, 6, 7 & 8', href: 'https://rizones45678.org' },
        { label: 'Rotary Fellowship', href: 'https://www.rotary.org/en/our-programs/more-fellowships' },
        { label: 'Rotary Blog', href: 'https://blog.rotary.org' }
      ] },
      quickLinks: { title: 'Quick Links', items: [
        { label: 'District Committee', href: PAGE.committee },
        { label: 'Clubs Finder', href: PAGE.finder },
        { label: 'Club Projects', href: PAGE.projects },
        { label: 'District Calendar', href: PAGE.calendar },
        { label: 'Newsletters', href: PAGE.newsletters },
        { label: 'Contact Us', href: PAGE.contact }
      ] },
      social: { title: 'Social', items: [
        { key: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/RotaryDistrict3141?mibextid=ZbWKwL' }
      ] },
      tagline: { lead: 'Together, we', emphasis: 'Create Change' },
      // Live site footer lines (sample/shared/content.js snapshot of the live API).
      copyright: '© 2026 Thane Hills. All rights reserved.',
      poweredBy: { lead: 'Powered by', name: 'Roster On Wheels' }
    },


    /* ---------- inner pages ----------
       page.key is what <body data-page> carries. About copy is a PLACEHOLDER until the
       district sends its own text. Committee and project entries are DUMMY: every
       person's name is invented; club names are real clubs of the district. */
    pages: {
      list: [
        { key: 'about',       file: PAGE.about,       title: 'About Us',           lead: 'Who we are, what we do and how District 3141 serves.' },
        { key: 'committee',   file: PAGE.committee,   title: 'District Committee', lead: 'The people leading District 3141 this Rotary year.' },
        { key: 'finder',      file: PAGE.finder,      title: 'Club Finder',        lead: 'Find a Rotary club near you, by name, place or meeting day.' },
        { key: 'projects',    file: PAGE.projects,    title: 'Club Projects',      lead: 'Service projects by the clubs of District 3141, across Rotary’s avenues of service.' },
        { key: 'service',     file: PAGE.service,     title: 'Club Service',       lead: 'Projects that strengthen our clubs: fellowship, training and membership.' },
        { key: 'calendar',    file: PAGE.calendar,    title: 'District Calendar',  lead: 'Events, birthdays and anniversaries across the district, month by month.' },
        { key: 'newsletters', file: PAGE.newsletters, title: 'Newsletters',        lead: 'The Governor’s Monthly Letter and bulletins from clubs across the district.' },
        { key: 'contact',     file: PAGE.contact,     title: 'Contact Us',         lead: 'Write to the District Governor’s office, or find a club to join.' }
      ],
      home: 'Home',
      about: {
        placeholder: true,
        image: photos.vision,
        intro: 'Rotary District 3141 brings together 125 Rotary clubs and more than 7,000 members across Mumbai, Thane and Palghar. Our clubs are neighbours, professionals and community leaders who meet every week to plan service that lasts.',
        paragraphs: [
          'Each club chooses its own projects, from health camps and school sanitation to tree plantation and disaster relief. The district connects those clubs, so that good ideas travel, large projects find partners and every Rotarian has a place to learn and lead.',
          'Rotary International is a global network of 1.4 million members in more than 46,000 clubs. Together we work on the causes that matter most to our communities, guided by The Four-Way Test in everything we think, say and do.'
        ],
        focusTitle: 'Our areas of focus',
        focus: [
          { key: 'peace', title: 'Promoting peace', text: 'Training peacebuilders and supporting dialogue in communities affected by conflict.' },
          { key: 'disease', title: 'Fighting disease', text: 'Health camps, screenings and treatment that reach people who would otherwise go without.' },
          { key: 'water', title: 'Clean water and sanitation', text: 'Water filters, toilets and hygiene education in schools and villages.' },
          { key: 'mothers', title: 'Saving mothers and children', text: 'Neonatal care, nutrition and support for mothers before and after birth.' },
          { key: 'education', title: 'Supporting education', text: 'Classrooms, learning material, scholarships and teacher training.' },
          { key: 'economy', title: 'Growing local economies', text: 'Skills, livelihoods and small business support for families.' },
          { key: 'environment', title: 'Protecting the environment', text: 'Plantation drives, beach clean-ups and waste reduction.' }
        ],
        cta: { label: 'Find a club near you', href: PAGE.finder }
      },
      committee: {
        searchLabel: 'Search by name, role or club',
        empty: 'No committee member matches your search.',
        groups: [
          { title: 'Executive Committee', members: [
            ['Rajan Dua', 'District Governor', ''],
            ['Anjali Deshmukh', 'District Governor Elect', 'Bombay Bandra'],
            ['Vikram Rao', 'District Governor Nominee', 'Bombay Airport'],
            ['Meera Kulkarni', 'Immediate Past District Governor', 'Bombay'],
            ['Sanjay Mehta', 'District Secretary', 'Boisar-Tarapur'],
            ['Kavita Iyer', 'District Treasurer', 'Bombay Bandra'],
            ['Rohan Shah', 'District Joint Secretary', 'Vasai'],
            ['Nisha Kapoor', 'District Joint Secretary', 'Virar']
          ] },
          { title: 'Club Service', members: [
            ['Arjun Nair', 'Director, Club Service', 'Bombay'],
            ['Pooja Bhatt', 'Chair, Club Administration', 'Wada'],
            ['Farhan Qureshi', 'Chair, Fellowship', 'Umroli'],
            ['Leena Joshi', 'Chair, Club Training', 'Upper Kandivali']
          ] },
          { title: 'Community Service', members: [
            ['Deepak Pillai', 'Director, Community Service', 'Bombay Pier'],
            ['Sunita Rane', 'Chair, Health Camps', 'Vasai'],
            ['Imran Sheikh', 'Chair, Water and Sanitation', 'Boisar-Tarapur'],
            ['Asha Menon', 'Chair, Environment', 'SkyCity Borivali'],
            ['Gaurav Patil', 'Chair, Disaster Relief', 'Virar']
          ] },
          { title: 'Vocational Service', members: [
            ['Ritu Agarwal', 'Director, Vocational Service', 'Bombay Airport'],
            ['Manish Gupta', 'Chair, Skill Development', 'Wada'],
            ['Shalini Dsouza', 'Chair, Vocational Awards', 'Bombay Bandra']
          ] },
          { title: 'International Service', members: [
            ['Karan Malhotra', 'Director, International Service', 'Bombay'],
            ['Neha Sawant', 'Chair, Global Grants', 'Upper Kandivali'],
            ['Tariq Hussain', 'Chair, Youth Exchange', 'Umroli']
          ] },
          { title: 'New Generation Service', members: [
            ['Priya Venkatesh', 'Director, New Generation Service', 'SkyCity Borivali'],
            ['Aditya Kamat', 'District Rotaract Representative', 'Vasai'],
            ['Sneha Gokhale', 'Chair, Interact', 'Virar'],
            ['Rahul Bhosale', 'Chair, RYLA', 'Boisar-Tarapur']
          ] },
          { title: 'The Rotary Foundation', members: [
            ['Harish Chandra', 'District Rotary Foundation Chair', 'Bombay Pier'],
            ['Madhuri Jain', 'Chair, Annual Fund', 'Bombay Airport'],
            ['Suresh Naik', 'Chair, Polio Plus', 'Wada']
          ] },
          { title: 'Membership and Public Image', members: [
            ['Anita Fernandes', 'Chair, Membership', 'Bombay Bandra'],
            ['Vivek Chauhan', 'Chair, Public Image', 'Bombay'],
            ['Rekha Pandit', 'Chair, Digital Media', 'Upper Kandivali']
          ] }
        ].map(function (g) { return { title: g.title, members: g.members.map(function (m) { return { name: m[0], role: m[1], club: m[2] }; }) }; })
      },
      finder: {
        searchLabel: 'Search by club name or meeting place',
        dayLabel: 'Meeting day',
        anyDay: 'Any day',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        empty: 'No club matches your search. Try another name or day.',
        more: 'Show more clubs',
        pageSize: 12,
        visit: 'View club'
      },
      projects: {
        searchLabel: 'Search by project or club',
        allLabel: 'All avenues',
        empty: 'No project matches your search.',
        more: 'Show more projects',
        pageSize: 9,
        avenues: [
          { key: 'club',          label: 'Club Service' },
          { key: 'community',     label: 'Community Service' },
          { key: 'vocational',    label: 'Vocational Service' },
          { key: 'international', label: 'International Service' },
          { key: 'youth',         label: 'New Generation Service' },
          { key: 'image',         label: 'Public Image' }
        ],
        statLabels: { projects: 'Projects', beneficiaries: 'Beneficiaries', amount: 'Amount spent', hours: 'Man hours' },
        list: [
          ['Beach clean-up at Juhu', 'Bombay Airport', 'community', '2026-10-25', 'beach', 1800, 1.2, 640, 'Volunteers cleared plastic and waste from two kilometres of shoreline.'],
          ['Dignity packs for girls', 'Bombay Bandra', 'community', '2026-10-18', 'dignity', 1200, 3.6, 220, 'Menstrual hygiene kits and a health talk for girls in municipal schools.'],
          ['Vision centre opening', 'Upper Kandivali', 'community', '2026-10-11', 'vision', 5200, 18.5, 410, 'A permanent eye clinic with screening for the neighbourhood.'],
          ['English speaking course', 'Bombay', 'vocational', '2026-10-04', 'classroom', 160, 2.4, 380, 'A twelve-week spoken English course for schoolgirls.'],
          ['Medical equipment for the civic hospital', 'Bombay Pier', 'international', '2026-09-27', 'medical', 9000, 42.0, 120, 'Dialysis and monitoring equipment funded through a global grant.'],
          ['Food kits for families', 'Vasai', 'community', '2026-09-20', 'foodkits', 650, 4.1, 300, 'Monthly ration kits for families of daily-wage workers.'],
          ['Tree plantation drive', 'SkyCity Borivali', 'community', '2026-09-13', 'plantation', 3000, 1.8, 520, 'Two thousand saplings planted with residents and students.'],
          ['Mid-day meals for schools', 'Wada', 'youth', '2026-09-06', 'meals', 900, 5.5, 260, 'Nutritious meals for children in four village schools.'],
          ['Goodwill school opening', 'Boisar-Tarapur', 'youth', '2026-08-30', 'school', 640, 26.0, 900, 'A new school building with classrooms, toilets and a library.'],
          ['Flood relief for Dahanu', 'Virar', 'international', '2026-08-23', 'relief', 2400, 7.8, 700, 'Supplies and temporary shelter for families after the floods.'],
          ['Notebooks for students', 'Umroli', 'youth', '2026-08-16', 'notebooks', 1500, 1.1, 140, 'Notebooks and school kits for the new academic year.'],
          ['Food for Warkari pilgrims', 'Bombay', 'community', '2026-08-09', 'warkaris', 8000, 2.9, 480, 'Meals and water for pilgrims on the way to Pandharpur.'],
          ['New member orientation', 'Bombay Bandra', 'club', '2026-08-02', 'coreTeam', 85, 0.4, 160, 'A half-day welcome and training for members who joined this year.'],
          ['Club leadership training', 'Bombay Airport', 'club', '2026-07-26', 'dgAddress', 140, 0.6, 210, 'Training for club presidents, secretaries and directors.'],
          ['Fellowship evening', 'Vasai', 'club', '2026-07-19', 'school', 120, 0.3, 90, 'An evening of fellowship with families of members.'],
          ['Membership drive', 'Virar', 'club', '2026-07-12', 'plantation', 60, 0.2, 75, 'Open house to introduce Rotary to professionals in the area.'],
          ['Vocational excellence awards', 'Bombay Pier', 'vocational', '2026-07-05', 'medical', 40, 0.8, 70, 'Awards for nurses, teachers and workers who serve with distinction.'],
          ['Rotary week on social media', 'SkyCity Borivali', 'image', '2026-07-01', 'beach', 25000, 0.5, 60, 'A week of stories about club projects across the district.']
        ].map(function (p, i) {
          return { id: i + 1, title: p[0], club: p[1], avenue: p[2], date: p[3], photo: photos[p[4]], beneficiaries: p[5], amount: p[6], hours: p[7], summary: p[8] };
        })
      },
      calendar: { emptyMonth: 'Nothing on the calendar this month yet.', monthLabel: 'Month' },
      newsletters: { yearLabel: 'Rotary year', governor: 'Governor’s Monthly Letter', club: 'Club Newsletters', searchLabel: 'Search bulletins by title or club' },
      contact: {
        title: 'Write to us',
        office: 'District Governor’s office',
        hours: 'We reply to every message within two working days.',
        formNote: 'This form is a design sample and does not send messages yet.',
        fields: { name: 'Your name', email: 'Email', phone: 'Phone', club: 'Your club (if any)', message: 'Message', send: 'Send message' },
        sent: 'Thank you. Your message is ready to be sent once the form is connected.',
        join: { title: 'Join Rotary', text: 'Meet people who share your wish to serve. Tell us a little about yourself and a club near you will get in touch.' },
        finder: { title: 'Find a club', text: 'There are 125 clubs in District 3141. Search by name, place or meeting day.' }
      },
      back: 'Back to Home',
      breadcrumb: 'Breadcrumb'
    },

    /* search data (Atelier's ⌘K palette): the district's 125 clubs, live */
    clubs: {
      href: LIVE + '/club?id=',
      list: [
        {"id":33547,"name":"Addiction Prevention 3141","day":"Wednesday","place":"Regular Meeting"},
        {"id":123,"name":"Boisar-Tarapur","day":"Tuesday","place":"Rotary Community Centre, 04, C Wing, Caster, Thakur Galaxy, Yashwant Shrushti"},
        {"id":18,"name":"Bombay","day":"Tuesday","place":"Taj Mahal Hotel, Apollo Bunder"},
        {"id":2563,"name":"Bombay Airport","day":"Monday","place":"Expanding Rotary's Reach through PEACE EDUCATION, Juhu Tara Club, Santacruz, Mumbai"},
        {"id":14,"name":"Bombay Bandra","day":"Thursday","place":"Otters Club, Sangeet Samrat Naushad Ali Marg, Near Joggers Park, Bandra west"},
        {"id":15,"name":"Bombay Bay View","day":"Friday","place":"Bellisima Banquets, 534,B.C.M.A Building, Hughes Road, Opera House,Mumbai"},
        {"id":11,"name":"Bombay Central","day":"Friday","place":"Hotel Trident, Hotel Trident, Nariman Point"},
        {"id":26,"name":"Bombay Chembur West","day":"Tuesday","place":"Rd. No. 16 Chembur"},
        {"id":34782,"name":"Bombay Cosmopolis","day":"Thursday","place":"REGULAR CLUB MEETINGS, MARINE DRIVE, Churchgate"},
        {"id":13,"name":"Bombay East","day":"Wednesday","place":"Regency Restaurant & Bar, Near Flyover Bridge, Andheri East"},
        {"id":19,"name":"Bombay Film City","day":"Friday","place":"Aura, Aura,Sahar plaza , nearjb nagar metro, Andheri East"},
        {"id":407,"name":"Bombay Hanging Garden","day":"Wednesday","place":"Orient Club, Gamdevi, Chowpatty, Sukh Sagar, near Royal Opera House"},
        {"id":21,"name":"Bombay Harbour","day":"Thursday","place":"Indian Merchant Chambers, Churchgate"},
        {"id":33723,"name":"Bombay Harbour View","day":"Wednesday","place":"Ashok Gardens, Tokershi Jivraj Road, Sewri"},
        {"id":23,"name":"Bombay Hills South","day":"Saturday","place":"Taj Mahal Palace, Opp. Gateway of India, Apollo Bunder, Colaba"},
        {"id":2,"name":"Bombay Juhu Beach","day":"Tuesday","place":"Hotel Emerald, Juhu Tara Rd."},
        {"id":28,"name":"Bombay Kandivli","day":"Sunday","place":"Evershine Millennium Club, Thakur Village, Kandivli East"},
        {"id":30989,"name":"Bombay Mahakali Heights","day":"Thursday","place":"Sher-E-Punjab, Gymkhana Hall, 368/72, Club Premises, Shere-E-Punjab Society, Mahakali Caves Rd., Andheri E."},
        {"id":32,"name":"Bombay Metropolitan","day":"Tuesday","place":"Hotel Samrat, Churchgate"},
        {"id":35,"name":"Bombay Mid-City","day":"Wednesday","place":"St. Regis, Mumbai, next to High Street Phoenix, 462, Senapati Bapat Marg, Lower Parel, Mumbai, Maharashtra"},
        {"id":37,"name":"Bombay Mid-Town","day":"Wednesday","place":"Lunch Weekly Meetings with Fellwoship, Apollo Bunder, Colaba"},
        {"id":40,"name":"Bombay Mulund Valley","day":"Monday","place":"Sitara Hotel, S.N. Rd. Nr. MCC College"},
        {"id":42,"name":"Bombay North","day":"Saturday","place":"The Willingdon Sports Club, Arya Nagar, Tulsiwadi, Tardeo"},
        {"id":44,"name":"Bombay North West-Malad","day":"Friday","place":"L & M Rotary Service Ctr., S. V. Rd. Malad W., Next to Indian Oil PP."},
        {"id":45,"name":"Bombay Peninsula","day":"Thursday","place":"Regular Meeting, PD Hall, Wankhede Stadium, Marine Drive"},
        {"id":47,"name":"Bombay Pier","day":"Thursday","place":"Bellissima Banquets, 534, BCMA, SVP Road, Opera House, Opp Sukh Sagar"},
        {"id":49,"name":"Bombay Powai","day":"Monday","place":"Forest Club House, Cliff Ave., Hiranandani Gardens, Powai"},
        {"id":51,"name":"Bombay Queen City","day":"Thursday","place":"Rotary Club of Bombay Queen City, Taj Mahal Hotel, opp Gateway of India ."},
        {"id":55,"name":"Bombay Sea Face","day":"Saturday","place":"Indian Merchant's Chambers (IMC), Babubhai Chinnai Hall, 2/Fl., Opp. Churchgate Stn."},
        {"id":57,"name":"Bombay Seacoast","day":"Thursday","place":"The Club Andheri, D. N. Nagar Andheri W."},
        {"id":58,"name":"Bombay Up-Town","day":"Monday","place":"Maharashi Karve Udyan , Behind Bharat Motors, Station Rd., Wadala West"},
        {"id":60,"name":"Bombay West","day":"Wednesday","place":"Sheila Raheja Hall, Rotary Service Centre, 2nd Floor, Rotary Chowk, Junction of Juhu Tara Rd & Juhu Koliwada, Santacruz West"},
        {"id":61,"name":"Bombay Worli","day":"Thursday","place":"Regular Meetings of Rotary Club of Bombay Worli, 9, Dr Annie Besant Rd, Siddharth Nagar, Worli"},
        {"id":33710,"name":"Borivali Wonders","day":"Friday","place":"Regular meeting, Bhagvati Restaurant Satya Nagar Borivali west"},
        {"id":63,"name":"Borivli","day":"Friday","place":"Garden Grove Banquet Hall, R. M. Bhattad Road, Opp. Kora Kendra Ground, Borivali (West)"},
        {"id":31237,"name":"Chandivali Mumbai","day":"Thursday","place":"Club meeting"},
        {"id":66,"name":"Chembur (Mumbai)","day":"Monday","place":"Rotary Centre, Chembur ( E), Next to Chembur Gymkhana, 16th Road, Chembur ( E)"},
        {"id":68,"name":"Dahanu","day":"Saturday","place":"Rotary Sabhagruha, Annapurna Building, 2nd Floor Above Hotel Chandrika, Tal -Dahanu, Dist. Palghar"},
        {"id":33323,"name":"Dahanu Sea Coast","day":"Saturday","place":"Behind Hotel Chandrika, Dahanu Rd. (W)"},
        {"id":69,"name":"Deonar","day":"Thursday","place":"Bombay Presidency Golf Club, Dr. Choitram Gidwani Rd, Chembur Col."},
        {"id":33542,"name":"Garden City Mumbai","day":"Sunday","place":"Goregaon East"},
        {"id":34742,"name":"Ghodbunder Mumbai","day":"Thursday","place":"Dahisar East"},
        {"id":3112,"name":"JVPD Mumbai","day":"Friday","place":"The Club, 197, D N Nagar, Andheri West"},
        {"id":95,"name":"Lokhandwala Kandivali","day":"Sunday","place":"Fast Food Banquet Hall - \" Celebrations \" , Centrium Mall , Lokhandwala Township , Kandivali East , Mumbai 400101, Lokhandwala Township, Kandivali (East)"},
        {"id":33324,"name":"Manor Highway","day":"Monday","place":"Sanjari Complex, Manor Palghar Rd., Near Astha Hosp. Manor"},
        {"id":34147,"name":"Marine Drive Mumbai","day":"Saturday","place":"20, Soona Mahal, 4th floor, 143, Marine Drive, Next to Sea Green Hotel"},
        {"id":99,"name":"Mira Road","day":"Saturday","place":"BOD, Regular, Regular, Fellowship, Club Assembly, OCV, AGM, C-003/004, Samruddhi Building, Poonam Gardens, Behind Happy Home Building, Mira Road East"},
        {"id":101,"name":"Mulund","day":"Tuesday","place":"Rotary Club of Mulund Meeting, Marathon Max Building, Mulund Goregaon Link Road, Mulund Werst"},
        {"id":102,"name":"Mulund Hill View","day":"Sunday","place":"Aastha Heaalthcare, Conference Rm., Opp Chedda Petrol Pump, LBS Marg, Mulund Colony,Mulund West"},
        {"id":104,"name":"Mulund Hills","day":"Friday","place":"Hotel Sitara, Dhiraj Annexe Bldg. Sarojini Nadiu Rd., Nr. MCC College, Mulund W."},
        {"id":35479,"name":"Mulund Oberoi Towers","day":"Thurs","place":"Oberoi Eternia Cafeteria, LBS Marg, Mulund West"},
        {"id":31492,"name":"Mumbai 101","day":"Sunday","place":"Rotary Club of Mumbai 101 Meetings, 101, Dimple Arcade, Thakur Complex, Kandivali East"},
        {"id":34778,"name":"Mumbai 25","day":"Friday","place":"Technocrat Society, Prabhadevi"},
        {"id":107,"name":"Mumbai Andheri","day":"Friday","place":"Hotel Suba Galaxy, Nr. Andheri Flyover, Andheri (East)"},
        {"id":34139,"name":"Mumbai Bandra Kurla Complex","day":"Wednesday","place":"MIG Cricket Club, Bandra E."},
        {"id":113,"name":"Mumbai Borivali East","day":"Thursday","place":"Rotary Medical Centre, Behind Sai Baba Temple, Ashok Van"},
        {"id":33325,"name":"Mumbai Bravehearts","day":"Monday","place":"Rotary Club of Mumbai Bravehearts, Near JIO Convention Centre, Bandra East"},
        {"id":34450,"name":"Mumbai City","day":"Friday","place":"Ground Fl., Swami Vivekananda Rd., Malad, Chincholi Phatak"},
        {"id":34140,"name":"Mumbai Coastline","day":"Tuesday","place":"Juhu Gym (JVPG Club), Plot No. U-13, N. S. Road No. 13, Opp. Juhu Bus Depot, JVPD Scheme, Juhu"},
        {"id":35480,"name":"Mumbai Crown","day":"Friday","place":"Banquet, Rustomji Crown Prabhadevi"},
        {"id":110,"name":"Mumbai Dahisar","day":"Wednesday","place":"CLUB MEETING, VIDYA MANDIR HIGH SCHOOL , C.S ROAD, OPP. DSF GROUND, DAHISAR EAST"},
        {"id":31132,"name":"Mumbai Divas","day":"Tuesday","place":"Regular, Senapati Bapat Marg, Lower Parel"},
        {"id":108,"name":"Mumbai Down Town Sea Land","day":"Wednesday","place":"1st,3rd &4th Wed.-Bombay Presidency Radio Club., Arthur Bunder Road, Near Taj Mahal Hotel, Colaba"},
        {"id":31326,"name":"Mumbai Elegant","day":"Thursday","place":"The St. Regis Mumbai, The St. Regis, 462 Sena Pati Bapat Marg, Lower Parel"},
        {"id":34810,"name":"Mumbai Elegant Plus","day":"Saturday","place":"Lala Lajpatrai Marg, Royal Western India Turf Club, Mahalakshmi"},
        {"id":33326,"name":"Mumbai Elite","day":"Friday","place":"ROTARY CLUB OF MUMBAI ELITE, B/401, Daffodil, Hiranandani Gardens, Powai, Powai"},
        {"id":31327,"name":"Mumbai GenX","day":"Friday","place":"Juhu Vile Parle Gymkhana, Opp: Juhu Church, Juhu"},
        {"id":106,"name":"Mumbai Ghatkopar","day":"Tuesday","place":"Smt. Pramilaben Dand Rotary Service Ctr., Opp. R. N. Gandhi School, Vidhya Vihar (E)"},
        {"id":31493,"name":"Mumbai Ghatkopar West","day":"Wednesday","place":"1705, Boulevard 1 The Address, LBS Rd. Ghatkopar West"},
        {"id":35481,"name":"Mumbai Glocal","day":"Friday","place":"Shop No. 14, Eklavya CHS, N L Complex, Anand Nagar"},
        {"id":105,"name":"Mumbai Goregaon West","day":"Friday","place":"RCM Goregaon West Meeting, Yashodham Shopping Complex, Aba Karmarkar Marg, Off Film City Road, Goregaon East"},
        {"id":103,"name":"Mumbai Green City","day":"Friday","place":"The Club, Opp. Police Station. D. N. Nagar, Andheri [W], Contact: 9820296456"},
        {"id":35189,"name":"Mumbai Greens","day":"Sunday","place":"MGLR, next to Fortis Hospital, Mulund West"},
        {"id":33328,"name":"Mumbai Greens","day":"Friday","place":"Bhandup WSrishti Square, Bhandup WFellowship"},
        {"id":34271,"name":"Mumbai Horizons","day":"Friday","place":"Shakti Nagar, D N Nagar, Andheri West"},
        {"id":31289,"name":"Mumbai Iconic","day":"Wednesday","place":"Hotel Regal Enclave, 4th Rd., Nr. Khar Market"},
        {"id":33329,"name":"Mumbai Inspire","day":"Friday","place":"Andheri West, Mumbai"},
        {"id":34885,"name":"Mumbai Island City","day":"Thursday","place":"Island City Center, G. D. Ambedkar Marg, Dadar (East)"},
        {"id":31494,"name":"Mumbai Jewels","day":"Friday","place":"The Club, Khanna Hotels P. Ltd., 197 D N Nagar, Andheri (West)"},
        {"id":100,"name":"Mumbai Juhu","day":"Friday","place":"Regular Club Meeting of All Members, D.N. Nagar, New Link Road, Andheri (West), Mumbai"},
        {"id":34435,"name":"Mumbai Juhu Elite","day":"Friday","place":"Mumbai"},
        {"id":31495,"name":"Mumbai Kalakar","day":"Thursday","place":"As per members Residence, Mumbai, Powai Location and others"},
        {"id":98,"name":"Mumbai Kandivli West","day":"Thursday","place":"Thathia Bhatia Hall, Opp Namah Hospital, Kandivli West, Mumbai"},
        {"id":96,"name":"Mumbai Khar","day":"Friday","place":"OTTERS CLUB BANDRA WEST, Carter road Bandra West"},
        {"id":94,"name":"Mumbai Lakers","day":"Tuesday","place":"Just Kiddin International School, Behind Hiranandani Hospital, Hiranandani Gardens, Powai"},
        {"id":31485,"name":"Mumbai Lower Parel","day":"Thursday","place":"B Wing Party Hall, Phoenix Towers, Senapati Bapat Marg, Lower Parel West"},
        {"id":92,"name":"Mumbai Mahim","day":"Saturday","place":"AOTS Hall, India Printing House, 3rd floor, 42, G. D. Ambekar Marg, Wadala, Mumbai 400031"},
        {"id":34252,"name":"Mumbai Makabo","day":"Sunday","place":"Regular Club Meeting, Gokul nagari 2, Thakur Village, Off Western Express Highway, Nr Sai Star, Kandivali East"},
        {"id":90,"name":"Mumbai Malabar Hill","day":"Friday","place":"SPEAKER MEETING, SUKH SAGAR CHOWPATTY, MUMBAI 400006"},
        {"id":31496,"name":"Mumbai Marvels","day":"Saturday","place":"Rotary Club of Mumbai Marvels, OPP. D-MART,BANGUR NAGAR METRO STATION,LINK ROAD, GOREGAON WEST. Mumbai 400067."},
        {"id":88,"name":"Mumbai Mid-West","day":"Friday","place":"AJANTA HOTEL, 8, Hari Ravendrakar Road (Juhu Tara Road), Near Hotel Sea Princess, Santacruz West"},
        {"id":86,"name":"Mumbai Mulund East","day":"Thursday","place":"Rotary Community Centre, Rotary Garden, Next to RR Education School, Mhada, Mulund East"},
        {"id":84,"name":"Mumbai Mulund South","day":"Wednesday","place":"Corner of VL Rd. & Ganesh Gavde Rd., Mulund W."},
        {"id":82,"name":"Mumbai Nariman Point","day":"Wednesday","place":"Royal Bombay Yacht Club, Apollo Bunder"},
        {"id":34261,"name":"Mumbai National Park","day":"Friday","place":"Bi-Monthly Club Meeting, Plot No 88, Ashirwad, Ground Floor, Shree Krishna Nagar, Borivali East"},
        {"id":34727,"name":"Mumbai Neo","day":"Thursday","place":"Club meeting, D N Nagar, Andheri (W)"},
        {"id":77,"name":"Mumbai North End","day":"Wednesday","place":"The Club, Andheri W."},
        {"id":75,"name":"Mumbai North Island","day":"Friday","place":"Juhu Club Millennium, Near Cooper Hospital, Gulmohar Road, Juhu, Vile Parle (W)"},
        {"id":33976,"name":"Mumbai Nova","day":"Sunday","place":"Rotary Club Of Mumbai Nova, Celebration Sports Club Mumbai, Lokhandwala Complex, Andheri West"},
        {"id":73,"name":"Mumbai Parleshwar","day":"Friday","place":"RCMP Friday Meeting @ Regency Banquet Hall, Regency Restuarant, Vasant Building, Professor N. S. Phadke Road, Sai Wadi, Andheri (East)"},
        {"id":34839,"name":"Mumbai Pioneers","day":"Sunday","place":"Lala Lajpatrai Marg, Near Race Cource, Mahalaxmi"},
        {"id":31137,"name":"Mumbai Rising Stars","day":"Friday","place":"The Club, 197 D.N. Nagar, Andheri West"},
        {"id":31047,"name":"Mumbai Royales","day":"Friday","place":"Nariman Bhawan, Nariman Point"},
        {"id":67,"name":"Mumbai Salt City","day":"Friday","place":"Mumbai Salt City Meeting, First Floor, No 1, Bishen Udyog Premises, Jain Mandir Road, Opposite Raja Industrial Estate, Mulund (West)"},
        {"id":34426,"name":"Mumbai Sher-E-Punjab","day":"Thursday","place":"Regular In person, Sher E Punjab Health Club, Andheri East"},
        {"id":62,"name":"Mumbai Sion","day":"Thursday","place":"Rotary Sion Meeting, Dadar T. T., Nr. Swami Narayan Mandir, Mumbai"},
        {"id":33332,"name":"Mumbai Sobo","day":"Thursday","place":"Club Meeting, Pandurang Budhkar Marg, Worli, Opp. Bombay Dyeing"},
        {"id":59,"name":"Mumbai South Cuffe Parade","day":"Thursday","place":"1st Floor, Court Chambers, 35, Vitthaldas Thackersey Marg., New Marine Lines, Marine Lines"},
        {"id":37225,"name":"Mumbai United Vision","day":"Monday","place":"Jade-2, Chembur Gym Khana, Chembur"},
        {"id":56,"name":"Mumbai Versova","day":"Friday","place":"The Club, D.N. Nagar, Upper Juhu, Andheri (West)"},
        {"id":31560,"name":"Mumbai Wadala East","day":"Wednesday","place":"General Club Meetings, Bhakti Park, Wadala East"},
        {"id":54,"name":"Mumbai West Coast","day":"Friday","place":"Club Meeting, Siddhartha Nagar, Goregaon West"},
        {"id":31561,"name":"Mumbai West End","day":"Friday","place":"The Club, 197, Shakti Nagar, Shanti Nagar, D.N. Nagar, Andheri (West)"},
        {"id":2965,"name":"Mumbai Western Elite","day":"Sunday","place":"The Westin Mumbai Garden City, International Business Park, Oberoi Garden City, Goregaon East"},
        {"id":34981,"name":"Mumbai World Towers","day":"Monday","place":"Club Meeting, World Towers - Grand Ball Room at P6, Lower Parel, off Senapati Bapat Marg"},
        {"id":111,"name":"Mumbai-Bhandup","day":"Thursday","place":"Regular Club Meeting, Guruprasad Banquet Hall , Marathon Maxima , Mulund west, Mumbai 400078"},
        {"id":34496,"name":"Organ Donation International","day":"Sunday","place":"Mumbai"},
        {"id":41,"name":"Palghar","day":"Thursday","place":"Vitthal Mandir Hall, Mahim Road"},
        {"id":79,"name":"Queen's Necklace","day":"Monday","place":"Bellissimo Lounge, Opera House, Near Sukh Sagar"},
        {"id":34840,"name":"SkyCity Borivali","day":"Wednesday","place":"Sky City Conference Hall or The Party No 1 Hall, Sky City, Borivali East"},
        {"id":34806,"name":"Umroli","day":"Friday","place":"Grampanchayat Hall"},
        {"id":33285,"name":"Upper Kandivali","day":"Sunday","place":"Bohra Colony, Dahanukar Wadi, Kandivali West"},
        {"id":34171,"name":"Vasai","day":"Friday","place":"Labtop House, Plot No. 59, Valiv Phata , Sativili Road, Vasai East"},
        {"id":31568,"name":"Virar","day":"Saturday","place":"Club meeting, SHOP NO 8, Bhau Nagar,Near New Viva college, Virar West"},
        {"id":31497,"name":"Wada","day":"Saturday","place":"CLUB MEETING, MANGALRAJ JEWELLERS, SHIVAJI NAGAR, AT POST TAL WADA DIST PALGHAR"}
      ]
    },

    /* helpers */
    fmt: {
      num: num,                                                         // num(642815) → "6,42,815"
      stat: function (def, value) {                                     // stat(amountDef, 54.59) → "₹54.59 Cr"
        return (def.prefix || '') + num(value, def.decimals) + (def.suffix || '');
      },
      fill: function (template, values) {                               // fill('… {year} …', {year:'2026-27'})
        return template.replace(/\{(\w+)\}/g, function (m, k) { return k in values ? values[k] : m; });
      }
    }
  };
})();
