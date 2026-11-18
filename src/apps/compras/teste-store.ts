import { InMemoryStore } from "@langchain/langgraph";

async function main() {
    // 1. Instancia a Store em memória diretamente (sem agente)
    const store = new InMemoryStore();

    // Namespaces canônicos isolados por usuário
    const nsAna = ["users", "u-ana", "preferencias"];
    const nsBruno = ["users", "u-bruno", "preferencias"];

    // 2. Grava a preferência de cada usuário no seu respectivo namespace
    await store.put(nsAna, "perfil", { preferencia: "marca própria" });
    await store.put(nsBruno, "perfil", { preferencia: "sem gelatina" });

    // Lê os dois perfis de volta
    const docAna = await store.get(nsAna, "perfil");
    const docBruno = await store.get(nsBruno, "perfil");

    console.log("--- 2. Isolamento por Usuário ---");
    console.log("Preferência da Ana:", docAna?.value);     // { preferencia: 'marca própria' }
    console.log("Preferência do Bruno:", docBruno?.value); // { preferencia: 'sem gelatina' }

    // Lista os documentos do namespace da Ana com search
    const itensAna = await store.search(nsAna, { limit: 10 });
    console.log("Documentos no namespace da Ana:", itensAna.length);
    console.log("Conteúdo do search (Ana):", itensAna.map((item) => item.value));

    // 3. Simulação da falha: namespace global sem userId
    const nsSemIsolamento = ["preferencias"];
    await store.put(nsSemIsolamento, "perfil", { preferencia: "sem lactose" });

    // Tanto Ana quanto Bruno, ao consultarem ["preferencias"], enxergam o mesmo dado compartilhado
    const leituraPelaAna = await store.get(["preferencias"], "perfil");
    const leituraPeloBruno = await store.get(["preferencias"], "perfil");

    console.log("\n--- 3. Falha de Isolamento (sem userId) ---");
    console.log("Ana leu de ['preferencias']:", leituraPelaAna?.value);     // { preferencia: 'sem lactose' }
    console.log("Bruno leu de ['preferencias']:", leituraPeloBruno?.value); // { preferencia: 'sem lactose' }
}

main();