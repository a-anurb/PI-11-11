# Checklist de homologação (MonY + Firebase)

## Configuração no Firebase Console (responsabilidade do proprietário)

- [ ] Inserir no `.env` as 6 propriedades do `firebaseConfig` do aplicativo Web
- [ ] Habilitar E-mail/senha e Google em Firebase Authentication
- [ ] Adicionar domínio Web autorizado (ex.: localhost + domínio de publicação)
- [ ] Criar Firestore e publicar `firestore.rules`
Fotos de perfil: ficam no dispositivo; não é necessário ativar Firebase Storage ou plano Blaze.
- [ ] Criar app Android com package `com.piideia.app`
- [ ] Cadastrar SHA-1 e SHA-256 da build Android
- [ ] Baixar `google-services.json` do Firebase e salvar na raiz do projeto
- [ ] Inserir o OAuth 2.0 **Web Client ID** em `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

## Instalação e execução

- [ ] `npm install` (regenera `package-lock.json`)
- [ ] `npm run web` e login por e-mail
- [ ] Login Google no navegador
- [ ] `npx expo run:android` (build nativa; não usar Expo Go para Google)
- [ ] Login Google no Android
- [ ] Reabrir aplicativo e conferir sessão (Lembrar-me)

## Persistência e segurança

- [ ] Criar/editar/apagar transações no celular e conferir no navegador
- [ ] Criar/editar/apagar metas e categorias
- [ ] Salvar simulações, histórico e preferências de notificações
Fotos de perfil: ficam no dispositivo; não é necessário ativar Firebase Storage ou plano Blaze.
- [ ] Fazer logout e entrar em outra conta; dados não devem se misturar
- [ ] Confirmar que usuário A não consegue ler `/users/{uid-de-B}` nas regras
- [ ] Testar link de recuperação de senha e de troca de e-mail
- [ ] Abrir Perfil > Seus dados > Importar dados antigos e confirmar origem correta
- [ ] Conferir que a migração não apaga chaves locais nem substitui documentos já existentes

## Observações

- Sem credenciais do proprietário não é possível validar login Google de ponta a ponta.
- O botão Apple é apenas uma opção de interface reservada para desenvolvimento futuro.
- Dados financeiros são armazenados em documentos JSON por conjunto; revisar modelagem para grandes volumes.
