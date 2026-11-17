"""Generates PRODUCTION.md for «Город, который умер вчера» from one scene table, so every AI-video prompt
repeats the exact same character reference (no drift between scenes)."""
import os

MARK_EN = ("Mark, a 29-year-old European man, 182 cm, slim athletic build; oval face with defined cheekbones, straight nose, "
           "light three-day stubble, small thin scar through the outer end of his left eyebrow; grey-blue eyes; dark-brown "
           "short hair, slightly messy, longer on top and swept to the right; wears an olive-green waxed cotton field jacket "
           "(M-65 style, four front pockets, collar up) over a charcoal-grey hoodie, dark navy slim jeans, worn white-grey "
           "leather sneakers, a silver analog wristwatch on the left wrist whose hands are stopped at 7:00, a black smartphone "
           "with a cracked top-left corner")
FUTURE_EN = ("Future Mark: the same man as Mark but visibly three years older and exhausted - same face and grey-blue eyes, "
             "same scar through the left eyebrow, hair grown to chin length and pushed back, a short 1 cm beard, a pale burn "
             "scar across the back of his right hand; wears the SAME olive-green M-65 field jacket but torn at the left "
             "shoulder and covered in grey dust, charcoal hoodie, dark navy jeans, white-grey sneakers, the same silver "
             "watch stopped at 7:00")
VERA_EN = ("Dr. Vera Lind, a 34-year-old Scandinavian-looking woman, 170 cm, slender; ash-blonde straight bob to the jaw, "
           "thin black rectangular glasses, calm pale-green eyes, a tiny mole under the right eye; white lab coat over a "
           "black turtleneck, dark grey trousers, black low boots, a laminated ID badge reading \"MIRROR / LEAD\" on the "
           "left chest pocket")
STYLE = ("Vertical 9:16 frame, photorealistic CGI, Unreal Engine 5 quality, Hollywood cinematic VFX, ultra-detailed "
         "environment, realistic human facial animation and micro-expressions, advanced global illumination, volumetric "
         "fog, realistic reflections, physically accurate materials, cinematic shallow depth of field, anamorphic lens "
         "character, high-end film color grading (teal-and-amber, crushed but detailed blacks), subtle film grain")
NEG = ("Negative: no face distortion, no extra fingers, no inconsistent clothing, no character morphing, no unnatural "
       "movement, no flickering, no text artifacts, no cartoon style, no people in the background unless stated")
CITY = "an empty modern European megacity (mix of 19th-century stone facades and glass high-rises, tram lines, wide boulevards)"

# scene = (sec, RU what happens, who, emotion, movement, angle, camera move, light, atmosphere, sfx, dialogue, transition,
#          EN action, EN location/time/weather, EN camera, EN light, cast keys)
EP = []

EP.append(("Город без людей", "Марк просыпается в пустом городе, получает предупреждение и находит запись себя из будущего.", [
 (4, "Пролёт над пустым проспектом: десятки машин стоят посреди дороги с открытыми дверями, светофоры погасли.", "никого", "—", "—", "сверху, высокий ракурс", "быстрый дрон-пролёт вниз к асфальту", "холодный рассвет, серо-голубой", "мокрый асфальт, туман, тишина", "ветер, далёкий собачий лай, щелчок реле", "Закадр: «Семь утра. Город на два миллиона человек. И ни одного звука».", "резкая склейка на звонок будильника",
  "A fast aerial drone dive over a wide boulevard where dozens of cars are stopped in the middle of the road with doors left open, traffic lights dark", CITY + ", 7:00 a.m., cold dawn after rain, wet asphalt with mirror reflections, low fog between buildings", "high aerial top-down shot diving toward the asphalt, ending low above a car roof", "cold blue-grey dawn light, soft overcast, no artificial light anywhere", []),
 (6, "Марк просыпается в квартире, тянется к телефону: «Нет сети». Щёлкает выключателем — ничего.", "Марк", "сонное недоумение → тревога", "садится на кровати, жмёт выключатель", "средний план, уровень глаз", "медленный наезд к лицу", "серый свет из окна", "квартира в старом доме, тиканье часов, которые стоят", "щелчок выключателя без отклика", "Марк (шёпотом): «Опять отключили?»", "Марк открывает входную дверь",
  "Mark wakes up in bed, reaches for his smartphone that shows 'No service', then flips a light switch that does nothing; his face turns from sleepy to uneasy", "a small apartment in an old European building, unmade bed, morning, grey daylight through tall windows, dust in the air", "medium shot at eye level, slow push-in to a close-up of his face", "soft grey window light, no lamps on, gentle volumetric light beams", ["mark"]),
 (7, "Марк выходит на улицу. Машины брошены, двери открыты, двигатель одной ещё тёплый — над капотом пар.", "Марк", "растерянность", "идёт между машинами, касается капота", "низкий ракурс от асфальта", "steadicam следом за героем", "холодный рассвет", "пустой перекрёсток, туман", "шаги, капли с крыш, тихое шипение остывающего мотора", "Закадр: «Моторы ещё тёплые».", "панорама на витрину кофейни",
  "Mark walks slowly between abandoned cars with open doors; he touches a car hood and a thin wisp of steam rises from it", CITY + ", empty intersection at 7:40 a.m., overcast, wet asphalt, light fog", "low-angle steadicam following Mark from behind, then orbiting to his profile", "cold diffused dawn light with faint warm reflections in puddles", ["mark"]),
 (6, "Кофейня открыта: на столах дымится кофе, недоеденные круассаны, на полу — упавший телефон с вибрирующим будильником.", "Марк", "страх", "медленно входит, оглядывается", "широкий план интерьера", "медленный dolly-in", "тёплый тусклый свет из витрины", "запах кофе, пар над чашками", "тихая вибрация чужого телефона", "—", "крик Марка",
  "Mark steps into an open café where cups of coffee are still steaming on every table, half-eaten croissants lie on plates, and a dropped phone vibrates on the floor; nobody is inside", "a modern European café interior, morning, rain outside the glass front", "wide interior shot, slow dolly-in toward Mark", "warm dim daylight through the window, steam lit by side light", ["mark"]),
 (5, "Марк выбегает на площадь и кричит. Эхо. Голуби взлетают.", "Марк", "паника", "кричит, разворачивается", "сверху вниз на маленькую фигуру на огромной площади", "резкий отъезд вверх", "серое небо", "пустая площадь", "эхо крика, хлопанье крыльев", "Марк: «Есть кто-нибудь?!»", "внезапная тишина",
  "Mark runs into the middle of a vast empty city square and shouts; pigeons burst into the air around him", CITY + ", central square with a fountain, morning, overcast", "starts at medium shot, then fast crane pull-up to a high top shot showing his tiny figure", "flat grey overcast light", ["mark"]),
 (6, "На площади светится единственный экран. Телефон Марка вибрирует: «Не выходи на улицу в 19:00. Ты уже однажды умер».", "Марк", "ужас", "смотрит в телефон, медленно поднимает голову", "крупный план экрана телефона → крупный план глаз", "rack focus с экрана на лицо", "синий свет экрана на лице", "помехи на большом экране", "вибрация, электронный писк, резкая тишина", "Текст на экране: «НЕ ВЫХОДИ НА УЛИЦУ В 19:00. ТЫ УЖЕ ОДНАЖДЫ УМЕР»", "склейка на бег",
  "Close-up of Mark's cracked smartphone screen lighting up with a message from an unknown number, then a rack focus to his eyes widening in fear; behind him a giant billboard screen flickers with static", CITY + ", square, late morning, light drizzle", "extreme close-up on the phone screen, rack focus to his face", "cold blue phone light on his face, flickering white light from the billboard", ["mark"]),
 (7, "В будке охраны банка Марк перематывает запись: на экране — он сам на этой площади. Дата — завтрашняя. Марк на записи смотрит прямо в камеру.", "Марк, Марк на записи", "шок", "склоняется к монитору", "через плечо на монитор", "медленный наезд в экран до пикселей", "зелёный свет мониторов", "тесная будка, мигающий REC", "писк перемотки, гул", "Марк на записи: «Если ты это смотришь, значит, я опять не успел».", "срез в чёрное",
  "In a tiny bank security booth, Mark leans toward a CCTV monitor; the grainy footage shows Mark himself standing in the square, the timestamp shows tomorrow's date, and the Mark on the screen slowly raises his eyes straight into the camera", "a cramped security booth inside a bank lobby, CCTV monitors, flashing REC light", "over-the-shoulder shot, then slow push-in into the monitor until scanlines fill the frame", "green-white monitor glow, darkness around", ["mark"]),
]))

EP.append(("Завтра уже наступило", "Марк ищет отправителя: все часы стоят на 18:59, метро говорит его голосом и даёт адрес.", [
 (4, "Хук: все часы города — на башне, в витринах, на руке Марка — показывают 18:59.", "Марк", "напряжение", "смотрит на свои часы", "крупно: циферблаты, монтаж", "быстрые наезды", "холодный дневной", "тишина без тиканья", "один удар часов, затем тишина", "Закадр: «Все часы в городе остановились. На одной минуте».", "склейка на улицу",
  "Rapid sequence: the giant clock on a stone tower, clocks in shop windows and the silver watch on Mark's wrist all show 18:59 and do not move", CITY + ", midday, overcast", "macro close-ups with quick push-ins", "cold daylight, metallic reflections on watch glass", ["mark"]),
 (8, "Марк ищет вышку связи, с которой пришло сообщение. На крыше — антенна, внизу — сотни одинаковых бумажек «19:00».", "Марк", "решимость", "поднимается по пожарной лестнице", "низкий ракурс снизу", "вертикальный подъём камеры", "пасмурно", "ветер на высоте", "свист ветра, скрип металла", "Марк: «Кто ты?»", "звук поезда из-под земли",
  "Mark climbs a fire escape onto a rooftop with a cell antenna; hundreds of small paper notes reading '19:00' are scattered and fluttering in the wind", CITY + ", rooftop above the old town, midday, strong wind, low clouds", "low-angle crane following him up the ladder, ending on a wide rooftop reveal", "overcast silver light, wind-blown paper catching light", ["mark"]),
 (8, "Метро. Пустой вагон с открытыми дверями. Включается объявление — голосом Марка.", "Марк", "мурашки", "застывает на платформе", "симметричный широкий план платформы", "медленный трэвеллинг вдоль платформы", "мерцающие лампы", "пустая станция", "гул тоннеля, щелчок динамика", "Голос Марка из динамика: «Марк. Улица Северная, семнадцать. Не опаздывай».", "свет гаснет",
  "Mark stands frozen on an empty subway platform next to a train with open doors; ceiling lamps flicker as an announcement plays", "an empty modern European metro station, tiled walls, a stopped train with open doors", "symmetrical wide shot, slow lateral tracking along the platform", "flickering cold fluorescent light, deep shadows in the tunnel", ["mark"]),
 (6, "Марк бежит по туннелю к выходу, свет фонарика телефона.", "Марк", "страх", "бег", "спереди, на герое", "ручная камера, лёгкая тряска", "только фонарик", "тьма, капли", "дыхание, шаги, капли", "—", "выход на улицу в тумане",
  "Mark runs through a dark metro tunnel lit only by his phone flashlight, breathing hard", "dark metro service tunnel, wet concrete, cables along the walls", "handheld front-facing tracking shot with slight shake", "single phone flashlight beam, volumetric dust", ["mark"]),
 (7, "Улица Северная, 17. Старый дом. Все окна тёмные, кроме одного.", "Марк", "настороженность", "стоит у подъезда", "общий план дома снизу", "медленный tilt вверх к горящему окну", "сумерки наступают рано", "туман", "гудение лампы в окне", "Закадр: «Свет горел только в одном окне».", "склейка на лестницу",
  "Mark stands in front of an old six-storey building at 17 Severnaya Street; every window is dark except one warmly lit window on the top floor", CITY + ", old residential street, early dusk, fog", "wide low-angle shot, slow tilt up to the lit window", "blue dusk ambience with a single warm window glow", ["mark"]),
 (8, "Последний этаж. Дверь. На табличке — «МАРК» и завтрашняя дата.", "Марк", "шок", "касается таблички", "крупный план таблички", "медленный наезд", "тусклая лампа", "запах пыли", "сердцебиение, затем тишина", "Табличка: «МАРК · 18.11»", "дверь сама приоткрывается",
  "Mark touches a brass nameplate on an apartment door that reads his name and tomorrow's date; the door slowly creaks open by itself", "a dim old stairwell, top-floor landing, peeling paint", "close-up on the nameplate, slow push-in, then pull back as the door opens", "single dim warm bulb, dust in the light", ["mark"]),
]))

EP.append(("Человек из прошлого", "Внутри — архив его прошлых дней: он уже много раз проживал этот день.", [
 (5, "Хук: стена комнаты покрыта сотнями фотографий Марка — на каждой он на той же площади.", "Марк", "ужас узнавания", "медленно поворачивается к стене", "широкий план стены", "медленный объезд по дуге", "тёплая лампа", "архивная комната", "шелест бумаги", "Закадр: «Сотни фотографий. Везде — он».", "наезд на одно фото",
  "Mark turns to face a wall completely covered with hundreds of printed photographs of himself standing in the same square", "a cluttered attic room turned into an archive, desk lamp, cables, monitors", "wide shot with a slow arcing camera move", "warm tungsten desk lamp, everything else in shadow", ["mark"]),
 (8, "Видеокассеты с датами. На всех записях он делает одно и то же — но день кончается по-разному: огонь, вода, обрыв.", "Марк", "растерянность", "включает записи одну за другой", "через плечо на экраны", "быстрые наезды на мониторы", "свет мониторов", "щёлканье кнопок", "помехи VHS", "—", "склейка на записку",
  "Mark switches on several old monitors one after another; each shows him repeating the same day but with a different ending - fire, flooding water, a fall from a roof", "the same archive room, a row of old CRT monitors", "over-the-shoulder shots with quick push-ins to each screen", "flickering monitor light on his face", ["mark"]),
 (7, "Записка его почерком: «Попытка №47. Не доверяй часам».", "Марк", "холод по коже", "держит записку дрожащей рукой", "макро", "rack focus", "лампа", "—", "тиканье, которого быть не может", "Записка: «ПОПЫТКА №47. НЕ ДОВЕРЯЙ ЧАСАМ»", "звук шага за спиной",
  "Macro shot of Mark's trembling hand holding a handwritten note in his own handwriting", "archive desk under a lamp", "macro close-up with rack focus from the note to his eyes", "warm lamp light, deep shadows", ["mark"]),
 (7, "В ящике стола — пропуск с его фото: «MIRROR · ИНЖЕНЕР · МАРК». Он не помнит, что там работал.", "Марк", "недоверие", "вертит пропуск в руках", "крупно пропуск", "медленный наезд", "лампа", "пыль", "щелчок ящика", "Пропуск: «MIRROR · ИНЖЕНЕР · МАРК»", "зачёркнутые дни на стене",
  "Mark pulls an ID badge out of a desk drawer: it has his photo and reads 'MIRROR - ENGINEER - MARK'; he turns it over in disbelief", "archive desk under a lamp", "close-up on the badge, slow push-in, then tilt up to his face", "warm lamp light, dust particles", ["mark"]),
 (8, "Марк понимает, что пытался разгадать это много раз. Садится, считает зачёркнутые дни на стене — их 46.", "Марк", "отчаяние", "опускается на стул", "средний план", "медленный отъезд", "полутьма", "тишина", "тяжёлое дыхание", "Марк: «Сорок шесть раз… и ни разу не успел».", "отражение в стекле",
  "Mark sinks into a chair and stares at a wall covered with 46 crossed-out tally marks", "archive room, dusk outside", "medium shot with a slow pull-back", "dim blue dusk through the window plus warm lamp", ["mark"]),
 (7, "Финал: в тёмном стекле окна за его плечом стоит человек — точь-в-точь как он.", "Марк, двойник (силуэт)", "оцепенение", "замирает, не оборачиваясь", "через стекло", "медленный наезд на отражение", "отражение в окне", "туман за стеклом", "скрип половицы, тишина", "—", "срез в чёрное",
  "In the dark window glass behind Mark's shoulder, a reflection of a man identical to Mark appears and stands perfectly still; Mark freezes without turning around", "archive room window at night, fog outside", "shot through the glass reflection, slow push-in on the second figure", "low-key lighting, the reflection lit faintly from behind", ["mark"]),
]))

EP.append(("Секрет под городом", "Под городом — комплекс MIRROR: эксперимент, связанный с 19:00.", [
 (5, "Хук: пол архива проваливается — под ним бетонная шахта с лестницей вниз, снизу бьёт голубой свет.", "Марк", "решимость", "спускается", "сверху в шахту", "вертикальный спуск камеры", "голубое свечение снизу", "холодный пар", "гул генераторов", "—", "спуск",
  "A hidden floor hatch opens to reveal a deep concrete shaft with a ladder; cold blue light glows from far below as Mark begins to climb down", "under the archive building, concrete shaft", "top-down shot looking into the shaft, slow descent with the character", "strong cold blue underlight, volumetric haze", ["mark"]),
 (8, "Огромный подземный комплекс: ряды серверов, над ними — тысячи мерцающих точек, как окна города.", "Марк", "потрясение", "идёт по мостику", "широчайший план", "дрон-пролёт над залом", "голубой и белый", "гигантский зал", "гул, тихий хор электронных импульсов", "Закадр: «Под городом был ещё один город».", "наезд на логотип",
  "Mark walks along a narrow steel catwalk inside a gigantic underground hall filled with server towers; thousands of tiny lights above form the shape of the city", "massive underground research complex, steel and glass", "epic wide drone shot flying over the hall toward Mark", "cold blue and white practical lights, volumetric fog", ["mark"]),
 (7, "На стене — логотип MIRROR и протокол: «Временная фиксация состояния города. Окно: 19:00».", "Марк", "сосредоточенность", "читает", "средний план", "медленный pan по тексту", "экраны", "—", "электронный писк", "Экран: «MIRROR · ВРЕМЕННАЯ ФИКСАЦИЯ · ОКНО 19:00»", "видеозапись",
  "Mark reads a large wall display with the logo 'MIRROR' and a protocol about a temporal anomaly at 19:00", "control room inside the complex, curved wall screens", "medium shot with slow lateral pan across the screens", "screen glow, cool tones", ["mark"]),
 (8, "Запись: учёная Вера Линд говорит в камеру: «Если в 19:00 ядро сорвётся, город откатится. Люди останутся в зеркале».", "Вера (на записи)", "усталость, страх", "говорит в камеру", "фронтальный крупный", "статичная камера записи", "лабораторный свет", "сирена на фоне", "сирена, помехи", "Вера: «Люди останутся в зеркале. Все, кроме якоря».", "Марк касается экрана",
  "Recorded video on a lab monitor: Dr. Vera Lind speaks directly into the camera, exhausted and scared, with a warning siren light pulsing behind her", "laboratory inside the MIRROR complex", "static front-facing close-up as a CCTV-style recording, slight scanlines", "cold lab light with a pulsing red alarm in the background", ["vera"]),
 (7, "Марк узнаёт Веру — и у него раскалывается голова: обрывки памяти, её смех, белый халат.", "Марк", "боль, узнавание", "хватается за голову", "крупный", "резкие вспышки-флешбэки", "вспышки белого", "звон в ушах", "искажённый смех, высокий звон", "Марк: «Я… я её знаю».", "сканер",
  "Mark grabs his head in pain as fragmented flashbacks flash over his face: a woman laughing in a white lab coat", "control room", "close-up with quick white flash transitions", "harsh white flashes over cool ambient", ["mark", "vera"]),
 (8, "Финал: красный луч сканирует Марка. Экран: «ОБЪЕКТ №001. ПАМЯТЬ ВОССТАНОВЛЕНА НА 73%».", "Марк", "шок", "замирает в луче", "фронтально", "медленный наезд на экран", "красный скан", "сирена стихает", "сканирующий гул, писк", "Экран: «ОБЪЕКТ №001 · ПАМЯТЬ ВОССТАНОВЛЕНА НА 73%»", "срез в чёрное",
  "A red laser grid scans Mark's body; a huge screen behind him displays 'OBJECT #001 - MEMORY RESTORED 73%'", "control room", "frontal medium shot, slow push-in toward the screen text", "red scanning light cutting through blue haze", ["mark"]),
]))

EP.append(("Последнее предупреждение", "Записи прошлых циклов, будущий Марк и правда о создателе.", [
 (5, "Хук: на всех экранах зала — 46 Марков, каждый говорит в камеру одно слово.", "Марки на экранах", "мольба", "говорят", "стена экранов", "быстрый отъезд", "свет экранов", "хор голосов", "наложение голосов", "Хор: «Не… спасай… город…»", "склейка на Марка",
  "A wall of 46 screens, each showing a different version of Mark speaking a single word into the camera", "control room screen wall", "fast pull-back revealing the whole wall", "multicolored screen glow", ["mark"]),
 (8, "Марк смотрит записи: каждый раз, когда он пытается спасти город, день перезапускается.", "Марк", "осознание", "листает записи", "через плечо", "медленный наезд", "экраны", "—", "щелчки", "Закадр: «Каждое спасение запускало день заново».", "шаги в темноте",
  "Mark scrolls through recordings of himself; each ends with the city resetting in a flash of white light", "control room", "over-the-shoulder, slow push-in", "screen light, white reset flashes", ["mark"]),
 (8, "Из темноты выходит будущий Марк: старше, с бородой, в разорванной куртке.", "Марк, будущий Марк", "страх / усталость", "медленно выходит на свет", "снизу, контровой свет", "медленный наезд", "контровой голубой", "дым", "шаги, гул", "Будущий Марк: «Наконец-то ты дошёл».", "диалог",
  "Future Mark slowly steps out of the darkness into a beam of light, facing the present Mark", "underground control room filled with haze", "low-angle shot with strong backlight, slow push-in", "cold blue rim light, silhouettes", ["mark", "future"]),
 (9, "Будущий Марк объясняет: город — копия, люди в зеркале, а Марк — якорь системы.", "оба Марка", "напряжение", "стоят друг напротив друга", "профиль, два лица в кадре", "медленная дуга вокруг", "холодный", "тишина", "дыхание", "Будущий Марк: «Город — это зеркало. Люди внутри. А ты — якорь».", "часы",
  "Present Mark and Future Mark stand face to face in profile, talking quietly; the camera arcs slowly around them", "control room", "two-shot in profile with a slow 180-degree arc", "cool blue key light, warm rim from a screen", ["mark", "future"]),
 (6, "На всех экранах загорается таймер: 18:52.", "Марк", "паника", "смотрит на часы", "крупно таймер", "резкий наезд", "красный", "тревога", "сирена", "Экран: «18:52»", "финальная реплика",
  "Every screen in the hall switches to a red countdown showing 18:52", "control room", "fast push-in on the timer", "red alarm light", []),
 (8, "Финал: будущий Марк кладёт руку ему на плечо: «В этот раз не спасай город. Спаси того, кто его создал». И растворяется.", "оба Марка", "решимость / прощание", "растворяется в свете", "крупный", "медленный отъезд", "белый свет", "тишина", "звон, затем тишина", "Будущий Марк: «В этот раз не спасай город. Спаси того, кто его создал».", "срез в белое",
  "Future Mark places a hand on Mark's shoulder, says his final line, then dissolves into particles of white light", "control room", "close two-shot, slow pull-back as he dissolves", "soft white glow from the dissolving figure", ["mark", "future"]),
]))

EP.append(("19:00", "Решающая минута: Марк спасает Веру, и тайна раскрывается.", [
 (5, "Хук: таймер 18:59:50. Ядро MIRROR — огромное зеркальное кольцо, внутри которого застыла Вера.", "Марк, Вера", "ужас", "бежит к ядру", "широкий", "быстрый наезд", "белое ядро", "искры", "нарастающий гул", "—", "Марк у кольца",
  "A giant mirrored ring-shaped core hovers in the hall; inside it Dr. Vera Lind is frozen mid-motion; a red timer reads 18:59:50", "the core chamber of the MIRROR complex", "wide shot with a fast push-in toward the ring", "blinding white core light, sparks, volumetric haze", ["mark", "vera"]),
 (8, "Марк вспоминает всё: они создавали MIRROR вместе. В день аварии Вера осталась в ядре, чтобы удержать город. А он стал якорем.", "Марк", "память возвращается", "касается кольца", "крупный", "наложение флешбэков", "тёплый в флешбэках", "—", "музыка стихает", "Закадр: «Он вспомнил всё. Это был их проект».", "выбор",
  "Close-up of Mark touching the mirrored ring while warm flashbacks overlay: Mark and Vera working together, laughing in the lab", "core chamber", "close-up with layered flashback dissolves", "warm memory light over cold present light", ["mark", "vera"]),
 (7, "На экране два варианта: «Перезапустить город» и «Извлечь оператора».", "Марк", "выбор", "смотрит на панель", "через плечо на панель", "статично", "красный и синий", "тишина", "сердцебиение", "Экран: «ПЕРЕЗАПУСК ГОРОДА / ИЗВЛЕЧЬ ОПЕРАТОРА»", "решение",
  "A control panel shows two glowing options; Mark's hand hesitates between them", "core chamber control panel", "over-the-shoulder on the panel", "split red and blue light on his face", ["mark"]),
 (8, "19:00. Марк выбирает Веру. Он вытаскивает её из кольца — зеркало трескается.", "Марк, Вера", "отчаянная решимость", "тянет её за руку", "средний, контровой", "slow motion", "белая вспышка", "осколки света", "звон стекла, тишина", "Марк: «Держись за меня!»", "белая вспышка",
  "At exactly 19:00 Mark pulls Vera out of the mirrored ring by the hand as the mirror surface shatters into shards of light, in slow motion", "core chamber", "medium shot in slow motion with strong backlight", "explosive white light, glittering shards", ["mark", "vera"]),
 (8, "Тишина. Город за окнами наполняется звуками: шаги, машины, голоса. Люди вернулись.", "Марк, Вера", "облегчение, слёзы", "Вера открывает глаза, узнаёт его", "крупно лица", "медленный отъезд к окну с городом", "закатное золото", "оживший город", "гул города, сигнал машины", "Вера: «Марк… ты успел».", "время на часах",
  "Vera opens her eyes and recognizes Mark; behind them through a high window the city comes alive - people walking, cars moving, lights turning on", "observation deck above the city at sunset", "close-up on their faces, slow pull-back to reveal the living city", "warm golden sunset light", ["mark", "vera"]),
 (6, "Часы Марка снова идут: 19:01.", "Марк", "улыбка", "смотрит на запястье", "макро", "наезд", "закат", "—", "тиканье возвращается", "—", "сообщение",
  "Macro shot of Mark's silver watch: the second hand starts moving again, showing 19:01", "observation deck", "macro push-in", "warm sunset glints on the watch glass", ["mark"]),
 (7, "Последний поворот: телефон Марка вибрирует. Неизвестный номер: «Спасибо, папа. Увидимся в 19:00». У Марка нет детей.", "Марк", "холодный шок", "смотрит в телефон", "крупный экран", "rack focus на лицо", "свет экрана", "город шумит", "вибрация, затем тишина", "Сообщение: «СПАСИБО, ПАПА. УВИДИМСЯ В 19:00»", "чёрный экран, титр «Сезон 2»",
  "Close-up of Mark's cracked phone receiving a message from an unknown number; rack focus to his face turning pale", "observation deck at dusk, city lights behind", "extreme close-up on the phone, rack focus to his face", "cold phone light against warm city bokeh", ["mark"]),
]))

TITLES = ["Он проснулся — а город пуст. «Не выходи в 19:00. Ты уже однажды умер»",
          "Все часы остановились на 18:59. А метро заговорило его голосом",
          "Он проживал этот день 46 раз. И в отражении стоял он сам",
          "Под городом нашли второй город. «Объект №001. Память: 73%»",
          "К нему пришёл он сам из будущего: «Не спасай город»",
          "19:00. Он выбрал её. Но последнее сообщение всё изменило"]


# stretch every scene ~25% so each episode lands in 45-75 s, as the brief requires
EP = [(n, l, [(max(4, round(sc[0] * 1.25)),) + tuple(sc[1:]) for sc in scenes]) for n, l, scenes in EP]


def prompt(sc):
    sec, *_, act, loc, cam, light, cast = sc
    who = " ".join({"mark": MARK_EN, "future": FUTURE_EN, "vera": VERA_EN}[c] + "." for c in cast) or "No people in frame."
    return (f"{STYLE}. Duration {sec} seconds, one continuous shot, one main action. Characters: {who} Action: {act}. "
            f"Location, time and weather: {loc}. Camera: {cam}. Lighting: {light}. Realistic materials: wet asphalt, "
            f"glass, brushed steel, fabric with visible weave. VFX: subtle volumetric fog and atmospheric particles. "
            f"Mood: tense mystery thriller, silent empty city. {NEG}.")


out = ["# «Город, который умер вчера» — производственный документ", "",
       "Мини-сериал из 6 серий по 45–75 секунд для TikTok. Фантастика, мистический триллер, детектив.", "",
       "## 1. Концепция", "",
       "Марк, 29 лет, просыпается в абсолютно пустом европейском мегаполисе. Машины брошены посреди дорог, кофе на столах "
       "ещё горячий, электричества нет — кроме нескольких экранов. Телефон получает сообщение: «НЕ ВЫХОДИ НА УЛИЦУ В 19:00. "
       "ТЫ УЖЕ ОДНАЖДЫ УМЕР». Камера наблюдения показывает его самого — с завтрашней датой.", "",
       "**Главная тайна.** Под городом работает экспериментальная система MIRROR — «временное зеркало», которое каждый день "
       "в 19:00 фиксирует состояние города. В день аварии ядро сорвалось: жители оказались «внутри зеркала», а город "
       "откатывается к утру снова и снова. Учёная Вера Линд осталась в ядре, удерживая систему. Марк — её партнёр по проекту "
       "и «якорь» (объект №001): только он проживает цикл, но каждый раз теряет память. Он 46 раз пытался спасти город — и "
       "каждый раз запускал день заново. Выход — не спасать город, а спасти того, кто его создал: Веру.", "",
       "**Задел на 2 сезон:** «Спасибо, папа. Увидимся в 19:00» — у Марка нет детей. В зеркале остался кто-то ещё.", "",
       "## 2. Персонажи и визуальные референсы", "",
       "### Марк (главный герой) — одинаков во всех сериях",
       "- Возраст: 29. Рост 182 см, худощавое спортивное телосложение.",
       "- Лицо: овальное, выраженные скулы, прямой нос, трёхдневная щетина, тонкий шрам через внешний край левой брови.",
       "- Глаза: серо-голубые.", "- Причёска: тёмно-каштановые короткие волосы, сверху длиннее, зачёсаны вправо, слегка растрёпаны.",
       "- Одежда: оливковая вощёная полевая куртка M-65 (четыре кармана, поднятый воротник) поверх графитового худи, тёмно-синие узкие джинсы.",
       "- Обувь: поношенные бело-серые кожаные кеды.",
       "- Детали: серебряные часы на левой руке, стрелки которых стоят на 7:00; чёрный смартфон с трещиной в верхнем левом углу.", "",
       "### Будущий Марк", "- Тот же человек, но на 3 года старше и измотан: волосы до подбородка зачёсаны назад, борода 1 см, "
       "бледный шрам от ожога на тыльной стороне правой ладони. Та же куртка M-65, но порвана на левом плече и в серой пыли; те же часы.", "",
       "### Доктор Вера Линд — создатель MIRROR",
       "- 34 года, 170 см, стройная. Пепельно-русое каре до линии челюсти, тонкие чёрные прямоугольные очки, спокойные бледно-зелёные глаза, родинка под правым глазом.",
       "- Белый лабораторный халат поверх чёрной водолазки, тёмно-серые брюки, чёрные низкие ботинки, бейдж «MIRROR / LEAD».", "",
       "### Референсы на английском (вставлять в каждый промт без изменений)", "", f"- **Mark:** {MARK_EN}.",
       f"- **Future Mark:** {FUTURE_EN}.", f"- **Vera:** {VERA_EN}.", "",
       "## 3. Сценарии серий, раскадровка и промты", ""]
for n, (name, logline, scenes) in enumerate(EP, 1):
    total = sum(s[0] for s in scenes)
    out += [f"### Серия {n}. «{name}» — {total} сек", "", f"_{logline}_", ""]
    for k, sc in enumerate(scenes, 1):
        (sec, what, who, emo, move, angle, cmove, light, atm, sfx, dia, trans, *_rest) = sc
        out += [f"**Сцена {n}.{k} — {sec} сек**", f"1. Что происходит: {what}", f"2. В кадре: {who}", f"3. Эмоции: {emo}",
                f"4. Движение персонажа: {move}", f"5. Ракурс: {angle}", f"6. Движение камеры: {cmove}", f"7. Освещение: {light}",
                f"8. Атмосфера: {atm}", f"9. Звук: {sfx}", f"10. Диалог / текст: {dia}", f"11. Переход: {trans}", "",
                "Промт (EN):", "", "```", prompt(sc), "```", ""]
out += ["## 4. Звук и монтаж", "",
        "- Фон пустого города: низкий ветер, далёкие сигнализации, капли с крыш, редкий лай; никакого городского гула до 6-й серии.",
        "- Электронные помехи и писк — каждый раз, когда «работает» MIRROR (экраны, телефон, метро).",
        "- Музыка: тёмный эмбиент + пульсирующий бас; перед каждым открытием — 0,5–1 сек полной тишины, затем удар.",
        "- Хук в первые 2 секунды каждой серии, событие каждые 5–8 секунд, в конце — клиффхэнгер и секундная заставка с номером серии.",
        "- Реплики: короткие, на выдохе; голос закадра — ровный, напряжённый, без театральности.", "",
        "## 5. Заголовки и описания для TikTok", ""]
for n, ttl in enumerate(TITLES, 1):
    out += [f"**Серия {n}/6**", "```", f"{ttl} 🌆 Серия {n}/6", "Реклама: LuxerVPN — ищи @LuxerVpnBot в Telegram",
            "#luxerpvn #сериал #мистика #триллер #городкоторыйумервчера", "```", ""]
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "PRODUCTION.md"), "w").write("\n".join(out))
print("scenes:", sum(len(e[2]) for e in EP), "durations:", [sum(s[0] for s in e[2]) for e in EP])
