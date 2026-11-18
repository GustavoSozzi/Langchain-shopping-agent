import "dotenv/config";
import { createAgent, HumanMessage, initChatModel } from "langchain";
import { MemorySaver, type StateSnapshot } from "@langchain/langgraph";
import { ChefState } from "../../core/state.js";

// Inicializa o modelo de chat usando a variável de ambiente MODEL e uma temperatura baixa para respostas mais determinísticas
const model = await initChatModel(process.env.MODEL!, { temperature: 0.2 });

// Cria o agente utilizando o LangGraph, injetando o modelo, ferramentas vazias, 
// o esquema de estado customizado (ChefState) e um salvador de estado em memória (MemorySaver)
const agent = createAgent({
    model,
    tools: [],
    stateSchema: ChefState,
    checkpointer: new MemorySaver(),
});

// Configuração de execução contendo o identificador da thread (sessão/histórico)
const config = { configurable: { thread_id: "teste-reducer" } };

// Atualiza o estado do agente injetando a primeira mensagem do usuário ("oi") no histórico
await agent.updateState(config, { messages: [new HumanMessage("oi")] });

// Recupera o snapshot atual do estado do agente na thread correspondente
let snapshot = (await agent.getState(config)) as unknown as StateSnapshot;

// Exibe no console as flags alimentares presentes no estado após o primeiro turno
console.log("flags no primeiro turno:", snapshot.values.dietaryFlags);

// Adiciona manualmente a restrição alimentar "vegan" ao estado usando o updateState
await agent.updateState(config, { dietaryFlags: ["vegan"] });

// Adiciona manualmente a restrição alimentar "sem-lactose" ao estado (o reducer vai unir com a anterior)
await agent.updateState(config, { dietaryFlags: ["sem-lactose"] });

// Recupera novamente o snapshot atualizado do estado do agente
snapshot = (await agent.getState(config)) as unknown as StateSnapshot;

// Exibe as flags após as duas escritas disjuntas (graças ao reducer, o resultado será ["vegan", "sem-lactose"])
console.log("flags após duas escritas disjuntas:", snapshot.values.dietaryFlags);