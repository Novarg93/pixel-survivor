import type { RunInventoryPort } from './runItems';
import type { PaidActionInput, PaidActionReceipt } from './premium';

/** A live World owns this operation. A reload must never apply it to a new World. */
export class PaidActionOperation {
  receipt?: PaidActionReceipt;
  applied = false;
  constructor(readonly clientRunId: string, readonly input: PaidActionInput) { Object.freeze(input); }
  async execute(port: RunInventoryPort, apply: (receipt: PaidActionReceipt) => boolean) {
    if (!port.executeAction || !port.acknowledgeAction) throw new Error('Game actions are unavailable.');
    if (!this.receipt) this.receipt = await port.executeAction(this.clientRunId, this.input);
    const receipt = this.receipt;
    if (receipt.client_run_id !== this.clientRunId || receipt.operation_id !== this.input.operation_id || receipt.action !== this.input.action) throw new Error('This confirmation belongs to a different operation.');
    if (!this.applied) {
      if (!apply(receipt)) throw new Error('Usage was saved. The effect could not be applied to this scene; retry restoring the same operation.');
      this.applied = true;
    }
    await port.acknowledgeAction(this.clientRunId, this.input.operation_id);
    return receipt;
  }
}
