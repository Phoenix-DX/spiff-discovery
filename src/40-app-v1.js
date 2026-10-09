const PAW='<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><ellipse cx="8" cy="12" rx="2.5" ry="3.3"/><ellipse cx="14.6" cy="8.2" rx="2.8" ry="3.7"/><ellipse cx="21.4" cy="8.2" rx="2.8" ry="3.7"/><ellipse cx="28" cy="12" rx="2.5" ry="3.3"/><path d="M16 15c-4.7 0-8.2 3.2-8.2 6.7 0 2.8 2.4 4.1 4.7 4.1 1.7 0 2.5-.7 3.5-.7s1.8.7 3.5.7c2.3 0 4.7-1.3 4.7-4.1C24.2 18.2 20.7 15 16 15z"/></svg>';
const ICON={
  chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>',
  people:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.7-5 6-5s6 2 6 5M16 5a3 3 0 010 6"/></svg>',
  warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l9 16H3zM12 10v4M12 17h.01"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  route:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h6a3 3 0 003-3V8M6 17V8a3 3 0 013-3h5"/></svg>',
  sms:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a8 8 0 01-11.6 7.1L3 21l1.9-6.4A8 8 0 1121 12z"/></svg>',
  mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  push:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/></svg>',
  wallet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 15h2"/></svg>',
  upload:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15V3M8 7l4-4 4 4M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4"/></svg>',
  doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9zM14 3v6h6"/></svg>',
  brief:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/></svg>',
  flag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21V4h13l-2 4 2 4H4"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4M12 3l7 3v6a8 8 0 01-7 8 8 8 0 01-7-8V6z"/></svg>',
  flow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M9 6h6a3 3 0 013 3v6"/></svg>',
  bolt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 13a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 01-4 0v-.2A1.6 1.6 0 006 19.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 003 12.6a2 2 0 010-4h.2A1.6 1.6 0 004.7 6l-.1-.1a2 2 0 112.8-2.8l.1.1A1.6 1.6 0 0010 3.6V3a2 2 0 014 0v.2a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 001.1 2.7H21a2 2 0 010 4h-.2a1.6 1.6 0 00-1.4 1z"/></svg>',
  grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/></svg>',
  bar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>',
  pie:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v9l7 4A9 9 0 1012 3z"/></svg>',
  line:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l6-7 4 3 8-9M21 4v6h-6"/></svg>',
  scatter:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><circle cx="7" cy="16" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="10" r="1.6" fill="currentColor" stroke="none"/><circle cx="16" cy="14" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="6" r="1.6" fill="currentColor" stroke="none"/></svg>',
  map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>',
  menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>'
};
const ANSWERS={
  ldm:{q:"How many LDM meetings ran in my subdivisions last quarter?",
    lede:"Your subdivisions held <b>142 LDM meetings</b> last quarter — up 11% on the prior quarter. Lorraine and Bethel led on volume; <b>Oakridge</b> is the one to watch, down 18% with attendance slipping below 70%.",
    metrics:[{v:"142",l:"Meetings",d:"+11% vs Q2",c:"up"},{v:"6",l:"Subdivisions"},{v:"78%",l:"Avg attendance",d:"−3 pts",c:"down"}],
    chart:{title:"LDM meetings by subdivision · last quarter",max:36,data:[["Lorraine",34],["Bethel",31],["Grace",24],["Highfield",22],["Riverside",19],["Oakridge",12,true]]},
    table:{cols:["Subdivision","Meetings","Members","Attendance","Δ QoQ"],rows:[["Lorraine","34","412","82%","+9%"],["Bethel","31","388","80%","+14%"],["Grace","24","301","77%","+4%"],["Highfield","22","276","75%","+6%"],["Riverside","19","240","74%","−2%"],["Oakridge","12","198","68%","−18%"]]},
    scope:"12 of 312 localities",asof:null,sources:[["Directory","member & subdivision"],["Connect","meeting records"]],join:"joined on member id",metric:"ldm_meeting (governed)",
    followups:[["Why did Oakridge drop 18%?","oakridge"],["Compare against the same quarter last year","ldm_yoy"],["Show attendance trend for Oakridge by month","oak_trend"],["Show meeting counts per province","assemble_regions"]]},
  oakridge:{q:"Why did Oakridge drop 18%?",
    lede:"Oakridge's dip traces to <b>two causes</b>: two host families relocated in June, and a mid-quarter venue change hurt turnout. Attendance fell from 74% to 68%, and 2 of 8 localities have gone quiet.",
    metrics:[{v:"−18%",l:"Meetings QoQ",c:"down"},{v:"2",l:"Hosts relocated"},{v:"2",l:"Quiet localities",c:"down"}],
    table:{cols:["Locality","Last meeting","Status"],rows:[["Cedar Rise","12 Aug 2026","Active"],["Oak Hollow","09 Aug 2026","Active"],["Elmsdale","18 May 2026","Quiet"],["Marlow","27 May 2026","Quiet"]]},
    scope:"12 of 312 localities",asof:null,sources:[["Connect","meeting records"],["Directory","host & locality"]],join:"joined on locality id",metric:"ldm_meeting (governed)",
    followups:[["Show Oakridge attendance by month","oak_trend"],["Draft outreach for the quiet localities","stale"]]},
  ldm_yoy:{q:"Compare against the same quarter last year",
    lede:"Up <b>+23% year-on-year</b> — 142 meetings vs 115 in Q3 last year. Every subdivision grew except <b>Oakridge</b>, down 9% YoY.",
    metrics:[{v:"+23%",l:"YoY meetings",c:"up"},{v:"142",l:"This year"},{v:"115",l:"Last year"}],
    table:{cols:["Subdivision","This yr","Last yr","YoY"],rows:[["Lorraine","34","27","+26%"],["Bethel","31","24","+29%"],["Grace","24","20","+20%"],["Highfield","22","18","+22%"],["Riverside","19","15","+27%"],["Oakridge","12","13","−9%"]]},
    scope:"12 of 312 localities",asof:null,sources:[["Connect","meeting records"]],join:"period over period",metric:"ldm_meeting (governed)",
    followups:[["Why is Oakridge behind?","oakridge"],["Show the current quarter breakdown","ldm"]]},
  oak_trend:{q:"Attendance trend for Oakridge by month",
    lede:"Oakridge attendance has <b>declined three months running</b> — 76% in June, 72% in July, 68% in August — now below the 70% threshold we watch.",
    metrics:[{v:"68%",l:"August",c:"down"},{v:"−8 pts",l:"Since June",c:"down"}],
    chart:{title:"Oakridge attendance % by month",max:80,data:[["Jun",76],["Jul",72],["Aug",68,true]]},
    scope:"12 of 312 localities",asof:null,sources:[["Connect","attendance"]],join:"by subdivision id",metric:"attendance_rate (governed)",
    followups:[["What changed in Oakridge?","oakridge"]]},
  assemble_regions:{q:"Show meeting counts per province",
    lede:"<b>930 meetings</b> ran nationally this quarter. <b>Gauteng</b> and the <b>Western Cape</b> carry the most volume; <b>Northern Cape</b> is the quietest province by some margin.",
    metrics:[{v:"930",l:"Meetings"},{v:"9",l:"Provinces"},{v:"238",l:"Top — Gauteng"}],
    chart:{title:"Meetings by province · this quarter",max:240,geo:"ZA",_type:"map",data:[["Gauteng",238],["Western Cape",176],["KwaZulu-Natal",154],["Eastern Cape",121],["Limpopo",98],["Mpumalanga",87],["North West",64],["Free State",59],["Northern Cape",33,true]]},
    table:{cols:["Province","Meetings","Share"],rows:[["Gauteng","238","26%"],["Western Cape","176","19%"],["KwaZulu-Natal","154","17%"],["Eastern Cape","121","13%"],["Limpopo","98","11%"],["Mpumalanga","87","9%"],["North West","64","7%"],["Free State","59","6%"],["Northern Cape","33","4%"]]},
    scope:"All provinces you're entitled to",asof:null,sources:[["Connect","meeting records"],["Directory","province mapping"]],join:"aggregated by province code",metric:"meeting (governed)",
    followups:[["Why is Northern Cape so quiet?","stale"],["Show the same breakdown for LDM meetings","ldm"]]},
  growth:{q:"Member growth by locality this year",
    lede:"Net membership grew <b>+3,240</b> across your localities this year — a <b>+4.2%</b> lift. Stellenbosch and Pretoria drove most of the gain; Polokwane is flat and worth a closer look.",
    metrics:[{v:"+3,240",l:"Net new members",d:"+4.2%",c:"up"},{v:"5",l:"Localities"},{v:"79,410",l:"Total members"}],
    chart:{title:"Net new members by locality · YTD 2026",max:1200,data:[["Stellenbosch",1080],["Pretoria",920],["Makhanda",640],["Rustenburg",560],["Polokwane",40,true]]},
    table:{cols:["Locality","Members","Net new","Growth","Localities"],rows:[["Stellenbosch","21,340","+1,080","+5.3%","46"],["Pretoria","18,910","+920","+5.1%","39"],["Makhanda","15,220","+640","+4.4%","33"],["Rustenburg","14,660","+560","+4.0%","31"],["Polokwane","9,280","+40","+0.4%","22"]]},
    scope:"12 of 312 localities",asof:null,sources:[["Directory","member records"]],join:"aggregated by locality id",metric:"net_member_growth (governed)",
    followups:[["What's holding Polokwane back?","northern"],["Break Stellenbosch down by locality","south_loc"],["Show the monthly trend","growth_trend"]]},
  northern:{q:"What's holding Polokwane back?",
    lede:"Polokwane's flat growth (+0.4%) is concentrated in <b>4 localities</b> with high attrition. New sign-ups held up, but exits nearly matched them.",
    metrics:[{v:"+0.4%",l:"Growth",c:"down"},{v:"+310",l:"New"},{v:"−270",l:"Exits",c:"down"}],
    table:{cols:["Locality","New","Exits","Net"],rows:[["Kingsford","64","−92","−28"],["Dunmore","70","−61","+9"],["Ashcombe","88","−54","+34"],["Fairview","88","−63","+25"]]},
    scope:"12 of 312 localities",asof:null,sources:[["Directory","member movements"]],join:"by locality id",metric:"net_member_growth (governed)",
    followups:[["Which localities are going quiet?","stale"],["Show the monthly trend","growth_trend"]]},
  south_loc:{q:"Break Stellenbosch down by locality",
    lede:"Stellenbosch's +1,080 net new members came mostly from <b>Ashcombe</b> and <b>Cedar Rise</b>; 41 of 46 localities grew.",
    metrics:[{v:"46",l:"Localities"},{v:"41",l:"Growing"}],
    chart:{title:"Top localities by net new members · Stellenbosch",max:180,data:[["Ashcombe",164],["Cedar Rise",148],["Grace Hill",121],["Riverbend",96],["Oak Hollow",74]]},
    scope:"12 of 312 localities",asof:null,sources:[["Directory","member records"]],join:"by locality id",metric:"net_member_growth (governed)",
    followups:[["Show the monthly trend","growth_trend"]]},
  growth_trend:{q:"Monthly member growth trend",
    lede:"Growth has been <b>steady all year</b>, averaging +405 a month, with a spike in March from the enrolment drive.",
    metrics:[{v:"+405",l:"Avg / month"},{v:"March",l:"Best month"}],
    chart:{title:"Net new members by month · 2026",max:700,data:[["Jan",380],["Feb",410],["Mar",640,true],["Apr",420],["May",395],["Jun",405],["Jul",300],["Aug",290]]},
    scope:"12 of 312 localities",asof:null,sources:[["Directory","member records"]],join:"aggregated by month",metric:"net_member_growth (governed)",
    followups:[["Break down by locality","growth"]]},
  stale:{q:"Which localities haven't held a meeting in 60 days?",
    lede:"<b>9 localities</b> in your localities have had no recorded meeting in over 60 days. Three are past 90 days — <b>Elmsdale</b>, <b>Kingsford</b> and <b>Marlow</b> — and should probably be flagged for follow-up.",
    metrics:[{v:"9",l:"Localities > 60 days"},{v:"3",l:"Past 90 days",c:"down"},{v:"612",l:"Members affected"}],
    table:{cols:["Locality","Locality","Subdivision","Last meeting","Days"],rows:[["Elmsdale","Stellenbosch","Grace","18 May 2026","100"],["Kingsford","Pretoria","Bethel","24 May 2026","94"],["Marlow","Makhanda","Highfield","27 May 2026","91"],["Ashcombe","Stellenbosch","Lorraine","09 Jun 2026","78"],["Dunmore","Rustenburg","Riverside","14 Jun 2026","73"],["Fairview","Pretoria","Grace","21 Jun 2026","66"]]},
    warnRows:[0,1,2],scope:"12 of 312 localities",asof:null,sources:[["Connect","meeting records"],["Directory","locality & subdivision"]],join:"joined on locality id",metric:"days_since_last_meeting (governed)",
    followups:[["Show member growth by locality","growth"],["Who hosts in these localities?","profile"]]},
  profile:{q:"John Steyn — profile and upcoming Assemble calendar",
    profile:{name:"John Steyn",init:"JS",locality:"Ashcombe",subdivision:"Lorraine",country:"South Africa",household:"Steyn (4)",role:"Subdivision host",member:"#40118"},
    lede:"<b>John Steyn</b> hosts in <b>Lorraine</b> subdivision (Stellenbosch). He has <b>3 upcoming</b> meetings in the next 30 days and hosted 6 in the last quarter.",
    calTable:{cols:["Date","Meeting","Subdivision","Role","Status"],rows:[["02 Sep 2026","Monthly LDM — Lorraine","Lorraine","Host","Confirmed"],["09 Sep 2026","Regional planning","Stellenbosch","Attendee","Confirmed"],["27 Sep 2026","LDM — Lorraine (last Fri)","Lorraine","Host","Tentative"]]},
    scope:"visible to you",asof:null,sources:[["Directory","member profile"],["Assemble","calendar"]],join:"joined on member id",metric:"—",
    followups:[["Trace his planned activities next month","steyn_journey"],["LDM meetings in Lorraine, last quarter","ldm"]]},
  orbit_travel:{q:"Orbit bookings by family — flights, cars and hotels this quarter",
    lede:"Across your localities, <b>218 trips</b> were booked through Orbit this quarter — <b>194 flights</b>, 156 car rentals and 421 hotel nights. The <b>Steyn</b> and <b>Mbeki</b> families travelled most, largely for divisional events.",
    metrics:[{v:"194",l:"Flights"},{v:"156",l:"Car rentals"},{v:"421",l:"Hotel nights"},{v:"88",l:"Families"}],
    chart:{title:"Flights booked · top families",max:14,data:[["Steyn",12],["Mbeki",11],["Okafor",9],["Ferreira",7],["Naidoo",6],["Botha",5]],scatter:{xl:"Flights",yl:"Hotel nights",data:[["Steyn",12,19],["Mbeki",11,22],["Okafor",9,15],["Ferreira",7,12],["Naidoo",6,9],["Botha",5,7]]}},
    table:{cols:["Family","Locality","Flights","Car rentals","Hotel nights","Trips"],rows:[["Steyn","Stellenbosch","12","8","19","7"],["Mbeki","Pretoria","11","9","22","7"],["Okafor","Makhanda","9","6","15","5"],["Ferreira","Stellenbosch","7","5","12","4"],["Naidoo","Rustenburg","6","4","9","4"],["Botha","Pretoria","5","3","7","3"]]},
    scope:"12 of 312 localities",asof:null,sources:[["Orbit","bookings & itineraries"],["Directory","family & locality"]],join:"aggregated by householder id",metric:"orbit_trip (governed)",
    followups:[["Trace the Steyn family's next trip","steyn_journey"],["Break bookings down by locality","growth"]]},
  steyn_journey:{q:"Can you trace John Steyn's planned activities for next month?",
    lede:"Next month John Steyn travels to <b>Northgate</b> for a Stellenbosch divisional event. Spiff traced the whole journey across <b>four systems</b> — the invitation in LDM, the flight, car and hotel in Orbit, and the meeting check-in in Connect — all correlated on his member id.",
    metrics:[{v:"4",l:"Systems"},{v:"Sep 11–13",l:"Travel window"},{v:"8",l:"Linked activities"}],
    systems:[["Directory","#1F52A0"],["LDM","#8E44AD"],["Orbit","#0E9AA6"],["Assemble","#1E8449"]],
    timeline:[
      ["03 Sep","LDM","#8E44AD","Invited to the Stellenbosch divisional lunch","As special guest of Bethel subdivision."],
      ["10 Sep","Orbit","#0E9AA6","Flight booked","QF447 · Home → Northgate · departs 08:15 on 11 Sep."],
      ["10 Sep","Orbit","#0E9AA6","Car rental booked","Compact · Northgate Airport · 11–13 Sep."],
      ["10 Sep","Orbit","#0E9AA6","Hotel booked","Northgate Pretoria · 2 nights · 11–13 Sep."],
      ["11 Sep","Orbit","#0E9AA6","Departs for Northgate","Outbound flight QF447."],
      ["12 Sep","LDM","#8E44AD","Divisional lunch — special guest","Bethel subdivision · 12:30."],
      ["12 Sep","Connect","#1F52A0","Meeting — special guest","Northgate regional meeting · 14:00."],
      ["13 Sep","Orbit","#0E9AA6","Returns home","Flight QF452 · Northgate → Home · 17:40."]
    ],
    scope:"visible to you",asof:null,sources:[["Directory","member profile"],["LDM","invitation"],["Orbit","itinerary & bookings"],["Connect","meeting attendance"]],join:"correlated on member id #40118",metric:"—",
    followups:[["Show John's travel history","steyn_history"],["Who else is travelling to Northgate?","orbit_travel"]]},
  steyn_history:{q:"John Steyn — travel history",
    lede:"Over the last 6 months John Steyn made <b>4 trips</b> through Orbit — all tied to divisional events. Each followed the same pattern: an LDM invitation, an Orbit booking, and a meeting on arrival.",
    metrics:[{v:"4",l:"Trips (6 mo)"},{v:"4",l:"Flights"},{v:"9",l:"Hotel nights"}],
    table:{cols:["Trip","Destination","Reason (LDM)","Nights","Assemble mtg"],rows:[["Feb 2026","Riverton","Regional lunch","2","Yes"],["Apr 2026","Capeside","Leadership forum","3","Yes"],["Jun 2026","Northgate","Divisional lunch","2","Yes"],["Aug 2026","Eastvale","Planning day","2","No"]]},
    scope:"visible to you",asof:null,sources:[["Orbit","itineraries"],["LDM","invitations"],["Connect","attendance"]],join:"correlated on member id #40118",metric:"orbit_trip (governed)",
    followups:[["Trace his next planned trip","steyn_journey"],["Orbit bookings across all families","orbit_travel"]]}
};
const CHIPS=[["ldm","LDM meetings in my subdivisions, last quarter"],["orbit_travel","Orbit bookings by family — flights, cars, hotels"],["steyn_journey","Trace John Steyn's planned activities next month"],["ambig","Show me meetings"],["growth","Member growth by locality this year"],["assemble_regions","Show meeting counts per province"]];
const THEME={ldm:["LDM meetings","#1F52A0"],oakridge:["LDM meetings","#1F52A0"],ldm_yoy:["LDM meetings","#1F52A0"],oak_trend:["LDM meetings","#1F52A0"],stale:["LDM meetings","#1F52A0"],
  growth:["Membership","#1E8449"],northern:["Membership","#1E8449"],south_loc:["Membership","#1E8449"],growth_trend:["Membership","#1E8449"],
  profile:["John Steyn","#8E44AD"],steyn_journey:["John Steyn","#8E44AD"],steyn_history:["John Steyn","#8E44AD"],
  orbit_travel:["Travel","#0E9AA6"],assemble_regions:["Meetings","#C77E12"]};
function themeOf(id){return THEME[id]||["Other","#5B6B7C"];}
let REPORTS=[
  {id:"growth",name:"Member growth by locality",saved:"2 days ago"},
  {id:"stale",name:"Localities overdue a meeting",saved:"5 days ago",sched:"Daily · 02:00"},
  {id:"ldm",name:"LDM meetings — quarterly pack",saved:"1 week ago",sched:"Weekly · Mon 07:00"},
  {id:"orbit_travel",name:"Orbit bookings by family",saved:"1 week ago"}
];
const CHATS=[
  {id:"ldm",when:"2h ago"},{id:"oakridge",when:"2h ago"},{id:"oak_trend",when:"yesterday"},{id:"ldm_yoy",when:"yesterday"},
  {id:"growth",when:"2 days ago"},{id:"stale",when:"2 days ago"},{id:"northern",when:"3 days ago"},{id:"south_loc",when:"3 days ago"},
  {id:"profile",when:"last week"},{id:"steyn_journey",when:"last week"},{id:"growth_trend",when:"last week"},
  {id:"orbit_travel",when:"2 weeks ago"},{id:"steyn_history",when:"2 weeks ago"},
  {id:"ldm",when:"3 weeks ago"},{id:"growth",when:"3 weeks ago"},{id:"profile",when:"last month"}
];
const PEOPLE_NAMES=["Thato S.","Pavitra G.","Dawid K.","Sindi M.","Tumelo M.","Amira R."];
const TEAMS=[
  ["LDM Operations","#1F52A0","LO",14,"You + 8 members","Meeting cadence, attendance and host coverage across subdivisions.","Directory · Connect · LDM"],
  ["Membership Insights","#1E8449","MI",9,"You + 5 members","Growth, retention and movement of members by country and locality.","Directory · Connect"],
  ["Regional Leadership","#8E44AD","RL",7,"You + 11 members","Quarterly rollups and cross-locality comparisons for leadership.","All systems"],
  ["Finance & Cost","#C77E12","FC",5,"You + 4 members","Verified figures for budgeting, cost and resource decisions.","Connect · Orbit"]
];
const LIBRARY=[
  {id:"ldm",team:"LDM Operations",owner:"Pavitra G.",oi:"PG",refreshed:"12 min ago",tag:["LDM Ops",""]},
  {id:"stale",team:"LDM Operations",owner:"Thato S.",oi:"TS",refreshed:"1 hour ago",tag:["Attention","w"]},
  {id:"oak_trend",team:"LDM Operations",owner:"Pavitra G.",oi:"PG",refreshed:"today",tag:["",""]},
  {id:"growth",team:"Membership Insights",owner:"Dawid K.",oi:"DK",refreshed:"today",tag:["Membership",""]},
  {id:"northern",team:"Membership Insights",owner:"Dawid K.",oi:"DK",refreshed:"yesterday",tag:["",""]},
  {id:"ldm",team:"Regional Leadership",owner:"Sindi M.",oi:"SM",refreshed:"yesterday",tag:["Quarterly",""]},
  {id:"orbit_travel",team:"Regional Leadership",owner:"Sindi M.",oi:"SM",refreshed:"2 days ago",tag:["",""]},
  {id:"profile",team:"LDM Operations",owner:"Pavitra G.",oi:"PG",refreshed:"3 days ago",tag:["Host",""]},
  {id:"growth",team:"Finance & Cost",owner:"Thato S.",oi:"TS",refreshed:"today",tag:["Verified","g"]}
];
const CAPS=[
  {id:"orbit_sched",n:"Schedule Orbit travel",cat:"Orbit · travel",ik:"route",cfg:"Event + flights + hotel"},
  {id:"orbit_flight",n:"Book flights",cat:"Orbit · travel",ik:"route",cfg:"Best fare · home → event"},
  {id:"orbit_hotel",n:"Book accommodation",cat:"Orbit · travel",ik:"route",cfg:"Near the venue"},
  {id:"sms",n:"SMS sender",cat:"Notify",ik:"sms",cfg:"Text the member"},
  {id:"email",n:"Email sender",cat:"Notify",ik:"mail",cfg:"Send the itinerary"},
  {id:"push",n:"Push notification",cat:"Notify",ik:"push",cfg:"In-app alert"},
  {id:"wallet",n:"Add to Google Wallet",cat:"Deliver",ik:"wallet",cfg:"Flight & hotel passes"},
  {id:"upload",n:"Upload to a path",cat:"Deliver",ik:"upload",cfg:"SharePoint / drive"},
  {id:"pdf",n:"Generate PDF pack",cat:"Deliver",ik:"doc",cfg:"Itinerary document"},
  {id:"brief",n:"Morning brief",cat:"Curate",ik:"brief",cfg:"Daily digest"},
  {id:"mission",n:"Daily mission update",cat:"Curate",ik:"flag",cfg:"Team tasks summary"},
  {id:"approve",n:"Ask for approval",cat:"Control",ik:"shield",cfg:"Human-in-the-loop"}
];
const CAPCFG={
  orbit_sched:{sys:"Orbit",who:"Owners + leads",fields:[{k:"for",label:"Book for",type:"recipients",modes:["subject","people"]},{k:"items",label:"Includes",type:"multiselect",opts:["Flight","Car","Hotel"]}]},
  orbit_flight:{sys:"Orbit",who:"Owners + leads",fields:[{k:"for",label:"Book for",type:"recipients",modes:["subject","people"]}]},
  orbit_hotel:{sys:"Orbit",who:"Owners + leads",fields:[{k:"for",label:"Book for",type:"recipients",modes:["subject","people"]}]},
  sms:{sys:"Notifications",who:"Owners + leads",fields:[{k:"to",label:"Send to",type:"recipients",modes:["subject","people","phones"]},{k:"msg",label:"Message",type:"textarea",ph:"You have a new schedule…"}]},
  email:{sys:"Notifications",who:"Owners + leads",fields:[{k:"to",label:"Send to",type:"recipients",modes:["subject","people","team","emails"]},{k:"subject",label:"Subject",type:"text",ph:"Your itinerary"},{k:"body",label:"Body",type:"textarea",ph:"Attached is your itinerary…"}]},
  push:{sys:"Notifications",who:"All users",fields:[{k:"to",label:"Notify",type:"recipients",modes:["subject","people","team","me"]},{k:"msg",label:"Message",type:"text"}]},
  wallet:{sys:"Google Wallet",who:"Owners",fields:[{k:"to",label:"Add to wallet of",type:"recipients",modes:["subject","people"]},{k:"items",label:"Passes",type:"select",opts:["Flight + hotel","Flight only","Hotel only"]}]},
  upload:{sys:"Files",who:"Owners",fields:[{k:"path",label:"Destination",type:"select",opts:["SharePoint / Reports","OneDrive / Me","Team drive"]}]},
  pdf:{sys:"Files",who:"All users",fields:[{k:"tmpl",label:"Document",type:"select",opts:["Itinerary pack","Summary","Full pack"]}]},
  brief:{sys:"Spiff",who:"All users",fields:[{k:"to",label:"Send to",type:"recipients",modes:["me","team","people"]},{k:"via",label:"Deliver via",type:"select",opts:["Email","In-app","Slack"]},{k:"time",label:"Time",type:"select",opts:["06:00","07:00","08:00"]}]},
  mission:{sys:"Spiff",who:"Leads",fields:[{k:"to",label:"For",type:"recipients",modes:["team","people"]}]},
  approve:{sys:"Spiff",who:"Admins",fields:[{k:"by",label:"Approver",type:"recipients",modes:["people","team"]}]}
};
const capFields=id=>(CAPCFG[id]||{}).fields||[];
const capSys=id=>(CAPCFG[id]||{}).sys||"—";
const capWho=id=>(CAPCFG[id]||{}).who||"All users";
let DASHBOARDS=[
  {name:"My dashboard",type:"personal",tiles:[{id:"ldm",refresh:"Every 30 min"},{id:"growth",refresh:"Daily · 02:00"},{id:"stale",refresh:"Hourly"}]},
  {name:"LDM Operations",type:"team",team:"LDM Operations",tiles:[{id:"ldm",refresh:"Every 30 min"},{id:"oak_trend",refresh:"Daily · 02:00"},{id:"stale",refresh:"Hourly"},{id:"profile",refresh:"Real-time · on event"}]}
];
const TRIGTYPES=[
  {id:"metric",n:"When a metric crosses a threshold"},
  {id:"event",n:"When a new record appears"},
  {id:"schedule",n:"On a schedule"},
  {id:"manual",n:"Manually, when I run it"}
];
const CADENCES=["Real-time · on event","Every 15 min","Every 30 min","Hourly","Every 6 hours","Daily · 02:00","Weekly · Mon 07:00"];
const SOURCES=["LDM attendance","Assemble events feed","Member growth by locality","Localities overdue","Orbit bookings by family"];
const METRICS=["Attendance %","New events","Net member growth","Localities overdue","Meetings count"];
const OPS=["<",">","=","changes by"];
let WORKFLOWS=[
  {name:"Assemble → travel & notify",trig:"event",cfg:{source:"Assemble events feed"},on:true,owner:"Thato S.",shared:false,steps:[
    {cap:"orbit_sched",cfg:{for:{mode:"subject"},items:["Flight","Car","Hotel"]}},
    {cap:"sms",cfg:{to:{mode:"subject"},msg:"You have a new travel schedule for the divisional event."}},
    {cap:"email",cfg:{to:{mode:"subject"},subject:"Your itinerary",body:"Attached is your flight, car and hotel itinerary."}},
    {cap:"wallet",cfg:{to:{mode:"subject"},items:"Flight + hotel"}}]},
  {name:"Weekly attendance alert",trig:"metric",cfg:{report:"LDM attendance",metric:"Attendance %",op:"<",val:"70",cadence:"Every 30 min"},on:false,owner:"Thato S.",shared:false,steps:[
    {cap:"email",cfg:{to:{mode:"team",val:"LDM Operations"},subject:"Attendance below threshold",body:"Attendance dropped below 70% — please review."}},
    {cap:"sms",cfg:{}}]},
  {name:"Overdue locality outreach",trig:"metric",cfg:{report:"Localities overdue",metric:"Localities overdue",op:">",val:"10",cadence:"Hourly"},on:true,owner:"Pavitra G.",shared:true,team:"LDM Operations",steps:[
    {cap:"email",cfg:{to:{mode:"team",val:"LDM Operations"},subject:"Overdue localities",body:"These localities need outreach this week."}},
    {cap:"mission",cfg:{to:{mode:"team",val:"LDM Operations"}}}]}
];
const SUBS={
  ldm:[{who:"Thato S.",ch:"Dashboard",cad:"Every 30 min"},{who:"Pavitra G.",ch:"Email",cad:"Daily · 07:00"},{who:"Sindi M.",ch:"In-app",cad:"Hourly"}],
  growth:[{who:"Dawid K.",ch:"Email",cad:"Daily · 02:00"},{who:"Thato S.",ch:"Dashboard",cad:"Daily · 02:00"}]
};
const subsFor=id=>(SUBS[id]||(SUBS[id]=[]));
const SCHEDRUNS=[
  {name:"LDM attendance",cadence:"Every 30 min",next:"in 12 min",owner:"Thato S.",cost:"~NZ$ 0.06",on:true},
  {name:"Assemble events feed",cadence:"Real-time · on event",next:"live",owner:"Pavitra G.",cost:"~NZ$ 0.03",on:true},
  {name:"Member growth by locality",cadence:"Daily · 02:00",next:"tonight",owner:"Dawid K.",cost:"~NZ$ 0.25",on:true},
  {name:"Localities overdue",cadence:"Hourly",next:"in 40 min",owner:"Thato S.",cost:"~NZ$ 0.08",on:true},
  {name:"Orbit bookings by family",cadence:"Weekly · Mon 07:00",next:"Mon 07:00",owner:"Sindi M.",cost:"~NZ$ 0.40",on:false}
];
const TRIGRULES=[
  {rule:"Attendance % < 70",src:"LDM attendance",cadence:"Every 30 min",wf:"Weekly attendance alert",last:"2h ago",on:true},
  {rule:"New event appears",src:"Assemble events feed",cadence:"Real-time",wf:"Assemble → travel & notify",last:"today",on:true},
  {rule:"Net growth < 0",src:"Member growth by locality",cadence:"Daily · 02:00",wf:"Membership dip escalation",last:"—",on:false},
  {rule:"Localities overdue > 10",src:"Localities overdue",cadence:"Hourly",wf:"Outreach to leads",last:"1h ago",on:true}
];
const capById=id=>CAPS.find(c=>c.id===id);
function trigSummary(t,cfg){cfg=cfg||{};
  if(t==='metric')return 'when '+(cfg.metric||'a metric')+' '+(cfg.op||'<')+' '+(cfg.val||'')+', checked '+(cfg.cadence||'every 30 min').toLowerCase();
  if(t==='event')return 'when a new record appears in '+(cfg.source||'a source');
  if(t==='schedule')return 'on a schedule · '+(cfg.cadence||'Daily · 02:00');
  return 'manually, on demand';}

const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const REDUCE=matchMedia('(prefers-reduced-motion:reduce)').matches;
function toast(msg){const t=$('#toast');$('#toast-msg').textContent=msg;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),2600);}
function iconFor(a){return a.timeline?ICON.route:(a.chart?ICON.chart:(a.profile?ICON.people:(a.warnRows?ICON.warn:ICON.chart)));}
const CRUMB={answer:"Answer",workspace:"My workspace",teams:"Team workspaces",library:"Team workspaces",autos:"Automations",admin:"Set-up",dashes:"Dashboards"};

function showOnly(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('on'));$('#view-'+id).classList.add('on');$('.scroll').scrollTop=0;}
function navActive(view){document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('active',a.dataset.view===view));}
function go(view){showOnly(view);navActive(view);$('#crumb').innerHTML='<b>'+CRUMB[view]+'</b>';
  if(view==='workspace')renderWorkspace();if(view==='teams')renderTeams();if(view==='library')renderLibrary();if(view==='autos')renderAutomations();if(view==='dashes')renderDashes();}

/* ---------- ask / clarify ---------- */
function guessId(q){q=q.toLowerCase();
  if(/stey/.test(q)){
    if(/history|past|previous|recent|last (3|three|few|6|six)/.test(q))return'steyn_history';
    if(/trace|journey|activit|travel|trip|itinerar|next month|plan/.test(q))return'steyn_journey';
    return'profile';}
  if(/flight|car rental|rental|hotel|orbit|booking|travel|trip/.test(q))return'orbit_travel';
  if(/growth|member|locality/.test(q))return'growth';
  if(/60|90|stale|no meeting|haven|quiet|days/.test(q))return'stale';
  return'ldm';}
function isAmbiguous(q){q=q.toLowerCase().trim();
  if(/^(show me |list |get |find )?(the )?meetings?\??\.?$/.test(q))return true;
  return q.includes('meeting')&&!/ldm|subdivision|lorraine|bethel|grace|highfield|riverside|oakridge|locality|quarter|last|stey|profile/.test(q);}
function askText(text){text=(text||'').trim();if(!text)return;
  if(isAmbiguous(text)){go('answer');$('#crumb').innerHTML='<b>Answer</b>';$('#thread').innerHTML='';clarifyTurn(text);}
  else openAnswer(guessId(text),text);}
function openFromCard(id){openAnswer(id,ANSWERS[id].q);}
function openAnswer(id,q){go('answer');$('#crumb').innerHTML='<b>Answer</b>';$('#thread').innerHTML='';answerTurn(id,q);}
function submitFollowup(){const el=$('#fu-in');const v=(el.value||'').trim();if(!v)return;el.value='';el.style.height='auto';if(isAmbiguous(v))clarifyTurn(v);else answerTurn(guessId(v),v);}

function scrollToTurn(el){el.scrollIntoView({block:'start',behavior:REDUCE?'auto':'smooth'});}
function clarifyTurn(q){
  document.querySelectorAll('#thread .followups').forEach(e=>e.remove());
  const turn=document.createElement('div');turn.className='turn';
  const opts=[["Stellenbosch","LDM meetings — Stellenbosch locality, last quarter"],["Pretoria","LDM meetings — Pretoria locality, last quarter"],["All 4 of my localities","LDM meetings across my subdivisions, last quarter"]];
  turn.innerHTML='<div class="qhead"><div class="qav">TS</div><h2>'+esc(q)+'</h2></div>'
    +'<div class="clarify"><div class="cl-h"><span class="pw">'+PAW+'</span><span>Spiff needs one detail</span></div>'
    +'<p>That could mean a few things. <b>Which locality</b> did you have in mind?</p>'
    +'<div class="opts">'+opts.map(o=>'<button class="opt" data-q="'+esc(o[1])+'">'+esc(o[0])+'</button>').join('')+'</div>'
    +'<div class="cl-note">Spiff asks instead of guessing — so the same question always means the same thing.</div></div>';
  $('#thread').appendChild(turn);
  turn.querySelectorAll('.opt').forEach(b=>b.addEventListener('click',()=>{turn.querySelector('.clarify').classList.add('answered');answerTurn('ldm',b.dataset.q);}));
  scrollToTurn(turn);
}
function answerTurn(id,q){
  document.querySelectorAll('#thread .followups').forEach(e=>e.remove());
  const turn=document.createElement('div');turn.className='turn';
  turn.innerHTML='<div class="qhead"><div class="qav">TS</div><h2>'+esc(q)+'</h2></div><div class="thinking"></div>';
  $('#thread').appendChild(turn);scrollToTurn(turn);
  const box=turn.querySelector('.thinking');
  const steps=["Understanding the question","Choosing tools · Directory, Assemble","Running the query, scoped to you","Composing the answer"];
  steps.forEach((s,i)=>{const d=document.createElement('div');d.className='tstep';d.style.animationDelay=(i*.1)+'s';d.innerHTML='<span class="dot"></span>'+s;box.appendChild(d);});
  const stepEls=[...box.children];const dur=REDUCE?0:850;
  if(!REDUCE)stepEls.forEach((e,i)=>setTimeout(()=>e.classList.add('done'),dur*.5+i*150));
  setTimeout(()=>{box.remove();renderAnswerCard(turn,id);scrollToTurn(turn);},REDUCE?0:dur+stepEls.length*150);
}
function chartHTML(c){
  let grid='';[0,.5,1].forEach(f=>{grid+='<div class="grid-l" style="bottom:'+(f*100)+'%"><span>'+Math.round(c.max*f)+'</span></div>';});
  let bars='',xs='';
  c.data.forEach(d=>{const h=Math.max(4,d[1]/c.max*100);
    bars+='<div class="bar"><span class="val">'+d[1]+'</span><div class="col'+(d[2]?' mut':'')+'" style="height:'+h+'%"></div></div>';
    xs+='<div class="x">'+esc(d[0])+'</div>';});
  return '<div class="chart bar-chart"><div class="ct">'+esc(c.title)+'</div><div class="bars">'+grid+bars+'</div><div class="xlabels">'+xs+'</div></div>';
}
const PIEPAL=["#2E7CD6","#1F52A0","#0E9AA6","#8E44AD","#1E8449","#C77E12","#9db4cf"];
function pieHTML(c){
  const total=c.data.reduce((s,d)=>s+d[1],0)||1;const R=52,CIRC=2*Math.PI*R;let off=0,segs='',leg='';
  c.data.forEach((d,i)=>{const frac=d[1]/total,len=frac*CIRC,col=d[2]?"#9db4cf":PIEPAL[i%PIEPAL.length];
    segs+='<circle r="'+R+'" cx="70" cy="70" fill="none" stroke="'+col+'" stroke-width="22" stroke-dasharray="'+len+' '+(CIRC-len)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 70 70)"/>';
    off+=len;leg+='<div class="pl"><span class="pd" style="background:'+col+'"></span>'+esc(d[0])+'<span class="pv">'+d[1]+' · '+Math.round(frac*100)+'%</span></div>';});
  return '<div class="chart pie-chart" style="display:none"><div class="ct">'+esc(c.title)+'</div><div class="pie-wrap"><svg viewBox="0 0 140 140" style="width:150px;height:150px;flex:none">'+segs+'</svg><div class="pie-legend">'+leg+'</div></div></div>';
}
const ZA_ALIAS={'Free State':'Orange Free State'};
let __zaRegistered=false;
function ensureZA(){if(!__zaRegistered&&window.echarts&&typeof ZA_GEO!=='undefined'){echarts.registerMap('ZA',ZA_GEO);__zaRegistered=true;}}
const CHART_TYPES=[
  {id:'bar',n:'Bar',ik:'bar',when:c=>true},
  {id:'line',n:'Line',ik:'line',when:c=>c.data.length>=2},
  {id:'pie',n:'Pie / donut',ik:'pie',when:c=>c.data.length<=8&&c.data.every(d=>d[1]>=0)},
  {id:'scatter',n:'Scatter',ik:'scatter',when:c=>!!c.scatter},
  {id:'map',n:'Map',ik:'map',when:c=>!!c.geo}
];
function eligibleTypes(c){return CHART_TYPES.filter(t=>t.when(c));}
function cssv(name){return getComputedStyle(document.documentElement).getPropertyValue(name).trim();}
const ECHART_MOUNTS=new Map();
function buildChartOption(c,type){
  const ink=cssv('--ink')||'#0b1220',muted=cssv('--muted')||'#6b7685',hair=cssv('--hair2')||'#e6e9ee',accent=cssv('--accent')||'#2E7CD6',accentSoft=cssv('--accent-soft')||'#E8F1FC',surface=cssv('--surface')||'#fff';
  const textStyle={color:muted,fontFamily:'inherit',fontSize:11.5};
  if(type==='bar'||type==='line'){
    const labels=c.data.map(d=>d[0]),vals=c.data.map(d=>d[1]);
    const series={type,
      data:type==='bar'?vals.map((v,i)=>({value:v,itemStyle:{color:c.data[i][2]?muted:accent}})):vals,
      label:{show:true,position:'top',color:ink,fontSize:11.5}};
    if(type==='line')Object.assign(series,{symbol:'circle',symbolSize:7,lineStyle:{color:accent,width:2},itemStyle:{color:accent}});
    else series.barMaxWidth=28;
    return {grid:{left:36,right:12,top:14,bottom:28,containLabel:true},
      xAxis:{type:'category',data:labels,axisLine:{lineStyle:{color:hair}},axisTick:{show:false},axisLabel:textStyle},
      yAxis:{type:'value',splitLine:{lineStyle:{color:hair}},axisLabel:textStyle},
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'}},
      series:[series]};
  }
  if(type==='pie'){
    return {tooltip:{trigger:'item',formatter:p=>p.name+': '+p.value+' ('+p.percent+'%)'},
      legend:{show:false},
      series:[{type:'pie',radius:['42%','72%'],avoidLabelOverlap:true,
        label:{formatter:'{b}\n{d}%',color:ink,fontSize:11},
        labelLine:{lineStyle:{color:hair}},
        data:c.data.map((d,i)=>({name:d[0],value:d[1],itemStyle:{color:d[2]?muted:PIEPAL[i%PIEPAL.length]}}))}]};
  }
  if(type==='scatter'){
    const s=c.scatter;
    return {grid:{left:44,right:16,top:16,bottom:36,containLabel:true},
      tooltip:{trigger:'item',formatter:p=>p.name+'<br>'+s.xl+': '+p.value[0]+'<br>'+s.yl+': '+p.value[1]},
      xAxis:{type:'value',name:s.xl,nameLocation:'middle',nameGap:26,axisLabel:textStyle,nameTextStyle:textStyle,splitLine:{lineStyle:{color:hair}}},
      yAxis:{type:'value',name:s.yl,nameLocation:'middle',nameGap:32,axisLabel:textStyle,nameTextStyle:textStyle,splitLine:{lineStyle:{color:hair}}},
      series:[{type:'scatter',symbolSize:16,itemStyle:{color:accent,opacity:.85},
        data:s.data.map(d=>({name:d[0],value:[d[1],d[2]]})),
        label:{show:true,formatter:p=>p.name,position:'top',color:muted,fontSize:11}}]};
  }
  if(type==='map'){
    ensureZA();
    const vals=c.data.map(d=>d[1]);
    return {tooltip:{trigger:'item',formatter:p=>p.name+': '+(p.value==null?'no data':p.value+' meetings')},
      visualMap:{min:0,max:c.max||Math.max(...vals),left:'left',bottom:8,text:['More','Fewer'],
        textStyle:{color:muted,fontSize:11},calculable:false,
        inRange:{color:[accentSoft,accent,ink]}},
      series:[{type:'map',map:'ZA',roam:true,label:{show:false},
        emphasis:{label:{show:true,color:ink}},
        itemStyle:{borderColor:surface,borderWidth:1},
        data:c.data.map(d=>({name:ZA_ALIAS[d[0]]||d[0],value:d[1]}))}]};
  }
}
function renderChart(container,chart,type){
  if(!window.echarts){container.innerHTML='<div style="padding:24px;text-align:center;color:var(--muted);font-size:12.5px">Chart library unavailable</div>';return;}
  container.style.height=(type==='map'?'360px':type==='scatter'?'300px':'280px');
  let inst=echarts.getInstanceByDom(container);
  if(!inst)inst=echarts.init(container);
  inst.setOption(buildChartOption(chart,type),true);
  inst.resize();
  ECHART_MOUNTS.set(container,{chart,type});
}
function repaintAllCharts(){ECHART_MOUNTS.forEach((v,container)=>{if(document.body.contains(container))renderChart(container,v.chart,v.type);else{const inst=echarts.getInstanceByDom(container);if(inst)inst.dispose();ECHART_MOUNTS.delete(container);}});}
if(typeof window!=='undefined')window.addEventListener('resize',()=>{ECHART_MOUNTS.forEach((v,container)=>{const inst=window.echarts&&echarts.getInstanceByDom(container);if(inst)inst.resize();});});
function reshapeBar(a,hasChart,id){let s='<div class="reshape"><span class="rl">Layout</span>';
  if(id && typeof tplFor==='function'){const rec=tplFor(tplCtx(id)),cur=tplApplied(id),mine=TPL_STATE.choice[id]&&TPL_STATE.choice[id]!==rec.chosen.id;
    s+='<div class="rmenu layout-menu"><button class="rbtn layout-btn" title="'+esc(mine?'Your choice':(rec.reason?'Recommended: '+rec.reason:'Spiff\'s default'))+'">'+I2.file+' '+esc(cur.name)+' <span class="mono" style="opacity:.6">v'+cur.version+'</span></button>'
      +'<div class="rpop layout-pop"><div class="rhead">'+(mine?'Your choice · the recommendation was '+esc(rec.chosen.name):(rec.reason?'Recommended because '+esc(rec.reason):'Nothing else claims this question'))+'</div>'
      +rec.candidates.map(t=>'<button data-tpl="'+t.id+'"'+(t.id===cur.id?' class="on"':'')+'>'+I2.file+' '+esc(t.name)+' <span class="mono" style="opacity:.6">v'+t.version+'</span>'+(t.id===rec.chosen.id?' <span class="bdg ok">recommended</span>':'')+'<span class="rchk">'+(t.id===cur.id?ICON.check:'')+'</span></button>').join('')
      +'<div class="rsep"></div><button data-tpl="__save">'+I2.plus+' Save this shape as a template</button></div></div>';}
  if(a.chart && hasChart!==false){const types=eligibleTypes(a.chart),cur=types.find(t=>t.id===a.chart._type)||types[0];
    s+='<div class="rmenu ctype-menu"><button class="rbtn ctype-btn">'+ICON.menu+' '+cur.n+'</button><div class="rpop ctype-pop">'+types.map(t=>'<button data-ct="'+t.id+'"'+(t.id===cur.id?' class="on"':'')+'>'+ICON[t.ik]+' '+t.n+'<span class="rchk">'+(t.id===cur.id?ICON.check:'')+'</span></button>').join('')+'</div></div>';}
  if(a.table)s+='<span style="font-size:11.5px;color:var(--muted)">Sort — click a column header</span>';
  return s+'</div>';
}
function sortTable(th){const table=th.closest('table'),ci=+th.dataset.ci,tb=table.querySelector('tbody');
  const dir=th.classList.contains('asc')?-1:1;
  table.querySelectorAll('th').forEach(x=>x.classList.remove('asc','desc','sorted'));
  th.classList.add(dir>0?'asc':'desc','sorted');
  const num=s=>{const n=parseFloat(String(s).replace(/[^0-9.\-]/g,''));return isNaN(n)?null:n;};
  [...tb.querySelectorAll('tr')].sort((a,b)=>{const av=a.children[ci].textContent.trim(),bv=b.children[ci].textContent.trim(),an=num(av),bn=num(bv);
    return (an!==null&&bn!==null)?(an-bn)*dir:av.localeCompare(bv)*dir;}).forEach(r=>tb.appendChild(r));
}
const ANSWER_ROW_CAP=200;
function tableHTML(t,warn){
  const capped=t.rows.length>ANSWER_ROW_CAP, rowsShown=capped?t.rows.slice(0,ANSWER_ROW_CAP):t.rows;
  let h='<tr>'+t.cols.map((c,i)=>'<th'+(i>0?' class="num sortable" data-ci="'+i+'"':'')+'>'+esc(c)+(i>0?' <span class="sarr">↕</span>':'')+'</th>').join('')+'</tr>';
  let b=rowsShown.map((r,ri)=>'<tr>'+r.map((c,i)=>{const flag=i===0&&warn&&warn.includes(ri);
    return '<td'+(i>0?' class="num"':'')+(flag?' style="font-weight:600"':'')+'>'+(flag&&r[4]?'<span class="tag w" style="margin-right:6px">'+esc(r[4])+'d</span>':'')+esc(c)+'</td>';}).join('')+'</tr>').join('');
  const capNote=capped?'<div class="mutedtext" style="font-size:12.5px;padding:8px 2px 0">Showing the first '+ANSWER_ROW_CAP+' of '+fmt(t.rows.length)+' rows. Ask for a breakdown, or Export for the rest.</div>':'';
  return '<div class="tbl-wrap"><table><thead>'+h+'</thead><tbody>'+b+'</tbody></table>'+capNote+'</div>';
}
function renderAnswerCard(turn,id){
  const a=ANSWERS[id];
  let body='<div class="lede">'+a.lede+'</div>';
  if(a.profile){const p=a.profile;
    body+='<div class="profcard"><div class="big">'+p.init+'</div><div><h3>'+p.name+'</h3><div style="color:var(--muted);font-size:13px">'+p.role+' · '+p.member+'</div><div class="pgrid"><div class="c"><div class="k">Locality</div><div class="v">'+p.locality+'</div></div><div class="c"><div class="k">Subdivision</div><div class="v">'+p.subdivision+'</div></div><div class="c"><div class="k">Country</div><div class="v">'+p.country+'</div></div><div class="c"><div class="k">Household</div><div class="v">'+p.household+'</div></div></div></div></div>';}
  /* the template decides which blocks appear and in what order; it never touches a number */
  const T=(typeof tplApplied==='function')?tplApplied(id):null, order=T?T.blocks:['headline','chart','table','commentary','notes'];
  const has=k=>order.indexOf(k)>=0;
  if(T && !has('commentary')) body=body.replace(/^<div class="lede">[\s\S]*?<\/div>/,'');
  const parts={
    headline: a.metrics?'<div class="metrics">'+a.metrics.map(m=>'<div class="metric"><div class="v">'+m.v+'</div><div class="l">'+m.l+'</div>'+(m.d?'<div class="dlt '+(m.c||'')+'">'+m.d+'</div>':'')+'</div>').join('')+'</div>':'',
    chart: a.chart?'<div class="chart"><div class="ct">'+esc(a.chart.title)+'</div><div class="echart-wrap"></div></div>':'',
    table: a.table?tableHTML(a.table,a.warnRows):''
  };
  if((a.chart&&has('chart'))||(a.table&&has('table'))||T)body+=reshapeBar(a, !!(a.chart&&has('chart')), id);
  order.forEach(k=>{ if(parts[k]) body+=parts[k]; });
  if(a.calTable)body+='<div class="chart" style="margin:0"><div class="ct">Upcoming — next 30 days</div></div>'+tableHTML(a.calTable);
  if(a.systems)body+='<div class="syslegend">'+a.systems.map(s=>'<span class="sl"><span class="sd" style="background:'+s[1]+'"></span>'+esc(s[0])+'</span>').join('')+'</div>';
  if(a.timeline)body+='<div class="timeline">'+a.timeline.map(e=>'<div class="tl-item"><span class="dot" style="background:'+e[2]+'"></span><span class="when">'+esc(e[0])+'</span><span class="sys" style="background:'+e[2]+'">'+esc(e[1])+'</span><div class="tt">'+esc(e[3])+'</div><div class="td2">'+esc(e[4])+'</div></div>').join('')+'</div>';
  body+='<details class="provf"><summary><svg class="cx" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M9 6l6 6-6 6"/></svg> Show working</summary><div class="prov">'
    +'<div class="row"><div class="pk">Sources</div><div class="pv">'+a.sources.map(s=>'<span class="src"><span class="sd"></span>'+s[0]+' · '+s[1]+'</span>').join('')+'</div></div>'
    +'<div class="row"><div class="pk">Correlation</div><div class="pv">'+a.join+'</div></div>'
    +'<div class="row"><div class="pk">Definition</div><div class="pv mono">'+a.metric+'</div></div>'
    +'<div class="row"><div class="pk">Computed by</div><div class="pv">UBT systems — not the model. Same question, same numbers.</div></div></div></details>';
  const meta='<div class="meta">'
    +'<span class="badge scope">'+ICON.people+' Your view · '+a.scope+'</span>'
    +'<span class="badge live">● Live · re-runs on open</span>'
    +'<span class="badge time">'+ICON.clock+' '+(a.snapshot ? 'snapshot · '+esc(a.snapshot) : 'as of today '+FX.time)+'</span>'
    +(subsFor(id).length?'<span class="badge" data-subs="'+id+'" title="People subscribed — each gets their own re-run, scoped to them">'+ICON.people+' '+subsFor(id).length+' subscribed</span>':'')
    +'<span class="sp"></span><div class="act">'
    +'<div class="rmenu actmenu"><button class="btn" data-act="keep"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-4-7 4V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg> Keep <span class="caret">▾</span></button>'
      +'<div class="rpop"><button data-do="save"><b>Save</b> to My workspace</button><button data-do="dash"><b>Pin</b> to a dashboard</button><button data-do="watch"><b>Watch</b> on Home — a card, with a threshold if you want one</button><button data-do="share"><b>Share</b> with a team or a person</button><div class="rnote">Whoever opens it gets their own re-run. Sharing organises, it never widens access.</div></div></div>'
    +'<div class="rmenu actmenu"><button class="btn" data-act="auto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> Automate <span class="caret">▾</span></button>'
      +'<div class="rpop"><button data-do="subscribe"><b>Subscribe</b> — my copy, on a clock</button><button data-do="schedule"><b>Schedule</b> — run it and deliver it</button><div class="rnote">Runs as its owner, re-checked every time.</div></div></div>'
    +'<button class="btn" data-act="whocansee" title="Who can see this answer, and why"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg> Who can see this?</button>'
    +'<div class="rmenu actmenu"><button class="btn" data-act="export"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M8 11l4 4 4-4M4 21h16"/></svg> Export <span class="caret">▾</span></button>'
      +'<div class="rpop"><button data-do="x">Word (.docx)</button><button data-do="x">PDF</button><button data-do="x">Excel</button><button data-do="x">Google Sheets</button></div></div>'
    +'</div></div>';
  const fu='<div class="followups"><div class="fl">Suggested follow-ups</div><div class="row">'+a.followups.map(f=>'<button class="fchip" data-to="'+f[1]+'"><span class="fa">↳</span>'+esc(f[0])+'</button>').join('')+'</div></div>';
  turn.insertAdjacentHTML('beforeend','<div class="answer"><div class="body">'+body+'</div>'+meta+'</div>'+fu);
  const DO={save:()=>saveReport(id), dash:()=>dashModal(id), watch:()=>homeWatchAdd(id), share:()=>shareModal(id), subscribe:()=>subscribeModal(id),
    schedule:()=>openFlow(null,ANSWERS[id].timeline||ANSWERS[id].calTable||/stale|event/.test(id)?'assemble_event':'schedule')};
  turn.querySelectorAll('.actmenu').forEach(m=>{const btn=m.querySelector(':scope > .btn'),pop=m.querySelector(':scope > .rpop');
    btn.onclick=e=>{e.stopPropagation();document.querySelectorAll('.rpop.on').forEach(p=>{if(p!==pop)p.classList.remove('on');});pop.classList.toggle('on');};
    pop.querySelectorAll('button[data-do]').forEach(b=>b.onclick=()=>{pop.classList.remove('on');const k=b.dataset.do;if(k==='x')toast('Exported as '+b.textContent);else DO[k]();});});
  turn.querySelector('[data-act="whocansee"]').onclick=()=>whoCanSeeAnswer(id);
  turn.querySelectorAll('.fchip').forEach(b=>b.onclick=()=>answerTurn(b.dataset.to,ANSWERS[b.dataset.to].q));
  const ctm=turn.querySelector('.ctype-menu');
  if(ctm){const btn=ctm.querySelector('.ctype-btn'),pop=ctm.querySelector('.ctype-pop'),wrap=turn.querySelector('.echart-wrap');
    btn.onclick=e=>{e.stopPropagation();document.querySelectorAll('.rpop.on').forEach(p=>{if(p!==pop)p.classList.remove('on');});pop.classList.toggle('on');};
    pop.querySelectorAll('button').forEach(b=>b.onclick=()=>{const type=b.dataset.ct,t=CHART_TYPES.find(x=>x.id===type);
      a.chart._type=type;pop.classList.remove('on');
      pop.querySelectorAll('button').forEach(x=>{x.classList.toggle('on',x===b);x.querySelector('.rchk').innerHTML=(x===b?ICON.check:'');});
      btn.innerHTML=ICON.menu+' '+t.n;
      renderChart(wrap,a.chart,type);});}
  const lm=turn.querySelector('.layout-menu');
  if(lm){const lb=lm.querySelector('.layout-btn'),pop=lm.querySelector('.rpop');lb.onclick=e=>{e.stopPropagation();document.querySelectorAll('.rpop.on').forEach(p=>{if(p!==pop)p.classList.remove('on');});pop.classList.toggle('on');};
    pop.querySelectorAll('button[data-tpl]').forEach(x=>x.onclick=()=>{pop.classList.remove('on');if(x.dataset.tpl==='__save')tplFromAnswer(id);else tplChoose(id,x.dataset.tpl);});}
  if(a.chart && turn.querySelector('.echart-wrap')){const wrap=turn.querySelector('.echart-wrap'),types=eligibleTypes(a.chart),cur=types.find(t=>t.id===a.chart._type)||types[0];
    a.chart._type=cur.id;renderChart(wrap,a.chart,cur.id);}
}

/* ---------- actions ---------- */
function setCount(id,n){const e=$('#'+id);if(e)e.textContent=n;}
function saveReport(id){if(!REPORTS.find(r=>r.id===id))REPORTS.unshift({id,name:ANSWERS[id].q,saved:"just now"});setCount('ws-count',REPORTS.length);toast("Saved to My workspace");}
const others=PEOPLE_NAMES.filter(p=>p!=="Thato S.");
function shareModal(id){
  const m=$('#modal');
  m.innerHTML='<div class="modal"><h3>Share this answer</h3><div class="msub">It stays live — it re-runs under each viewer\'s own permissions, so they see only their slice.</div>'
    +'<div class="field"><label>Share with</label><div class="seg2" id="share-mode" style="width:fit-content"><button class="on" data-m="team">A team</button><button data-m="person">A person</button></div></div>'
    +'<div class="field" id="share-target"></div>'
    +'<div class="field"><label>Shareable link</label><div class="link"><span>ubt.spiff/a/'+id+'-'+Math.random().toString(36).slice(2,7)+'</span><button onclick="toast(\'Link copied\')">Copy</button></div></div>'
    +'<div class="sharenote">🔒 Sharing organises, it never widens access. Each viewer sees only their own slice.</div>'
    +'<div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn pri" onclick="doShare(\''+id+'\')">Share</button></div></div>';
  m.classList.add('on');
  const tgt=$('#share-target');const setT=mode=>{tgt.innerHTML='<label>'+(mode==='team'?'Team':'Person')+'</label><select id="share-to">'+(mode==='team'?TEAMS.map(t=>'<option>'+t[0]+'</option>').join(''):others.map(p=>'<option>'+p+'</option>').join(''))+'</select>';};
  setT('team');
  m.querySelectorAll('#share-mode button').forEach(b=>b.onclick=()=>{m.querySelectorAll('#share-mode button').forEach(x=>x.classList.toggle('on',x===b));setT(b.dataset.m);});
}
function doShare(id){const mode=$('#modal #share-mode .on').dataset.m,to=$('#share-to').value;
  if(mode==='team'){LIBRARY.unshift({id,team:to,owner:"Thato S.",oi:"TS",refreshed:"just now",tag:["New",""]});setCount('lib-count',LIBRARY.length);}
  closeModal();toast(mode==='team'?"Shared to "+to:"Shared with "+to);}
function scheduleModal(id){
  const m=$('#modal');
  m.innerHTML='<div class="modal"><h3>Schedule this answer</h3><div class="msub">Spiff runs it on a cadence and delivers the result — re-scoped to each recipient. No need to ask again.</div>'
    +'<div class="field"><label>Frequency</label><select id="sch-freq"><option>Every day</option><option>Every weekday</option><option>Every week · Mon</option><option>Every month · 1st</option></select></div>'
    +'<div class="field"><label>Time</label><select id="sch-time"><option>02:00</option><option>06:00</option><option>07:00</option><option>18:00</option></select></div>'
    +'<div class="field"><label>Deliver to</label><select id="sch-to"><option>Me</option>'+others.map(p=>'<option>'+p+'</option>').join('')+'</select></div>'
    +'<div class="sharenote" style="background:var(--accent-soft);color:var(--accent)">⏱ Runs on a schedule, not on request — and re-evaluates permissions and identity each run.</div>'
    +'<div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn pri" onclick="doSchedule(\''+id+'\')">Schedule it</button></div></div>';
  m.classList.add('on');
}
function doSchedule(id){const f=$('#sch-freq').value,t=$('#sch-time').value,sched=f.replace('Every ','').replace(/^(.)/,c=>c.toUpperCase())+' · '+t,ex=REPORTS.find(r=>r.id===id);
  if(ex)ex.sched=sched;else REPORTS.unshift({id,name:ANSWERS[id].q,saved:"just now",sched});
  setCount('ws-count',REPORTS.length);closeModal();toast("Scheduled · "+f.toLowerCase()+" at "+t);}
let _subTurn=null;
function subscribeModal(id,turn){_subTurn=turn||null;const m=$('#modal'),subs=subsFor(id),mine=subs.find(s=>s.who==="Thato S.");
  const list=subs.length?'<div class="sublist">'+subs.map(s=>'<div class="subrow"><span class="ava">'+esc(s.who.split(' ').map(w=>w[0]).join(''))+'</span><div style="flex:1;min-width:0"><div class="srn">'+esc(s.who)+(s.who==="Thato S."?' <span style="color:var(--muted);font-weight:500">(you)</span>':'')+'</div><div class="srd">'+esc(s.ch)+' · '+esc(s.cad)+'</div></div></div>').join('')+'</div>':'<div class="msub" style="margin:2px 0 12px">No subscribers yet — be the first.</div>';
  m.innerHTML='<div class="modal"><h3>Subscribe to this answer</h3><div class="msub">One answer, many subscribers. Each subscription re-runs on its own clock and is scoped to that person — you never see more than your slice.</div>'
    +'<div class="field"><label>Who\'s subscribed</label>'+list+'</div>'
    +'<div class="field"><label>Deliver to me via</label><select id="sub-ch"><option>Email</option><option>In-app</option><option'+(mine&&mine.ch==="Dashboard"?' selected':'')+'>Dashboard</option></select></div>'
    +'<div class="field"><label>How often</label><select id="sub-cad"><option>Daily · 07:00</option><option>Every 30 min</option><option>Hourly</option><option>Weekly · Mon 07:00</option></select></div>'
    +'<div class="sharenote" style="background:var(--good-soft);color:var(--good)">'+ICON.shield+' Your copy runs as you — same question, your numbers. It never inherits the author\'s access.</div>'
    +'<div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn pri" onclick="doSubscribe(\''+id+'\')">'+(mine?'Update my subscription':'Subscribe me')+'</button></div></div>';
  m.classList.add('on');}
function doSubscribe(id){const ch=$('#sub-ch').value,cad=$('#sub-cad').value,subs=subsFor(id),mine=subs.find(s=>s.who==="Thato S.");
  if(mine){mine.ch=ch;mine.cad=cad;}else subs.push({who:"Thato S.",ch,cad});
  if(_subTurn){const meta=_subTurn.querySelector('.meta');if(meta){const n=subs.length,html=ICON.people+' '+n+' subscribed';let b=meta.querySelector('[data-subs]');if(b)b.innerHTML=html;else{const el=document.createElement('span');el.className='badge';el.setAttribute('data-subs',id);el.title='People subscribed — each gets their own re-run, scoped to them';el.innerHTML=html;meta.insertBefore(el,meta.querySelector('.sp'));}}}
  closeModal();toast(mine?"Subscription updated · "+cad.toLowerCase():"Subscribed · "+ch.toLowerCase()+" "+cad.toLowerCase());}
function closeModal(){$('#modal').classList.remove('on');}
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});

/* ---------- lists (themed groups + search) ---------- */
function groupsHTML(items,getId,rowFn){const g={},order=[];
  items.forEach(it=>{const th=themeOf(getId(it));if(!g[th[0]]){g[th[0]]={col:th[1],items:[]};order.push(th[0]);}g[th[0]].items.push(it);});
  return order.map(label=>{const grp=g[label];
    return '<details class="tgroup" open><summary><span class="tdot" style="background:'+grp.col+'"></span>'+esc(label)+'<span class="ct2">'+grp.items.length+'</span><svg class="cx" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></summary><div class="rows">'+grp.items.map(rowFn).join('')+'</div></details>';}).join('');
}
const COL_ICO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 11l-5-5-5 5"/><path d="M17 18l-5-5-5 5"/></svg>';
const EXP_ICO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 6l5 5 5-5"/><path d="M7 13l5 5 5-5"/></svg>';
function collapseBtn(sel){return '<button class="btn" onclick="toggleGroups(\''+sel+'\',this)">'+COL_ICO+' Collapse all</button>';}
function toggleGroups(sel,btn){const v=$(sel);if(!v)return;const gs=[...v.querySelectorAll('.tgroup')];if(!gs.length)return;const anyOpen=gs.some(g=>g.open);gs.forEach(g=>g.open=!anyOpen);btn.innerHTML=(anyOpen?EXP_ICO+' Expand all':COL_ICO+' Collapse all');}
function chatRow(c){const a=ANSWERS[c.id];return '<div class="row2" onclick="openFromCard(\''+c.id+'\')"><div class="ri">'+iconFor(a)+'</div><div class="rmain"><div class="rt">'+esc(a.q)+'</div><div class="rsub">'+esc(a.lede.replace(/<[^>]+>/g,'').slice(0,72))+'…</div></div><div class="rmeta"><span class="when">'+c.when+'</span></div></div>';}
function reportRow(r){const a=ANSWERS[r.id];return '<div class="row2" onclick="openFromCard(\''+r.id+'\')"><div class="ri">'+iconFor(a)+'</div><div class="rmain"><div class="rt">'+esc(r.name)+'</div><div class="rsub">'+esc(a.q)+'</div></div><div class="rmeta">'+(r.sched?'<span class="sbadge">'+ICON.clock+' '+esc(r.sched)+'</span>':'')+'<span class="when">'+r.saved+'</span></div></div>';}
function libRow(l){const a=ANSWERS[l.id];return '<div class="row2" onclick="openFromCard(\''+l.id+'\')"><div class="ri">'+iconFor(a)+'</div><div class="rmain"><div class="rt">'+esc(a.q)+'</div><div class="rsub">'+l.owner+' · '+l.team+'</div></div><div class="rmeta">'+(l.tag[0]?'<span class="tag '+l.tag[1]+'">'+l.tag[0]+'</span>':'')+'<span class="sbadge" style="background:var(--accent-soft);color:var(--accent)">● live</span><span class="when">'+l.refreshed+'</span></div></div>';}
let WSQ='';
function renderWorkspace(){const q=WSQ.toLowerCase();
  const reps=REPORTS.filter(r=>!q||(r.name+' '+ANSWERS[r.id].q).toLowerCase().includes(q));
  $('#view-workspace').innerHTML='<div class="pagehead"><div><div class="eyebrow">Personal</div><h1>My workspace</h1><div class="desc">Your saved and scheduled reports, grouped by theme. Your chat history lives in the drawer on the right — open it from any screen.</div></div></div>'
    +'<div class="wsbar"><div class="wsearch"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg><input id="ws-search" placeholder="Search your reports…" value="'+esc(WSQ)+'"></div>'+(reps.length?collapseBtn('#view-workspace'):'')+'</div>'
    +'<div class="section-h">Saved &amp; scheduled reports <span class="n">'+reps.length+'</span></div>'
    +(reps.length?groupsHTML(reps,r=>r.id,reportRow):'<div class="empty">No saved reports match.</div>');
  const si=$('#ws-search');si.oninput=e=>{WSQ=e.target.value;renderWorkspace();};si.focus();si.setSelectionRange(si.value.length,si.value.length);
}
function renderTeams(){
  $('#view-teams').innerHTML='<div class="pagehead"><div><div class="eyebrow">Shared</div><h1>Team spaces</h1><div class="desc">Shared homes where trusted answers live. Each space scopes its own context — which systems are in play — so answers stay relevant and cost stays contained.</div></div></div>'
    +'<div class="teamrow">'+TEAMS.map(t=>'<button class="team" onclick="openTeam(\''+esc(t[0])+'\')"><div class="ti" style="background:'+t[1]+'">'+t[2]+'</div><div style="flex:1;min-width:0"><div class="tn">'+t[0]+'</div><div class="td">'+t[4]+'   <span class="scopechip">'+t[6]+'</span></div></div><div class="tc">'+t[3]+' answers</div></button>').join('')+'</div>';
}
function openTeam(name){const t=TEAMS.find(x=>x[0]===name),items=LIBRARY.filter(l=>l.team===name);
  showOnly('team');navActive('teams');$('#crumb').innerHTML='Team spaces <span style="opacity:.5">/</span> <b>'+esc(name)+'</b>';
  $('#view-team').innerHTML='<button class="backlink" onclick="go(\'teams\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg> All team spaces</button>'
    +'<div class="teamhero"><div class="ti" style="background:'+t[1]+'">'+t[2]+'</div><div><h1>'+esc(t[0])+'</h1><div class="th-d">'+esc(t[5])+'</div><div style="margin-top:7px;display:flex;gap:9px;align-items:center;font-size:12.5px;color:var(--muted);flex-wrap:wrap">'+t[4]+' <span class="scopechip">Context: '+t[6]+'</span></div></div></div>'
    +(items.length?groupsHTML(items,l=>l.id,libRow):'<div class="empty">No shared answers here yet.</div>');
}
let LIBQ='';
function renderLibrary(){const q=LIBQ.toLowerCase();
  const items=LIBRARY.filter(l=>!q||(ANSWERS[l.id].q+' '+l.team+' '+l.owner).toLowerCase().includes(q));
  $('#view-library').innerHTML='<div class="pagehead"><div><div class="eyebrow">Workspaces</div><h1>Team workspace</h1><div class="desc">The answers your teams keep — grouped by theme and searchable. Find a trusted answer instead of hunting for a report.</div></div></div>'
    +'<div class="wsbar"><div class="wsearch"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg><input id="lib-search" placeholder="Search the team workspace…" value="'+esc(LIBQ)+'"></div>'+(items.length?collapseBtn('#view-library'):'')+'</div>'
    +(items.length?groupsHTML(items,l=>l.id,libRow):'<div class="empty">Nothing matches.</div>');
  const si=$('#lib-search');si.oninput=e=>{LIBQ=e.target.value;renderLibrary();};si.focus();si.setSelectionRange(si.value.length,si.value.length);
}

/* ---------- automation builder ---------- */
let FLOW=null;
function renderAutomations(){
  $('#view-autos').innerHTML='<div class="pagehead"><div><div class="eyebrow">Automate</div><h1>Automations</h1><div class="desc">Turn a report into an automation — a trigger, then capabilities you drag together. Every step runs as you.</div></div><button class="btn pri" onclick="openFlow(null,\'assemble_event\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg> New automation</button></div>'
    +'<div class="teamrow">'+WORKFLOWS.map((w,i)=>{const mine=w.owner==="Thato S.";const own=mine?(w.shared?'Shared to '+esc(w.team||'team')+' · you own it':'Personal'):'Shared by '+esc(w.owner);const ownTag='<span class="tag '+(mine&&!w.shared?'':'g')+'" style="margin-left:7px;font-size:10px;padding:1px 7px;vertical-align:middle">'+own+'</span>';return '<button class="team" onclick="openFlow('+i+')"><div class="ti" style="background:'+(w.on?"#1E8449":"#8A9199")+'">'+ICON.flow+'</div><div style="flex:1;min-width:0"><div class="tn">'+esc(w.name)+ownTag+'</div><div class="td">Fires '+esc(trigSummary(w.trig,w.cfg))+' · '+w.steps.length+' steps · runs as '+(mine?'you':esc(w.owner))+'</div></div><div class="tc">'+(w.on?"On":"Off")+'</div></button>';}).join('')+'</div>';
}
function openFlow(idx,seedTrig){
  if(typeof idx==='number'){const w=WORKFLOWS[idx];FLOW={idx,name:w.name,trig:w.trig,cfg:Object.assign({},w.cfg),steps:w.steps.map(s=>({cap:s.cap,cfg:JSON.parse(JSON.stringify(s.cfg||{}))})),on:w.on,owner:w.owner||"Thato S.",shared:!!w.shared,team:w.team};}
  else{const seed=seedTrig==='assemble_event'?{trig:'event',cfg:{source:'Assemble events feed'}}:{trig:'schedule',cfg:{cadence:'Daily · 02:00'}};FLOW={idx:null,name:"New automation",trig:seed.trig,cfg:seed.cfg,steps:[],on:false,owner:"Thato S.",shared:false};}
  showOnly('flow');navActive('autos');$('#crumb').innerHTML='Automations <span style="opacity:.5">/</span> <b>'+esc(FLOW.name)+'</b>';renderFlow();
}
function selOpts(arr,cur){return arr.map(o=>'<option'+(o===cur?' selected':'')+'>'+esc(o)+'</option>').join('');}
function trigCfgHTML(){const c=FLOW.cfg||{},t=FLOW.trig;
  if(t==='metric')return '<div class="cfgrow"><label>From report</label><select data-k="report">'+selOpts(SOURCES,c.report)+'</select></div>'
    +'<div class="cfgrow"><label>When</label><select data-k="metric">'+selOpts(METRICS,c.metric)+'</select><select data-k="op" class="narrow">'+selOpts(OPS,c.op)+'</select><input data-k="val" class="narrow" placeholder="70" value="'+esc(c.val||'')+'"></div>'
    +'<div class="cfgrow"><label>Checked</label><select data-k="cadence">'+selOpts(CADENCES,c.cadence)+'</select></div>'
    +'<div class="cfgnote">Evaluated on each refresh · fires once per crossing (cooldown), and runs as you.</div>';
  if(t==='event')return '<div class="cfgrow"><label>Source</label><select data-k="source">'+selOpts(SOURCES,c.source)+'</select></div><div class="cfgnote">Fires the moment a new record appears in the source.</div>';
  if(t==='schedule')return '<div class="cfgrow"><label>Runs</label><select data-k="cadence">'+selOpts(CADENCES.filter(x=>x!=="Real-time · on event"),c.cadence)+'</select></div><div class="cfgnote">Runs on the clock, whether or not anything changed.</div>';
  return '<div class="cfgnote">You run this automation yourself, on demand.</div>';
}
function addStep(id){FLOW.steps.push({cap:id,cfg:{}});renderFlow();const d=$('#flow-drop');if(d)d.scrollIntoView({block:'center',behavior:REDUCE?'auto':'smooth'});}
function shareFlow(){FLOW.shared=true;FLOW.team=FLOW.team||"LDM Operations";if(FLOW.idx!==null&&WORKFLOWS[FLOW.idx]){WORKFLOWS[FLOW.idx].shared=true;WORKFLOWS[FLOW.idx].team=FLOW.team;}renderFlow();toast("Shared to "+FLOW.team+" — each member adds their own copy that runs as them");}
function cloneFlow(){const rec={name:FLOW.name+" (my copy)",trig:FLOW.trig,cfg:Object.assign({},FLOW.cfg),steps:JSON.parse(JSON.stringify(FLOW.steps)),on:false,owner:"Thato S.",shared:false};WORKFLOWS.unshift(rec);toast("Added your copy — it runs as you, scoped to your data");openFlow(0);}
function fieldFilled(f,v){if(v===undefined||v===null||v==='')return false;
  if(f.type==='recipients'){if(!v.mode)return false;if(v.mode==='subject'||v.mode==='me')return true;if(v.mode==='people')return v.val&&v.val.length;return !!v.val;}
  if(f.type==='multiselect')return v&&v.length;return true;}
function recipLabel(v){if(!v||!v.mode)return '—';const m=v.mode;
  if(m==='subject')return 'the member (trigger)';if(m==='me')return 'me';if(m==='team')return v.val||'a team';
  if(m==='people')return (v.val||[]).join(', ')||'—';if(m==='phones')return (v.val||'')+' (numbers)';if(m==='emails')return (v.val||'')+' (emails)';return v.val||'—';}
function summarizeCfg(id,cfg){cfg=cfg||{};const rf=capFields(id).find(f=>f.type==='recipients');const parts=[];
  if(rf)parts.push('To '+recipLabel(cfg[rf.k]));
  capFields(id).filter(f=>f.type==='select').forEach(f=>{if(cfg[f.k])parts.push(cfg[f.k]);});
  return parts.join(' · ')||'Configured';}
function stepStatus(st){const fields=capFields(st.cap),c=capById(st.cap);
  if(!fields.length)return {ready:true,summary:c.cfg};
  const missing=fields.filter(f=>!fieldFilled(f,(st.cfg||{})[f.k]));
  return {ready:missing.length===0,summary:missing.length?'':summarizeCfg(st.cap,st.cfg)};}
function configModal(i){const st=FLOW.steps[i],c=capById(st.cap),draft=JSON.parse(JSON.stringify(st.cfg||{}));
  const m=$('#modal');
  m.innerHTML='<div class="modal"><h3>Configure · '+esc(c.n)+'</h3><div class="msub">'+esc(capSys(st.cap))+' capability · give it what it needs to run.</div><div id="cfg-fields"></div><div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn pri" id="cfg-save">Save</button></div></div>';
  renderCfgFields(c,draft);
  $('#cfg-save').onclick=()=>{FLOW.steps[i].cfg=draft;closeModal();renderFlow();toast('Saved · '+c.n);};
  m.classList.add('on');
}
function renderCfgFields(c,draft){const wrap=$('#cfg-fields'),fields=capFields(c.id);
  wrap.innerHTML=fields.length?fields.map(f=>'<div class="field" data-fk="'+f.k+'"><label>'+esc(f.label)+'</label><div class="fcontrol"></div></div>').join(''):'<div class="msub">No setup needed — this step just runs.</div>';
  fields.forEach(f=>renderFieldControl(f,draft,wrap.querySelector('[data-fk="'+f.k+'"] .fcontrol')));
}
function renderFieldControl(f,draft,cell){const v=draft[f.k];
  if(f.type==='recipients'){const ML={subject:"The member (trigger)",people:"Individuals",team:"A team",phones:"Phone numbers",emails:"Emails",me:"Me"};
    const cur=(v&&v.mode)||f.modes[0];
    cell.innerHTML='<div class="seg2 rmode" style="margin-bottom:8px;flex-wrap:wrap">'+f.modes.map(mo=>'<button data-mo="'+mo+'"'+(mo===cur?' class="on"':'')+'>'+ML[mo]+'</button>').join('')+'</div><div class="rinput"></div>';
    const draw=mode=>{const ri=cell.querySelector('.rinput');
      if(mode==='subject'||mode==='me'){ri.innerHTML='<div class="msub" style="margin:0">'+(mode==='subject'?'Goes to the member the event is about — no list needed.':'Goes to you.')+'</div>';draft[f.k]={mode};}
      else if(mode==='people'){ri.innerHTML=PEOPLE_NAMES.map(p=>'<label class="ckrow"><input type="checkbox" value="'+esc(p)+'"'+(((v&&v.val)||[]).includes(p)?' checked':'')+'> '+esc(p)+'</label>').join('');ri.querySelectorAll('input').forEach(cb=>cb.onchange=()=>draft[f.k]={mode:'people',val:[...ri.querySelectorAll('input:checked')].map(x=>x.value)});}
      else if(mode==='team'){ri.innerHTML='<select>'+TEAMS.map(t=>'<option'+((v&&v.val)===t[0]?' selected':'')+'>'+esc(t[0])+'</option>').join('')+'</select>';const s=ri.querySelector('select');draft[f.k]={mode:'team',val:s.value};s.onchange=()=>draft[f.k]={mode:'team',val:s.value};}
      else{ri.innerHTML='<input placeholder="'+(mode==='phones'?'+27 82 …, +27 83 …':'name@ubt.org, …')+'" value="'+esc((v&&typeof v.val==='string')?v.val:'')+'">';const inp=ri.querySelector('input');draft[f.k]={mode,val:inp.value};inp.oninput=()=>draft[f.k]={mode,val:inp.value};}};
    draw(cur);
    cell.querySelectorAll('.rmode button').forEach(b=>b.onclick=()=>{cell.querySelectorAll('.rmode button').forEach(x=>x.classList.toggle('on',x===b));draw(b.dataset.mo);});
  }
  else if(f.type==='textarea'){cell.innerHTML='<textarea rows="2" placeholder="'+esc(f.ph||'')+'">'+esc(v||'')+'</textarea>';cell.querySelector('textarea').oninput=e=>draft[f.k]=e.target.value;}
  else if(f.type==='select'){cell.innerHTML='<select>'+f.opts.map(o=>'<option'+(o===v?' selected':'')+'>'+esc(o)+'</option>').join('')+'</select>';const s=cell.querySelector('select');if(!v)draft[f.k]=f.opts[0];s.onchange=()=>draft[f.k]=s.value;}
  else if(f.type==='multiselect'){cell.innerHTML=f.opts.map(o=>'<label class="ckrow"><input type="checkbox" value="'+esc(o)+'"'+((v||[]).includes(o)?' checked':'')+'> '+esc(o)+'</label>').join('');cell.querySelectorAll('input').forEach(cb=>cb.onchange=()=>draft[f.k]=[...cell.querySelectorAll('input:checked')].map(x=>x.value));}
  else{cell.innerHTML='<input placeholder="'+esc(f.ph||'')+'" value="'+esc(v||'')+'">';cell.querySelector('input').oninput=e=>draft[f.k]=e.target.value;}
}
function renderFlow(){
  const cats=[...new Set(CAPS.map(c=>c.cat))];
  const palette=cats.map(cat=>'<div class="pcat">'+esc(cat)+'</div>'+CAPS.filter(c=>c.cat===cat).map(c=>'<div class="capblock" draggable="true" data-id="'+c.id+'">'+ICON[c.ik]+'<span>'+esc(c.n)+'</span></div>').join('')).join('');
  const steps=FLOW.steps.map((st,i)=>{const c=capById(st.cap),s=stepStatus(st);return '<div class="connector"></div><div class="stepcard'+(s.ready?'':' unset')+'"><div class="snum">'+(i+1)+'</div><div class="sic">'+ICON[c.ik]+'</div><div class="smain"><div class="sname">'+esc(c.n)+'</div><div class="scfg">'+(s.ready?esc(s.summary):'<span class="needpill">Needs setup</span>')+'</div></div><button class="sgear" data-i="'+i+'" title="Configure">'+ICON.gear+'</button><button class="srm" data-i="'+i+'" title="Remove">×</button></div>';}).join('');
  $('#view-flow').innerHTML='<button class="backlink" onclick="go(\'autos\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg> All automations</button>'
    +'<div class="flowhead"><input class="fname" id="flow-name" value="'+esc(FLOW.name)+'"'+(FLOW.owner==="Thato S."?'':' readonly')+'><div class="sp"></div>'
    +'<span class="scopechip">'+ICON.shield+' Runs as '+(FLOW.owner==="Thato S."?'you':esc(FLOW.owner))+'</span>'
    +(FLOW.owner==="Thato S."
        ? (FLOW.shared?'<span class="scopechip" style="color:var(--good);background:var(--good-soft)">'+ICON.people+' Shared &middot; clone</span>':'<button class="btn" id="flow-share">'+ICON.people+' Share to team</button>')
          +'<div class="toggle'+(FLOW.on?' on':'')+'" id="flow-toggle"><span class="tk"></span>'+(FLOW.on?"On":"Off")+'</div>'
          +'<button class="btn pri" id="flow-save"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-4-7 4V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg> Save automation</button>'
        : '<span class="scopechip">'+ICON.people+' '+esc(FLOW.team||'Team')+'</span><button class="btn pri" id="flow-clone">'+ICON.flow+' Add my copy</button>')
    +'</div>'
    +'<div class="flowbody"><div class="palette"><div class="ph">Capabilities</div><div class="phs">Drag onto the flow, or click to add. Only capabilities you\'re allowed to run appear here.</div>'+palette+'</div>'
    +'<div class="canvas" id="flow-canvas"><div class="trigger-card"><div class="tl">'+ICON.bolt+' Trigger — when this happens</div><select id="trig-type">'+TRIGTYPES.map(t=>'<option value="'+t.id+'"'+(t.id===FLOW.trig?' selected':'')+'>'+esc(t.n)+'</option>').join('')+'</select><div class="trig-cfg" id="trig-cfg">'+trigCfgHTML()+'</div></div>'
    +'<div id="flow-steps">'+steps+'</div>'
    +'<div class="connector"></div><div class="dropzone" id="flow-drop">Drag a capability here to add a step</div>'
    +'<div class="flownote">'+ICON.shield+' Every step runs as '+(FLOW.owner==="Thato S."?'you':esc(FLOW.owner))+' — an automation can never do what its owner couldn\'t. Sharing to a team doesn\'t widen access: each colleague adds their own copy that runs as them, scoped to their data.</div></div></div>';
  $('#flow-name').oninput=e=>{FLOW.name=e.target.value;$('#crumb').innerHTML='Automations <span style="opacity:.5">/</span> <b>'+esc(FLOW.name)+'</b>';};
  $('#trig-type').onchange=e=>{FLOW.trig=e.target.value;renderFlow();};
  $('#trig-cfg').querySelectorAll('[data-k]').forEach(el=>{el.onchange=el.oninput=()=>{FLOW.cfg[el.dataset.k]=el.value;};});
  const _tog=$('#flow-toggle');if(_tog)_tog.onclick=()=>{FLOW.on=!FLOW.on;renderFlow();};
  const _sv=$('#flow-save');if(_sv)_sv.onclick=()=>{const rec={name:FLOW.name,trig:FLOW.trig,cfg:Object.assign({},FLOW.cfg),steps:JSON.parse(JSON.stringify(FLOW.steps)),on:FLOW.on,owner:FLOW.owner,shared:!!FLOW.shared,team:FLOW.team};if(FLOW.idx!==null)WORKFLOWS[FLOW.idx]=rec;else{WORKFLOWS.unshift(rec);FLOW.idx=0;}toast("Automation saved"+(FLOW.on?" · now running":""));go('autos');};
  const _sh=$('#flow-share');if(_sh)_sh.onclick=shareFlow;
  const _cl=$('#flow-clone');if(_cl)_cl.onclick=cloneFlow;
  $('#view-flow').querySelectorAll('.capblock').forEach(b=>{b.onclick=()=>addStep(b.dataset.id);b.ondragstart=e=>e.dataTransfer.setData('text',b.dataset.id);});
  $('#view-flow').querySelectorAll('.srm').forEach(b=>b.onclick=()=>{FLOW.steps.splice(+b.dataset.i,1);renderFlow();});
  $('#view-flow').querySelectorAll('.sgear').forEach(b=>b.onclick=()=>configModal(+b.dataset.i));
  const dz=$('#flow-drop'),canvas=$('#flow-canvas');
  [dz,canvas].forEach(el=>{el.ondragover=e=>{e.preventDefault();dz.classList.add('over');};el.ondragleave=()=>dz.classList.remove('over');el.ondrop=e=>{e.preventDefault();dz.classList.remove('over');const id=e.dataTransfer.getData('text');if(id)addStep(id);};});
}

/* ---------- dashboards ---------- */
function miniChart(c){return '<div class="minibars">'+c.data.map(d=>'<div class="mbar"><div class="mcol'+(d[2]?' mut':'')+'" style="height:'+Math.max(6,d[1]/c.max*100)+'%"></div></div>').join('')+'</div>';}
function tileHTML(t,ti){const a=ANSWERS[t.id];let body='';
  if(a.metrics)body+='<div class="dt-metrics">'+a.metrics.slice(0,2).map(m=>'<div class="dm"><div class="dmv">'+m.v+'</div><div class="dml">'+m.l+'</div></div>').join('')+'</div>';
  if(a.chart)body+=miniChart(a.chart);
  if(!a.metrics&&!a.chart)body='<div style="color:var(--muted);font-size:13px">'+esc(a.lede.replace(/<[^>]+>/g,'').slice(0,90))+'…</div>';
  return '<div class="dtile" onclick="openFromCard(\''+t.id+'\')"><div class="dt-head"><div class="dt-title">'+esc(a.q)+'</div><button class="dt-rm" data-ti="'+ti+'">×</button></div><div class="dt-body">'+body+'</div><div class="dt-foot"><span class="badge live" style="padding:2px 9px;font-size:10.5px">↻ '+esc(t.refresh)+'</span> updated 2m ago<span class="sp"></span><span class="badge scope" style="padding:2px 9px;font-size:10.5px">scoped to you</span></div></div>';}
function renderDashes(){
  $('#view-dashes').innerHTML='<div class="pagehead"><div><div class="eyebrow">Dashboards</div><h1>Dashboards</h1><div class="desc">Pin reports to a personal or team dashboard — each tile refreshes on its own cadence and re-runs scoped to whoever\'s looking.</div></div><button class="btn pri" onclick="newDashModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg> New dashboard</button></div>'
    +'<div class="teamrow">'+DASHBOARDS.map((d,i)=>'<button class="team" onclick="openDash('+i+')"><div class="ti" style="background:'+(d.type==='team'?"#8E44AD":"#1F52A0")+'">'+ICON.grid+'</div><div style="flex:1;min-width:0"><div class="tn">'+esc(d.name)+'</div><div class="td">'+(d.type==='team'?'Team · '+esc(d.team):'Personal')+' · '+d.tiles.length+' reports</div></div><div class="tc">'+(d.type==='team'?"Shared":"Private")+'</div></button>').join('')+'</div>';
}
function openDash(idx){const d=DASHBOARDS[idx];showOnly('dash');navActive('dashes');$('#crumb').innerHTML='Dashboards <span style="opacity:.5">/</span> <b>'+esc(d.name)+'</b>';
  $('#view-dash').innerHTML='<button class="backlink" onclick="go(\'dashes\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg> All dashboards</button>'
    +'<div class="teamhero"><div class="ti" style="background:'+(d.type==='team'?"#8E44AD":"#1F52A0")+'">'+ICON.grid+'</div><div><h1>'+esc(d.name)+'</h1><div class="th-d">'+(d.type==='team'?'Team dashboard · '+esc(d.team):'Personal dashboard')+' · '+d.tiles.length+' reports · live</div></div></div>'
    +(d.tiles.length?'<div class="dgrid">'+d.tiles.map((t,ti)=>tileHTML(t,ti)).join('')+'</div>':'<div class="empty">No reports yet. Open a report and choose “Add to dashboard”.</div>');
  $('#view-dash').querySelectorAll('.dt-rm').forEach(b=>b.onclick=e=>{e.stopPropagation();DASHBOARDS[idx].tiles.splice(+b.dataset.ti,1);openDash(idx);});
}
function dashModal(id){const m=$('#modal');
  m.innerHTML='<div class="modal"><h3>Pin to a dashboard</h3><div class="msub">Pin this answer as a live tile — it refreshes on a cadence and re-runs scoped to each viewer.</div>'
    +'<div class="field"><label>Dashboard</label><select id="dash-sel">'+DASHBOARDS.map((d,i)=>'<option value="'+i+'">'+esc(d.name)+(d.type==='team'?' (team)':' (personal)')+'</option>').join('')+'<option value="new">＋ New dashboard…</option></select></div>'
    +'<div class="field" id="dash-new" style="display:none"><label>New dashboard</label><input id="dash-name" placeholder="e.g. Regional overview"><div class="seg2" id="dash-type" style="margin-top:8px;width:fit-content"><button class="on" data-t="personal">Personal</button><button data-t="team">Team</button></div></div>'
    +'<div class="field"><label>Refresh every</label><select id="dash-refresh">'+CADENCES.map(c=>'<option'+(c==='Every 30 min'?' selected':'')+'>'+esc(c)+'</option>').join('')+'</select></div>'
    +'<div class="sharenote" style="background:var(--accent-soft);color:var(--accent)">↻ You set the refresh when you publish it — the tile then updates on that cadence, scoped to each viewer.</div>'
    +'<div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn pri" onclick="doAddDash(\''+id+'\')">Add to dashboard</button></div></div>';
  m.classList.add('on');
  $('#dash-sel').onchange=e=>{$('#dash-new').style.display=e.target.value==='new'?'':'none';};
  $('#dash-type').querySelectorAll('button').forEach(b=>b.onclick=()=>$('#dash-type').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)));
}
function doAddDash(id){const sel=$('#dash-sel').value,refresh=$('#dash-refresh').value;let di;
  if(sel==='new'){const name=($('#dash-name').value||'').trim()||'New dashboard';const type=$('#modal #dash-type .on').dataset.t;DASHBOARDS.push({name,type,team:type==='team'?'LDM Operations':undefined,tiles:[]});di=DASHBOARDS.length-1;}
  else di=+sel;
  DASHBOARDS[di].tiles.push({id,refresh});closeModal();toast('Added to '+DASHBOARDS[di].name+' · refreshes '+refresh.toLowerCase());}
function newDashModal(){const m=$('#modal');
  m.innerHTML='<div class="modal"><h3>New dashboard</h3><div class="msub">A personal dashboard is yours; a team dashboard is shared — each tile still re-runs scoped to the viewer.</div><div class="field"><label>Name</label><input id="nd-name" placeholder="e.g. Regional overview"></div><div class="field"><label>Type</label><div class="seg2" id="nd-type" style="width:fit-content"><button class="on" data-t="personal">Personal</button><button data-t="team">Team</button></div></div><div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn pri" onclick="doNewDash()">Create</button></div></div>';
  m.classList.add('on');$('#nd-type').querySelectorAll('button').forEach(b=>b.onclick=()=>$('#nd-type').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)));
}
function doNewDash(){const name=($('#nd-name').value||'').trim()||'New dashboard';const type=$('#modal #nd-type .on').dataset.t;DASHBOARDS.push({name,type,team:type==='team'?'LDM Operations':undefined,tiles:[]});closeModal();renderDashes();toast('Created '+name);}


/* ---------- chat history drawer ---------- */
let CDGROUP=1,CDQ='';
function renderChatDrawer(){const q=CDQ.toLowerCase();
  const chs=CHATS.filter(c=>!q||ANSWERS[c.id].q.toLowerCase().includes(q));
  $('#cd-body').innerHTML=chs.length?(CDGROUP?groupsHTML(chs,c=>c.id,chatRow):'<div class="tgroup"><div class="rows">'+chs.map(chatRow).join('')+'</div></div>'):'<div class="empty">No chats match.</div>';
}
function openCDrawer(){$('#cdrawer').classList.add('on');$('#chandle').style.display='none';renderChatDrawer();}
function closeCDrawer(){$('#cdrawer').classList.remove('on');$('#chandle').style.display='';}

/* ---------- wiring ---------- */
$('#brandmark').innerHTML=PAW;
document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>go(a.dataset.view)));
$('#fu-in').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submitFollowup();}});
$('#fu-in').addEventListener('input',e=>{e.target.style.height='auto';e.target.style.height=Math.min(120,e.target.scrollHeight)+'px';});
/* global search is owned by the boot handler — see 90-boot-v2.js */
setCount('ws-count',REPORTS.length);setCount('lib-count',LIBRARY.length);
$('#thread').addEventListener('click',e=>{const th=e.target.closest('th.sortable');if(th)sortTable(th);});
document.addEventListener('click',()=>document.querySelectorAll('.rpop.on').forEach(p=>p.classList.remove('on')));
$('#chandle').querySelector('.chcount').textContent=CHATS.length;
$('#chandle').onclick=openCDrawer;$('#cd-close').onclick=closeCDrawer;
$('#cd-group').querySelectorAll('button').forEach(b=>b.onclick=()=>{CDGROUP=+b.dataset.g;$('#cd-group').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));renderChatDrawer();});
$('#cd-search').oninput=e=>{CDQ=e.target.value;renderChatDrawer();};
$('#cd-body').addEventListener('click',e=>{if(e.target.closest('.row2'))closeCDrawer();});
(function(){let t;try{t=localStorage.getItem('spiff-theme')}catch(e){}if(t)document.documentElement.setAttribute('data-theme',t);
$('#thm').addEventListener('click',()=>{const cur=document.documentElement.getAttribute('data-theme');const isDark=cur==='dark'||(!cur&&matchMedia('(prefers-color-scheme:dark)').matches);const nx=isDark?'light':'dark';document.documentElement.setAttribute('data-theme',nx);try{localStorage.setItem('spiff-theme',nx)}catch(e){}setTimeout(repaintAllCharts,60);});})();
