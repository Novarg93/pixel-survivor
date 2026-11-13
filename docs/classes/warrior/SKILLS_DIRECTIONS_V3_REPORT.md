# Warrior: приёмки и доработки навыков, v3

Пользователь принял Whirlwind, Shield Block полностью и Charge. Северный Cleave требовал
стального щита с жёлтой полосой. Северный Stomp отклонён: нужен шаг вперёд и совместный удар
ногой/щитом. Piercing Throw отклонён полностью, заказана новая анимация всех проекций.

## Результат и источники

Демка: `art/generated/warrior-skills-directions-review-v3/viewer.html`.
12клипов,156body-кадров,48сочетаний. Сразу8ракурсов выбранного навыка, либо48карточек.
N/NE напрямую от cell4; NWmirror. S/E/SEfront,W/SWmirror. Одобренные клипы отмечены зелёным,
изменения для оценки — жёлтым. PNG-листы, исходные кадры и параметры доступны в карточках.

- Whirlwind/Block/Charge: три северных13-кадровых источника v2 приняты и сохранены точно.
  Вместе с пятью прежними принятыми front-источниками сохранено104body-кадра без изменения RGBA.
- Cleave: через PixelLab pixelart_workbench заменено красное поле и крест на стальную поверхность
  с одной жёлтой диагональной полосой. Изменены408+283пикселя в исходных кадрах07/08;
  все остальные11кадров и все пиксели за пределами маски byte-equivalent по RGBA.
  Alpha и контуры не изменены. Оригиналы v2 и полные guarded operations/receipts сохранены.
- Stomp: первая новая проба получила удар щитом, но слабое продвижение. Текущая north-stomp-r2
  задана между начальной стойкой4 и её точным переносом14px вправо/14px вверх. Перенос Last
  выполнен workbench без перерисовки модели; само движение/двойной удар сгенерированы PixMiniMax.
  Габариты конечной позы действительно сместились+14/-14. Трещина привязана к новой зоне ног,
  начинается на frame8, отдельный переключаемый слой. Это новая проба для оценки движения.
- Throw: подготовлены два192px spear-ready PNG через Pixen. Новый северный бросок использует
  Enhance и возвращается к базовой стойке. Для южного выбран front-throw-r3: явный RELEASE,
  EMPTY hand, без доставания меча, без Enhance и без Last. Две первые пробы дали огненный
  артефакт и архивированы; выбранная версия без этого артефакта и без касания краёв.
  Старый Throw и его прежний VFX исключены из текущих маршрутов/демки.

Cleave motion и южный Whirlwind-эталон сохраняются; для material-only правки AI-анимация
не перегенерировалась. Точные prompts/Enhance/seed/job/First/Last всех проб и три новых
приёмки внесены в `docs/art/PIXELLAB_PROMPT_JOURNAL.md` и гайд генерации.
В source/jobs8AI-заданий:2подготовки,6motion-проб; по квитанциям котировка8.20generations.
Три workbench-правки (щит×2 и целевая поза) — детерминированные операции, не AI-prompts.

## Приёмки

Registry45исторических записей: добавлены только северные Whirlwind/Block/Charge.
Старая запись warrior-throw-old-south помечена currentApprovalStatus=revoked, история сохранена.
Poolv11: у Throw нет действующих источника/маршрутов; новые оба источника — pending.
Северные Cleave/Stomp/Throw и южный Throw пока не объявляются принятыми автоматически.
Принятые northern Charge/Block/Whirlwind готовы к последующей отдельной интеграции.

## Проверки

- Source verify PASS:156raw↔atlas↔native/mirrorPNG;104retained frames;691точечное изменение,
  outside/alpha0; clipping0; north routes correct; final Stomp offset+14/-14.
- SHA668файлов (весь текущий430-file runtime и прежняя v2): изменений0.
  Пользовательский Whirlwind проверяется отдельно исходным SHA.
- Browser PASS:48сочетаний,все156кадров,realCanvas N=NE/NWmirror для6навыков,
  включая исправленный щит в кадре7; pause byte-freeze,step,scrub,48cards,390px,
  PNG/source links,file://,cleanup. JS/HTTP errors0. Все новые контакты и Canvas PNG просмотрены.
  Лог `.tmp/warrior-skills-directions-v3-browser-final.log`; `validation.json` в каталоге демки.
- `npm run check` PASS: typecheck,ESLint,156файлов/1131unit tests,build;exit0.
  Лог `.tmp/warrior-skills-directions-v3-check-final.log`. Прежнее предупреждение Vite о chunk>500KB.
- При первом check обнаружена прежняя неточность типа Node.remove в E2E. Исправлена на
  parentNode?.removeChild без подавления типов. Соответствующий реальный Space/Charge E2E
  повторён:1/1PASS, `.tmp/warrior-skills-directions-v3-e2e-typefix.log`.
- После окончательной замены Stomp повторены source/browser и целевой ESLint всей v3+E2E.
  Лог `.tmp/warrior-skills-directions-v3-final-eslint.log`,exit0.

Результат — готовая новая демка для художественной оценки четырёх доработанных клипов.
Блокеров нет. Runtime/баланс/зависимости не менялись. Commit/push/deploy/done-маркеров нет.
