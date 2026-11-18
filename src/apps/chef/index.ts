// Carrega as variáveis de ambiente a partir do arquivo .env (ex: API key da OpenAI)
import "dotenv/config";

// Importa a função construtora do agente e a tipagem do seu contexto
import { createChefAgent } from "../../core/agent.js";
import type { ChefCtxT } from "../../core/state.js";

// Inicializa a instância do agente (carrega LLM, ferramentas, checkpointer e memória de longo prazo)
const agent = await createChefAgent();

// ----------------------------------------------------------------------------------
// 1. DEFINIÇÃO DOS CONTEXTOS DE USUÁRIO (Memória de Longo Prazo / Multi-tenancy)
// ----------------------------------------------------------------------------------
// Define o perfil da Alice: identificador único "u-alice" e plano "pro"
const aliceCtx: ChefCtxT = { userId: "u-alice", plan: "pro" };

// Define o perfil do Bob: identificador único "u-bob" e plano "free"
const bobCtx: ChefCtxT = { userId: "u-bob", plan: "free" };

// ----------------------------------------------------------------------------------
// 2. CONFIGURAÇÕES DE EXECUÇÃO (RunnableConfig)
// Cada objeto combina a Sessão do Chat (thread_id) com a Identidade do Usuário (context)
// ----------------------------------------------------------------------------------
// Alice conversando no Chat 1
const alice1 = { configurable: { thread_id: "chef-alice-1" }, context: aliceCtx };

// Alice abrindo um novo Chat 2 (mesmo userId, mas thread_id diferente)
const alice2 = { configurable: { thread_id: "chef-alice-2" }, context: aliceCtx };

// Bob conversando no seu próprio Chat 1
const bob1 = { configurable: { thread_id: "chef-bob-1" }, context: bobCtx };

// ----------------------------------------------------------------------------------
// 3. TESTE 1: Alice registra uma preferência alimentar na Thread 1
// ----------------------------------------------------------------------------------
const r1 = await agent.invoke(
  {
    messages: [
      {
        role: "user",
        content: "Sou vegana. Anote essa restrição para as próximas conversas, por favor.",
      },
    ],
  },
  alice1, // Envia as configurações da Thread 1 da Alice
);

console.log("--- Alice, thread 1: registro da preferência ---");
// Exibe a resposta enviada pelo agente no final da execução
console.log(r1.messages.at(-1)?.text);

// ----------------------------------------------------------------------------------
// 4. TESTE 2: Alice abre a Thread 2 (histórico zerado) e consulta a restrição
// ----------------------------------------------------------------------------------
const r2 = await agent.invoke(
  {
    messages: [
      {
        role: "user",
        content: "O que você sabe sobre as minhas restrições alimentares?",
      },
    ],
  },
  alice2, // Envia a Thread 2 da Alice (valida se ele recupera o dado gravado em 'u-alice')
);

console.log("\n--- Alice, thread 2: outra conversa, mesma usuária ---");
// Se a memória de longo prazo funcionar, o agente responderá que ela é vegana
console.log(r2.messages.at(-1)?.text);

// ----------------------------------------------------------------------------------
// 5. TESTE 3: Bob faz uma pergunta na sua própria Thread 1
// ----------------------------------------------------------------------------------
const r3 = await agent.invoke(
  {
    messages: [
      {
        role: "user",
        content: "Tenho abóbora em casa. Que pratos você sugere?",
      },
    ],
  },
  bob1, // Envia as configurações do Bob (valida isolamento de dados e regras do plano 'free')
);

console.log("\n--- Bob, thread 1: plano free ---");
// Valida se as preferências da Alice NÃO impactam a resposta do Bob
console.log(r3.messages.at(-1)?.text);