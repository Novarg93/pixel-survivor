# Принятое пламя Хранителя затмения в игре

2026-11-10. По приёмке пользователя подключены точные PixelLab PNG из
astral-flame-review-v1:9spawn,8idle,9vanish. Отдельный atlas26native128²,
528×924,padding2,1 951 488RGBAbytes. Display62world,pivot60,116 постоянны.
Подъём600мс,loop800мс,затухание600мс; активное горение длится прежние3с.
Новых генераций/затрат нет, принятые RGBA не изменялись.

Изменены только GameArt (загрузка/nearest) и AstralRevenantArt (выбор кадров,
текстуры и опоры). Добавлены atlasPNG/JSON, astralFlamePixellabPack и manifest.
World, четыре секции/spacing34, halfWidth17/halfDepth10, warning, урон/тик,
freeze/pause, owned cleanup, projectile/Blink и все ресурсы босса сохранены.
Старый Astral atlas остаётся для модели и сфер Guardian.

Scope guard:339из341прежних runtime файлов неизменны,2разрешённых изменения
и4новых файла. Исторический preview proof сохранён; демо помечено принятым.
Полный check PASS:1048unit/133files,typecheck/lint/build. Новые3unit проверяют
все26точныхRGBA/отступы, циклы/пустые окончания, устойчивую опору и неизменность
симуляции от art views. Игровые browser4PASS: обе карты и1280/844, вся реальная
стенка, freeze, вход/выход/тики урона, исчезновение, смерть и перезапуск.
HD3PASS: ресурсы, memory/listeners/teardown. Память132,71MiB<144MiB.
Production3PASS: практика босса и публичный Mage в двух биомах.

Покадровые ожидания старого E2E обновлены под принятые длительности AI-кадров;
проверки реального урона и времён не ослаблялись. Просмотрен Canvas screenshot:
`screenshots/astral-flame-runtime-v1/legacy/grove-1280/idle-first-tick.png`.
Полная E2E suite и физический телефон не проверялись. Блокеров нет.
