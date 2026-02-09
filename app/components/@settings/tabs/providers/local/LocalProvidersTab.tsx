import React, { useEffect, useState, useCallback } from 'react';
import { Switch } from '~/components/ui/Switch';
import { useSettings } from '~/lib/hooks/useSettings';
import { LOCAL_PROVIDERS, URL_CONFIGURABLE_PROVIDERS } from '~/lib/stores/settings';
import type { IProviderConfig } from '~/types/model';
import { logStore } from '~/lib/stores/logs';
import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { BsRobot } from 'react-icons/bs';
import type { IconType } from 'react-icons';
import { BiChip } from 'react-icons/bi';
import { TbBrandOpenai } from 'react-icons/tb';
import { providerBaseUrlEnvKeys } from '~/utils/constants';
import { useToast } from '~/components/ui/use-toast';
import { Progress } from '~/components/ui/Progress';
import OllamaModelInstaller from './OllamaModelInstaller';

// Add type for provider names to ensure type safety
type ProviderName = 'Ollama' | 'LMStudio' | 'OpenAILike';

// Update the PROVIDER_ICONS type to use the ProviderName type
const PROVIDER_ICONS: Record<ProviderName, IconType> = {
  Ollama: BsRobot,
  LMStudio: BsRobot,
  OpenAILike: TbBrandOpenai,
};

// Update PROVIDER_DESCRIPTIONS to use the same type
const PROVIDER_DESCRIPTIONS: Record<ProviderName, string> = {
  Ollama: 'Run open-source models locally on your machine',
  LMStudio: 'Local model inference with LM Studio',
  OpenAILike: 'Connect to OpenAI-compatible API endpoints',
};

// Add a constant for the Ollama API base URL
const OLLAMA_API_URL = 'http://127.0.0.1:11434';

interface OllamaModel {
  name: string;
  digest: string;
  size: number;
  modified_at: string;
  details?: {
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
  status?: 'idle' | 'updating' | 'updated' | 'error' | 'checking';
  error?: string;
  newDigest?: string;
  progress?: {
    current: number;
    total: number;
    status: string;
  };
}

interface OllamaPullResponse {
  status: string;
  completed?: number;
  total?: number;
  digest?: string;
}

const isOllamaPullResponse = (data: unknown): data is OllamaPullResponse => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'status' in data &&
    typeof (data as OllamaPullResponse).status === 'string'
  );
};

export default function LocalProvidersTab() {
  const { providers, updateProviderSettings } = useSettings();
  const [filteredProviders, setFilteredProviders] = useState<IProviderConfig[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const newFilteredProviders = Object.entries(providers || {})
      .filter(([key]) => LOCAL_PROVIDERS.includes(key))
      .map(
        ([key, value]) =>
          ({
            ...value,
            name: key,
          }) as IProviderConfig,
      );

    setFilteredProviders(newFilteredProviders);
  }, [providers]);

  const handleToggleProvider = (provider: IProviderConfig, enabled: boolean) => {
    updateProviderSettings(provider.name, {
      ...provider.settings,
      enabled,
    });
    toast(enabled ? `${provider.name} enabled` : `${provider.name} disabled`);
  };

  const handleUpdateBaseUrl = (provider: IProviderConfig, newBaseUrl: string) => {
    updateProviderSettings(provider.name, {
      ...provider.settings,
      baseUrl: newBaseUrl,
    });
  };

  const handleUpdateModels = (provider: IProviderConfig, newModels: string) => {
    updateProviderSettings(provider.name, {
      ...provider.settings,
      models: newModels,
    });
  };

  return (
    <div className="rounded-lg bg-bolt-elements-background text-bolt-elements-textPrimary shadow-sm p-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-bolt-elements-borderColor pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
              <div className="i-ph:lightning-duotone text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Local Providers</h2>
              <p className="text-sm text-bolt-elements-textSecondary">Configure your local Tachyon provider</p>
            </div>
          </div>
        </div>

        {filteredProviders.map((provider) => (
          <div
            key={provider.name}
            className="bg-bolt-elements-background-depth-2 rounded-xl p-5 border border-bolt-elements-borderColor"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="i-ph:lightning-duotone text-2xl text-purple-500" />
                <h3 className="text-md font-semibold">{provider.name}</h3>
              </div>
              <Switch
                checked={provider.settings.enabled}
                onCheckedChange={(checked) => handleToggleProvider(provider, checked)}
              />
            </div>

            {provider.settings.enabled && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-bolt-elements-textSecondary">Base URL</label>
                  <input
                    type="text"
                    value={provider.settings.baseUrl || ''}
                    onChange={(e) => handleUpdateBaseUrl(provider, e.target.value)}
                    placeholder="Enter Base URL (e.g. http://localhost:8000)"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                  <p className="text-xs text-bolt-elements-textTertiary">
                    Default: Integrates with internal python_bridge.py if empty.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-bolt-elements-textSecondary">
                    Models (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={provider.settings.models || ''}
                    onChange={(e) => handleUpdateModels(provider, e.target.value)}
                    placeholder="e.g. llama3, mistral, gpt2"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                  <p className="text-xs text-bolt-elements-textTertiary">
                    List the models your Tachyon server supports. These will appear in the model selector.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredProviders.length === 0 && (
          <div className="text-center text-bolt-elements-textSecondary py-4">
            No local providers found. Check settings.ts configuration.
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for model status badge
function ModelStatusBadge({ status }: { status?: string }) {
  if (!status || status === 'idle') {
    return null;
  }

  const statusConfig = {
    updating: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'Updating' },
    updated: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Updated' },
    error: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Error' },
  };

  const config = statusConfig[status as keyof typeof statusConfig];

  if (!config) {
    return null;
  }

  return (
    <span className={classNames('px-2 py-0.5 rounded-full text-xs font-medium', config.bg, config.text)}>
      {config.label}
    </span>
  );
}
