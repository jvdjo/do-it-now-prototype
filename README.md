# Do It Now - Protótipo & App Mobile Android

Protótipo e aplicativo mobile Android funcional (**React Native + Expo**) da aplicação **Do It Now**, com visual minimalista Preto & Branco, elementos arredondados e ícones vetoriais (**Lucide React Native**).

---

## Estrutura do Projeto

- `index.html`: Protótipo web estático original.
- `mobile/`: Aplicativo mobile Android funcional construído com **React Native + Expo**.

---

## Como usar o aplicativo no próprio celular Android (Passo a Passo)

### 1. Pré-requisitos
- **No computador:** Ter o [Node.js](https://nodejs.org/) instalado.
- **No celular Android:** Instalar o aplicativo **Expo Go** na [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent).
- **Rede:** Conectar o celular e o computador na **mesma rede Wi-Fi** (ou usar o modo `--tunnel` caso estejam em redes diferentes).

### 2. Instalar as dependências (apenas na primeira vez)
Abra o terminal na raiz do repositório, entre na pasta `mobile` e instale os pacotes:

```powershell
cd mobile
npm install
```

### 3. Iniciar o servidor do aplicativo
Ainda dentro da pasta `mobile`, execute:

```powershell
npx expo start
```

> **Dica (Redes Virtuais / WSL / Hyper-V):** Se o seu computador tiver adaptadores virtuais (como WSL ou Docker) e o Expo exibir um IP `172.x.x.x` em vez do IP da sua rede Wi-Fi/Ethernet (`192.168.x.x`), defina o IP da sua máquina antes de iniciar ou use o modo túnel:
> ```powershell
> # Opção A: Usando o IP local da sua máquina na rede (substitua pelo seu IPv4 local)
> $env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.0.144"
> npx expo start --lan
>
> # Opção B: Usando modo Túnel (funciona mesmo em redes diferentes / 4G / Firewall)
> npx expo start --tunnel
> ```

### 4. Abrir no celular com o Expo Go
1. Abra o aplicativo **Expo Go** no seu celular Android.
2. Escaneie o **QR Code** que apareceu no terminal do computador, **ou** toque em **"Enter URL manually"** (Inserir URL manualmente) e digite o endereço exibido no terminal (por exemplo: `exp://192.168.0.144:8081`).
3. O aplicativo será compilado e abrirá diretamente na tela do seu celular!

---

## Como executar no navegador (Teste rápido no PC)

Caso queira testar no navegador do próprio computador:

```powershell
cd mobile
npx expo start --web
```

---

## Funcionalidades do App Mobile (`mobile/`)

- **Jornada (Tela Inicial)**:
  - Card do Herói com Nível, Ouro, ícone personalizado de **XP** e progresso percentual automático para o próximo nível.
  - Pesquisa de tarefas em tempo real, filtros por status (`Pendentes`, `Concluídas`, `Falhadas`, `Todas`) e ordenação (`Mais Recentes`, `Maior Recompensa`, `Maior Dificuldade`, `Ordem Alfabética`).
  - Botão de check (`✓`) para concluir tarefas ganhando Ouro, EXP e evoluindo habilidades.
  - Menu de ações (`⋮`) em cada tarefa para **Editar**, **Falhar** (aplicando penalidade de XP, Ouro e Habilidade), **Reabrir** ou **Excluir**.
- **Cadastro e Edição de Tarefas em 2 Etapas**:
  - **Etapa 1:** Título, Descrição, Repetição (`Não repetir`, `Semanalmente`, `Mensalmente`, `Todos os dias`, `Anual`), Data de Início, opção `Dia inteiro` e adição/remoção de **Lembretes**.
  - **Etapa 2 (Elementos de RPG):** Sliders interativos de **Dificuldade**, **Importância** e **Medo** (`0%` a `100%`), cálculo automático (ou manual) de **EXP e Ouro**, cálculo da penalidade de falha e seleção de habilidades para aumentar/diminuir.
- **Loja de Recompensas**:
  - Abas **Disponíveis** e **Resgatadas** (com registro de data e hora do resgate).
  - Resgate funcional descontando do saldo de ouro do herói.
  - Botão flutuante (`+`) para cadastrar novas recompensas personalizadas na loja.
  - Busca e ordenação de recompensas por menor ou maior preço.
- **Menu & Perfil do Herói + Persistência Local**:
  - Edição do nome do herói, visualização dos níveis das habilidades e estatísticas gerais da jornada.
  - Salvamento automático de todos os dados no aparelho via `AsyncStorage` e botão para restaurar os dados originais do protótipo.
