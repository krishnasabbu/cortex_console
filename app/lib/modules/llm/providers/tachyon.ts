import { BaseProvider, getOpenAILikeModel } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';

export default class TachyonProvider extends BaseProvider {
  name = 'Tachyon';
  getApiKeyLink = undefined;
  labelForGetApiKey = undefined;
  icon = 'i-ph:lightning-duotone';

  config = {
    baseUrlKey: 'TACHYON_API_BASE_URL',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'tachyon-model',
      label: 'Tachyon Model (Default)',
      provider: 'Tachyon',
      maxTokenAllowed: 8000,
    },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: 'TACHYON_API_BASE_URL',
      defaultApiTokenKey: 'TACHYON_API_KEY',
    });

    if (settings?.models) {
      return settings.models
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean)
        .map((model) => ({
          name: model,
          label: model,
          provider: this.name,
          maxTokenAllowed: 8000,
        }));
    }

    if (!baseUrl || !apiKey) {
      return this.staticModels;
    }

    try {
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const res = (await response.json()) as any;
      const data = (res || []).filter((model: any) => model.type === 'chat' || !model.type);

      if (data.length === 0) {
        return this.staticModels;
      }

      return data.map((m: any) => ({
        name: m.id || m.name,
        label: m.display_name || m.name || m.id,
        provider: this.name,
        maxTokenAllowed: 8000,
      }));
    } catch (e) {
      return this.staticModels;
    }
  }

  getModelInstance(options: {
    model: string;
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { providerSettings, serverEnv, apiKeys } = options;

    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'TACHYON_API_BASE_URL',
      defaultApiTokenKey: 'TACHYON_API_KEY',
    });

    return getOpenAILikeModel(baseUrl || 'http://127.0.0.1:8000/v1', apiKey || 'no-key-needed', options.model);
  }
}
