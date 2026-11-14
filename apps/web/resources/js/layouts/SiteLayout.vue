<script setup lang="ts">
import { Link, usePage } from '@inertiajs/vue3';
const page = usePage();
</script>
<template>
    <div class="site-shell">
        <header class="site-header">
            <Link href="/" class="site-logo"><span aria-hidden="true">✦</span> PIXEL SURVIVOR</Link>
            <nav aria-label="Основная навигация">
                <Link href="/faq">FAQ</Link><Link href="/contact">Контакты</Link>
                <Link v-if="page.props.auth.user" href="/dashboard">Кабинет</Link>
                <Link v-else href="/login">Войти</Link>
                <a href="/play" class="site-button compact">Play Now <span aria-hidden="true">↗</span></a>
            </nav>
        </header>
        <main class="site-content"><slot /></main>
        <footer class="site-footer">
            <div><Link href="/" class="site-logo">✦ PIXEL SURVIVOR</Link><p>Одна искра против целой чащи.</p></div>
            <nav aria-label="Ссылки в подвале"><Link href="/privacy">Privacy Policy · проект</Link><Link href="/terms">Terms of Service · проект</Link><Link href="/contact">Обратная связь</Link></nav>
            <small>Одиночная браузерная игра · Гостевые рекорды в этом браузере</small>
        </footer>
    </div>
</template>
