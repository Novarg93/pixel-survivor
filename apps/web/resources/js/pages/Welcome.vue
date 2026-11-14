<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
defineOptions({ name: 'WelcomePage' });
</script>
<template>
    <Head title="Одна искра против целой чащи" />
    <section class="landing-hero">
        <img class="hero-scene" src="/images/gameplay.png" alt="Настоящий игровой кадр Pixel Survivor: маг в Роще осколков" fetchpriority="high" />
        <div class="hero-copy"><p class="overline">DARK FANTASY · SURVIVORS · В БРАУЗЕРЕ</p>
            <h1>PIXEL<br /><span>SURVIVOR</span></h1>
            <p class="hero-tagline">Чаща пробуждается.<br />Стань её последней искрой.</p>
            <p>Двигайся сквозь орды, собирай магию и создавай свою сборку. Продержись до финального Стража — и брось ему вызов.</p>
            <div class="cta-row"><a href="/play" class="site-button">Play Now <span>↗</span></a><a href="#heroes" class="quiet-link">Выбрать свой путь ↓</a></div>
            <small>Играй гостем · Без установки · Клавиатура, touch и геймпад</small>
        </div>
        <div class="scene-caption">01 / РОЩА ОСКОЛКОВ<span>Кадр из игры</span></div>
    </section>
    <div class="feature-strip"><span>АВТОМАТИЧЕСКИЕ АТАКИ</span><span>ТРИ УЛУЧШЕНИЯ НА ВЫБОР</span><span>ФИНАЛЬНЫЙ СТРАЖ</span></div>
    <section id="heroes" class="site-section">
        <div class="section-heading"><div><p class="overline">ДВА ПУТИ В ОДНУ ЧАЩУ</p><h2>Магия или сталь.</h2></div><p>Разные способности. Своя сборка.<br />Один шанс пережить следующую волну.</p></div>
        <div class="hero-grid">
            <article class="hero-card mage"><div class="hero-number">01 / MAGE</div><h3>Стихии на твоей стороне.</h3><p>Огненный шар, мороз, молнии и метеоры. Держи дистанцию, собирай опыт и усиливай магию.</p><div class="hero-traits"><span>Дальний бой</span><span>Blink</span><span>Тайный щит</span></div><a href="/play">Играть за Mage ↗</a></article>
            <article class="hero-card warrior"><div class="hero-number">02 / WARRIOR</div><h3>Проложи путь сквозь орду.</h3><p>Меч, щит и пробивающее копьё. Врывайся в бой, раскручивай Whirlwind и выбирай свой ультимейт.</p><div class="hero-traits"><span>Ближний бой</span><span>Charge</span><span>Whirlwind</span></div><a href="/play">Играть за Warrior ↗</a></article>
        </div>
    </section>
    <section class="site-section expedition"><div><p class="overline">КАЖДЫЙ ЗАБЕГ — НОВАЯ СБОРКА</p><h2>Ещё одно<br />улучшение.<br /><em>Ещё одна минута.</em></h2><p>Атаки срабатывают автоматически. Твоя задача — двигаться, выбирать усиления и читать предупреждения врагов. Уровень ставит мир на паузу: решай, что взять дальше.</p><Link href="/faq" class="quiet-link">Управление и ответы →</Link></div><figure><img src="/images/warrior.png" alt="Warrior использует копьё в существующей игре" loading="lazy" /><figcaption>Warrior · настоящий игровой кадр</figcaption></figure></section>
    <section class="site-section progression-preview"><p class="overline">СЕГОДНЯ И ДАЛЬШЕ</p><h2>Твои истории начинаются здесь.</h2><div class="progression-grid"><div><b>Сейчас</b><h3>Личные рекорды</h3><p>Гостевые настройки и результаты сохраняются в этом браузере. Можно играть без аккаунта.</p></div><div><b>Следующий этап</b><h3>Путь аккаунта и героев</h3><p>Постоянные уровни 1–10 для аккаунта, Mage и Warrior запланированы на сервере. Начисления пока не подключены.</p></div></div><Link href="/register" class="site-button">Создать аккаунт <span>→</span></Link><p class="subtle">Аккаунт уже доступен. Серверный прогресс, награды и покупки — в следующих этапах.</p></section>
</template>
