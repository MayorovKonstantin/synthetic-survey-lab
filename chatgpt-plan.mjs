import { homedir } from 'node:os';
import { join } from 'node:path';
import { createChatGPT } from '@siwc/local';
import { windowsCredentialEncryption } from './windows-credential-encryption.mjs';
import { DomainError } from './domain.mjs';

export function createPlanClient({ storageDir = join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'),
  'Synthetic Survey Lab', 'chatgpt') } = {}) {
  let waitingForUrl = null, signInTask = null, signInError = null;
  let modelCache = null, modelCacheTime = 0;
  const client = createChatGPT({
    appName: 'Synthetic Survey Lab', appId: 'synthetic-survey-lab', redirectPort: 0,
    storageDir, credentialEncryption: windowsCredentialEncryption, sendHostId: true,
    openBrowser: async url => {
      if (!waitingForUrl) throw new Error('No sign-in request is active.');
      if (new URL(url).origin !== 'https://auth.openai.com') throw new Error('Unexpected sign-in destination.');
      waitingForUrl.resolve(url);
    }
  });

  async function models() {
    if (modelCache && Date.now() - modelCacheTime < 300_000) return modelCache;
    modelCache = await client.listModels();
    modelCacheTime = Date.now();
    return modelCache;
  }

  return {
    client,
    async status() {
      const session = await client.getSession();
      let catalog = [], modelError = null;
      if (session.sharing) {
        try { catalog = await models(); }
        catch (error) { modelError = error?.message || 'Не удалось получить список моделей.'; }
      }
      return { session, models: catalog, modelError, signInError };
    },
    async beginSignIn() {
      if (signInTask) throw new DomainError('Подключение ChatGPT уже выполняется.', 409);
      signInError = null;
      const urlReady = new Promise((resolve, reject) => { waitingForUrl = { resolve, reject }; });
      signInTask = client.signIn().then(() => { modelCache = null; })
        .catch(error => { signInError = error?.message || 'Не удалось подключить ChatGPT.'; waitingForUrl?.reject(error); })
        .finally(() => { waitingForUrl = null; signInTask = null; });
      let url;
      try { url = await Promise.race([urlReady, new Promise((_, reject) => setTimeout(() => reject(new Error('Подключение не началось.')), 15000))]); }
      catch (error) { client.cancelSignIn(); throw new DomainError(error.message, 503); }
      return url;
    },
    async cancelSignIn() {
      client.cancelSignIn();
      if (signInTask) await signInTask;
      signInError = null;
      return this.status();
    },
    async selectModel(requested) {
      const session = await client.getSession();
      if (!session.sharing) throw new DomainError('Сначала подключите ChatGPT и разрешите использование подписки.', 401);
      const catalog = await models();
      const chosen = requested || catalog[0]?.slug;
      if (!catalog.some(model => model.slug === chosen)) throw new DomainError('Выбранная модель сейчас недоступна.', 400);
      return chosen;
    }
  };
}
