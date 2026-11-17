<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
defineOptions({ name: 'WelcomePage' });
</script>
<template>
    <Head title="One spark against an entire grove" />
    <section class="landing-hero">
        <div class="hero-copy"><p class="overline"><span class="status-spark" aria-hidden="true"></span> THE GROVE IS WAITING</p>
            <h1>PIXEL<br /><span>SURVIVOR</span></h1>
            <p class="hero-tagline">The grove awakens.<br />Become its last spark.</p>
            <p>Move through hordes, gather magic and create your build. Survive until the final Warden — and challenge him.</p>
            <div class="cta-row"><a href="/play" class="site-button">Play Now <span>↗</span></a><a href="#heroes" class="quiet-link">Choose your path ↓</a></div>
            <small>Play as a guest · No install · Keyboard, touch and gamepad</small>
            <div class="hero-run-stats"><div><strong>02</strong><span>Ways to fight</span></div><div><strong>20:00</strong><span>The final encounter</span></div><div><strong>01</strong><span>Last spark</span></div></div>
        </div>
        <figure class="hero-arena"><div class="arena-topline"><span><i aria-hidden="true"></i> SHARD GROVE</span><span>IN-GAME CAPTURE</span></div><img class="hero-scene" src="/images/gameplay.png" alt="Actual Pixel Survivor gameplay: a Mage in Shard Grove" fetchpriority="high" /><figcaption><span>ONE SPARK. AN ENTIRE HORDE.</span><span>MOVE · GATHER · SURVIVE</span></figcaption></figure>
    </section>
    <div class="feature-strip"><span>AUTOMATIC ATTACKS</span><span>THREE UPGRADES TO CHOOSE FROM</span><span>THE FINAL WARDEN</span></div>
    <section id="heroes" class="site-section">
        <div class="section-heading"><div><p class="overline">TWO PATHS INTO ONE GROVE</p><h2>Magic or steel.</h2></div><p>Different abilities. Your own build.<br />One chance to survive the next wave.</p></div>
        <div class="hero-grid">
            <article class="hero-card mage"><div class="hero-card-top"><div class="hero-number">01 / MAGE</div><span class="hero-sigil" aria-hidden="true">✧</span></div><h3>The elements<br />are on your side.</h3><p>Fireballs, frost, lightning and meteors. Keep your distance, collect XP and strengthen your magic.</p><div class="hero-traits"><span>Ranged combat</span><span>Blink</span><span>Arcane Shield</span></div><a href="/play">Play as Mage <span aria-hidden="true">↗</span></a></article>
            <article class="hero-card warrior"><div class="hero-card-top"><div class="hero-number">02 / WARRIOR</div><span class="hero-sigil" aria-hidden="true">⚔</span></div><h3>Carve a path<br />through the horde.</h3><p>A sword, shield and piercing spear. Charge into battle, unleash Whirlwind and choose your ultimate.</p><div class="hero-traits"><span>Melee combat</span><span>Charge</span><span>Whirlwind</span></div><a href="/play">Play as Warrior <span aria-hidden="true">↗</span></a></article>
        </div>
    </section>
    <section class="site-section expedition"><div><p class="overline">EVERY RUN — A NEW BUILD</p><h2>One more<br />upgrade.<br /><em>One more minute.</em></h2><p>Attacks trigger automatically. Your job is to move, choose upgrades and read enemy warnings. Leveling up pauses the world: decide what to take next.</p><Link href="/faq" class="quiet-link">Controls and answers →</Link></div><figure><img src="/images/warrior.png" alt="Warrior throwing a spear in the game" loading="lazy" /><figcaption>Warrior · actual gameplay</figcaption></figure></section>
    <section class="site-section progression-preview"><p class="overline">PRESERVE YOUR JOURNEY</p><h2>Your stories begin here.</h2><div class="progression-grid"><div><b>Guest mode</b><h3>Personal bests</h3><p>Guest settings and results are saved in this browser. You can play without an account.</p></div><div><b>With an account</b><h3>Account and character progression</h3><p>Level your account, Mage and Warrior up to level 10. Permanent character bonuses strengthen your next run; history and XP are stored on the server after result validation.</p></div></div><Link href="/register" class="site-button">Create account <span>→</span></Link><p class="subtle">Item rewards are already delivered to Inventory. Activate XP Boost manually; credit purchases are available in Shop. Combat consumable usage and real payments are not available yet.</p></section>
</template>
