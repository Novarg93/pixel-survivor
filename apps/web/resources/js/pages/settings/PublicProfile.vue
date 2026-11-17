<script setup lang="ts">
import { Head, Link, router } from '@inertiajs/vue3';
import { ref } from 'vue';
import Heading from '@/components/Heading.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuditedRequest } from '@/composables/useAuditedRequest';
import { dateUTC } from '@/types/leaderboard';
import type { PublicProfile } from '@/types/leaderboard';
const props = defineProps<{ profile: PublicProfile }>();
const nickname = ref(props.profile.nickname);
const { ready, busy, error, pending, submit } = useAuditedRequest<{ nickname: string }>(`pixel-nickname:${props.profile.id}`);
async function save() { if (await submit('/api/v1/profile/nickname', { nickname: nickname.value })) router.reload(); }
</script>

<template>
    <Head title="Public name" />
    <h1 class="sr-only">Public profile</h1>
    <div class="flex flex-col gap-6">
        <Heading variant="small" title="Leaderboard name" description="Your email and account settings name are not published. Your profile ID stays the same when your nickname changes." />
        <form class="flex flex-col gap-6" @submit.prevent="save">
            <div class="grid gap-2">
                <Label for="nickname">Public name</Label>
                <Input id="nickname" v-model="nickname" name="nickname" autocomplete="nickname" maxlength="64" :disabled="!ready || busy || !!pending" :aria-invalid="!!error" aria-describedby="nickname-help nickname-status" required />
                <p id="nickname-help" class="text-sm text-muted-foreground">3–24 characters after normalization: letters, numbers, spaces, hyphens and _. Change once every 24 hours.</p>
            </div>
            <div v-if="!profile.can_rename || pending || error" id="nickname-status" aria-live="polite">
                <p v-if="!profile.can_rename" class="settings-notice">Next change: {{ dateUTC(profile.rename_after ?? null) }}</p>
                <p v-if="pending" class="settings-notice">There is an unfinished request. Retrying uses the original name and operation ID.</p>
                <p v-if="error" role="alert" class="field-error">{{ error }}</p>
            </div>
            <div class="flex flex-wrap items-center gap-4">
                <Button :disabled="!ready || busy || (!profile.can_rename && !pending)">{{ busy ? 'Saving…' : pending ? 'Retry request' : 'Save nickname' }}</Button>
                <Link href="/leaderboard" class="settings-link">Global Leaderboard →</Link>
            </div>
        </form>
    </div>
</template>
