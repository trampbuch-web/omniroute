# Stress marks for words the TTS voice tends to misread (names, rare words).
# accent(text) puts U+0301 after the stressed vowel; a stem also covers its case endings.
import re

A = "́"
# stem with "+" before the stressed vowel; capitalised stems match only capitalised words
STEMS = """
Зюг+анов Груд+инин Фург+ал Сл+уцк Неч+аев Дав+анков Жирин+овск Лантр+атов Дм+итриев Песк+ов
Медв+едев Лужк+ов Примак+ов Фаберл+ик Хаб+аровск Мясн+ицк Ник+ольск Пож+арск М+инин Гр+амот
Роск+осмос Р+убио Над+оршин
соз+ыв лобб+ист экзитп+ол пр+аймериз кандел+ябр мр+аморн совх+оз дизт+оплив мемк+оин
""".split()
RULES = []
for s in STEMS:
    plain = s.replace("+", "")
    i = s.index("+")
    marked = plain[: i + 1] + A + plain[i + 1 :]  # vowel right after "+" gets the mark
    flags = 0 if plain[0].isupper() else re.I
    RULES.append((re.compile(r"(?<![\ẃ])" + plain, flags), plain, marked))


def accent(text):
    for rx, plain, marked in RULES:
        text = rx.sub(lambda m: m.group(0)[0] + marked[1:] if m.group(0)[0] != plain[0] else marked, text)
    return text


def strip(text):
    return text.replace(A, "")


if __name__ == "__main__":
    t = accent("Зюганов и Зюганова, созыве, Песков, лоббист, Фургал, «Фаберлик», Медведевым")
    assert "Зюга́нов" in t and "созы́ве" in t and "Песко́в" in t, t
    assert strip(t).startswith("Зюганов и Зюганова"), t
    print(t)
