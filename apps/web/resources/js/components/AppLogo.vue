<script setup lang="ts">
import AppLogoIcon from '@/components/AppLogoIcon.vue';
</script>

<template>
    <span class="app-logo">
        <AppLogoIcon class="app-logo-icon" />
        <span class="app-logo-wordmark group-data-[collapsible=icon]:sr-only">
            <span>Pixel</span>
            <strong>Survivor</strong>
        </span>
    </span>
</template>

<style scoped>
.app-logo {
    display: inline-flex;
    align-items: center;
    gap: var(--app-logo-gap, 10px);
    white-space: nowrap;
}

.app-logo-icon {
    flex: none;
    width: var(--app-logo-size, 32px);
    height: var(--app-logo-size, 32px);
}

.app-logo-wordmark {
    display: grid;
    gap: 3px;
    color: var(--site-gold);
    font: 700 10px/1 ui-monospace, monospace;
    letter-spacing: .24em;
    text-transform: uppercase;
}

.app-logo-wordmark strong {
    color: var(--site-text);
    font: 800 var(--app-logo-type-size, 14px)/1 ui-monospace, monospace;
    letter-spacing: .12em;
}
</style>
