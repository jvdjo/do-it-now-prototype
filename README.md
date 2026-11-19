# Do It Now - Protótipo & App Mobile Android

Protótipo e aplicativo mobile Android funcional (**React Native + Expo**) da aplicação **Do It Now**, seguindo o visual wireframe Preto & Branco (`prototype-v2.0`).

## Estrutura do Projeto

- `index.html`: Protótipo web estático original.
- `mobile/`: Aplicativo mobile Android funcional construído com **React Native + Expo**.

## Funcionalidades do App Mobile (`mobile/`)

- **CRUD Completo de Tarefas**:
  - Criar tarefas em 2 etapas (Etapa 1: Título, Descrição, Repetição, Data, Dia inteiro e Lembretes; Etapa 2: Sliders de Dificuldade, Importância e Medo, vínculo automático ou manual de EXP/Ouro e Habilidades).
  - Editar tarefas existentes.
  - Concluir tarefas (ganhando Ouro, EXP e evolução de Habilidade).
  - Marcar falha na tarefa (aplicando penalidade de Ouro, EXP e Habilidade).
  - Excluir e reabrir tarefas.
  - Busca em tempo real, filtros por status (Pendentes, Concluídas, Falhadas, Todas) e ordenação (Data, Recompensa, Dificuldade, A-Z).
- **Sistema de RPG Funcional**:
  - Cálculo dinâmico de XP e Ouro com base nos sliders de Dificuldade, Importância e Medo.
  - Barra/círculo de progresso percentual e subida automática de Nível.
  - Painel de Perfil e Habilidades na aba `[Menu]`.
- **Loja de Recompensas Funcional**:
  - Listagem de recompensas disponíveis e histórico de recompensas resgatadas com data/hora.
  - Resgate funcional descontando do saldo de ouro do herói.
  - Cadastro de novas recompensas personalizadas pelo botão `+`.
  - Busca e ordenação por preço.
- **Persistência Local**:
  - Todos os dados são salvos automaticamente no aparelho com `@react-native-async-storage/async-storage` (com opção no `[Menu]` para restaurar os dados originais de demonstração).

## Como executar no celular Android (Expo Go)

1. Instale o aplicativo **Expo Go** na Google Play Store do seu celular Android.
2. No terminal, entre na pasta `mobile` e inicie o servidor Expo:
   ```powershell
   cd mobile
   npx expo start
   ```
3. Escaneie o **QR Code** que aparecerá no terminal usando o app **Expo Go** (certifique-se de que o computador e o celular estejam na mesma rede Wi-Fi, ou use `npx expo start --tunnel`).

## Como executar no navegador (Teste rápido)

```powershell
cd mobile
npx expo start --web
```
