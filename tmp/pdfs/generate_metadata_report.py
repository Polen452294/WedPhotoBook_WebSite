from __future__ import annotations

from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output" / "pdf" / "wedfotobook-titles-and-descriptions.pdf"

NAVY = colors.HexColor("#061D31")
BLUE = colors.HexColor("#0B4263")
GOLD = colors.HexColor("#B99769")
CREAM = colors.HexColor("#F7F3ED")
PAPER = colors.HexColor("#FFFDF9")
TEXT = colors.HexColor("#172431")
MUTED = colors.HexColor("#66717A")
LINE = colors.HexColor("#DCD7CF")
GREEN = colors.HexColor("#2E6B55")


def register_fonts() -> None:
    for name, path in {
        "SiteSans": "C:/Windows/Fonts/arial.ttf",
        "SiteSansBold": "C:/Windows/Fonts/arialbd.ttf",
        "SiteMono": "C:/Windows/Fonts/consola.ttf",
        "SiteMonoBold": "C:/Windows/Fonts/consolab.ttf",
    }.items():
        font_path = Path(path)
        if not font_path.exists():
            raise FileNotFoundError(font_path)
        pdfmetrics.registerFont(TTFont(name, str(font_path)))


register_fonts()

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="CoverTitle",
    fontName="SiteSansBold",
    fontSize=24,
    leading=29,
    textColor=colors.white,
    spaceAfter=12,
))
styles.add(ParagraphStyle(
    name="CoverSubtitle",
    fontName="SiteSans",
    fontSize=11,
    leading=16,
    textColor=colors.HexColor("#D9E0E5"),
))
styles.add(ParagraphStyle(
    name="Section",
    fontName="SiteSansBold",
    fontSize=17,
    leading=21,
    textColor=NAVY,
    spaceBefore=8,
    spaceAfter=9,
    keepWithNext=True,
))
styles.add(ParagraphStyle(
    name="Body",
    fontName="SiteSans",
    fontSize=9.2,
    leading=13.4,
    textColor=TEXT,
))
styles.add(ParagraphStyle(
    name="Small",
    fontName="SiteSans",
    fontSize=7.5,
    leading=10,
    textColor=MUTED,
))
styles.add(ParagraphStyle(
    name="Route",
    fontName="SiteMonoBold",
    fontSize=8.2,
    leading=11,
    textColor=colors.white,
))
styles.add(ParagraphStyle(
    name="Number",
    fontName="SiteSansBold",
    fontSize=8.2,
    leading=11,
    textColor=GOLD,
    alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    name="Label",
    fontName="SiteSansBold",
    fontSize=7.3,
    leading=9.5,
    textColor=BLUE,
))
styles.add(ParagraphStyle(
    name="Value",
    fontName="SiteSans",
    fontSize=8.8,
    leading=12.4,
    textColor=TEXT,
))
styles.add(ParagraphStyle(
    name="MetricNumber",
    fontName="SiteSansBold",
    fontSize=22,
    leading=24,
    textColor=NAVY,
    alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    name="MetricLabel",
    fontName="SiteSans",
    fontSize=7.4,
    leading=10,
    textColor=MUTED,
    alignment=TA_CENTER,
))


PAGES = [
    ("/", "Фотокнига на заказ в Москве — под ключ за 7 дней | wedfotobook.ru", "Заказать фотокнигу на заказ в Москве — от 8 900 руб. Индивидуальный дизайн, от 1 экз. Пришлите фото — сделаем под ключ за 7 дней. Консультация бесплатно!"),
    ("/otzyvy/", "Отзывы о фотокнигах | wedfotobook.ru", "Предлагаем ознакомиться с реальными отзывами наших клиентов, которые заказывали у нас фотокниги в подарок, на день рождения, юбилеи, выпускной или свадьбу."),
    ("/katalog/", "Каталог фотокниг на заказ — примеры работ | Москва | wedfotobook.ru", "Каталог фотокниг на заказ в Москве — свадебные, детские, семейные, выпускные. Под ключ от 8 900 руб. Индивидуальный дизайн, от 1 экз., за 7 дней."),
    ("/kontakty/", "Фотокниги в Москве на заказ | Контакты | 8-985-434-23-67 | wedfotobook.ru", "Фотокниги в Москве на заказ: звоните 8-985-434-23-67, ежедневно с 9:00 до 21:00. Пишите на 79854342367@yandex.ru. Сделаем фотокнигу за 7 дней!"),
    ("/stoimost/", "Цены на фотокниги на заказ в Москве — стоимость и прайс | wedfotobook.ru", "Стоимость фотокниги зависит от выбранной обложки, формата фотокниги и количества страниц. Цена от 8 900 руб."),
    ("/fotokniga-premium/", "Стоимость фотокниги Премиум | wedfotobook.ru", "Стоимость фотокниги Премиум «под ключ» от 8 900 руб. Обработка фото, дизайн и печать уже включены."),
    ("/fotokniga-standart/", "Стоимость фотокниги Стандарт | wedfotobook.ru", "В стоимость фотокниги Стандарт входит обработка фотографий, индивидуальный дизайн, согласование макета и печать. Цены начинаются от 8 500 руб."),
    ("/vypusknye-fotoknigi-stoimost/", "Стоимость выпускного альбома на заказ в Москве — цены 2026 | wedfotobook.ru", "Цены на выпускные альбомы на заказ в Москве. От 1 500 руб. за экземпляр. Индивидуальный дизайн, печать, доставка. Рассчитайте стоимость онлайн."),
    ("/fotoknigi-s-dopolnennoj-realnostju-stoim/", "Фотокнига с оживающими фото цена | wedfotobook.ru", "Фотокнига с дополненной реальность на заказ, фотокниги с оживающими фотографиями \"под ключ\""),
    ("/wedding-fotoknig/", "Свадебная фотокнига на заказ в Москве — под ключ от 8 900 руб | wedfotobook.ru", "Заказать свадебную фотокнигу в Москве — индивидуальный дизайн, ваши фото, от 1 экз. Сделаем за 7 дней. Звоните: 8-985-434-23-67"),
    ("/detskaya-fotokniga/", "Детская фотокнига на заказ в Москве — индивидуальный дизайн | wedfotobook.ru", "Заказать детскую фотокнигу в Москве — под ключ от 8 900 руб. Любая тема, от 1 экз., за 7 дней. Пришлите фото — всё сделаем сами."),
    ("/yubilejnaya-fotokniga/", "Фотокнига на юбилей | wedfotobook.ru", "Предлагаем изготовление фотокниг на юбилею для мужчин и женщин. Создадим индивидуальный дизайн и напечатаем фотокниги на юбилей маме, папе, сыну, дочери, дяде, тёте, крёстному или крёстной."),
    ("/fotokniga-o-puteshestvii/", "Фотокнига путешествий | wedfotobook.ru", "Поможем запечатлеть каждую минуту в ваших путешествиях в памяти на долгие годы. Создадим красивую фотокнигу путешествий, которая никого не оставит равнодушным."),
    ("/vypusknye-fotoknigi/", "Выпускные альбомы на заказ в Москве — для класса и группы | wedfotobook.ru", "Заказать выпускные альбомы в Москве — индивидуальный дизайн для школы и детского сада. От 1 500 руб., за 7 дней. Звоните: 8-985-434-23-67"),
    ("/fotokniga-na-lyubuyu-temu/", "Фотокнига на любую тему | wedfotobook.ru", "Фотокнига на любую тему «под ключ» в Москве за 7 дней: обработка фото, индивидуальный дизайн и качественная печать. Согласование макета."),
    ("/fotokniga-s-dopolnennoj-realnostyu/", "Фотокнига с оживающими фото | wedfotobook.ru", "Изготовим фотокниги с дополненной реальностью (или AR фото) в виде оживающих фотографий. Вы получите красивые фотокниги, в которых при наведении на страницы камерой телефона, фотографии оживают."),
    ("/genealogicheskaya-fotokniga/", "Родословная фотокнига на заказ в Москве — семейное генеалогическое древо | wedfotobook.ru", "Заказать родословную книгу в Москве — семейная история и генеалогическое древо в подарочном издании. От 8 900 руб. Звоните: 8-985-434-23-67"),
    ("/article-genealogy/", "Родословная книга – идеальный подарок и семейная реликвия | wedfotobook.ru", "Фотокнига со снимками разных поколений становится семейной реликвией, которую будут листать дети, внуки и правнуки."),
    ("/article-vipysk/", "11 лет за пару оборотов фотокниги: выпускной альбом на заказ как летопись взросления | wedfotobook.ru", "Выпускной альбом собирает одиннадцать школьных лет в цельную хронику взросления."),
    ("/article-travell/", "Фотокнига путешествий – увлекательная история поездки | wedfotobook.ru", "Фотокнига путешествий превращает разрозненные кадры в цельную историю поездки."),
    ("/article-alivefoto/", "Оживающие фотографии – сказка или реальность? | wedfotobook.ru", "Как дополненная реальность превращает фотографию на странице фотокниги в видеоролик или анимацию."),
    ("/article-otziv/", "Отзывы о фотокнигах WedFotoBook | wedfotobook.ru", "Особенности сервиса WedFotoBook и отзывы заказчиков о готовых фотокнигах."),
    ("/soglashenie/", "Пользовательское соглашение — wedfotobook.ru | wedfotobook.ru", "Условия использования сайта wedfotobook.ru: права и обязанности пользователя, регистрация, порядок работы с сервисом фотокниг на заказ"),
    ("/politika-obrabotki-personalnyh-dannyh/", "Политика обработки персональных данных — wedfotobook.ru | wedfotobook.ru", "Политика в отношении обработки персональных данных ИП Ардашева Е.В. Цели, правовые основания и условия обработки данных на сайте wedfotobook.ru"),
    ("/polzovatelskoe-soglashenie/", "Согласие на обработку персональных данных — wedfotobook.ru | wedfotobook.ru", "Согласие на обработку и передачу персональных данных при отправке форм на сайте wedfotobook.ru в соответствии с 152-ФЗ"),
    ("/statya-6-fotoknigi-na-zakaz-wedfotobook-ru/", "Фотокнига на заказ: сохраните яркие моменты | wedfotobook.ru", "Фотокнига на заказ от WedFotoBook превращает разрозненные кадры в цельную и долговечную историю."),
    ("/blog_fotoknigi/", "Блог о фотокнигах | wedfotobook.ru", "Фотокнига на заказ от wedfotobook.ru: сохраните яркие моменты в премиальном исполнении"),
    ("/company/", "О компании | wedfotobook.ru", "Wedfotobook.ru — компания, которая создаёт фотокниги на заказ «под ключ» в Москве. Компания предлагает превратить разрозненные фотографии в цельное произведение, которое станет семейной реликвией или эффектным подарком."),
    ("/fotokniga-klassik/", "Фотокнига \"Классик\" - Фотокниги на заказ в Москве | wedfotobook.ru", "Фотокниги на заказ в Москве. С индивидуальным дизайном под ключ за 7 дней от 5 800 руб."),
    ("/article-wedding/", "Свадебная фотокнига: мгновения, которые останутся навсегда | wedfotobook.ru", "Свадебная фотокнига превращает снимки главного дня в цельную историю, которую хочется пересматривать."),
    ("/article-children/", "Детская фотокнига: история взросления в каждом кадре | wedfotobook.ru", "Детская фотокнига сохраняет этапы взросления, первые слова и важные семейные воспоминания."),
    ("/article-anniversary/", "Фотокнига к юбилею — способ с любовью оглянуться на пройденный путь | wedfotobook.ru", "Фотокнига к юбилею собирает важные события и семейные воспоминания в личную летопись."),
]

GROUPS = [
    ("Основные страницы", ["/", "/otzyvy/", "/katalog/", "/kontakty/", "/stoimost/", "/blog_fotoknigi/", "/company/"]),
    ("Страницы стоимости", ["/fotokniga-premium/", "/fotokniga-standart/", "/vypusknye-fotoknigi-stoimost/", "/fotoknigi-s-dopolnennoj-realnostju-stoim/"]),
    ("Каталог фотокниг", ["/wedding-fotoknig/", "/detskaya-fotokniga/", "/yubilejnaya-fotokniga/", "/fotokniga-o-puteshestvii/", "/vypusknye-fotoknigi/", "/fotokniga-na-lyubuyu-temu/", "/fotokniga-s-dopolnennoj-realnostyu/", "/genealogicheskaya-fotokniga/"]),
    ("Статьи", ["/article-genealogy/", "/article-vipysk/", "/article-travell/", "/article-alivefoto/", "/article-otziv/", "/statya-6-fotoknigi-na-zakaz-wedfotobook-ru/", "/article-wedding/", "/article-children/", "/article-anniversary/"]),
    ("Юридические и служебные страницы", ["/soglashenie/", "/politika-obrabotki-personalnyh-dannyh/", "/polzovatelskoe-soglashenie/", "/fotokniga-klassik/"]),
]


def ascii_dashes(value: str) -> str:
    return value.replace("—", "-").replace("–", "-").replace("‑", "-")


def para(value: str, style: str) -> Paragraph:
    return Paragraph(escape(ascii_dashes(value)), styles[style])


def page_card(number: int, route: str, title: str, description: str) -> KeepTogether:
    header = Table([
        [Paragraph(f"{number:02d}", styles["Number"]), para(route, "Route")],
    ], colWidths=[12 * mm, 154 * mm])
    header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    body = Table([
        [Paragraph(f"TITLE<br/><font name='SiteSans' color='{MUTED.hexval()}'>{len(title)} знаков</font>", styles["Label"]), para(title, "Value")],
        [Paragraph(f"DESCRIPTION<br/><font name='SiteSans' color='{MUTED.hexval()}'>{len(description)} знаков</font>", styles["Label"]), para(description, "Value")],
    ], colWidths=[29 * mm, 137 * mm])
    body.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, PAPER]),
        ("GRID", (0, 0), (-1, -1), 0.45, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return KeepTogether([header, body, Spacer(1, 4 * mm)])


class MetadataDoc(BaseDocTemplate):
    def __init__(self, filename: str):
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=22 * mm,
            rightMargin=22 * mm,
            topMargin=20 * mm,
            bottomMargin=19 * mm,
            title="Title и description всех страниц Wedfotobook",
            author="OpenAI Codex",
            subject="Текущие SEO title и meta description публичных страниц",
        )
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="body")
        self.addPageTemplates([PageTemplate(id="metadata", frames=[frame], onPage=self.draw_page)])

    def draw_page(self, canvas, doc) -> None:
        canvas.saveState()
        if doc.page > 1:
            canvas.setStrokeColor(LINE)
            canvas.setLineWidth(0.5)
            canvas.line(doc.leftMargin, A4[1] - 13 * mm, A4[0] - doc.rightMargin, A4[1] - 13 * mm)
            canvas.setFont("SiteSansBold", 7.5)
            canvas.setFillColor(BLUE)
            canvas.drawString(doc.leftMargin, A4[1] - 10 * mm, "WEDFOTOBOOK - TITLE И DESCRIPTION")
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.5)
        canvas.line(doc.leftMargin, 13 * mm, A4[0] - doc.rightMargin, 13 * mm)
        canvas.setFont("SiteSans", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(doc.leftMargin, 8.5 * mm, "Итоговые значения из HTML публичных страниц")
        canvas.drawRightString(A4[0] - doc.rightMargin, 8.5 * mm, f"Страница {doc.page}")
        canvas.restoreState()


assert len(PAGES) == 32
assert len({route for route, _, _ in PAGES}) == 32
assert all(title and description for _, title, description in PAGES)
by_route = {route: (title, description) for route, title, description in PAGES}
assert sum(len(routes) for _, routes in GROUPS) == 32
assert {route for _, routes in GROUPS for route in routes} == set(by_route)

story: list = []
cover = Table([
    [Paragraph("Title и description<br/>всех страниц Wedfotobook", styles["CoverTitle"])],
    [Paragraph("Текущие значения из итогового HTML 32 канонических публичных URL", styles["CoverSubtitle"])],
], colWidths=[166 * mm])
cover.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), NAVY),
    ("LEFTPADDING", (0, 0), (-1, -1), 16 * mm),
    ("RIGHTPADDING", (0, 0), (-1, -1), 16 * mm),
    ("TOPPADDING", (0, 0), (-1, 0), 17 * mm),
    ("BOTTOMPADDING", (0, 0), (-1, 0), 6 * mm),
    ("TOPPADDING", (0, 1), (-1, 1), 0),
    ("BOTTOMPADDING", (0, 1), (-1, 1), 15 * mm),
]))
story.extend([cover, Spacer(1, 8 * mm)])

metrics = Table([
    [Paragraph("32", styles["MetricNumber"]), Paragraph("0", styles["MetricNumber"]), Paragraph("0", styles["MetricNumber"])],
    [Paragraph("страницы в sitemap", styles["MetricLabel"]), Paragraph("title отсутствуют", styles["MetricLabel"]), Paragraph("description отсутствуют", styles["MetricLabel"])],
], colWidths=[55.3 * mm] * 3)
metrics.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), CREAM),
    ("BOX", (0, 0), (-1, -1), 0.7, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.45, LINE),
    ("TOPPADDING", (0, 0), (-1, 0), 8),
    ("BOTTOMPADDING", (0, 0), (-1, 0), 2),
    ("TOPPADDING", (0, 1), (-1, 1), 0),
    ("BOTTOMPADDING", (0, 1), (-1, 1), 8),
]))
story.extend([
    metrics,
    Spacer(1, 7 * mm),
    Paragraph("В отчёте приведены значения, которые сейчас находятся в тегах &lt;title&gt; и &lt;meta name=\"description\"&gt; после применения шаблона названия сайта.", styles["Body"]),
    Spacer(1, 2 * mm),
    Paragraph("Количество знаков рассчитано по исходному HTML. Для единообразного отображения в PDF длинные тире визуально заменены обычным дефисом.", styles["Small"]),
    PageBreak(),
])

number_by_route = {route: index for index, (route, _, _) in enumerate(PAGES, 1)}
for group_title, routes in GROUPS:
    story.append(Paragraph(group_title, styles["Section"]))
    for route in routes:
        title, description = by_route[route]
        story.append(page_card(number_by_route[route], route, title, description))

doc = MetadataDoc(str(OUTPUT))
doc.build(story)
print(OUTPUT)
