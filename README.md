# MonY — Firebase + Expo (Android e Web)

Aplicativo escolar de finanças pessoais feito com **React Native, Expo SDK 52, Expo Router e TypeScript**. A interface visual original foi mantida. O projeto usa **Firebase Authentication**, **Cloud Firestore** (dados financeiros e preferências) e armazenamento **local** das fotos do perfil (sem Firebase Storage).

> **Antes de usar:** é necessário conectar seu próprio projeto Firebase. O ZIP contém um `.env` com campos vazios — **não contém credenciais reais**. O login Google só funcionará depois que você configurar os clientes OAuth, domínios e fingerprints descritos abaixo. Este ZIP é código preparado para execução; não foi possível confirmar uma autenticação real sem acesso ao seu Firebase.

## 1. Instalar

Pré-requisitos: Node.js 20+ e npm. O arquivo original `package-lock.json` ficou como `package-lock.legacy.json` porque as dependências do Firebase e do Google nativo foram acrescentadas. Gere o novo lock ao instalar:

```bash
npm install
```

**Web:**

```bash
npm run web
```

**Android (login Google nativo):** use um emulador ou celular Android configurado com Android Studio/SDK e execute:

```bash
npx expo run:android
```

Para evitar problemas na compilação de módulos nativos, use `npx expo prebuild --clean` somente quando for necessário regenerar a pasta `android/`. **Google no Android não funciona no Expo Go**, pois usa um módulo nativo: é necessária uma build própria do aplicativo. No navegador o Google usa popup do Firebase.

## 2. Criar/configurar o Firebase (projeto já existente)

No [Console Firebase](https://console.firebase.google.com/):

1. Abra seu projeto > **Configurações do projeto** > **Seus aplicativos** > adicione/selecione um **aplicativo da Web** (`</>`). Copie as informações do objeto `firebaseConfig` para o arquivo `.env` na raiz:

   | Campo do `firebaseConfig` | Variável no `.env` |
   | --- | --- |
   | `apiKey` | `EXPO_PUBLIC_FIREBASE_API_KEY` |
   | `authDomain` | `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` |
   | `projectId` | `EXPO_PUBLIC_FIREBASE_PROJECT_ID` |
   | `storageBucket` | `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` |
   | `messagingSenderId` | `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
   | `appId` | `EXPO_PUBLIC_FIREBASE_APP_ID` |

2. Em **Authentication > Sign-in method**, habilite **E-mail/senha** e **Google**. Configure o e-mail de suporte exigido pelo Google.
3. Em **Authentication > Settings > Authorized domains**, autorize o domínio usado no navegador, inclusive `localhost` se for testar localmente. Se a janela Google apresentar `auth/unauthorized-domain`, revise essa lista e o domínio configurado em `authDomain`.
4. Em **Firestore Database**, crie um banco de dados (modo produção é adequado). Cole o conteúdo de **`firestore.rules`** na aba **Regras** e publique.
5. **Não ative Firebase Storage:** esta edição guarda fotos de perfil somente neste dispositivo/navegador. Isso evita a exigência do plano Blaze.
6. Salve o `.env` e reinicie o Metro após qualquer alteração de variável:

```bash
npx expo start --clear --web
```

**Nunca adicione service accounts JSON, credenciais administrativas ou chaves privadas ao código Expo**. As variáveis `EXPO_PUBLIC_*` são incluídas no aplicativo compilado e portanto são **identificadores públicos**. A proteção é aplicada pelas regras `firestore.rules`.

## 3. Google no Android (passo indispensável)

1. No Firebase > **Configurações do projeto > Seus aplicativos**, registre um aplicativo **Android** com o package name `com.piideia.app` (igual ao `app.json`).
2. Cadastre os fingerprints **SHA-1** e, recomendavelmente, **SHA-256** do certificado com o qual você compila e assina o APK. A chave de debug da sua máquina pode ser obtida com `keytool -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore` (senha padrão debug: `android`). APKs instalados de builds diferentes podem exigir outros fingerprints.
3. No app Android do Firebase, baixe **`google-services.json`** e coloque o arquivo na raiz do projeto. O `app.config.js` o detecta automaticamente e informa seu caminho à configuração nativa do Expo. Este arquivo é específico do **seu** projeto e portanto não está no ZIP. Sem ele, não considere o Google Android configurado.
4. Após cadastrar os fingerprints, confira em **Google Cloud Console > APIs e serviços > Credenciais** o **ID do cliente OAuth 2.0 do tipo aplicativo Web** associado ao projeto; coloque-o em `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` no `.env`. **Não use aqui o Client ID de tipo Android**.
5. Confirme que o provedor Google está habilitado em **Firebase Authentication**.
6. Gere/instale uma **build Android nativa** (`npx expo run:android`); o botão Google nessa build obtém um ID token do Google e entra no Firebase via `signInWithCredential`.

Se surgir `DEVELOPER_ERROR` ou `idToken` vazio, verifique a combinação **package name + SHA-1/256 + Web Client ID + projeto Firebase**. Android não usa o mesmo popup do navegador. Consulte [documentação oficial do Expo](https://docs.expo.dev/guides/google-authentication/).

**Login com Apple:** o botão foi mantido visualmente, mas mostra uma mensagem de função futura. Não autentica no momento.

## 4. Estrutura e banco de dados

- `lib/firebase.ts`: inicialização de Auth com persistência nativa e conexão Firestore.
- `lib/googleSignIn.web.ts`: login Google via popup no navegador.
- `lib/googleSignIn.native.ts`: login nativo no Android (build própria).
- `context/AuthContext.tsx`: cadastro, sessão, login, perfil, senha e alteração verificada de e-mail.
- `lib/cloudData.ts`: dados sincronizados com Firestore, cache local e importação explícita de dados antigos.
- `firestore.rules`: só cada usuário autenticado pode acessar os próprios dados. `storage.rules` é legado e não precisa ser publicado.
- `components/ImportLegacyModal.tsx`: ferramenta de importação dentro de **Perfil > Seus dados**.
- `server/` e `lib/localBackend.ts`: **código histórico da implementação anterior** (não utilizado pelo Firebase); preservado para referência/migração manual.

Documentos armazenados:

```text
users/{uid}                              -> name, email, phone, avatar, previousAvatar
users/{uid}/data/finapp_transactions     -> transações
users/{uid}/data/finapp_goals            -> metas
users/{uid}/data/finapp_custom_categories -> categorias personalizadas
users/{uid}/data/finapp_notifications    -> avisos
users/{uid}/data/finapp_notification_settings -> preferências
users/{uid}/data/finapp_notifications_meta -> metadados de lembretes
users/{uid}/data/finapp_last_weekly_summary -> data do último resumo
users/{uid}/data/mony_simulations        -> simulações salvas
users/{uid}/data/mony_sim_history        -> histórico de simulações
users/{uid}/data/mony_levelup_seen      -> conquistas já notificadas
Fotos: AsyncStorage local (`mony:local-avatar:<uid>:<timestamp>`). Firestore guarda apenas uma referência `local:`.
```

Cada documento de `data` contém `json` (a representação serializada da coleção) e `updatedAt`. O limite máximo de **1 MiB por documento Firestore** torna essa solução apropriada para o escopo escolar, mas aplicações com milhares de transações devem migrar para subcoleções por item, com paginação e atualização granular.

## 5. Preservação e importação dos dados antigos

**Nenhuma chave antiga é excluída.** A versão anterior mantinha dados financeiros em `AsyncStorage` sob chaves como `finapp_transactions:{ID-antigo}`, `finapp_goals:{ID-antigo}`, além de chaves sem ID. O novo Firebase atribui UIDs diferentes dos IDs do servidor anterior.

1. Inicie o app **no mesmo dispositivo e origem de navegador onde os registros antigos foram salvos**.
2. Cadastre-se/entre com uma conta Firebase.
3. Abra **Perfil > Seus dados > Importar dados antigos**.
4. Confira o identificador da conta antiga e selecione **somente sua própria conta**; confirme a importação.
5. A importação **não sobrescreve** nenhum conjunto que já exista no Firebase. Dados antigos permanecem intactos. Se o aplicativo não mostrar a atualização, feche e abra novamente.

O login antigo por senha **não é migrado automaticamente** do servidor Express. Você precisa criar/usar uma conta Firebase. A importação depende de os dados existirem no armazenamento local do dispositivo. Se trocou de navegador, computador, domínio ou reinstalou o app e perdeu o cache, a versão nova não pode recuperar esses dados por conta própria. Faça backup dos dados antigos antes de atualizar.

Uma conta recém-criada começa com transações e metas vazias — dados demonstrativos do projeto original não são adicionados como transações reais.

## 6. Recuperação de senha e mudanças de conta

- **Esqueceu a senha?**: Firebase envia um link para o e-mail; não há mais código mostrado na tela ou no terminal.
- **Alteração de e-mail**: o Firebase envia um link de confirmação ao **novo e-mail** e pode exigir login recente. Abra o link e então atualize/reative a sessão no app.
- **Alteração de senha**: para contas cadastradas com e-mail/senha, exige senha atual. Contas só Google não usam esse fluxo de senha local.
- **Telefone**: armazenado como contato opcional no perfil (não é verificado por SMS).
- **Fotos**: salvas somente no dispositivo/navegador atual; não há sincronização de fotos entre dispositivos. Presets e avatares customizados permanecem no Firestore.

## 7. Limitações e checklist de testes

O ZIP foi preparado sem suas credenciais reais, sem instalação de dependências neste ambiente e sem dispositivo Android. **Não foi possível fazer teste end-to-end com Firebase nem gerar o APK**, portanto a autenticação Google deve ser testada com seu projeto após concluir as etapas 2 e 3.

Teste em navegador e Android: cadastro e login; login Google; sair e restaurar sessão; criar/editar/excluir transações e metas; criar categorias; simulações e histórico; sincronizar entre dois dispositivos; importar uma cópia de dados antigos; regras impedindo acesso de UID diferente; recuperar senha por link; alterar e-mail; enviar e recuperar avatar.

### Referências

- [Firebase Web SDK — Authentication](https://firebase.google.com/docs/auth/web/start)
- [Firebase — Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Expo — Google authentication](https://docs.expo.dev/guides/google-authentication/)

## Correção para erro `expo-asset cannot be found`

Esta versão declara `expo-asset` diretamente nas dependências. Rode `npm install` antes de `npx expo start --clear`; se o erro continuar, execute `npx expo install expo-asset` com conexão à internet.
