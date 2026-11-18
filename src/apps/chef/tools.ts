import { tool, type ToolRuntime } from "langchain";
import * as z from "zod";
import { Command } from "@langchain/langgraph";
import { ToolMessage } from "@langchain/core/messages";
import type { ChefStateT, ChefCtxT, StdContext,  ExerciceState} from "../../core/state.js";
import { run } from "node:test";


interface Quantidade {
    item: string;
    quantidade: number;
    unidade: string;
}

interface Receita {
    nome: string;
    porcoes: number;
    ingredientes: Quantidade[];
}

interface Exercicio {
    titulo: string;
    tempoMinutos: number;
    nivel: "facil" | "medio" | "dificil";
}


interface Topico {
    nome: string;
    cargaHoraria: number;
    exercicios: Exercicio[];
}

type KVStore = {
    put(ns: string[], key: string, value: unknown): Promise<void>;
    get(ns: string[], key: string): Promise<{ value: unknown } | undefined>;
};
const storeOf = (runtime: ToolRuntime<ChefStateT, ChefCtxT>): KVStore => {
    return runtime.store as unknown as KVStore;
}

const normalizar = (texto: string) => texto.trim().toLowerCase();

const CATALOGO: Receita[] = [
    {
        nome: "Risoto de abóbora",
        porcoes: 4,
        ingredientes: [
            { item: "abóbora", quantidade: 600, unidade: "g" },
            { item: "arroz arbóreo", quantidade: 320, unidade: "g" },
            { item: "queijo parmesão", quantidade: 80, unidade: "g" },
            { item: "caldo de legumes", quantidade: 1, unidade: "l" },
        ],
    },
    {
        nome: "Frango assado com limão",
        porcoes: 4,
        ingredientes: [
            { item: "frango", quantidade: 800, unidade: "g" },
            { item: "limão", quantidade: 1, unidade: "unidade" },
            { item: "batata", quantidade: 600, unidade: "g" },
        ],
    },
    {
        nome: "Sopa de abóbora com leite de coco",
        porcoes: 4,
        ingredientes: [
            { item: "abóbora", quantidade: 700, unidade: "g" },
            { item: "cebola", quantidade: 150, unidade: "g" },
            { item: "leite de coco", quantidade: 200, unidade: "ml" },
        ],
    },
];


const CATALOGO_LISTAR_EXERCICIO: Topico[] = [
  {
    nome: "TypeScript",
    cargaHoraria: 8,
    exercicios: [
      { titulo: "Tipagem básica de funções", tempoMinutos: 10, nivel: "facil" },
      { titulo: "Interfaces vs Type Aliases", tempoMinutos: 15, nivel: "facil" },
      { titulo: "Union Types e Narrowing", tempoMinutos: 15, nivel: "facil" },
      { titulo: "Tuplas e Arrays readonly", tempoMinutos: 15, nivel: "facil" },
      { titulo: "Funções Genéricas", tempoMinutos: 20, nivel: "medio" },
      { titulo: "Utility Types: Partial e Pick", tempoMinutos: 20, nivel: "medio" },
      { titulo: "Utility Types: Record e Omit", tempoMinutos: 20, nivel: "medio" },
      { titulo: "Inferência de tipos com Zod", tempoMinutos: 25, nivel: "medio" },
      { titulo: "Discriminated Unions", tempoMinutos: 30, nivel: "dificil" },
      { titulo: "Conditional Types e infer", tempoMinutos: 35, nivel: "dificil" },
    ],
  },
  {
    nome: "LangGraph",
    cargaHoraria: 6,
    exercicios: [
      { titulo: "Definindo StateSchema e ReducedValue", tempoMinutos: 15, nivel: "facil" },
      { titulo: "Tool retornando Command e ToolMessage", tempoMinutos: 25, nivel: "medio" },
      { titulo: "Injetando contextSchema no runtime", tempoMinutos: 20, nivel: "medio" },
      { titulo: "Persistência com checkpointer e thread_id", tempoMinutos: 30, nivel: "dificil" },
    ],
  },
  {
    nome: "SQL",
    cargaHoraria: 4,
    exercicios: [
      { titulo: "Filtros com SELECT e WHERE", tempoMinutos: 10, nivel: "facil" },
      { titulo: "Junções com INNER e LEFT JOIN", tempoMinutos: 20, nivel: "medio" },
      { titulo: "Agregações com GROUP BY e HAVING", tempoMinutos: 25, nivel: "medio" },
    ],
  },
];

const TABELA_NUTRICIONAL: Record<string, { calorias: number; proteina_g: number; carboidratos_g: number; gorduras_g: number }
> = {
    "abóbora": { calorias: 40, proteina_g: 1, carboidratos_g: 10, gorduras_g: 0.1 },
    "arroz arbóreo": { calorias: 130, proteina_g: 2.7, carboidratos_g: 28, gorduras_g: 0.3 },
    "queijo parmesão": { calorias: 420, proteina_g: 35, carboidratos_g: 4, gorduras_g: 28 },
    "caldo de legumes": { calorias: 10, proteina_g: 0.5, carboidratos_g: 1, gorduras_g: 0.2 },
    "frango": { calorias: 165, proteina_g: 31, carboidratos_g: 0, gorduras_g: 3.6 },
    "limão": { calorias: 29, proteina_g: 1.1, carboidratos_g: 9, gorduras_g: 0.3 },
    "batata": { calorias: 77, proteina_g: 2, carboidratos_g: 17, gorduras_g: 0.1 },
    "cebola": { calorias: 40, proteina_g: 1.1, carboidratos_g: 9, gorduras_g: 0.1 },
    "leite de coco": { calorias: 230, proteina_g: 2, carboidratos_g: 6, gorduras_g: 24 },
};


export const listar_exercicios = tool(
    ({ topico }, runtime: ToolRuntime<ExerciceState, StdContext>) => {
        const plano = runtime.context.plan;
        const maximo = plano === "pro" ? 10: 3
        const alvo = normalizar(topico);
        const achadas = CATALOGO_LISTAR_EXERCICIO.filter((exercicio) => 
            exercicio.exercicios.some((i) => normalizar(i.titulo).includes(alvo)),
        ).slice(0, maximo);
    if (achadas.length === 0){
        return `Nenhum exercicio encontrado usa "${topico}". Sugira ao usuário outro tópico.`;
    }
    return achadas.map((exercicio) => `${exercicio.cargaHoraria} - nome ${exercicio.nome}`)},
    {
        name: "listar_exercicios",
        description: 
            "Busca um exercicio por titulo na lista de exercicio. O número máximo de resultados " + 
            "depende do plano do usuário (free: 3, pro: 10).",
            schema: z.object({
                topico: z.string().describe("Tópico a buscar na lista de exercicios: ex: Tipagem básica de funções"),
            }),
    },
)

export const search_recipes = tool(
    ({ ingrediente }, runtime: ToolRuntime<ChefStateT, ChefCtxT>) => {
        const plano = runtime.context.plan;
        const maximo = plano === "pro" ? 5 : 1;
        const alvo = normalizar(ingrediente);
        const achadas = CATALOGO.filter((receita) =>
            receita.ingredientes.some((i) => normalizar(i.item).includes(alvo)),
        ).slice(0, maximo);
        if (achadas.length === 0) {
            return `Nenhuma receita do catálogo usa "${ingrediente}". Sugira ao usuário outro
ingrediente.`;
        }
        return achadas
            .map(
                (receita) =>
                    `${receita.nome} — rende ${receita.porcoes} porções\n` +
                    receita.ingredientes
                        .map((i) => ` ${i.quantidade} ${i.unidade} de ${i.item}`)
                        .join("\n"),
            )
            .join("\n\n");
    },
    {
        name: "search_recipes",
        description:
            "Busca receitas no catálogo local. O número máximo de resultados " +
            "depende do plano do usuário (free: 1, pro: 5).",
        schema: z.object({
            ingrediente: z.string().describe("Ingrediente a buscar, ex: abóbora"),
        }),
    },
)

export const scale_recipe = tool(
    ({ receita, porcoes_originais, porcoes_desejadas }) => {
        const achada = CATALOGO.find((r) =>
            normalizar(r.nome).includes(normalizar(receita)),
        );

        if (!achada) {
            return `Receita "${receita}" não encontrada no catálogo. Chame search_recipes primeiro para ver as opções.`;
        }

        const fator = porcoes_desejadas / porcoes_originais;
        const reescalados = achada.ingredientes.map((i) => ({
            item: i.item,
            quantidade: Math.round(i.quantidade * fator * 10) / 10,
            unidade: i.unidade,
        }));

        return (
            `${achada.nome} para ${porcoes_desejadas} porções (fator ${fator.toFixed(2)}):\n` +
            reescalados.map((i) => ` ${i.quantidade} ${i.unidade} de ${i.item}`).join("\n")
        );
    },
    {
        name: "scale_recipe",
        description:
            "Reescala as quantidades de uma receita do catálogo para um novo número de porções. " +
            "Chame depois de search_recipes, passando o nome exato da receita e o rendimento " +
            "original retornado pela busca. Retorna os ingredientes reescalados e o fator de conversão.",
        schema: z.object({
            receita: z.string().describe("Nome da receita, como retornado por search_recipes"),
            porcoes_originais: z
                .number()
                .int()
                .positive()
                .describe("Rendimento original, conforme informado pela busca"),
            porcoes_desejadas: z
                .number()
                .int()
                .positive()
                .describe("Novo número de porções"),
        }),
    },
);

export const estimate_nutrition = tool(
    ({ ingredientes }) => {
        const total = { calorias: 0, proteina_g: 0, carboidratos_g: 0, gorduras_g: 0 };
        const nao_reconhecidos: string[] = [];

        for (const nome of ingredientes) {
            const info = TABELA_NUTRICIONAL[normalizar(nome)];
            if (!info) {
                nao_reconhecidos.push(nome);
                continue;
            }
            total.calorias += info.calorias;
            total.proteina_g += info.proteina_g;
            total.carboidratos_g += info.carboidratos_g;
            total.gorduras_g += info.gorduras_g;
        }

        return {
            base: "estimativa por 100 g de cada ingrediente",
            total,
            nao_reconhecidos,
        };
    },
    {
        name: "estimate_nutrition",
        description:
            "Estima calorias e macronutrientes de uma lista de ingredientes usando a tabela " +
            "local do chef (valores aproximados por 100 g). Use quando o usuário perguntar sobre " +
            "nutrição de um prato. Ingredientes fora da tabela são devolvidos em `nao_reconhecidos`.",
        schema: z.object({
            ingredientes: z
                .array(z.string())
                .min(1)
                .describe("Lista de ingredientes, ex: abóbora, arroz arbóreo"),
        }),
    },
);

// Define uma ferramenta (tool) do LangChain chamada "save_preference"
export const save_preference = tool(
    // Função assíncrona executada quando a IA decide chamar essa ferramenta.
    // Recebe os parâmetros extraídos ({ flag }) e o objeto de execução (runtime) contendo estado e contexto.
    async ({ flag }, runtime: ToolRuntime<ChefStateT, ChefCtxT>) => {
        
        // Extrai o ID do usuário diretamente do contexto injetado no runtime (ex: "u-alice")
        const userId = runtime.context.userId;
        
        // Define um caminho hierárquico (namespace) para isolar e organizar os dados do usuário no armazenamento de longo prazo
        const ns = ["users", userId, "preferences"];
        
        // Obtém a instância do "Store" (banco de dados de longo prazo/cross-thread) a partir do runtime
        const store = storeOf(runtime);
        
        // Busca no Store se já existe algum documento salvo com a chave "preferences" dentro do namespace do usuário
        const doc = await store.get(ns, "preferences");
        
        // Verifica se o dado retornado é um array válido; caso contrário, inicializa uma lista vazia
        const anteriores = Array.isArray(doc?.value) ? (doc!.value as string[]) : [];
        
        // Junta as preferências antigas com a nova flag e usa um Set para remover itens duplicados
        const consolidadas = [...new Set([...anteriores, flag])];
        
        // Salva a lista consolidada de preferências de volta no Store de longo prazo (permanece entre diferentes sessões/threads)
        await store.put(ns, "preferences", consolidadas);
        
        // Retorna um Command do LangGraph para atualizar o estado da sessão atual e responder ao modelo de IA
        return new Command({
            update: {
                // Atualiza o estado da thread atual com a nova flag (acionando o reducer que acumula as flags)
                dietaryFlags: [flag],
                
                // Cria e adiciona uma ToolMessage ao histórico para informar o modelo sobre o sucesso da operação
                messages: [
                    new ToolMessage({
                        // Conteúdo da mensagem que a IA vai ler para saber o resultado
                        content:
                            `Preferência "${flag}" registrada para ${userId}. ` +
                            `No perfil constam: ${consolidadas.join(", ")}.`,
                        // Associa a mensagem ao ID exato da chamada da ferramenta feita pela IA
                        tool_call_id: runtime.toolCallId,
                    }),
                ],
            },
        });
    },
    {
        // Nome identificador da ferramenta que o modelo lê para saber quando usá-la
        name: "save_preference",
        
        // Descrição orientativa para o modelo de IA entender *quando* e *para que* serve esta ferramenta
        description:
            "Salva uma restrição ou preferência alimentar permanente do usuário " +
            "(ex: vegana, sem lactose). Use quando o usuário declarar uma restrição " +
            "e pedir para lembrar, ou quando a restrição claramente não vale só para esta conversa.",
            
        // Esquema Zod que define, valida e tipa os parâmetros que a IA precisa fornecer ao chamar esta tool
        schema: z.object({
            flag: z.string().describe("Restrição alimentar, ex: vegana, sem lactose"),
        }),
    },
);

export const get_preferences = tool(
    async (_input, runtime: ToolRuntime<ChefStateT, ChefCtxT>) => {
        const userId = runtime.context.userId;
        const store = storeOf(runtime);
        const doc = await store.get(["users", userId, "preferences"], "preferences");
        if (!doc || !Array.isArray(doc.value) || doc.value.length === 0) {
            return `Nenhuma preferência alimentar registrada para este usuário.`;
        }
        return `Preferências alimentares registradas: ${doc.value.join(", ")}.`;
    },
    {
        name: "get_preferences",
        description:
            "Lê as preferências alimentares permanentes do usuário. Use antes de sugerir receitas " + "ou quando precisar respeitar restrições que podem ter sido ditas em conversas anteriores.",
schema: z.object({}),
    },
);

export const chefTools = [
    search_recipes,
    scale_recipe,
    estimate_nutrition,
    save_preference,
    get_preferences,
]

