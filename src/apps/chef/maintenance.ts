import { REMOVE_ALL_MESSAGES, type StateSnapshot } from "@langchain/langgraph";
import { RemoveMessage } from "@langchain/core/messages";
import { trimMessages, type BaseMessage } from "langchain";
export type ThreadConfig = { configurable: { thread_id: string } };
type AgentLike = {
    getState: (config: ThreadConfig) => Promise<unknown>;
    updateState: (config: ThreadConfig, values: Record<string, unknown>) =>
        Promise<unknown>;
};
const approxTokenCounter = (messages: BaseMessage[]): number =>
    messages.reduce((total, m) => total + Math.ceil(String(m.content).length / 4), 0);
export async function compactThread(
    agent: AgentLike,
    config: ThreadConfig,
    maxTokens = 200,
): Promise<BaseMessage[]> {
    const snapshot = (await agent.getState(config)) as unknown as StateSnapshot;
    const history = snapshot.values.messages as BaseMessage[];
    const trimmed = await trimMessages(history, {
        maxTokens,
        strategy: "last",
        startOn: "human",
        tokenCounter: approxTokenCounter,
    });
    await agent.updateState(config, {
        messages: [new RemoveMessage({ id: REMOVE_ALL_MESSAGES }), ...trimmed],
    });
    console.log(
        `[compact] ${history.length} -> ${trimmed.length} mensagens ` +
        `(${history.length - trimmed.length} removidas)`,
    );
    return trimmed;
}
