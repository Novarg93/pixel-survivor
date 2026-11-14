<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';
const page = usePage();
const sections = [
    ['Account Level', 'Постоянный уровень аккаунта 1–10. Начисление опыта за финального босса появится на следующем этапе.'],
    ['Characters', 'Mage и Warrior получат независимые постоянные уровни 1–10. Серверный прогресс пока не создан.'],
    ['Inventory', 'Единый инвентарь появится позже. Предметы и расходники ещё не выдаются.'],
    ['Wallet', 'Кошелёк не подключён. Баланс отсутствует; пополнения и покупки недоступны.'],
    ['Run History', 'Серверных записей пока нет. Гостевые результаты доступны в меню игры на этом устройстве.'],
    ['Rewards', 'Награды ещё не начисляются. Список появится вместе с постоянным прогрессом.'],
];
defineOptions({ name: 'DashboardPage' });
</script>
<template><Head title="Кабинет" /><section class="site-section dashboard-page"><p class="overline">ЛИЧНЫЙ КАБИНЕТ</p><div class="section-heading"><div><h1>С возвращением,<br />{{ page.props.auth.user.name }}.</h1><p>Новая глава твоей истории.</p></div><a href="/play" class="site-button">Продолжить играть ↗</a></div><div class="profile-panel"><div><small>ПРОФИЛЬ</small><p>{{ page.props.auth.user.email }}</p><span>Почта подтверждена</span></div><Link href="/settings/profile" class="quiet-link">Settings · Настройки →</Link><Link href="/logout" method="post" as="button" class="quiet-link">Выйти</Link></div><div class="dashboard-grid"><article v-for="([title, text], i) in sections" :key="title"><small>0{{ i + 1 }} / ПРЕДСТОИТ РЕАЛИЗАЦИЯ</small><h2>{{ title }}</h2><p>{{ text }}</p><span class="empty-mark">—</span></article></div></section></template>
