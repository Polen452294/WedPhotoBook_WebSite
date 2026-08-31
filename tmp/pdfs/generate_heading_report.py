from __future__ import annotations

from datetime import date
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
    PageTemplate,
    Paragraph,
    PageBreak,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output" / "pdf" / "wedfotobook-heading-hierarchy-report.pdf"

NAVY = colors.HexColor("#061D31")
BLUE = colors.HexColor("#0B4263")
GOLD = colors.HexColor("#B99769")
CREAM = colors.HexColor("#F7F3ED")
PAPER = colors.HexColor("#FFFDF9")
TEXT = colors.HexColor("#172431")
MUTED = colors.HexColor("#66717A")
LINE = colors.HexColor("#DCD7CF")
GREEN = colors.HexColor("#2E6B55")
RED = colors.HexColor("#A34242")


def register_fonts() -> None:
    fonts = {
        "SiteSans": Path("C:/Windows/Fonts/arial.ttf"),
        "SiteSansBold": Path("C:/Windows/Fonts/arialbd.ttf"),
        "SiteSansItalic": Path("C:/Windows/Fonts/ariali.ttf"),
        "SiteMono": Path("C:/Windows/Fonts/consola.ttf"),
        "SiteMonoBold": Path("C:/Windows/Fonts/consolab.ttf"),
    }
    for name, path in fonts.items():
        if not path.exists():
            raise FileNotFoundError(f"Required font is missing: {path}")
        pdfmetrics.registerFont(TTFont(name, str(path)))


register_fonts()

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="ReportTitle",
    fontName="SiteSansBold",
    fontSize=25,
    leading=29,
    textColor=colors.white,
    alignment=TA_LEFT,
    spaceAfter=10,
))
styles.add(ParagraphStyle(
    name="ReportSubtitle",
    fontName="SiteSans",
    fontSize=11,
    leading=16,
    textColor=colors.HexColor("#D9E0E5"),
    spaceAfter=0,
))
styles.add(ParagraphStyle(
    name="Section",
    fontName="SiteSansBold",
    fontSize=16,
    leading=20,
    textColor=NAVY,
    spaceBefore=17,
    spaceAfter=8,
    keepWithNext=True,
))
styles.add(ParagraphStyle(
    name="Subsection",
    fontName="SiteSansBold",
    fontSize=11.5,
    leading=15,
    textColor=BLUE,
    spaceBefore=11,
    spaceAfter=5,
    keepWithNext=True,
))
styles.add(ParagraphStyle(
    name="BodyRu",
    fontName="SiteSans",
    fontSize=9.2,
    leading=13.2,
    textColor=TEXT,
    spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="Small",
    fontName="SiteSans",
    fontSize=7.7,
    leading=10.8,
    textColor=MUTED,
))
styles.add(ParagraphStyle(
    name="BulletRu",
    fontName="SiteSans",
    fontSize=8.8,
    leading=12.4,
    textColor=TEXT,
    leftIndent=12,
    firstLineIndent=-7,
    bulletIndent=0,
    spaceAfter=3,
))
styles.add(ParagraphStyle(
    name="TableHead",
    fontName="SiteSansBold",
    fontSize=8.2,
    leading=10.5,
    textColor=colors.white,
))
styles.add(ParagraphStyle(
    name="TableBody",
    fontName="SiteSans",
    fontSize=8.1,
    leading=11.2,
    textColor=TEXT,
))
styles.add(ParagraphStyle(
    name="Tag",
    fontName="SiteMonoBold",
    fontSize=7.8,
    leading=10,
    textColor=BLUE,
    alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    name="CalloutNumber",
    fontName="SiteSansBold",
    fontSize=22,
    leading=24,
    textColor=NAVY,
    alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    name="CalloutLabel",
    fontName="SiteSans",
    fontSize=7.5,
    leading=10,
    textColor=MUTED,
    alignment=TA_CENTER,
))


def p(text: str, style: str = "BodyRu") -> Paragraph:
    return Paragraph(text, styles[style])


def code_tag(value: str) -> Paragraph:
    color = GREEN if "сохран" in value or value in {"h1", "h2", "h3"} else BLUE
    return Paragraph(f'<font color="{color.hexval()}">{escape(value)}</font>', styles["Tag"])


def section(title: str, route: str | None = None) -> list:
    label = escape(title)
    if route:
        label += f' <font name="SiteMono" size="8" color="{MUTED.hexval()}">{escape(route)}</font>'
    return [Paragraph(label, styles["Section"])]


def subsection(title: str) -> Paragraph:
    return Paragraph(escape(title), styles["Subsection"])


def bullets(items: list[str]) -> list[Paragraph]:
    return [Paragraph(f'<font color="{GOLD.hexval()}">•</font> {escape(item)}', styles["BulletRu"]) for item in items]


def change_table(rows: list[tuple[str, str, str]], widths=(93 * mm, 31 * mm, 42 * mm)) -> Table:
    data = [[p("Заголовок", "TableHead"), p("Раньше", "TableHead"), p("Сейчас", "TableHead")]]
    for title, before, after in rows:
        data.append([p(escape(title), "TableBody"), code_tag(before), code_tag(after)])
    table = Table(data, colWidths=list(widths), repeatRows=1, hAlign="LEFT", splitByRow=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.45, LINE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PAPER]),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


class ReportDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str):
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=22 * mm,
            rightMargin=22 * mm,
            topMargin=21 * mm,
            bottomMargin=19 * mm,
            title="Иерархия заголовков сайта Wedfotobook",
            author="OpenAI Codex",
            subject="Сравнение HTML-заголовков до и после SEO-исправлений",
        )
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="body")
        self.addPageTemplates([PageTemplate(id="report", frames=[frame], onPage=self.draw_page)])

    def draw_page(self, canvas, doc) -> None:
        canvas.saveState()
        if doc.page > 1:
            canvas.setStrokeColor(LINE)
            canvas.setLineWidth(0.5)
            canvas.line(doc.leftMargin, A4[1] - 13 * mm, A4[0] - doc.rightMargin, A4[1] - 13 * mm)
            canvas.setFont("SiteSansBold", 7.5)
            canvas.setFillColor(BLUE)
            canvas.drawString(doc.leftMargin, A4[1] - 10 * mm, "WEDFOTOBOOK - SEO-ИЕРАРХИЯ ЗАГОЛОВКОВ")
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.5)
        canvas.line(doc.leftMargin, 13 * mm, A4[0] - doc.rightMargin, 13 * mm)
        canvas.setFont("SiteSans", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(doc.leftMargin, 8.5 * mm, "Отчёт по итоговому HTML публичных страниц")
        canvas.drawRightString(A4[0] - doc.rightMargin, 8.5 * mm, f"Страница {doc.page}")
        canvas.restoreState()


story: list = []

# Cover block
cover = Table([
    [Paragraph("Иерархия заголовков<br/>сайта Wedfotobook", styles["ReportTitle"])],
    [Paragraph("Подробное сравнение тегов h1, h2 и h3 до и после SEO-исправлений", styles["ReportSubtitle"])],
], colWidths=[166 * mm])
cover.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), NAVY),
    ("BOX", (0, 0), (-1, -1), 0, NAVY),
    ("LEFTPADDING", (0, 0), (-1, -1), 16 * mm),
    ("RIGHTPADDING", (0, 0), (-1, -1), 16 * mm),
    ("TOPPADDING", (0, 0), (-1, 0), 17 * mm),
    ("BOTTOMPADDING", (0, 0), (-1, 0), 6 * mm),
    ("TOPPADDING", (0, 1), (-1, 1), 0),
    ("BOTTOMPADDING", (0, 1), (-1, 1), 15 * mm),
]))
story.extend([cover, Spacer(1, 8 * mm)])

metrics = Table([
    [p("32", "CalloutNumber"), p("1", "CalloutNumber"), p("0", "CalloutNumber")],
    [p("публичные страницы проверены", "CalloutLabel"), p("h1 на каждой странице", "CalloutLabel"), p("нарушений иерархии", "CalloutLabel")],
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
    Spacer(1, 6 * mm),
    p("В документ включены все заголовки, уровень которых был изменён, а также скрытые дубли, удалённые из поисковой разметки. Тексты видимых заголовков не переписывались."),
    p(f"Дата отчёта: {date(2026, 8, 29).strftime('%d.%m.%Y')}", "Small"),
    PageBreak(),
])

# Global
story += section("Изменение на всех страницах")
story.append(change_table([
    ("Обсудим вашу фотокнигу", "h2 перед содержимым", "h2 после содержимого"),
]))
story.append(Spacer(1, 3 * mm))
story.append(p("Уровень заголовка формы не менялся. Изменилось его положение в HTML: теперь основной h1 страницы идёт раньше заголовка закрытого модального окна."))

# Home
story += section("Главная страница", "/")
story.append(subsection("Видимые элементы"))
story.append(change_table([
    ("Фотокнига на заказ", "h1", "h1"),
    ("«под ключ» в Москве за 7 дней", "h2", "h2"),
    ("8-985-434-23-67", "h3", "p"),
]))
story.append(subsection("Скрытая старая версия главной"))
story.append(p("Эти тексты давно не показывались посетителям, но оставались заголовками в HTML. Сейчас они сохранены в скрытом блоке как нейтральные div и больше не участвуют в структуре документа."))
story.append(p("h3 → div:", "Small"))
story += bullets([
    "Как мы делаем фотокниги?",
    "Фотокнига это больше, чем просто фотографии",
    "Отзывы о фотокнигах",
    "Какие фотокниги мы делаем? Любые!",
    "Почему нам можно доверять?",
    "Хотите узнать стоимость фотокниги до начала работы?",
    "Фотокнига на заказ всего за 7 дней!",
    "Остались вопросы?",
])
story.append(p("h4 → div - этапы:", "Small"))
story += bullets([
    "1. Профессиональная обработка фотографий",
    "2. Дизайн фотокниги",
    "3. Согласование макета",
    "4. Печать фотокниги и доставка",
])
story.append(p("h4 → div - вопросы старого FAQ:", "Small"))
story += bullets([
    "Если у вас конструктор для создания фотокниг?",
    "Что значит обработка фотографий?",
    "У меня фотографии только в телефоне, подойдут они для фотокниги?",
    "Что нужно при заказе фотокниги у вас?",
    "Сколько стоит добавить тексты в фотокнигу?",
    "Могу я увидеть макет до оплаты?",
    "Можно ли что-то изменить в макете?",
    "Как происходит работа над фотокнигой?",
    "Сколько раз можно вносить правки?",
    "Какие сроки создания фотокниги?",
    "Можно ли сделать фотокнигу быстрее?",
    "Где вы печатаете фотокниги?",
    "Можете отрисовать генеалогическое древо?",
    "Где я заберу фотокнигу?",
    "Вы работаете с юридическими лицами?",
])
story.append(p("Заголовки видимой современной части главной не менялись: названия разделов остаются h2, элементы внутри разделов - h3."))

# Catalog
story += section("Каталог", "/katalog/")
story.append(change_table([
    ("Каталог. Примеры фотокниг - скрытая старая версия", "h1", "удалён"),
    ("Примеры фотокниг - видимая версия", "h1", "h1"),
]))
story.append(subsection("Карточки каталога: h3 → h2"))
story += bullets([
    "Свадебная фотокнига",
    "Детская фотокнига",
    "Фотокнига на юбилей",
    "Фотокнига путешествий",
    "Выпускной альбом",
    "Родословная фотокнига",
    "Другая фотокнига",
    "Фотокнига с оживающими фото",
])

# Pricing
story += section("Цены", "/stoimost/")
story.append(change_table([
    ("Цены на фотокниги на заказ в Москве - скрытая версия", "h1", "удалён"),
    ("Частые вопросы о стоимости фотокниги - скрытая версия", "h2", "удалён"),
    ("Цены на фотокниги на заказ - видимая версия", "h1", "h1"),
]))
story.append(subsection("Ценовые карточки: h3 → h2"))
story += bullets(["Премиум", "Стандарт", "Выпускные альбомы", "Оживающие фото"])

# Contacts
story += section("Контакты", "/kontakty/")
story.append(change_table([
    ("Контакты - фотокниги на заказ в Москве - старая версия", "h1", "удалён"),
    ("Контакты - фотокниги на заказ в Москве - видимая версия", "h2", "h1"),
    ("Контактная форма - старая версия", "h2", "удалён"),
    ("Мы на карте", "h2", "h2"),
]))

# Blog
story += section("Блог", "/blog_fotoknigi/")
story.append(change_table([
    ("Блог о фотокнигах - старая версия", "h1", "удалён"),
    ("Блог о фотокнигах - видимая версия", "h1", "h1"),
]))
story.append(subsection("Названия статей в карточках: h3 → h2"))
story += bullets([
    "Родословная книга - идеальный подарок и семейная реликвия",
    "11 лет за пару оборотов фотокниги: выпускной альбом на заказ как летопись взросления",
    "Фотокнига путешествий - увлекательная история поездки",
    "Оживающие фотографии - сказка или реальность?",
    "Отзывы о фотокнигах WedFotoBook",
    "Фотокнига на заказ: сохраните яркие моменты",
    "Свадебная фотокнига: мгновения, которые останутся навсегда",
    "Детская фотокнига: история взросления в каждом кадре",
    "Фотокнига к юбилею - способ с любовью оглянуться на пройденный путь",
])

# Company
story += section("О компании", "/company/")
story.append(change_table([
    ("О компании - старая скрытая версия", "h1", "удалён"),
    ("О компании - видимая версия", "h1", "h1"),
    ("О нас", "h2", "h2"),
    ("Контакты", "h2", "h2"),
    ("Мы на карте", "h2", "h2"),
]))

# Price details
story += section("Страницы стоимости отдельных продуктов")
price_pages = [
    ("Фотокнига Премиум", "/fotokniga-premium/", [
        ("ФОТОКНИГА ПРЕМИУМ от 8 900 руб. - старая версия", "h2", "удалён"),
        ("Стоимость фотокниги Премиум - старая версия", "h1", "удалён"),
        ("Частые вопросы о фотокниге «Премиум» - старая версия", "h2", "удалён"),
        ("Фотокнига Премиум - видимая версия", "h1", "h1"),
    ]),
    ("Фотокнига Стандарт", "/fotokniga-standart/", [
        ("ФОТОКНИГА СТАНДАРТ от 9 800 руб. - старая версия", "h2", "удалён"),
        ("Стоимость фотокниги Стандарт - старая версия", "h1", "удалён"),
        ("Фотокнига Стандарт - видимая версия", "h1", "h1"),
    ]),
    ("Выпускные альбомы", "/vypusknye-fotoknigi-stoimost/", [
        ("Выпускные альбомы от 1 500 руб. - старая версия", "h2", "удалён"),
        ("Варианты выпускных альбомов - старая версия", "h1", "удалён"),
        ("Выпускные альбомы - видимая версия", "h1", "h1"),
    ]),
    ("Оживающие фото", "/fotoknigi-s-dopolnennoj-realnostju-stoim/", [
        ("Оживающие фотографии 300 руб. - старая версия", "h2", "удалён"),
        ("Фотокнига с оживающими фото цена - старая версия", "h1", "удалён"),
        ("Оживающие фото - видимая версия", "h1", "h1"),
    ]),
]
for title, route, rows in price_pages:
    story.append(subsection(f"{title}  {route}"))
    story.append(change_table(rows))
    story.append(Spacer(1, 2 * mm))

# Catalog details
story += section("Страницы отдельных видов фотокниг")
story.append(p("На этих страницах скрытая WordPress-версия дублировала новый видимый контент. Старые h1 удалены, видимые тематические h1 сохранены."))
catalog_rows = [
    ("/wedding-fotoknig/ - Свадебная фотокнига", "h1", "удалён старый дубль"),
    ("/detskaya-fotokniga/ - Детская фотокнига", "h1", "удалён старый дубль"),
    ("/yubilejnaya-fotokniga/ - Фотокнига на юбилей", "h1", "удалён старый дубль"),
    ("/fotokniga-o-puteshestvii/ - Фотокнига о путешествии", "h1", "удалён"),
    ("/vypusknye-fotoknigi/ - Выпускные альбомы", "h1", "удалён старый дубль"),
    ("/fotokniga-na-lyubuyu-temu/ - Разные фотокниги", "h1", "удалён"),
    ("/fotokniga-s-dopolnennoj-realnostyu/ - Фотокнига с оживающими фото", "h1", "удалён старый дубль"),
    ("/genealogicheskaya-fotokniga/ - Генеалогическое древо. Родословная фотокнига.", "h1", "удалён"),
]
story.append(change_table(catalog_rows, widths=(111 * mm, 22 * mm, 33 * mm)))
story.append(subsection("Дополнительно удалены скрытые дубли"))
story += bullets([
    "Частые вопросы о свадебной фотокниге - старый h2 удалён, видимый h2 сохранён.",
    "Частые вопросы о детской фотокниге - старый h2 удалён, видимый h2 сохранён.",
    "Частые вопросы о выпускных фотокнигах - старый h2 удалён, видимый h2 сохранён.",
    "Смотрите также: на странице оживающих фото - h2 удалён.",
    "Пустой h4 на странице фотокниги путешествий - удалён.",
])
story.append(p("Видимые карточки внутри этих страниц остались h3, потому что находятся внутри разделов с h2."))

# Classic
story += section("Фотокнига Классик", "/fotokniga-klassik/")
story.append(change_table([
    ("Фотокнига «Классик»", "h2", "h1"),
    ("Комментарии", "h3", "h2"),
]))
story.append(p("Раньше у страницы не было заголовка первого уровня."))

# Legal
story += section("Юридические страницы")
story.append(subsection("Согласие на обработку данных  /soglashenie/"))
story.append(change_table([
    ("Согласие на обработку и передачу персональных данных", "h1", "h1"),
    ("Пустой заголовок", "h3", "div"),
]))
story.append(subsection("Пользовательское соглашение  /polzovatelskoe-soglashenie/"))
story.append(change_table([
    ("Пользовательское соглашение", "h1", "h1"),
    ("Пустой заголовок", "h3", "div"),
    ("11. Реквизиты оператора", "h3", "h2"),
]))
story.append(subsection("Политика обработки персональных данных  /politika-obrabotki-personalnyh-dannyh/"))
story.append(change_table([
    ("Политика обработки персональных данных", "h1", "h1"),
    ("9. Реквизиты оператора", "h3", "h2"),
    ("Первое «ПЕРЕЧЕНЬ»", "h3", "h2"),
    ("Второе «ПЕРЕЧЕНЬ»", "h3", "h2"),
    ("Персональных данных, передаваемых третьим лицам", "h3", "h3"),
    ("На основании пункта 8.1 Политики", "h3", "h3"),
    ("Настоящий перечень содержит сведения...", "h3", "p"),
    ("Восемь пустых заголовков", "h3", "div"),
]))
story.append(p("Два содержательных h3 сохранены, потому что теперь находятся под h2 «ПЕРЕЧЕНЬ»."))

# Unchanged
story += section("Страницы и разделы без изменения уровней")
story += bullets([
    "/otzyvy/ - «Отзывы о фотокнигах» остался h1.",
    "Все девять страниц статей - название статьи осталось h1, подразделы остались h2.",
    "Видимые разделы главной - названия разделов остались h2, карточки внутри них остались h3.",
    "Видимые разделы страниц каталога и стоимости сохранили h1, h2 и h3 там, где вложенность уже была правильной.",
])

# Final callout
story.append(Spacer(1, 5 * mm))
final_box = Table([
    [p("Итог проверки", "Subsection")],
    [p("32 публичные страницы. На каждой странице ровно один непустой h1. Переходов вида h1 → h3 и других пропусков уровней не обнаружено.")],
], colWidths=[166 * mm])
final_box.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), CREAM),
    ("BOX", (0, 0), (-1, -1), 0.8, GOLD),
    ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
    ("LEFTPADDING", (0, 0), (-1, -1), 12),
    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story.append(final_box)

doc = ReportDocTemplate(str(OUTPUT))
doc.build(story)
print(OUTPUT)
