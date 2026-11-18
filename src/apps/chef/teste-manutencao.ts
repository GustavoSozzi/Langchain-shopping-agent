import "dotenv/config";
import { AIMessage, HumanMessage, ToolMessage, type BaseMessage } from "langchain";
import { createAgent, initChatModel } from "langchain";
import { MemorySaver, type StateSnapshot } from "@langchain/langgraph";
import { ChefState } from "../../core/state.js";
import { compactThread } from "./maintenance.js";

// 1. Inicializa o modelo de IA carregando as variáveis do .env (ex: OpenAI, Anthropic)
const model = await initChatModel(process.env.MODEL!, { temperature: 0.2 });

// 2. Cria o agente LangGraph usando um MemorySaver para armazenar o histórico em memória
const agent = createAgent({
  model,
  tools: [],
  stateSchema: ChefState,
  checkpointer: new MemorySaver(),
});

// 3. Define a chave de identificação da thread/conversa atual
const config = { configurable: { thread_id: "teste-poda" } };

// 4. Monta um histórico simulado com mensagens longas para estourar o limite de tokens
const historia: BaseMessage[] = [
  // Mensagens antigas (~54 tokens cada)
  new HumanMessage("pergunta antiga " + "x".repeat(200)),
  new AIMessage("resposta antiga " + "y".repeat(200)),

  // Bloco intermediário com execução de ferramenta (Tool Call)
  new HumanMessage("sou vegana " + "x".repeat(40)),
  //momento que a ia executa função externa
  new AIMessage({
    content: "",
    tool_calls: [
      { name: "save_preference", args: { flag: "vegan" }, id: "call_01", type: "tool_call" },
    ],
  }),
  new ToolMessage({ content: "preferência registrada", tool_call_id: "call_01" }),
  new AIMessage("anotado! " + "y".repeat(40)),

  // Mensagens recentes (~55 tokens cada)
  new HumanMessage("pergunta recente " + "x".repeat(200)),
  new AIMessage("resposta recente " + "y".repeat(200)),
];

// 5. Injeta o histórico simulado diretamente no estado do agente
await agent.updateState(config, { messages: historia });

// 6. Recupera e exibe a contagem de mensagens ANTES da compactação (deve ser 8)
const antes = (await agent.getState(config)) as unknown as StateSnapshot;
console.log("mensagens antes:", (antes.values.messages as BaseMessage[]).length);

// 7. Executa a função de poda limitando o histórico a no máximo ~200 tokens
await compactThread(agent, config, 200);

// 8. Recupera o estado atualizado do agente DEPOIS do corte
const depois = (await agent.getState(config)) as unknown as StateSnapshot;
const restantes = depois.values.messages as BaseMessage[];
console.log("mensagens depois:", restantes.length);

// 9. Mapeia a sequência de tipos das mensagens restantes (ex: ['human', 'ai', 'tool'...])
const tipos = restantes.map((m) => m.getType());
console.log("tipos depois:", tipos);

// 10. Verifica integridade: garante que se existir uma ToolMessage, a mensagem imediatamente
// anterior a ela continua sendo a AIMessage que solicitou a ferramenta
const idxTool = tipos.indexOf("tool");
console.log("par de tool preservado?", idxTool === -1 || tipos[idxTool - 1] === "ai");