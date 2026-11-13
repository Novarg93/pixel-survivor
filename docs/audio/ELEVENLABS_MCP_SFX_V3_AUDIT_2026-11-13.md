# ElevenLabs MCP: аудит SFX v3, 13 ноября 2026

**Через текущие доступные инструменты гарантировать SFX v3 нельзя. Генераций и расходов в ходе аудита: 0.** Использовались только каталог/схемы/чтение существующего узла и официальная документация. Генераторы, run, estimate, создание узлов, установка и изменение подключения не вызывались.

## 1. Тип подключения

Фактически предоставлен облачный ElevenCreative/Flows-интерфейс: `creative_*`, Flow/node/session/generation IDs, доступен прежний облачный Cleave-узел. Это не интерфейс старого локального `elevenlabs-mcp` с `text_to_sound_effects`. Точный URL транспорта клиент этой сессии не раскрывает; скрытая конфигурация клиента не читалась. Классификация основана на работающем интерфейсе и его соответствии официальной документации, а не на перехвате транспорта.

Официальный hosted endpoint: `https://api.elevenlabs.io/v1/mcp`, OAuth. Старый локальный сервер deprecated/archived. Источники: [hosted MCP](https://elevenlabs.io/docs/eleven-api/resources/mcp-server), [официальный changelog](https://elevenlabs.io/docs/changelog/2026/8/22), [старый репозиторий](https://github.com/elevenlabs/elevenlabs-mcp).

## 2. Реальные инструменты и параметры

- `creative_generate_in_flow`: обязательные `node_type`, `model_id` и `prompt`; необязательные `connect_from`, `estimate_only`, `flow_id`, `generations_count`, `view_state_id`, `voice_id`. Для SFX используется `node_type="sfx"`. Аргумента `model_parameters` у этого сокращённого вызова нет.
- Для явных настроек: `creative_add_flow_node` принимает `node_type`, `model_id`, `prompt`, `model_parameters`, а также `flow_id`, `label`, `connect_from`, `voice_id`. Настройка не запускает генерацию сама по себе; запуск существующего узла — `creative_run_flow_nodes(flow_id,node_ids,...)`. В аудите ни создание, ни запуск не выполнялись.
- Live `creative_get_model_schema(model_id="eleven_text_to_sound_v2",node_type="sfx")`: `duration_seconds` — float 0,5–30; `prompt_influence` — float 0–1, default0,3; `loop` — boolean, defaultfalse. Prompt подключается как text input. `automatic_prompt_improvement` не предоставлен.

## 3. Можно ли указать SFX v3

В enum `model_id` текущих инструментов присутствует `eleven_text_to_sound_v2`, но отсутствует `eleven_text_to_sound_v3`. Live `creative_get_flow_node_types` также перечисляет для SFX только v2. Наличие `eleven_v3` не помогает: это TTS, не Sound Effects. Заголовок общего family-guide с упоминанием v3 не доказывает поддержку модели вопреки enum/каталогу.

Отправлять неподдерживаемый `model_id` в генератор ради эксперимента не стали. Помещение его в `model_parameters` тоже не даёт гарантии: это не поле опубликованной SFX parameter schema и не замена model selector.

## 4. Flows default и прежний Cleave

Свежий `creative_get_flow_node_types`: `sfx.default_model_id="eleven_text_to_sound_v2"`, available_models содержит только эту модель. Прочитан существующий Cleave node: model_idv2, duration0,5/influence0,3/loopfalse; последняя сохранённая генерация completed и model_idv2. Старые результаты действительно выполнены на v2. Один read-call с `generations_limit=0` получил validation error; повтор с1 прочитал данные, генерации не запускались.

Этот вывод относится к предоставленному MCP и workspace-каталогу. Он не означает, что весь веб-продукт Flows в принципе лишён SFX v3: [официальная страница SFX](https://elevenlabs.io/docs/overview/capabilities/sound-effects) заявляет v3 в API и ElevenCreative.

## 5. Подходящий маршрут для v3

[Официальный REST API](https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert): `POST https://api.elevenlabs.io/v1/sound-generation`, с обязательным для нашего рабочего процесса явным выбором:

```json
{
  "text": "One quick dry sword swish through empty air.",
  "model_id": "eleven_text_to_sound_v3",
  "duration_seconds": 0.5,
  "prompt_influence": 0.3,
  "loop": false
}
```

Опубликованный default API всё ещёv2: `model_id` нельзя пропускать. Это только образец запроса, он не выполнялся. Automatic improvement отсутствует и в опубликованном перечне параметров endpoint; совпадение этой функции с веб-сайтом не обещается.

Альтернатива — официальный [Sound Effects skill](https://github.com/elevenlabs/skills/blob/main/sound-effects/SKILL.md) из `elevenlabs/skills`. Проверены Python/JavaScript/CLI-примеры с явным `eleven_text_to_sound_v3`. Skill использует API и требует настроенной авторизации; это не обход авторизации и не доказательство возможностей текущего MCP. Ничего не установлено, авторизация не менялась, секреты не запрашивались.

Машиночитаемое доказательство и точные выдержки входных схем: соседний JSON. JSON проверен; runtime/аудио/приёмки сохранены. Полный игровой check не запускался для этого read-only аудита и документации.
