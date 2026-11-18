import { InMemoryStore } from "@langchain/langgraph";
// Cria um armazenamento de longo prazo em memória RAM (simulando um banco de dados KV/Chave-Valor)
const store = new InMemoryStore();
// Define um namespace (caminho hierárquico em formato de array) para isolar os dados da usuária Alice
const ns = ["users", "u-alice", "preferences"];
// Salva a lista inicial de preferências da Alice na chave "preferences" dentro do seu namespace
await store.put(ns, "preferences", ["vegan"]);
// Atualiza/sobrescreve o valor da chave "preferences" com uma nova lista (adicionando "sem-lactose")
await store.put(ns, "preferences", ["vegan", "sem-lactose"]);
// Busca o documento armazenado no namespace da Alice com a chave "preferences"
const doc = await store.get(ns, "preferences");
// Exibe o valor atual salvo no perfil da Alice (será: ["vegan", "sem-lactose"])
console.log("perfil da alice:", doc?.value);
// Exibe o namespace de onde o documento foi recuperado
console.log("namespace:", doc?.namespace);
// Tenta buscar as preferências de outro usuário (Bob). Como nada foi salvo para o Bob, retorna undefined.
const bob = await store.get(["users", "u-bob", "preferences"], "preferences");
console.log("perfil do bob:", bob?.value);
// Pesquisa/lista os itens armazenados dentro do namespace da Alice definindo um limite de 10 resultados
const lista = await store.search(ns, { limit: 10 });
// Exibe a quantidade de itens encontrados no namespace da Alice (será: 1, pois há apenas a chave "preferences")
console.log("itens no namespace da alice:", lista.length);