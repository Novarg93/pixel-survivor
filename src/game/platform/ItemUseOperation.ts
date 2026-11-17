import type { ItemUseInput, RunInventoryPort, RunItemReceipt } from './runItems';

// DB debit and browser effect are separate commits; retain both for this live run.
export class ItemUseOperation {
  readonly input: Readonly<ItemUseInput>;
  private receipt?: RunItemReceipt;
  applied = false;
  constructor(readonly clientRunId: string, input: ItemUseInput) { this.input = Object.freeze({ ...input }); }
  async execute(port: RunInventoryPort, apply: (receipt: RunItemReceipt) => boolean): Promise<RunItemReceipt> {
    this.receipt ??= await port.consume(this.clientRunId, this.input);
    const receipt = this.receipt;
    if (receipt.client_run_id !== this.clientRunId || receipt.operation_id !== this.input.operation_id || receipt.item_id !== this.input.item_id) throw new Error('This confirmation belongs to a different operation.');
    if (!this.applied) {
      if (!apply(receipt)) throw new Error('Usage was saved, but the scene did not accept the effect. Retry or finish the run; refunds are not automatic.');
      this.applied = true;
    }
    await port.acknowledge(this.clientRunId, receipt.id);
    return receipt;
  }
}
