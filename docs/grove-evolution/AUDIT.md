# Аудит Grove / консолидация карт — 2026-11-06

Рабочая папка PixelSurvivor, ветка main. До изменений дерево чистое. Прочитаны
AGENTS.md, PLAN.md, текущие записи PROGRESS/DECISIONS, задачи 07, 10, 18.
Новая задача задана пользователем; отдельного номерного задания для неё нет.

| Область | Фактическое устройство до изменений | Решение |
| --- | --- | --- |
| Выбор карты | MainMenu.vue: две кнопки; App.vue: локальный ref biome и preview/restart через bridge | AVAILABLE_MAPS содержит только Grove; legacy ID нормализуется на входе World |
| ID | config/biomes.ts: BiomeId = grove / dark-forest | BiomeId остаётся историческим; MapId описывает доступный запуск |
| Мир | World — чистая симуляция; GameScene владеет Phaser и камерой | Изменения только presentation, кроме нормализации удалённой карты |
| Чанки | WorldChunkSystem, 128 world px, Canvas 256²; chunkKeys с culling/padding | Тот же footprint/координаты/culling; максимум две поверхности на чанк |
| Земля | hdGrove.ts, biomeTile/worldTiles.tileHash; исходные зелёные/земляные цвета | Палитра normal сохранена; общий оригинальный атлас четырёх фаз |
| Декор | Камни, кусты, ростки встроены в Canvas; forest имел хвойные деревья/грибы | Координатный groveDecoration, независимые силуэты и детали семи категорий |
| Ассеты | preloadGameArt, assetRegistry, публичные HD PNG/JSON; terrain runtime Canvas | Существующие actor atlases не меняются; маленький runtime art atlas на сцену |
| Атмосфера | AtmospherePhaseController, config/atmosphere, ForestAtmosphere: tint/veil/fog/glow/motes | Сохранены восемь слоёв, уменьшены интенсивности для уже тёмных рисунков |
| Время | world.elapsed увеличивается только в World.step при playing | Общие окна art/atmosphere 270–300,570–600,870–900; pause не использует wall clock |
| Старая версия | 300–302.5,600–602.5,900–902.5; darkened/creepy | Новое требование пользователя заменяет тайминги и названия на dusk/dying |
| Сохранения | services/storage.ts, pixel-survivor-v1 schema v1/v2; details.biome; top10 records + totals | Схема/валидатор/ограничение top10 прежние; исторические dark-forest не мигрируют в grove |
| Выбор в storage/URL | Отдельного persisted selected-map в текущей схеме нет; lastPlayed.id — ID результата | Старые данные остаются; unknown/legacy launch нормализован; старый query безопасно игнорируется |
| Аудио | AudioController содержит legacy dark-forest palette | Каталог сохранён, новые запуски Grove используют прежнюю музыку Grove |
| Проверки | unit atmosphere/biomes/chunks/records, E2E atmosphere/milestones/phase2/production, множество art fixtures | UI fixtures перенесены на Grove; отдельные проверки legacy и физического изменения силуэтов |
| Mobile | mobileViewport, zoom, chunk padding=0, bounded atmosphere motes 18/8, preferences | Сохранены; без шейдера/таймеров/декоративных GameObjects на каждое растение |

Исходники Dark Forest (hdForest.ts, biomeTile palette, registry metadata) сохранены
как исторический авторский материал; активный renderer их больше не вызывает.
Новые внешние изображения, зависимости, карты и игровые hazards не добавляются.
