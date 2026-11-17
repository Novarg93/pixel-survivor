import type { PlatformPort, RunStart } from '../../../../../src/game/platform/port';
import { permanentBonuses, type StatId } from '../../../../../src/game/platform/progression';
import type { CharacterId } from '../../../../../src/game/config/characters';
import type { BiomeId } from '../../../../../src/game/config/biomes';
import type { RunRecord } from '../../../../../src/game/services/storage';
import { PlatformRequestError, readEconomy, readItemReceipt, readRunInventory, type RunInventoryPort } from '../../../../../src/game/platform/runItems';
import { readOffer, readPaidReceipt } from '../../../../../src/game/platform/premium';

function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
export class HttpPlatform implements PlatformPort {
    readonly commerce: RunInventoryPort = {
        snapshot: async clientId => readRunInventory(await this.request(`/runs/${this.serverId(clientId)}/inventory`)),
        death: async (clientId, input) => { await this.request(`/runs/${this.serverId(clientId)}/death`, { ...input, client_run_id: clientId }); },
        consume: async (clientId, input) => readItemReceipt(await this.request(`/runs/${this.serverId(clientId)}/items`, { ...input, client_run_id: clientId })),
        acknowledge: async (clientId, usageId) => { await this.request(`/runs/${this.serverId(clientId)}/items/${usageId}/ack`, {}); },
        purchase: async (item, priceQuote, operationId) => { await this.request('/shop/purchases', { product_key: item, quantity: 1, expected_unit_price: priceQuote, operation_id: operationId }); },
        upgradeOffer: async (clientId, context) => readOffer(await this.request('/runs/'+this.serverId(clientId)+'/upgrade-offers', { ...context, client_run_id: clientId })),
        executeAction: async (clientId, input) => readPaidReceipt(await this.request('/runs/'+this.serverId(clientId)+'/actions', { ...input, client_run_id: clientId })),
        recoverAction: async (clientId, operation) => { const result = await this.request('/runs/'+this.serverId(clientId)+'/actions/'+operation); return { receipt: readPaidReceipt(result.receipt), status: String(result.status) }; },
        acknowledgeAction: async (clientId, operation) => { await this.request('/runs/'+this.serverId(clientId)+'/actions/'+operation+'/ack', {}); },
    };
    private serverId(clientId: string): string {
        const id = this.runs.get(clientId);
        if (!id) throw new Error('This run is not registered on the server.');
        return id;
    }
    private controller = new AbortController();
    private runs = new Map<string, string>();
    private pending?: { selection: string; body: Record<string, string> };
    private async request(url: string, body?: unknown): Promise<Record<string, unknown>> {
        const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        // Reuse the exact body/operation ID when a response is lost after server commit.
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const response = await fetch(`/api/v1${url}`, { method: body ? 'POST' : 'GET', credentials: 'same-origin',
                    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
                    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.any([this.controller.signal, AbortSignal.timeout(10000)]) });
                if (!response.ok) {
                    if (attempt === 0 && response.status >= 500) continue;
                    const detail: unknown = response.status < 500 ? await response.json().catch(() => null) : null;
                    throw new PlatformRequestError(response.status, response.status === 401 || response.status === 419 ? 'Your session expired. Sign in again.' : response.status === 403 ? 'Verify your email in your account before starting a server run.' : object(detail) && typeof detail.message === 'string' ? detail.message.slice(0, 300) : `The server rejected the request (${response.status}).`);
                }
                const result: unknown = await response.json();
                if (!object(result)) throw new Error('Invalid server response.');
                return result;
            } catch (error) {
                if (attempt === 0 && error instanceof TypeError && !this.controller.signal.aborted) continue;
                throw error;
            }
        }
        throw new Error('The server is temporarily unavailable.');
    }
    async start(character: CharacterId, biome: BiomeId, practice: boolean): Promise<RunStart> {
        const selection = `${character}:${biome}:${practice}`;
        if (this.pending?.selection !== selection) this.pending = { selection, body: { operation_id: crypto.randomUUID(), client_run_id: crypto.randomUUID(), character_id: character, biome_id: biome, mode: practice ? 'practice' : 'normal' } };
        const result = await this.request('/runs', this.pending.body);
        if (typeof result.server_run_id !== 'string' || typeof result.client_run_id !== 'string' || typeof result.seed !== 'number' || !object(result.bonuses)) throw new Error('Invalid run snapshot.');
        const bonuses: Partial<Record<StatId, number>> = {};
        for (const [key, amount] of Object.entries(result.bonuses)) {
            if (typeof amount !== 'number') throw new Error('Invalid character bonus.');
            // permanentBonuses validates all supported stats and their numeric bounds.
            Object.assign(bonuses, { [key]: amount });
        }
        this.runs.set(result.client_run_id, result.server_run_id); this.pending = undefined;
        while (this.runs.size > 8) { const oldest = this.runs.keys().next().value; if (oldest) this.runs.delete(oldest); }
        return { clientRunId: result.client_run_id, seed: result.seed, bonuses: permanentBonuses(bonuses), economy: readEconomy(result.economy) };
    }
    async finish(record: RunRecord): Promise<string> {
        const serverId = this.runs.get(record.id);
        if (!serverId) throw new Error('This run has no server registration.');
        const receipt = await this.request(`/runs/${serverId}/finish`, { record });
        // A durable receipt is success even if a subsequent refresh cannot reach the server.
        this.runs.delete(record.id);
        const account = object(receipt.account) ? receipt.account : {}, hero = object(receipt.character) ? receipt.character : {};
        return receipt.status === 'accepted' ? `Result saved · Account ${account.level} (+${receipt.account_xp} XP) · Character ${hero.level} (+${receipt.character_xp} XP). Bonuses apply to new runs.` : 'Result saved for review. XP has not been awarded yet.';
    }
    destroy() { this.controller.abort(); this.runs.clear(); }
}
