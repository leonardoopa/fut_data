# Passe — instruções para o Claude Code

Aplicação web de mercado de jogadores (backend Django em `backend/`, frontend React/TypeScript em `frontend/`). Comandos de execução e testes estão no `README.md`.

## Navegação de contexto (Graphify)

O grafo do código fica em `graphify-out/` (`graph.json`, `GRAPH_REPORT.md`, `graph.html`). Gerado só por AST local, sem LLM.

### Regra das 3 camadas
1. **Primeiro:** consultar o grafo para entender estrutura e conexões. Ler `graphify-out/GRAPH_REPORT.md` (comunidades e pontos centrais) e usar `graphify query "<pergunta>"`, `graphify explain "<nó>"` ou `graphify path "<A>" "<B>"`.
2. **Segundo:** consultar o vault Obsidian (decisões, progresso, logs de sessão), conforme o `CLAUDE.md` global.
3. **Terceiro:** ler arquivos de código brutos só para editar, ou quando as duas primeiras camadas não responderem.

### Limites do grafo
- Melhor para perguntas estruturais: quem chama X, o que depende de Y, caminho entre A e B.
- Para texto livre ou nomes em português, `grep` costuma ser mais preciso. Se uma query vier truncada ou ruidosa, usar `grep`.
- O grafo pode estar desatualizado: comparar o commit em `GRAPH_REPORT.md` ("Built from commit") com `git rev-parse HEAD`.

### Quando reconstruir
- Após mudança estrutural (módulos novos, refatoração grande): `graphify update .` (só arquivos modificados, sem custo de API).
- Não é preciso reconstruir a cada sessão.

### Não fazer
- Não editar arquivos dentro de `graphify-out/` à mão.
- Não reler o código inteiro se o grafo já tem a informação.
