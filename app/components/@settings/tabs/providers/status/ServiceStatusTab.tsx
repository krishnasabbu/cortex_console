/* eslint-disable prettier/prettier */
import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { TbActivityHeartbeat } from 'react-icons/tb';
import { BsCheckCircleFill, BsXCircleFill, BsExclamationCircleFill } from 'react-icons/bs';
import { useSettings } from '~/lib/hooks/useSettings';
import { useToast } from '~/components/ui/use-toast';

type ServiceStatus = {
  status: 'operational' | 'degraded' | 'down';
  message?: string;
  responseTime?: number;
  lastChecked: Date;
};

const ServiceStatusTab = () => {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const settings = useSettings();
  const { success, error } = useToast();

  const checkTachyonStatus = useCallback(async () => {
    setLoading(true);

    const tachyonSettings = settings.providers?.Tachyon?.settings;
    const baseUrl = tachyonSettings?.baseUrl;
    const checkUrl = baseUrl ? `${baseUrl}/models` : '/api/llm/bridge';

    try {
      const startTime = performance.now();
      const response = await fetch(checkUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const endTime = performance.now();

      if (response.ok) {
        setStatus({
          status: 'operational',
          message: 'Tachyon server is reachable and responding.',
          responseTime: endTime - startTime,
          lastChecked: new Date(),
        });
        success('Tachyon status checked: Operational');
      } else {
        setStatus({
          status: 'degraded',
          message: `Tachyon responded with status: ${response.status}`,
          responseTime: endTime - startTime,
          lastChecked: new Date(),
        });
        error(`Tachyon status checked: Degraded (${response.status})`);
      }
    } catch (err) {
      setStatus({
        status: 'down',
        message: err instanceof Error ? err.message : 'Connection failed',
        lastChecked: new Date(),
      });
      error('Tachyon status checked: Down');
    } finally {
      setLoading(false);
    }
  }, [settings.providers, success, error]);

  useEffect(() => {
    checkTachyonStatus();
  }, [checkTachyonStatus]);

  const getStatusColor = (s: ServiceStatus['status']) => {
    switch (s) {
      case 'operational':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (s: ServiceStatus['status']) => {
    switch (s) {
      case 'operational':
        return <BsCheckCircleFill className="w-5 h-5" />;
      case 'degraded':
        return <BsExclamationCircleFill className="w-5 h-5" />;
      case 'down':
        return <BsXCircleFill className="w-5 h-5" />;
      default:
        return <BsXCircleFill className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between gap-2 mt-8 mb-4">
          <div className="flex items-center gap-2">
            <div
              className={classNames(
                'w-8 h-8 flex items-center justify-center rounded-lg',
                'bg-bolt-elements-background-depth-3',
                'text-purple-500',
              )}
            >
              <TbActivityHeartbeat className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-md font-medium text-bolt-elements-textPrimary">Tachyon Status</h4>
              <p className="text-sm text-bolt-elements-textSecondary">
                Monitor the status of your local Tachyon provider
              </p>
            </div>
          </div>
          <button
            onClick={checkTachyonStatus}
            disabled={loading}
            className={classNames(
              'px-3 py-1.5 rounded-lg text-sm',
              'bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4',
              'text-bolt-elements-textPrimary transition-all duration-200',
              'flex items-center gap-2',
              loading ? 'opacity-50 cursor-not-allowed' : '',
            )}
          >
            <div className={`i-ph:arrows-clockwise w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        <div className="bg-bolt-elements-background-depth-2 rounded-xl p-6 border border-bolt-elements-borderColor">
          {!status ? (
            <div className="text-center text-bolt-elements-textSecondary py-8">
              {loading ? 'Checking status...' : 'No status available'}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={getStatusColor(status.status)}>{getStatusIcon(status.status)}</div>
                  <div>
                    <h3 className="text-lg font-semibold capitalize text-bolt-elements-textPrimary">{status.status}</h3>
                    <p className="text-sm text-bolt-elements-textSecondary">{status.message}</p>
                  </div>
                </div>
                {status.responseTime !== undefined && (
                  <div className="text-right">
                    <div className="text-2xl font-mono text-bolt-elements-textPrimary">
                      {Math.round(status.responseTime)}ms
                    </div>
                    <div className="text-xs text-bolt-elements-textSecondary">Response Time</div>
                  </div>
                )}
              </div>
              <div className="text-xs text-bolt-elements-textTertiary pt-4 border-t border-bolt-elements-borderColor">
                Last checked: {status.lastChecked.toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ServiceStatusTab;
