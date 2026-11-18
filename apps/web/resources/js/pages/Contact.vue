<script setup lang="ts">
import { Head, Link, useForm } from '@inertiajs/vue3';
import { CircleCheckIcon } from '@lucide/vue';
import { nextTick, ref } from 'vue';

defineOptions({ name: 'ContactPage' });
const props = defineProps<{ received: boolean }>();
const form = useForm({ name: '', email: '', subject: '', message: '' });
const sent = ref(props.received);
const confirmation = ref<HTMLElement>();
const fields = [
    { id: 'name', label: 'Name', type: 'text', autocomplete: 'name', maxLength: 100 },
    { id: 'email', label: 'Email', type: 'email', autocomplete: 'email', maxLength: 254 },
    { id: 'subject', label: 'Subject', type: 'text', autocomplete: 'off', maxLength: 160 },
    { id: 'message', label: 'Message', maxLength: 5000 },
] as const;

function submit() {
    if (form.processing) return;

    sent.value = false;
    form.post('/contact', {
        preserveScroll: true,
        onSuccess: async ({ props: response }) => {
            if (response.received !== true) return;

            form.reset();
            sent.value = true;
            await nextTick();
            confirmation.value?.focus();
        },
    });
}
</script>

<template>
    <Head title="Contact us" />
    <section class="site-section reading-page">
        <h1>Contact us</h1>
        <p>Found a bug, have a question, or want to share feedback? Send us a message below.</p>
        <form class="contact-form" @submit.prevent="submit">
            <template v-for="field in fields" :key="field.id">
                <label :for="field.id">{{ field.label }}</label>
                <textarea
                    v-if="field.id === 'message'"
                    :id="field.id"
                    v-model="form[field.id]"
                    :maxlength="field.maxLength"
                    required
                    minlength="10"
                    rows="6"
                    :aria-invalid="!!form.errors[field.id]"
                    :aria-describedby="form.errors[field.id] ? `${field.id}-error` : undefined"
                />
                <input
                    v-else
                    :id="field.id"
                    v-model="form[field.id]"
                    :type="field.type"
                    :maxlength="field.maxLength"
                    :autocomplete="field.autocomplete"
                    required
                    :aria-invalid="!!form.errors[field.id]"
                    :aria-describedby="form.errors[field.id] ? `${field.id}-error` : undefined"
                />
                <p v-if="form.errors[field.id]" :id="`${field.id}-error`" class="field-error">{{ form.errors[field.id] }}</p>
            </template>
            <p class="subtle">Keep passwords and payment details private. We store your name, email and message with this request. <Link href="/privacy">Data processing information (draft)</Link>.</p>
            <button type="submit" class="site-button" :disabled="form.processing">{{ form.processing ? 'Saving…' : 'Send message' }} <span v-if="!form.processing" aria-hidden="true">→</span></button>
            <div v-if="sent" ref="confirmation" class="notice contact-success" role="status" tabindex="-1">
                <CircleCheckIcon :size="24" aria-hidden="true" />
                <div><strong>Message received</strong><p>Thanks for reaching out. Your message has been saved.</p></div>
            </div>
        </form>
    </section>
</template>

<style scoped>
.contact-success { display: flex; align-items: flex-start; gap: 12px; margin: 8px 0 0; }
.contact-success svg { flex: none; margin-top: 2px; color: var(--site-mint); }
.contact-success strong { display: block; color: var(--site-mint); font-size: 15px; }
</style>
