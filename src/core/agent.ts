import { createAgent, initChatModel } from "langchain";
import { InMemoryStore, MemorySaver } from "@langchain/langgraph";
import { chefTools } from "../apps/chef/tools.js";
import { ChefContext, ChefState } from "./state.js";
const SYSTEM_PROMPT = `Você é o Personal Chef, um assistente de cozinha.
Regras:
- Nunca invente receitas, quantidades ou valores nutricionais: use as ferramentas.
- Quando o usuário declarar uma restrição alimentar permanente, registre com
save_preference.
- Quando precisar das restrições do usuário, consulte get_preferences.
- Para reescalar ou estimar nutrição, busque a receita antes com search_recipes.
- Responda em português do Brasil, de forma direta e amigável.`;
export async function createChefAgent() {
    const model = await initChatModel(process.env.MODEL!, {
        temperature: 0.2,
        maxTokens: 2000,
    });
    return createAgent({
        model,
        tools: chefTools,
        systemPrompt: SYSTEM_PROMPT,
        stateSchema: ChefState,
        contextSchema: ChefContext,
        checkpointer: new MemorySaver(),
        store: new InMemoryStore(),
    });
}
