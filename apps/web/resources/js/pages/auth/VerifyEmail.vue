<script setup lang="ts">
import { Form, Head } from '@inertiajs/vue3';
import { onMounted, ref } from 'vue';
import TextLink from '@/components/TextLink.vue';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

defineOptions({
    layout: {
        title: 'Email verification',
        description: 'Confirm your email address to unlock your Pixel Survivor account.',
    },
});

defineProps<{
    status?: string;
    email: string;
}>();

const ready = ref(false);
onMounted(() => { ready.value = true; });
</script>

<template>
    <Head title="Email verification" />

    <p class="mb-4 text-center text-sm text-muted-foreground">
        Open the verification link in the email for <strong class="break-all text-foreground">{{ email }}</strong>.
        If you can't find it, check your spam folder or request a new link below.
    </p>
    <div
        v-if="status === 'verification-link-sent'"
        role="status"
        class="mb-4 text-center text-sm font-medium text-emerald-600 dark:text-emerald-300"
    >
        A new verification link was sent. Check your inbox.
    </div>
    <div v-else-if="status" role="alert" class="mb-4 text-center text-sm font-medium text-red-600 dark:text-red-300">
        <p v-if="status === 'verification-link-invalid'">
            This link is invalid or has expired. Request a new link for the signed-in account below.
        </p>
        <p v-else-if="status === 'verification-delivery-failed'">
            We couldn't send the verification email. Please try again in a moment.
        </p>
        <p v-else-if="status === 'verification-rate-limited'">
            Too many requests. Wait a minute before requesting another link.
        </p>
    </div>

    <Form
        v-bind="send.form()"
        class="space-y-6 text-center"
        v-slot="{ processing }"
    >
        <Button type="submit" :disabled="!ready || processing" variant="secondary">
            <Spinner v-if="processing" />
            Resend verification email
        </Button>

        <TextLink :href="logout()" as="button" type="button" class="mx-auto block text-sm">
            Log out
        </TextLink>
    </Form>
</template>
